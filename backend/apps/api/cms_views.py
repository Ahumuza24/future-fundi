"""
Curriculum Designer CMS views (PRD §8, Phase 4).

All write operations require the curriculum_designer role (IsCurriculumDesigner).
Safe methods (GET, HEAD, OPTIONS) are open to any authenticated user.

Structural limit warnings are surfaced in the response as `structural_warning`
when a creation is near the ceiling (hard blocks raise 400 via the serializer).
"""

from __future__ import annotations

from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.models import LearningTask, Lesson, Module, Pathway, Program, Track, Unit
from apps.core.services import structural_limits

from .permissions import IsCurriculumDesigner
from .cms_serializers import (
    LearningTaskCMSSerializer,
    LessonCMSSerializer,
    ModuleCMSSerializer,
    PathwayCMSSerializer,
    PeerReviewQueueSerializer,
    ProgramCMSSerializer,
    TrackCMSSerializer,
    UnitCMSSerializer,
)

_PERMS = [IsAuthenticated, IsCurriculumDesigner]


def _create_with_warning(viewset, request, child_layer: str, parent_obj):
    """Create a child object and attach structural_warning metadata if near ceiling."""
    serializer = viewset.get_serializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    instance = serializer.save()
    result = structural_limits.check(parent_obj, child_layer)
    data = dict(serializer.data)
    if result.status == "warn":
        data["structural_warning"] = result.message
    return Response(data, status=status.HTTP_201_CREATED)


class PathwayCMSViewSet(viewsets.ModelViewSet):
    permission_classes = _PERMS
    serializer_class = PathwayCMSSerializer
    queryset = Pathway.objects.all().order_by("name")


class TrackCMSViewSet(viewsets.ModelViewSet):
    permission_classes = _PERMS
    serializer_class = TrackCMSSerializer

    def get_queryset(self):
        qs = Track.objects.select_related("pathway").order_by("pathway__name", "sequence_order")
        pathway_id = self.request.query_params.get("pathway")
        if pathway_id:
            qs = qs.filter(pathway_id=pathway_id)
        return qs

    def create(self, request, *args, **kwargs):
        parent = Pathway.objects.filter(id=request.data.get("pathway")).first()
        if parent:
            return _create_with_warning(self, request, "track", parent)
        return super().create(request, *args, **kwargs)


class ProgramCMSViewSet(viewsets.ModelViewSet):
    permission_classes = _PERMS
    serializer_class = ProgramCMSSerializer

    def get_queryset(self):
        qs = Program.objects.select_related("track__pathway").order_by(
            "track__pathway__name", "track__sequence_order", "sequence_order"
        )
        track_id = self.request.query_params.get("track")
        if track_id:
            qs = qs.filter(track_id=track_id)
        return qs

    def create(self, request, *args, **kwargs):
        parent = Track.objects.filter(id=request.data.get("track")).first()
        if parent:
            return _create_with_warning(self, request, "program", parent)
        return super().create(request, *args, **kwargs)


class ModuleCMSViewSet(viewsets.ModelViewSet):
    permission_classes = _PERMS
    serializer_class = ModuleCMSSerializer

    def get_queryset(self):
        qs = Module.objects.select_related("program__track__pathway").order_by(
            "program__track__pathway__name", "program__sequence_order", "sequence_order"
        )
        program_id = self.request.query_params.get("program")
        if program_id:
            qs = qs.filter(program_id=program_id)
        return qs

    def create(self, request, *args, **kwargs):
        parent = Program.objects.filter(id=request.data.get("program")).first()
        if parent:
            return _create_with_warning(self, request, "module", parent)
        return super().create(request, *args, **kwargs)

    @action(detail=True, methods=["post"], url_path="submit-for-review")
    def submit_for_review(self, request, pk=None):
        """Step 7: Mark module as ready for peer review (PRD §8.4)."""
        module = self.get_object()
        if module.status != Module.STATUS_DRAFT:
            return Response(
                {"detail": "Only Draft modules can be submitted for review."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        module.needs_review = True
        module.save(update_fields=["needs_review"])
        return Response(ModuleCMSSerializer(module).data)

    @action(detail=True, methods=["post"], url_path="approve-review")
    def approve_review(self, request, pk=None):
        """Step 7: Second designer records peer review approval."""
        module = self.get_object()
        if not module.needs_review:
            return Response(
                {"detail": "This module has not been submitted for review."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        module.needs_review = False
        module.reviewed_by = request.user
        module.reviewed_at = timezone.now()
        module.save(update_fields=["needs_review", "reviewed_by", "reviewed_at"])
        return Response(ModuleCMSSerializer(module).data)

    @action(detail=True, methods=["post"])
    def publish(self, request, pk=None):
        """Step 8: Change status Draft→Active after peer review (PRD §8.4)."""
        module = self.get_object()
        if module.status != Module.STATUS_DRAFT:
            return Response(
                {"detail": "Only Draft modules can be published."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not module.reviewed_by_id:
            return Response(
                {"detail": "Module must pass peer review before publishing."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        module.status = Module.STATUS_ACTIVE
        module.save(update_fields=["status"])
        return Response(ModuleCMSSerializer(module).data)

    @action(detail=False, methods=["get"], url_path="peer-review-queue")
    def peer_review_queue(self, request):
        """List all modules awaiting peer review."""
        qs = (
            Module.objects.filter(needs_review=True, status=Module.STATUS_DRAFT)
            .select_related("program__track__pathway")
            .order_by("updated_at")
        )
        return Response(PeerReviewQueueSerializer(qs, many=True).data)


class UnitCMSViewSet(viewsets.ModelViewSet):
    permission_classes = _PERMS
    serializer_class = UnitCMSSerializer

    def get_queryset(self):
        qs = Unit.objects.select_related("module").order_by("module__name", "sequence_order")
        module_id = self.request.query_params.get("module")
        if module_id:
            qs = qs.filter(module_id=module_id)
        return qs

    def create(self, request, *args, **kwargs):
        parent = Module.objects.filter(id=request.data.get("module")).first()
        if parent:
            return _create_with_warning(self, request, "unit", parent)
        return super().create(request, *args, **kwargs)


class LessonCMSViewSet(viewsets.ModelViewSet):
    permission_classes = _PERMS
    serializer_class = LessonCMSSerializer

    def get_queryset(self):
        qs = Lesson.objects.select_related("unit__module").order_by(
            "unit__module__name", "unit__sequence_order", "sequence_order"
        )
        unit_id = self.request.query_params.get("unit")
        if unit_id:
            qs = qs.filter(unit_id=unit_id)
        return qs

    def create(self, request, *args, **kwargs):
        parent = Unit.objects.filter(id=request.data.get("unit")).first()
        if parent:
            return _create_with_warning(self, request, "lesson", parent)
        return super().create(request, *args, **kwargs)


class LearningTaskCMSViewSet(viewsets.ModelViewSet):
    permission_classes = _PERMS
    serializer_class = LearningTaskCMSSerializer

    def get_queryset(self):
        qs = LearningTask.objects.select_related("lesson__unit").order_by(
            "lesson__unit__sequence_order", "lesson__sequence_order", "sequence_order"
        )
        lesson_id = self.request.query_params.get("lesson")
        if lesson_id:
            qs = qs.filter(lesson_id=lesson_id)
        return qs

    def create(self, request, *args, **kwargs):
        parent = Lesson.objects.filter(id=request.data.get("lesson")).first()
        if parent:
            return _create_with_warning(self, request, "task", parent)
        return super().create(request, *args, **kwargs)
