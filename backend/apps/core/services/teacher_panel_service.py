from __future__ import annotations

from datetime import timedelta
from typing import Any

from django.db.models import Count, Q
from django.utils import timezone

from apps.core.models import (
    Artifact,
    BadgeRecord,
    BadgeTemplate,
    CertificationRecord,
    LearningTask,
    Learner,
    Lesson,
    LessonProgress,
    MicrocredentialRecord,
    ModuleProgress,
)
from apps.core.models.base import School


def _learner_name(learner: Learner) -> str:
    return f"{learner.first_name} {learner.last_name}"


def _module_pathway(module: Any) -> str:
    if module.course_id and module.course:
        return module.course.name
    try:
        return module.program.track.pathway.name
    except AttributeError:
        return ""


class TeacherPanelService:

    @staticmethod
    def cohort_progress(school: School) -> list[dict]:
        learners = list(
            Learner.objects.filter(tenant=school).order_by("first_name", "last_name")
        )
        active_progress = (
            ModuleProgress.objects.filter(learner__tenant=school)
            .select_related(
                "learner",
                "module",
                "module__course",
                "module__program__track__pathway",
            )
            .order_by("learner_id", "-module__sequence_order")
        )

        progress_by_learner: dict[str, list[ModuleProgress]] = {}
        for mp in active_progress:
            progress_by_learner.setdefault(str(mp.learner_id), []).append(mp)

        rows = []
        for learner in learners:
            all_progress = progress_by_learner.get(str(learner.id), [])
            current = next(
                (p for p in all_progress if p.completion_status == ModuleProgress.STATUS_IN_PROGRESS),
                all_progress[0] if all_progress else None,
            )
            if current:
                pct = (
                    round(current.units_completed / current.units_total * 100)
                    if current.units_total > 0
                    else 0
                )
                rows.append({
                    "learner_id": str(learner.id),
                    "learner_name": _learner_name(learner),
                    "level": learner.level,
                    "pathway": _module_pathway(current.module),
                    "module": current.module.name,
                    "module_id": str(current.module_id),
                    "units_completed": current.units_completed,
                    "units_total": current.units_total,
                    "attendance_count": current.attendance_count,
                    "completion_status": current.completion_status,
                    "microcredential_eligible": current.microcredential_eligible,
                    "completion_pct": pct,
                })
            else:
                rows.append({
                    "learner_id": str(learner.id),
                    "learner_name": _learner_name(learner),
                    "level": learner.level,
                    "pathway": "",
                    "module": "",
                    "module_id": None,
                    "units_completed": 0,
                    "units_total": 0,
                    "attendance_count": 0,
                    "completion_status": "not_started",
                    "microcredential_eligible": False,
                    "completion_pct": 0,
                })
        return rows

    @staticmethod
    def badge_readiness(school: School) -> dict:
        week_ago = timezone.now() - timedelta(days=7)

        active_progress = list(
            ModuleProgress.objects.filter(
                learner__tenant=school,
                units_completed__gt=0,
            ).select_related("learner", "module")
        )

        badge_templates = list(
            BadgeTemplate.objects.filter(unit__isnull=False).select_related("unit")
        )
        bt_by_module_seq: dict[tuple[str, int], BadgeTemplate] = {
            (str(bt.unit.module_id), bt.unit.sequence_order): bt
            for bt in badge_templates
        }

        issued_pairs = set(
            BadgeRecord.objects.filter(
                learner__tenant=school,
                status=BadgeRecord.STATUS_ISSUED,
            ).values_list("learner_id", "template_id")
        )
        issued_str = {(str(l), str(t)) for l, t in issued_pairs}

        pending_awards: list[dict] = []
        for mp in active_progress:
            for seq in range(1, mp.units_completed + 1):
                bt = bt_by_module_seq.get((str(mp.module_id), seq))
                if bt is None:
                    continue
                if (str(mp.learner_id), str(bt.id)) not in issued_str:
                    pending_awards.append({
                        "learner_id": str(mp.learner_id),
                        "learner_name": _learner_name(mp.learner),
                        "badge_title": bt.title,
                        "badge_template_id": str(bt.id),
                        "unit_title": bt.unit.title,
                        "module_title": mp.module.name,
                        "module_id": str(mp.module_id),
                    })

        recently_issued = (
            BadgeRecord.objects.filter(
                learner__tenant=school,
                status=BadgeRecord.STATUS_ISSUED,
                date_awarded__gte=week_ago,
            )
            .select_related("learner", "template")
            .order_by("-date_awarded")[:10]
        )

        return {
            "pending_awards": pending_awards,
            "recently_issued": [
                {
                    "learner_name": _learner_name(r.learner),
                    "badge_title": r.template.title,
                    "date_awarded": r.date_awarded.isoformat() if r.date_awarded else None,
                }
                for r in recently_issued
            ],
        }

    @staticmethod
    def microcredential_readiness(school: School) -> dict:
        eligible_progress = list(
            ModuleProgress.objects.filter(
                learner__tenant=school,
                microcredential_eligible=True,
            ).select_related("learner", "module", "module__microcredential_template")
        )

        issued_pairs = set(
            MicrocredentialRecord.objects.filter(
                learner__tenant=school,
                status="issued",
            ).values_list("learner_id", "module_id")
        )
        issued_str = {(str(l), str(m)) for l, m in issued_pairs}

        eligible: list[dict] = []
        for mp in eligible_progress:
            if (str(mp.learner_id), str(mp.module_id)) in issued_str:
                continue
            template = getattr(mp.module, "microcredential_template", None)
            eligible.append({
                "learner_id": str(mp.learner_id),
                "learner_name": _learner_name(mp.learner),
                "module": mp.module.name,
                "module_id": str(mp.module_id),
                "microcredential_template": template.title if template else "",
                "artifact_submitted": mp.artifact_submitted,
                "reflection_submitted": mp.reflection_submitted,
                "teacher_verified": mp.teacher_verified,
                "quiz_passed": mp.quiz_passed,
            })

        not_eligible_qs = (
            ModuleProgress.objects.filter(
                learner__tenant=school,
                completion_status__in=[
                    ModuleProgress.STATUS_IN_PROGRESS,
                    ModuleProgress.STATUS_PARTIAL,
                ],
                microcredential_eligible=False,
            ).select_related("learner", "module")
        )

        not_yet: list[dict] = []
        for mp in not_eligible_qs:
            missing: list[str] = []
            if mp.units_total > 0 and mp.units_completed < mp.units_total:
                missing.append(f"{mp.units_total - mp.units_completed} units remaining")
            if not mp.artifact_submitted:
                missing.append("artifact")
            if not mp.reflection_submitted:
                missing.append("reflection")
            if not mp.teacher_verified:
                missing.append("teacher verification")
            if not mp.quiz_passed:
                missing.append("quiz")
            not_yet.append({
                "learner_id": str(mp.learner_id),
                "learner_name": _learner_name(mp.learner),
                "module": mp.module.name,
                "module_id": str(mp.module_id),
                "units_completed": mp.units_completed,
                "units_total": mp.units_total,
                "missing": missing,
            })

        return {"eligible": eligible, "not_yet_eligible": not_yet}

    @staticmethod
    def interventions(school: School) -> list[dict]:
        flags: list[dict] = []

        for learner in Learner.objects.filter(tenant=school, equity_flag=True):
            flags.append({
                "learner_id": str(learner.id),
                "learner_name": _learner_name(learner),
                "flag_type": "at_risk",
                "detail": "Learner has an equity support flag",
                "module": "",
            })

        missed_qs = (
            ModuleProgress.objects.filter(
                learner__tenant=school,
                completion_status=ModuleProgress.STATUS_IN_PROGRESS,
                attendance_count=0,
            ).select_related("learner", "module")
        )
        for mp in missed_qs:
            flags.append({
                "learner_id": str(mp.learner_id),
                "learner_name": _learner_name(mp.learner),
                "flag_type": "missed_sessions",
                "detail": "No attendance recorded for this module",
                "module": mp.module.name,
            })

        behind_qs = (
            ModuleProgress.objects.filter(
                learner__tenant=school,
                completion_status=ModuleProgress.STATUS_IN_PROGRESS,
                units_total__gt=0,
            ).select_related("learner", "module")
        )
        for mp in behind_qs:
            if (mp.units_completed / mp.units_total) < 0.5:
                flags.append({
                    "learner_id": str(mp.learner_id),
                    "learner_name": _learner_name(mp.learner),
                    "flag_type": "behind_schedule",
                    "detail": f"{mp.units_completed} of {mp.units_total} units completed",
                    "module": mp.module.name,
                })

        seen: set[tuple[str, str, str]] = set()
        unique: list[dict] = []
        for flag in flags:
            key = (flag["learner_id"], flag["flag_type"], flag["module"])
            if key not in seen:
                seen.add(key)
                unique.append(flag)
        return unique

    @staticmethod
    def certification_pipeline(school: School) -> list[dict]:
        learners_with_mc = list(
            Learner.objects.filter(
                tenant=school,
                microcredential_records__status="issued",
            )
            .annotate(
                mc_count=Count(
                    "microcredential_records",
                    filter=Q(microcredential_records__status="issued"),
                )
            )
            .filter(mc_count__gt=0)
        )

        cert_map: dict[str, CertificationRecord] = {
            str(cr.learner_id): cr
            for cr in CertificationRecord.objects.filter(
                learner__tenant=school,
            ).select_related("program", "template")
        }

        rows: list[dict] = []
        for learner in learners_with_mc:
            mc_count: int = learner.mc_count
            cert = cert_map.get(str(learner.id))

            if cert and cert.status == "issued":
                pipeline_status = "certified"
            elif mc_count >= 3:
                pipeline_status = "on_track"
            elif mc_count == 2:
                pipeline_status = "needs_push"
            else:
                pipeline_status = "stalled"

            program_name = cert.program.title if cert and cert.program else ""

            rows.append({
                "learner_id": str(learner.id),
                "learner_name": _learner_name(learner),
                "program": program_name,
                "microcredentials_earned": mc_count,
                "microcredentials_required": 3,
                "capstone_submitted": cert is not None and cert.capstone_artifact_id is not None,
                "status": pipeline_status,
            })
        return rows

    @staticmethod
    def learner_dual_view(learner_id: str, school: School) -> dict | None:
        try:
            learner = Learner.objects.select_related("growth_profile").get(
                id=learner_id, tenant=school
            )
        except Learner.DoesNotExist:
            return None

        growth = getattr(learner, "growth_profile", None)

        current_mp = (
            ModuleProgress.objects.filter(
                learner=learner,
                completion_status=ModuleProgress.STATUS_IN_PROGRESS,
            )
            .select_related("module")
            .first()
        ) or (
            ModuleProgress.objects.filter(learner=learner)
            .select_related("module")
            .order_by("-id")
            .first()
        )

        current_lesson: Lesson | None = None
        current_task: LearningTask | None = None

        if current_mp:
            completed_ids = set(
                LessonProgress.objects.filter(
                    learner=learner,
                    lesson__unit__module=current_mp.module,
                    completed=True,
                ).values_list("lesson_id", flat=True)
            )
            current_lesson = (
                Lesson.objects.filter(
                    unit__module=current_mp.module,
                    status="active",
                )
                .exclude(id__in=completed_ids)
                .order_by("unit__sequence_order", "sequence_order")
                .select_related("unit")
                .first()
            )
            if current_lesson:
                current_task = (
                    LearningTask.objects.filter(
                        lesson=current_lesson,
                        status="active",
                    )
                    .order_by("sequence_order")
                    .first()
                )

        recent_artifacts = list(
            Artifact.objects.filter(learner=learner)
            .order_by("-submitted_at")[:5]
            .values("id", "title", "status", "submitted_at")
        )

        learner_view: dict = {"module": None, "lesson": None, "artifacts": recent_artifacts}
        if current_mp:
            m = current_mp.module
            learner_view["module"] = {
                "id": str(m.id),
                "name": m.name,
                "outcome_statement": m.outcome_statement,
                "units_completed": current_mp.units_completed,
                "units_total": current_mp.units_total,
                "completion_status": current_mp.completion_status,
                "microcredential_eligible": current_mp.microcredential_eligible,
            }
        if current_lesson:
            learner_view["lesson"] = {
                "id": str(current_lesson.id),
                "title": current_lesson.title,
                "duration_minutes": current_lesson.duration_minutes,
                "learner_objectives": current_lesson.learner_objectives,
                "learner_content": current_lesson.learner_content,
            }

        teacher_view: dict = {
            "module_notes": current_mp.module.teacher_notes if current_mp else "",
            "lesson_guide": None,
            "task_rubric": None,
        }
        if current_lesson:
            teacher_view["lesson_guide"] = {
                "teacher_content": current_lesson.teacher_content,
                "resource_links": current_lesson.resource_links,
            }
        if current_task:
            teacher_view["task_rubric"] = {
                "task_id": str(current_task.id),
                "task_title": current_task.title,
                "teacher_rubric": current_task.teacher_rubric,
                "answer_key": current_task.answer_key,
            }

        return {
            "learner": {
                "id": str(learner.id),
                "name": _learner_name(learner),
                "level": learner.level,
                "equity_flag": learner.equity_flag,
                "growth": {
                    "leaves_count": growth.leaves_count,
                    "fruit_count": growth.fruit_count,
                } if growth else None,
            },
            "learner_content": learner_view,
            "teacher_content": teacher_view,
        }
