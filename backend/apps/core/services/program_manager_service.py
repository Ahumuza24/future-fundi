from __future__ import annotations

from datetime import timedelta

from django.db.models import Count, Q
from django.utils import timezone

from apps.core.models import (
    BadgeRecord,
    CertificationRecord,
    Learner,
    MicrocredentialRecord,
    ModuleProgress,
)


class ProgramManagerService:

    @staticmethod
    def pathway_demand() -> list[dict]:
        rows = (
            Learner.objects.filter(current_track__isnull=False)
            .select_related("current_track__pathway")
            .values("current_track__pathway__name", "current_track__title")
            .annotate(enrolled_learners=Count("id"))
            .order_by("-enrolled_learners")
        )
        return [
            {
                "pathway": r["current_track__pathway__name"] or "",
                "track": r["current_track__title"] or "",
                "enrolled_learners": r["enrolled_learners"],
            }
            for r in rows
        ]

    @staticmethod
    def completion_rates() -> list[dict]:
        rows = (
            ModuleProgress.objects.select_related(
                "module", "module__program__track__pathway"
            )
            .values(
                "module__name",
                "module__program__track__pathway__name",
            )
            .annotate(
                learners_complete=Count("id", filter=Q(completion_status="complete")),
                learners_in_progress=Count("id", filter=Q(completion_status="in_progress")),
                total=Count("id"),
            )
            .order_by("module__program__track__pathway__name", "module__name")
        )
        result = []
        for r in rows:
            total = r["total"] or 1
            result.append(
                {
                    "pathway": r["module__program__track__pathway__name"] or "",
                    "module_name": r["module__name"] or "",
                    "learners_in_progress": r["learners_in_progress"],
                    "learners_complete": r["learners_complete"],
                    "completion_pct": round(r["learners_complete"] / total * 100),
                }
            )
        return result

    @staticmethod
    def badge_distribution() -> list[dict]:
        rows = (
            BadgeRecord.objects.filter(status="issued")
            .select_related("template", "template__unit")
            .values("template__title", "template__unit__title")
            .annotate(issued_count=Count("id"))
            .order_by("-issued_count")[:15]
        )
        return [
            {
                "badge_title": r["template__title"] or "",
                "unit_title": r["template__unit__title"] or "",
                "issued_count": r["issued_count"],
            }
            for r in rows
        ]

    @staticmethod
    def microcredential_issuance() -> list[dict]:
        six_months_ago = timezone.now() - timedelta(days=180)
        rows = (
            MicrocredentialRecord.objects.filter(
                status="issued", date_issued__gte=six_months_ago
            )
            .select_related("module")
            .values("module__name", "date_issued__month", "date_issued__year")
            .annotate(issued_count=Count("id"))
            .order_by("date_issued__year", "date_issued__month")
        )
        return [
            {
                "module_name": r["module__name"] or "",
                "month": r["date_issued__month"],
                "year": r["date_issued__year"],
                "issued_count": r["issued_count"],
            }
            for r in rows
        ]

    @staticmethod
    def certification_rates() -> list[dict]:
        rows = (
            CertificationRecord.objects.filter(status="issued")
            .select_related("template", "program")
            .values("program__title", "template__title")
            .annotate(issued_count=Count("id"))
            .order_by("-issued_count")
        )
        enrolled = (
            Learner.objects.filter(current_program__isnull=False)
            .values("current_program__title")
            .annotate(enrolled=Count("id"))
        )
        enrolled_map = {r["current_program__title"]: r["enrolled"] for r in enrolled}

        return [
            {
                "program_name": r["program__title"] or "",
                "cert_title": r["template__title"] or "",
                "issued_count": r["issued_count"],
                "learners_enrolled": enrolled_map.get(r["program__title"] or "", 0),
            }
            for r in rows
        ]

    @staticmethod
    def level_distribution() -> dict:
        rows = (
            Learner.objects.values("level")
            .annotate(count=Count("id"))
        )
        return {r["level"]: r["count"] for r in rows}

    @staticmethod
    def age_band_breakdown() -> dict:
        rows = (
            Learner.objects.values("age_band")
            .annotate(count=Count("id"))
        )
        return {(r["age_band"] or "unknown"): r["count"] for r in rows}
