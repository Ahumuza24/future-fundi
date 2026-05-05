from __future__ import annotations

from typing import Any

from django.db.models import Count

from apps.core.models import (
    Artifact,
    BadgeRecord,
    CertificationRecord,
    GrowthProfile,
    Learner,
    MicrocredentialRecord,
    ModuleProgress,
)


def _fmt_date(dt: Any) -> str | None:
    if dt is None:
        return None
    return dt.strftime("%Y-%m-%d") if hasattr(dt, "strftime") else str(dt)


class LearnerPanelService:

    @staticmethod
    def growth_summary(learner: Learner) -> dict:
        try:
            profile = learner.growth_profile
        except GrowthProfile.DoesNotExist:
            profile = None

        badges = (
            BadgeRecord.objects.filter(learner=learner, status="issued")
            .select_related("template")
            .order_by("-date_awarded")[:10]
        )
        microcreds = (
            MicrocredentialRecord.objects.filter(learner=learner, status="issued")
            .select_related("template", "module")
            .order_by("-date_issued")[:10]
        )

        return {
            "level": learner.level,
            "equity_flag": learner.equity_flag,
            "leaves_count": profile.leaves_count if profile else 0,
            "fruit_count": profile.fruit_count if profile else 0,
            "roots_score": profile.roots_score if profile else {},
            "trunk_score": profile.trunk_score if profile else {},
            "branches": profile.branches if profile else [],
            "badges": [
                {
                    "title": b.template.title,
                    "date_awarded": _fmt_date(b.date_awarded),
                    "icon_url": b.template.icon_url,
                }
                for b in badges
            ],
            "microcredentials": [
                {
                    "title": mc.template.title,
                    "module": mc.module.name if mc.module else "",
                    "date_issued": _fmt_date(mc.date_issued),
                }
                for mc in microcreds
            ],
        }

    @staticmethod
    def module_progress(learner: Learner) -> dict | None:
        progress = (
            ModuleProgress.objects.filter(learner=learner)
            .select_related("module", "module__program__track__pathway")
            .order_by("-module__sequence_order")
            .first()
        )
        if not progress:
            return None

        module = progress.module
        try:
            pathway = module.program.track.pathway.name
        except AttributeError:
            pathway = ""

        return {
            "module_id": str(module.id),
            "module_name": module.name,
            "outcome_statement": module.outcome_statement,
            "pathway": pathway,
            "units_completed": progress.units_completed,
            "units_total": progress.units_total,
            "completion_pct": progress.completion_pct,
            "microcredential_eligible": progress.microcredential_eligible,
            "status": progress.status,
        }

    @staticmethod
    def evidence_portfolio(learner: Learner) -> list[dict]:
        artifacts = (
            Artifact.objects.filter(learner=learner)
            .select_related("module")
            .order_by("-submitted_at")[:20]
        )
        return [
            {
                "id": str(a.id),
                "title": a.title,
                "status": a.status,
                "submitted_at": _fmt_date(a.submitted_at),
                "module": a.module.name if a.module else "",
                "uploaded_by_student": a.uploaded_by_student,
                "reflection": a.reflection,
                "media_refs": a.media_refs or [],
            }
            for a in artifacts
        ]

    @staticmethod
    def cohort_position(learner: Learner) -> dict:
        if not learner.tenant_id:
            return {
                "level": learner.level,
                "peers_above": 0,
                "peers_same": 0,
                "peers_below": 0,
                "total_peers": 0,
            }

        level_order = [
            Learner.LEVEL_EXPLORER,
            Learner.LEVEL_BUILDER,
            Learner.LEVEL_PRACTITIONER,
            Learner.LEVEL_PRE_PROFESSIONAL,
        ]
        learner_rank = level_order.index(learner.level) if learner.level in level_order else 0

        cohort_counts = (
            Learner.objects.filter(tenant=learner.tenant)
            .exclude(id=learner.id)
            .values("level")
            .annotate(count=Count("id"))
        )
        counts_by_level: dict[str, int] = {row["level"]: row["count"] for row in cohort_counts}

        above = sum(counts_by_level.get(lvl, 0) for i, lvl in enumerate(level_order) if i > learner_rank)
        same = sum(counts_by_level.get(lvl, 0) for i, lvl in enumerate(level_order) if i == learner_rank)
        below = sum(counts_by_level.get(lvl, 0) for i, lvl in enumerate(level_order) if i < learner_rank)

        return {
            "level": learner.level,
            "peers_above": above,
            "peers_same": same,
            "peers_below": below,
            "total_peers": above + same + below,
        }

    @staticmethod
    def certifications(learner: Learner) -> dict:
        issued = (
            CertificationRecord.objects.filter(learner=learner, status="issued")
            .select_related("template", "program")
            .order_by("-date_issued")
        )
        in_progress_mcs = (
            MicrocredentialRecord.objects.filter(learner=learner, status="issued")
            .select_related("module__program")
        )

        program_mc_counts: dict[str, int] = {}
        for mc in in_progress_mcs:
            try:
                prog_id = str(mc.module.program.id)
                program_mc_counts[prog_id] = program_mc_counts.get(prog_id, 0) + 1
            except AttributeError:
                continue

        issued_program_ids = {str(c.program_id) for c in issued}
        in_progress = [
            {"program_id": prog_id, "microcredentials_earned": mc_count, "microcredentials_required": 3}
            for prog_id, mc_count in program_mc_counts.items()
            if prog_id not in issued_program_ids
        ]

        return {
            "issued": [
                {
                    "title": c.template.title,
                    "program": c.program.title,
                    "date_issued": _fmt_date(c.date_issued),
                }
                for c in issued
            ],
            "in_progress": in_progress,
        }
