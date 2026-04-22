"""
Gate engine API views (PRD §9).

Endpoints:
  GET  /api/gate/check/                    — check whether a layer obj is unlocked
  POST /api/gate/override/                 — staff: grant an admin override
  GET  /api/gate/overrides/                — staff: list all overrides (filterable)
  GET/PATCH /api/gate/growth-profile/      — learner: fetch / update own GrowthProfile
  GET/PATCH /api/gate/module-progress/<id>/— teacher: view or update ModuleProgress
"""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from django.db.models import QuerySet
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.gates import GateService, GateResult
from apps.core.models import (
    AdminOverride,
    GrowthProfile,
    LearningTask,
    Learner,
    Lesson,
    Module,
    ModuleProgress,
    Pathway,
    Program,
    Track,
    Unit,
)

from .serializers import (
    AdminOverrideCreateSerializer,
    AdminOverrideSerializer,
    GateCheckSerializer,
    GateResultSerializer,
    GrowthProfileSerializer,
    ModuleProgressSerializer,
)

# ---------------------------------------------------------------------------
# Layer-to-model mapping
# ---------------------------------------------------------------------------

_LAYER_MODEL: dict[str, type] = {
    "pathway": Pathway,
    "track": Track,
    "program": Program,
    "module": Module,
    "unit": Unit,
    "lesson": Lesson,
    "task": LearningTask,
}


# ---------------------------------------------------------------------------
# Permissions
# ---------------------------------------------------------------------------

class IsStaffOrAdmin(permissions.BasePermission):
    def has_permission(self, request: Request, view: object) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and (
                request.user.is_staff
                or getattr(request.user, "role", None) in ("admin", "leader", "teacher")
            )
        )


# ---------------------------------------------------------------------------
# Gate check
# ---------------------------------------------------------------------------

class GateCheckView(APIView):
    """
    GET /api/gate/check/?layer=module&ref_id=<uuid>[&learner_id=<uuid>]

    Returns {"is_open": bool, "reason": str, "detail": str}.
    Learners may only check their own gate; staff may check any learner.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request) -> Response:
        params = GateCheckSerializer(data=request.query_params)
        params.is_valid(raise_exception=True)

        layer: str = params.validated_data["layer"]
        ref_id: uuid.UUID = params.validated_data["ref_id"]

        learner = self._resolve_learner(request)
        obj = self._resolve_layer_object(layer, ref_id)

        result: GateResult = GateService.check(learner, obj)
        return Response(GateResultSerializer(result).data)

    def _resolve_learner(self, request: Request) -> Learner:
        learner_id = request.query_params.get("learner_id")
        if learner_id:
            if not IsStaffOrAdmin().has_permission(request, self):
                raise PermissionDenied("Only staff may check gates for other learners.")
            return get_object_or_404(Learner, pk=learner_id)

        learner = getattr(request.user, "learner_profile", None)
        if learner is None:
            raise PermissionDenied("No learner profile attached to this account.")
        return learner

    def _resolve_layer_object(self, layer: str, ref_id: uuid.UUID) -> object:
        model = _LAYER_MODEL.get(layer)
        if model is None:
            from rest_framework.exceptions import ValidationError
            raise ValidationError(f"Unknown layer '{layer}'.")
        return get_object_or_404(model, pk=ref_id)


# ---------------------------------------------------------------------------
# Admin override — create + list
# ---------------------------------------------------------------------------

class AdminOverrideCreateView(generics.CreateAPIView):
    """POST /api/gate/override/ — staff only."""

    serializer_class = AdminOverrideCreateSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffOrAdmin]

    def perform_create(self, serializer: AdminOverrideCreateSerializer) -> None:
        serializer.save()


class AdminOverrideListView(generics.ListAPIView):
    """GET /api/gate/overrides/?learner=<id>&layer=<layer> — staff only."""

    serializer_class = AdminOverrideSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffOrAdmin]

    def get_queryset(self) -> QuerySet[AdminOverride]:
        qs = AdminOverride.objects.select_related("actor", "learner").order_by("-timestamp")
        learner_id = self.request.query_params.get("learner")
        layer = self.request.query_params.get("layer")
        if learner_id:
            qs = qs.filter(learner_id=learner_id)
        if layer:
            qs = qs.filter(layer=layer)
        return qs


# ---------------------------------------------------------------------------
# GrowthProfile
# ---------------------------------------------------------------------------

class GrowthProfileView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/gate/growth-profile/

    Learners retrieve their own; staff may retrieve any by ?learner_id=<uuid>.
    Only scores (roots_score, trunk_score, branches) are writable — counters
    are managed by signals and must never be set manually.
    """

    serializer_class = GrowthProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self) -> GrowthProfile:
        learner = self._resolve_learner()
        profile, _ = GrowthProfile.objects.get_or_create(learner=learner)
        return profile

    def _resolve_learner(self) -> Learner:
        learner_id = self.request.query_params.get("learner_id")
        if learner_id and IsStaffOrAdmin().has_permission(self.request, self):
            return get_object_or_404(Learner, pk=learner_id)

        learner = getattr(self.request.user, "learner_profile", None)
        if learner is None:
            raise PermissionDenied("No learner profile attached to this account.")
        return learner


# ---------------------------------------------------------------------------
# ModuleProgress — teacher updates
# ---------------------------------------------------------------------------

class ModuleProgressDetailView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/gate/module-progress/<pk>/

    Teachers can update verification fields; learners can read their own.
    """

    serializer_class = ModuleProgressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self) -> QuerySet[ModuleProgress]:
        if IsStaffOrAdmin().has_permission(self.request, self):
            return ModuleProgress.objects.select_related("learner", "module")
        learner = getattr(self.request.user, "learner_profile", None)
        if learner is None:
            return ModuleProgress.objects.none()
        return ModuleProgress.objects.filter(learner=learner)
