"""
Student enrollment service.

Extracted from StudentManagementViewSet.enroll_student() in teacher_views.py.
All business logic for enrolling a learner in a course lives here.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from apps.core.models import Course, Learner, LearnerCourseEnrollment


@dataclass(frozen=True)
class EnrollmentResult:
    enrollment: "LearnerCourseEnrollment"
    created: bool


class EnrollmentService:
    """Enroll a learner in a course, ensuring progress records exist."""

    @staticmethod
    def enroll(
        *,
        learner: "Learner",
        course_id: str | uuid.UUID,
        level_id: str | uuid.UUID | None = None,
    ) -> EnrollmentResult:
        """Enroll learner in course. Reactivates if previously inactive."""
        from apps.core.models import Course, CourseLevel, LearnerCourseEnrollment, LearnerLevelProgress

        course = Course.objects.get(id=course_id)
        starting_level = EnrollmentService._resolve_starting_level(course, level_id)

        enrollment, created = LearnerCourseEnrollment.objects.get_or_create(
            learner=learner,
            course=course,
            defaults={"is_active": True, "current_level": starting_level},
        )

        if not created:
            enrollment.is_active = True
            enrollment.save(update_fields=["is_active"])

        EnrollmentService._ensure_progress_record(enrollment)
        return EnrollmentResult(enrollment=enrollment, created=created)

    @staticmethod
    def _resolve_starting_level(
        course: "Course", level_id: str | uuid.UUID | None
    ) -> object:
        from apps.core.models import CourseLevel

        if level_id:
            return CourseLevel.objects.get(id=level_id, course=course)
        return course.levels.order_by("level_number").first()

    @staticmethod
    def _ensure_progress_record(enrollment: "LearnerCourseEnrollment") -> None:
        from apps.core.models import LearnerLevelProgress

        if enrollment.current_level:
            LearnerLevelProgress.objects.get_or_create(
                enrollment=enrollment,
                level=enrollment.current_level,
            )
