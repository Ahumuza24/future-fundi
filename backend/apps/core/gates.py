"""
Unlock Gate Engine (PRD §9).

Usage:
    from apps.core.gates import GateService

    result = GateService.check(learner, module)
    if not result.is_open:
        return Response({"detail": result.detail}, status=403)

    # Grant an admin override (creates an AdminOverride audit row):
    GateService.apply_override(
        actor=request.user,
        learner=learner,
        layer="module",
        layer_ref_id=module.pk,
        reason="Learner attended equivalent offline session",
    )
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from apps.core.models import (
        AdminOverride,
        Learner,
        LearningTask,
        Lesson,
        Module,
        Pathway,
        Program,
        Track,
        Unit,
    )


# ---------------------------------------------------------------------------
# GateResult
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class GateResult:
    """Immutable result returned by every GateService.check_* method."""

    is_open: bool
    reason: str
    detail: str = field(default="")

    # --- reason constants ---
    REASON_NO_GATE: str = field(default="no_gate", init=False, repr=False, compare=False)
    REASON_ENROLLED: str = field(default="enrolled", init=False, repr=False, compare=False)
    REASON_FIRST_IN_PARENT: str = field(default="first_in_parent", init=False, repr=False, compare=False)
    REASON_PREVIOUS_COMPLETE: str = field(default="previous_complete", init=False, repr=False, compare=False)
    REASON_PARENT_UNLOCKED: str = field(default="parent_unlocked", init=False, repr=False, compare=False)
    REASON_ADMIN_OVERRIDE: str = field(default="admin_override", init=False, repr=False, compare=False)
    REASON_NOT_ENROLLED: str = field(default="not_enrolled", init=False, repr=False, compare=False)
    REASON_PREVIOUS_INCOMPLETE: str = field(default="previous_incomplete", init=False, repr=False, compare=False)
    REASON_PARENT_LOCKED: str = field(default="parent_locked", init=False, repr=False, compare=False)


# Re-export as plain constants for call-site convenience.
NO_GATE = "no_gate"
ENROLLED = "enrolled"
FIRST_IN_PARENT = "first_in_parent"
PREVIOUS_COMPLETE = "previous_complete"
PARENT_UNLOCKED = "parent_unlocked"
ADMIN_OVERRIDE = "admin_override"
NOT_ENROLLED = "not_enrolled"
PREVIOUS_INCOMPLETE = "previous_incomplete"
PARENT_LOCKED = "parent_locked"


def _open(reason: str, detail: str = "") -> GateResult:
    return GateResult(is_open=True, reason=reason, detail=detail)


def _closed(reason: str, detail: str = "") -> GateResult:
    return GateResult(is_open=False, reason=reason, detail=detail)


# ---------------------------------------------------------------------------
# GateService
# ---------------------------------------------------------------------------

class GateService:
    """Reusable unlock gate engine implementing PRD §9 rules for all 7 layers.

    All methods are stateless class/static methods — no instantiation needed.
    """

    # ------------------------------------------------------------------
    # Public dispatcher
    # ------------------------------------------------------------------

    @classmethod
    def check(cls, learner: "Learner", obj: object) -> GateResult:
        """Dispatch to the correct layer checker based on obj's type."""
        # Import here to avoid circular import at module load time.
        from apps.core.models import (
            LearningTask,
            Lesson,
            Module,
            Pathway,
            Program,
            Track,
            Unit,
        )

        if isinstance(obj, Pathway):
            return cls.check_pathway(learner, obj)
        if isinstance(obj, Track):
            return cls.check_track(learner, obj)
        if isinstance(obj, Program):
            return cls.check_program(learner, obj)
        if isinstance(obj, Module):
            return cls.check_module(learner, obj)
        if isinstance(obj, Unit):
            return cls.check_unit(learner, obj)
        if isinstance(obj, Lesson):
            return cls.check_lesson(learner, obj)
        if isinstance(obj, LearningTask):
            return cls.check_task(learner, obj)

        raise TypeError(f"GateService.check: unsupported object type {type(obj)!r}")

    # ------------------------------------------------------------------
    # Layer 1 — Pathway (PRD §9.1)
    # Always open: enrollment in a Pathway is a separate enrolment action,
    # not a gate check.
    # ------------------------------------------------------------------

    @staticmethod
    def check_pathway(learner: "Learner", pathway: "Pathway") -> GateResult:
        return _open(NO_GATE, "Pathways are always open for enrollment.")

    # ------------------------------------------------------------------
    # Layer 2 — Track (PRD §9.2)
    # Open if the learner is enrolled in the parent Pathway.
    # ------------------------------------------------------------------

    @classmethod
    def check_track(cls, learner: "Learner", track: "Track") -> GateResult:
        if cls._has_override(learner, "track", track.pk):
            return _open(ADMIN_OVERRIDE, f"Admin override active for track {track.pk}.")

        from apps.core.models import LearnerCourseEnrollment

        enrolled = LearnerCourseEnrollment.objects.filter(
            learner=learner,
            course=track.pathway,
        ).exists()

        if enrolled:
            return _open(ENROLLED, "Learner is enrolled in the parent pathway.")

        return _closed(
            NOT_ENROLLED,
            f"Learner is not enrolled in pathway '{track.pathway.name}'. "
            "Enroll first to access this track.",
        )

    # ------------------------------------------------------------------
    # Layer 3 — Program (PRD §9.3)
    # Open if the learner is enrolled in the parent Pathway (same rule as
    # Track — Track unlocks are implicit once the Pathway is enrolled).
    # ------------------------------------------------------------------

    @classmethod
    def check_program(cls, learner: "Learner", program: "Program") -> GateResult:
        if cls._has_override(learner, "program", program.pk):
            return _open(ADMIN_OVERRIDE, f"Admin override active for program {program.pk}.")

        from apps.core.models import LearnerCourseEnrollment

        enrolled = LearnerCourseEnrollment.objects.filter(
            learner=learner,
            course=program.track.pathway,
        ).exists()

        if enrolled:
            return _open(ENROLLED, "Learner is enrolled in the parent pathway.")

        return _closed(
            NOT_ENROLLED,
            f"Learner is not enrolled in pathway '{program.track.pathway.name}'.",
        )

    # ------------------------------------------------------------------
    # Layer 4 — Module (PRD §9.4)
    # Open if:
    #   (a) it is the first Module in its Program (sequence_order == 1 or
    #       no earlier sibling exists), OR
    #   (b) the immediately preceding Module (by sequence_order) is complete.
    # ------------------------------------------------------------------

    @classmethod
    def check_module(cls, learner: "Learner", module: "Module") -> GateResult:
        if cls._has_override(learner, "module", module.pk):
            return _open(ADMIN_OVERRIDE, f"Admin override active for module {module.pk}.")

        if module.program_id is None:
            # Module not yet attached to a Program — treat as open.
            return _open(NO_GATE, "Module is not attached to a program.")

        # Find the previous sibling Module by sequence_order.
        prev_module = (
            type(module)
            .objects.filter(
                program_id=module.program_id,
                sequence_order__lt=module.sequence_order,
            )
            .order_by("-sequence_order")
            .first()
        )

        if prev_module is None:
            # First Module in its Program.
            return _open(FIRST_IN_PARENT, "First module in program — always open.")

        if cls._is_module_complete(learner, prev_module):
            return _open(
                PREVIOUS_COMPLETE,
                f"Previous module '{prev_module.title}' is complete.",
            )

        return _closed(
            PREVIOUS_INCOMPLETE,
            f"Complete module '{prev_module.title}' before accessing this one.",
        )

    # ------------------------------------------------------------------
    # Layer 5 — Unit (PRD §9.5)
    # Open if the parent Module is unlocked for this learner.
    # ------------------------------------------------------------------

    @classmethod
    def check_unit(cls, learner: "Learner", unit: "Unit") -> GateResult:
        if cls._has_override(learner, "unit", unit.pk):
            return _open(ADMIN_OVERRIDE, f"Admin override active for unit {unit.pk}.")

        module_result = cls.check_module(learner, unit.module)
        if module_result.is_open:
            return _open(PARENT_UNLOCKED, "Parent module is unlocked.")

        return _closed(
            PARENT_LOCKED,
            f"Parent module is locked: {module_result.detail}",
        )

    # ------------------------------------------------------------------
    # Layer 6 — Lesson (PRD §9.6)
    # Open if:
    #   (a) parent Unit is open, AND
    #   (b) it is the first Lesson in the Unit OR the previous Lesson is complete.
    # ------------------------------------------------------------------

    @classmethod
    def check_lesson(cls, learner: "Learner", lesson: "Lesson") -> GateResult:
        if cls._has_override(learner, "lesson", lesson.pk):
            return _open(ADMIN_OVERRIDE, f"Admin override active for lesson {lesson.pk}.")

        unit_result = cls.check_unit(learner, lesson.unit)
        if not unit_result.is_open:
            return _closed(PARENT_LOCKED, f"Parent unit is locked: {unit_result.detail}")

        # Find the previous sibling Lesson by sequence_order.
        prev_lesson = (
            type(lesson)
            .objects.filter(
                unit_id=lesson.unit_id,
                sequence_order__lt=lesson.sequence_order,
            )
            .order_by("-sequence_order")
            .first()
        )

        if prev_lesson is None:
            return _open(FIRST_IN_PARENT, "First lesson in unit — always open.")

        from apps.core.models import LessonProgress

        prev_done = LessonProgress.objects.filter(
            learner=learner,
            lesson=prev_lesson,
            completed=True,
        ).exists()

        if prev_done:
            return _open(PREVIOUS_COMPLETE, f"Previous lesson '{prev_lesson.title}' is complete.")

        return _closed(
            PREVIOUS_INCOMPLETE,
            f"Complete lesson '{prev_lesson.title}' before accessing this one.",
        )

    # ------------------------------------------------------------------
    # Layer 7 — LearningTask (PRD §9.7)
    # Open if the parent Lesson is open for this learner.
    # ------------------------------------------------------------------

    @classmethod
    def check_task(cls, learner: "Learner", task: "LearningTask") -> GateResult:
        if cls._has_override(learner, "task", task.pk):
            return _open(ADMIN_OVERRIDE, f"Admin override active for task {task.pk}.")

        lesson_result = cls.check_lesson(learner, task.lesson)
        if lesson_result.is_open:
            return _open(PARENT_UNLOCKED, "Parent lesson is unlocked.")

        return _closed(PARENT_LOCKED, f"Parent lesson is locked: {lesson_result.detail}")

    # ------------------------------------------------------------------
    # Override management
    # ------------------------------------------------------------------

    @staticmethod
    def apply_override(
        *,
        actor: object,
        learner: "Learner",
        layer: str,
        layer_ref_id: uuid.UUID,
        reason: str,
    ) -> "AdminOverride":
        """Create an AdminOverride audit row. The returned object is already saved."""
        from apps.core.models import AdminOverride

        if not reason or not reason.strip():
            raise ValueError("A non-empty reason is required for an admin override.")

        return AdminOverride.objects.create(
            actor=actor,
            learner=learner,
            layer=layer,
            layer_ref_id=layer_ref_id,
            reason=reason.strip(),
        )

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _has_override(learner: "Learner", layer: str, ref_id: uuid.UUID) -> bool:
        from apps.core.models import AdminOverride

        return AdminOverride.objects.filter(
            learner=learner,
            layer=layer,
            layer_ref_id=ref_id,
        ).exists()

    @staticmethod
    def _is_module_complete(learner: "Learner", module: "Module") -> bool:
        """Return True if the learner has a complete ModuleProgress row OR an
        issued MicrocredentialRecord for the module."""
        from apps.core.models import MicrocredentialRecord, ModuleProgress

        if ModuleProgress.objects.filter(
            learner=learner,
            module=module,
            completion_status=ModuleProgress.STATUS_COMPLETE,
        ).exists():
            return True

        return MicrocredentialRecord.objects.filter(
            learner=learner,
            module=module,
            status="issued",
        ).exists()
