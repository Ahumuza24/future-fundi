from __future__ import annotations

from apps.core.services.program_manager_service import ProgramManagerService
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .permissions import IsLeader


class ProgramManagerDashboardViewSet(viewsets.ViewSet):
    """Aggregate analytics endpoints for program managers and leaders."""

    permission_classes = [IsLeader]

    @action(detail=False, methods=["get"], url_path="pathway-demand")
    def pathway_demand(self, request):
        return Response({"results": ProgramManagerService.pathway_demand()})

    @action(detail=False, methods=["get"], url_path="completion-rates")
    def completion_rates(self, request):
        return Response({"results": ProgramManagerService.completion_rates()})

    @action(detail=False, methods=["get"], url_path="badge-distribution")
    def badge_distribution(self, request):
        return Response({"results": ProgramManagerService.badge_distribution()})

    @action(detail=False, methods=["get"], url_path="microcredential-issuance")
    def microcredential_issuance(self, request):
        return Response({"results": ProgramManagerService.microcredential_issuance()})

    @action(detail=False, methods=["get"], url_path="certification-rates")
    def certification_rates(self, request):
        return Response({"results": ProgramManagerService.certification_rates()})

    @action(detail=False, methods=["get"], url_path="level-distribution")
    def level_distribution(self, request):
        return Response(ProgramManagerService.level_distribution())

    @action(detail=False, methods=["get"], url_path="age-bands")
    def age_bands(self, request):
        return Response(ProgramManagerService.age_band_breakdown())
