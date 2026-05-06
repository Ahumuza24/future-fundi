from __future__ import annotations

from typing import Any

from django.contrib.auth import get_user_model
from django.db.models import QuerySet
from django.utils import timezone

from apps.core.models import (
    Artifact,
    BadgeRecord,
    GrowthProfile,
    Learner,
    MicrocredentialRecord,
    Session,
)

User = get_user_model()


def _fmt_date(dt: Any) -> str | None:
    if dt is None:
        return None
    return dt.strftime("%Y-%m-%d") if hasattr(dt, "strftime") else str(dt)


def _learner_children(parent_user) -> QuerySet:
    return Learner.objects.filter(parent=parent_user).select_related(
        "growth_profile",
        "current_program",
        "current_track",
    )


class ParentPanelService:

    @staticmethod
    def children_overview(parent_user) -> list[dict]:
        children = _learner_children(parent_user)
        result = []
        for child in children:
            try:
                profile = child.growth_profile
                leaves = profile.leaves_count
                fruit = profile.fruit_count
            except GrowthProfile.DoesNotExist:
                leaves = fruit = 0

            result.append(
                {
                    "learner_id": str(child.id),
                    "name": child.full_name,
                    "level": child.level,
                    "leaves_count": leaves,
                    "fruit_count": fruit,
                    "equity_flag": child.equity_flag,
                    "current_school": child.current_school,
                    "current_class": child.current_class,
                    "current_program": child.current_program.title if child.current_program else "",
                    "current_track": child.current_track.title if child.current_track else "",
                }
            )
        return result

    @staticmethod
    def _owns(parent_user, learner: Learner) -> bool:
        return str(learner.parent_id) == str(parent_user.id)

    @staticmethod
    def child_growth(learner: Learner) -> dict:
        try:
            profile = learner.growth_profile
            leaves = profile.leaves_count
            fruit = profile.fruit_count
        except GrowthProfile.DoesNotExist:
            leaves = fruit = 0

        recent_badges = (
            BadgeRecord.objects.filter(learner=learner, status="issued")
            .select_related("template")
            .order_by("-date_awarded")[:5]
        )

        return {
            "level": learner.level,
            "leaves_count": leaves,
            "fruit_count": fruit,
            "recent_badges": [
                {"title": b.template.title, "date_awarded": _fmt_date(b.date_awarded)}
                for b in recent_badges
            ],
        }

    @staticmethod
    def child_recognition(learner: Learner) -> dict:
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
            "badges": [
                {"title": b.template.title, "date_awarded": _fmt_date(b.date_awarded)}
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
    def child_artifacts(learner: Learner) -> list[dict]:
        artifacts = (
            Artifact.objects.filter(learner=learner)
            .select_related("module", "evidence_record", "evidence_record__task")
            .order_by("-submitted_at")[:15]
        )
        rows = []
        for artifact in artifacts:
            evidence = getattr(artifact, "evidence_record", None)
            rows.append(
                {
                    "id": str(artifact.id),
                    "title": artifact.title,
                    "status": artifact.status,
                    "submitted_at": _fmt_date(artifact.submitted_at),
                    "module": artifact.module.name if artifact.module else "",
                    "task": evidence.task.title if evidence and evidence.task else "",
                    "evidence_status": evidence.verification_status if evidence else "",
                    "media_count": len(artifact.media_refs or []),
                    "uploaded_by_student": artifact.uploaded_by_student,
                }
            )
        return rows

    @staticmethod
    def child_sessions(learner: Learner) -> list[dict]:
        today = timezone.now().date()
        sessions = (
            Session.objects.filter(
                learners=learner,
                date__gte=today,
                status__in=["scheduled", "in_progress"],
            )
            .select_related("module")
            .order_by("date", "start_time")[:5]
        )
        return [
            {
                "date": _fmt_date(s.date),
                "start_time": s.start_time.strftime("%H:%M") if s.start_time else None,
                "end_time": s.end_time.strftime("%H:%M") if s.end_time else None,
                "module_name": s.module.name if s.module else "",
                "status": s.status,
            }
            for s in sessions
        ]
