from __future__ import annotations

from typing import Any, Dict

from apps.core.models import Artifact, Learner, PathwayInputs
from django.db import connection
from django.db.models import Prefetch
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import (
    action,
    api_view,
)
from rest_framework.decorators import permission_classes as perm_classes
from rest_framework.response import Response
from rest_framework.views import APIView

from .permissions import (
    IsLeader,
    IsLearner,
    IsLearnerOrParent,
    IsParent,
    IsTeacher,
    IsTeacherOrLeader,
)
from .serializers import (
    ArtifactSerializer,
    LearnerSerializer,
    PathwayInputsSerializer,
)


class IsAuthenticatedTenant(permissions.IsAuthenticated):
    """Authenticated users only; querysets rely on TenantManager for scoping."""

    pass


class LearnerViewSet(viewsets.ModelViewSet):
    """ViewSet for learners with role-based access control.

    - Learners: Can only view/edit their own profile
    - Teachers: Can view all learners in their tenant
    - Parents: Can view their child's profile
    - Leaders: Can view/edit all learners in their tenant
    """

    permission_classes = [IsAuthenticatedTenant]
    serializer_class = LearnerSerializer
    throttle_classes = []  # Will be set in settings

    def get_queryset(self):
        # Use _base_manager to bypass TenantManager and avoid conflicts with pagination/prefetch
        # Manually apply tenant filtering to ensure it works with sliced querysets
        from apps.core.tenant import get_current_tenant

        tenant_id = get_current_tenant()
        qs = (
            Learner._base_manager.get_queryset()
            .select_related("user")
            .order_by("last_name", "first_name")
        )

        # Role-based filtering
        user = self.request.user
        if user.role == "learner":
            # Learners can only see their own profile
            qs = qs.filter(user=user)
        elif user.role == "parent":
            # Parents can see their child's profile
            from apps.core.models import ParentContact

            parent_contacts = ParentContact.objects.filter(
                email=user.email
            ).values_list("learner_id", flat=True)
            qs = qs.filter(id__in=parent_contacts)
        elif user.role in ["teacher", "leader", "admin"]:
            # Teachers and leaders can see all learners in their tenant
            if tenant_id:
                qs = qs.filter(tenant_id=tenant_id)
        else:
            # Default: only own profile
            qs = qs.filter(user=user)

        return qs

    def perform_create(self, serializer):
        # Default new learner to the request user's tenant
        tenant = getattr(self.request.user, "tenant", None)
        serializer.save(tenant=tenant)

    @action(detail=True, methods=["get"], url_path="tree")
    def growth_tree(self, request, pk: str) -> Response:
        """Returns a simplified growth tree structure (stub)."""
        # In a later pass, compose modules, credentials, outcomes
        data = {
            "learner_id": pk,
            "nodes": [
                {
                    "id": "root",
                    "label": "Pathways",
                    "children": [
                        {"id": "job_shadow", "label": "Job Shadow"},
                        {"id": "internship", "label": "Internship"},
                    ],
                }
            ],
        }
        return Response(data)

    @action(detail=True, methods=["get"], url_path="pathway")
    def pathway(self, request, pk: str) -> Response:
        """Compute pathway score and gate with latest inputs."""
        learner = self.get_object()
        latest_inputs = (
            PathwayInputs.objects.filter(learner=learner)
            .order_by("-created_at")
            .first()
        )
        if not latest_inputs:
            return Response({"detail": "No inputs", "score": None, "gate": None})

        from apps.core.models import WeeklyPulse
        from apps.core.services.pathway import (
            calculate_pathway_score,
            determine_gate,
            recommend_next_moves,
        )

        score = calculate_pathway_score(latest_inputs)

        # Check for positive mood from latest weekly pulse
        latest_pulse = (
            WeeklyPulse.objects.filter(learner=learner).order_by("-created_at").first()
        )
        has_positive_mood = latest_pulse.mood >= 60 if latest_pulse else True

        gate = determine_gate(score, latest_inputs.skill_readiness, has_positive_mood)
        recommendations = recommend_next_moves(latest_inputs, learner, gate)

        payload: Dict[str, Any] = {
            "score": score,
            "gate": gate,
            "recommendations": recommendations,
        }
        return Response(payload)

    @action(detail=True, methods=["get"], url_path="artifacts")
    def artifacts(self, request, pk: str) -> Response:
        learner = self.get_object()
        qs = learner.artifacts.order_by("-submitted_at")
        return Response(ArtifactSerializer(qs, many=True).data)

    @action(detail=True, methods=["get"], url_path="portfolio-pdf")
    def portfolio_pdf(self, request, pk: str) -> Response:
        return Response({"detail": "Not implemented"}, status=501)


class ArtifactViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticatedTenant]
    serializer_class = ArtifactSerializer

    def get_queryset(self):
        # Use _base_manager to bypass TenantManager and avoid conflicts with pagination/prefetch
        from apps.core.tenant import get_current_tenant

        tenant_id = get_current_tenant()
        qs = (
            Artifact._base_manager.get_queryset()
            .select_related("learner")
            .order_by("-submitted_at")
        )
        if tenant_id:
            qs = qs.filter(tenant_id=tenant_id)
        return qs

    @action(detail=True, methods=["post"], url_path="upload-media")
    def upload_media(self, request, pk: str) -> Response:
        return Response({"detail": "Not implemented"}, status=501)

    def perform_create(self, serializer):
        learner = serializer.validated_data.get("learner")
        tenant = getattr(learner, "tenant", None)
        serializer.save(tenant=tenant)


class DashboardKpisView(APIView):
    """Dashboard KPIs - accessible by teachers and leaders only."""

    permission_classes = [IsTeacherOrLeader]

    def get(self, request):
        # Placeholder aggregates; later implement real queries
        from apps.core.tenant import get_current_tenant

        tenant_id = get_current_tenant()

        qs_learners = Learner._base_manager.get_queryset()
        qs_artifacts = Artifact._base_manager.get_queryset()

        if tenant_id:
            qs_learners = qs_learners.filter(tenant_id=tenant_id)
            qs_artifacts = qs_artifacts.filter(tenant_id=tenant_id)

        return Response(
            {
                "learners": qs_learners.count(),
                "artifacts": qs_artifacts.count(),
            }
        )


@api_view(["GET"])
@perm_classes([permissions.AllowAny])
def health_check(request):
    """Health check endpoint for deployment monitoring."""
    try:
        # Test database connection
        connection.ensure_connection()
        db_status = "ok"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return Response(
        {
            "status": "healthy",
            "database": db_status,
            "version": "1.0.0",
        }
    )
