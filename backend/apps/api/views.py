from __future__ import annotations

from typing import Any, Dict

from apps.core.models import Artifact, Learner, PathwayInputs
from django.db import connection
from rest_framework import permissions, viewsets
from rest_framework.decorators import (
    action,
    api_view,
)
from rest_framework.decorators import permission_classes as perm_classes
from rest_framework.response import Response
from rest_framework.views import APIView

from .permissions import (
    IsTeacherOrLeader,
)
from .serializers import (
    ArtifactSerializer,
    LearnerSerializer,
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
    # throttle_classes defaults to settings (UserRateThrottle, etc.)

    def get_queryset(self):
        # Use _base_manager to bypass TenantManager and avoid conflicts with pagination/prefetch
        # Manually apply tenant filtering to ensure it works with sliced querysets
        from apps.core.models import ParentContact
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

    @action(detail=True, methods=["get"], url_path="dashboard")
    def dashboard(self, request, pk: str) -> Response:
        """Get comprehensive dashboard data for the learner."""
        learner = self.get_object()
        from datetime import date

        from apps.core.models import Activity, Session
        from django.db.models import Q

        # 1. Pathways (Enrollments)
        enrollments = learner.course_enrollments.filter(is_active=True).select_related(
            "course", "current_level"
        )
        pathways_data = []
        enrolled_course_ids = []
        for enrollment in enrollments:
            enrolled_course_ids.append(enrollment.course.id)
            pathways_data.append(
                {
                    "id": str(enrollment.course.id),
                    "name": enrollment.course.name,
                    "level": (
                        enrollment.current_level.name
                        if enrollment.current_level
                        else "Not Started"
                    ),
                    "progress": 0,  # TODO: Calculate actual progress
                    "description": enrollment.course.description,
                    "color": "#F05722",  # Default brand color
                }
            )

        # 2. Upcoming Activities
        today = date.today()
        # Sessions (Classes)
        upcoming_sessions = (
            Session.objects.filter(
                learners=learner, date__gte=today, status="scheduled"
            )
            .select_related("module")
            .order_by("date", "start_time")[:5]
        )

        # General Activities
        upcoming_events = Activity.objects.filter(
            Q(course__isnull=True) | Q(course__in=enrolled_course_ids),
            date__gte=today,
            status__in=["upcoming", "ongoing"],
        ).order_by("date", "start_time")[:5]

        # Combine
        combined_activities = []
        for s in upcoming_sessions:
            combined_activities.append(
                {
                    "id": str(s.id),
                    "title": s.module.name,
                    "date": s.date.isoformat(),
                    "time": s.start_time.strftime("%H:%M") if s.start_time else None,
                    "type": "Class",
                    "color": "#3B82F6",  # Blue for classes
                    "datetime": f"{s.date}T{s.start_time or '00:00:00'}",
                }
            )

        for a in upcoming_events:
            combined_activities.append(
                {
                    "id": str(a.id),
                    "title": a.name,
                    "date": a.date.isoformat(),
                    "time": a.start_time.strftime("%H:%M") if a.start_time else None,
                    "type": "Event",
                    "color": "#10B981",  # Green for events
                    "datetime": f"{a.date}T{a.start_time or '00:00:00'}",
                }
            )

        combined_activities.sort(key=lambda x: x["datetime"])
        upcoming_activities = combined_activities[:5]

        # 3. Active Projects (Pending Artifacts requirements)
        # For now, simplistic approach: recently updated progress that isn't complete
        active_projects = []
        progress_records = (
            learner.level_progress.filter(completed=False)
            .select_related("level", "level__course")
            .order_by("-updated_at")[:3]
        )

        for progress in progress_records:
            active_projects.append(
                {
                    "id": str(progress.id),
                    "title": f"{progress.level.name} Project",
                    "description": progress.level.description
                    or "Complete your level requirements.",
                    "pathway": progress.level.course.name,
                    "dueDate": "Ongoing",
                    "progress": progress.completion_percentage,
                    "status": "In Progress",
                    "color": "#F05722",
                }
            )

        # 4. Badges (Achievements)
        # Using Achievement model if populated, otherwise mock/derived logic
        # For now, let's look at completed levels as badges
        completed_levels = learner.level_progress.filter(completed=True).select_related(
            "level", "level__course"
        )
        badges = []
        for p in completed_levels:
            badges.append(
                {
                    "id": str(p.id),
                    "name": p.level.name,
                    "course": p.level.course.name,
                    "icon": "award",
                    "earned_at": p.completed_at,
                }
            )

        return Response(
            {
                "learner": {
                    "first_name": learner.first_name,
                    "last_name": learner.last_name,
                    "school": learner.current_school,
                    "class": learner.current_class,
                    "tenant_name": (
                        learner.tenant.name
                        if learner.tenant
                        else "Future Fundi Academy"
                    ),
                },
                "pathways": pathways_data,
                "upcoming_activities": upcoming_activities,
                "active_projects": active_projects,
                "badges": badges,
            }
        )


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
