from __future__ import annotations

from typing import Any

from django.db.models import Count

from apps.core.models import (
    Artifact,
    Attendance,
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
            .select_related("module", "evidence_record", "evidence_record__task")
            .order_by("-submitted_at")[:20]
        )
        rows = []
        for artifact in artifacts:
            evidence = getattr(artifact, "evidence_record", None)
            evidence_status = None
            if evidence is not None:
                evidence_status = evidence.verification_status
            elif artifact.status == Artifact.STATUS_APPROVED:
                evidence_status = "verified"
            else:
                evidence_status = artifact.status

            rows.append({
                "id": str(artifact.id),
                "title": artifact.title,
                "status": artifact.status,
                "evidence_status": evidence_status,
                "submitted_at": _fmt_date(artifact.submitted_at),
                "module": artifact.module.name if artifact.module else "",
                "task": evidence.task.title if evidence and evidence.task else "",
                "uploaded_by_student": artifact.uploaded_by_student,
                "reflection": artifact.reflection,
                "media_refs": artifact.media_refs or [],
            })
        return rows

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

    @staticmethod
    def attendance(learner: Learner) -> dict:
        records = (
            Attendance.objects.filter(learner=learner)
            .select_related(
                "session",
                "session__teacher",
                "session__module",
                "session__module__course",
                "session__module__program__track__pathway",
            )
            .order_by("-session__date", "-session__start_time", "-marked_at")
        )

        total = records.count()
        present_count = records.filter(status__in=["present", "late"]).count()
        absent_count = records.filter(status="absent").count()
        late_count = records.filter(status="late").count()
        excused_count = records.filter(status="excused").count()
        rate = round((present_count / total) * 100) if total else 0

        streak = 0
        seen_dates: set[str] = set()
        for record in records:
            date_key = record.session.date.isoformat()
            if date_key in seen_dates:
                continue
            seen_dates.add(date_key)
            if record.status in {"present", "late"}:
                streak += 1
            else:
                break

        pathway_counts: dict[str, dict[str, int]] = {}
        rows = []
        for record in records:
            module = record.session.module
            pathway = ""
            if module:
                if module.course:
                    pathway = module.course.name
                elif module.program and module.program.track and module.program.track.pathway:
                    pathway = module.program.track.pathway.name

            pathway_label = pathway or "General Learning"
            if pathway_label not in pathway_counts:
                pathway_counts[pathway_label] = {"total": 0, "present": 0}
            pathway_counts[pathway_label]["total"] += 1
            if record.status in {"present", "late"}:
                pathway_counts[pathway_label]["present"] += 1

            teacher_name = record.session.teacher.get_full_name() or record.session.teacher.username
            rows.append({
                "id": str(record.id),
                "status": record.status,
                "notes": record.notes,
                "marked_at": _fmt_date(record.marked_at),
                "session": {
                    "id": str(record.session.id),
                    "title": module.name if module else "Learning Session",
                    "date": record.session.date.isoformat(),
                    "start_time": (
                        record.session.start_time.strftime("%H:%M")
                        if record.session.start_time else None
                    ),
                    "end_time": (
                        record.session.end_time.strftime("%H:%M")
                        if record.session.end_time else None
                    ),
                    "status": record.session.status,
                    "pathway": pathway_label,
                    "teacher": teacher_name,
                },
            })

        return {
            "summary": {
                "attendance_rate": rate,
                "total_sessions": total,
                "sessions_completed": present_count,
                "absent": absent_count,
                "late": late_count,
                "excused": excused_count,
                "current_streak": streak,
            },
            "pathways": [
                {
                    "name": name,
                    "attendance_rate": round((counts["present"] / counts["total"]) * 100)
                    if counts["total"] else 0,
                    "total_sessions": counts["total"],
                }
                for name, counts in pathway_counts.items()
            ],
            "records": rows,
        }
