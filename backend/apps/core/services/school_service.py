"""
School dashboard analytics service.

Extracted from:
  - SchoolDashboardViewSet.stats()     → SchoolAnalyticsService.compute_stats()
  - SchoolDashboardViewSet.analytics() → SchoolAnalyticsService.compute_analytics()
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from apps.core.models import School


class SchoolAnalyticsService:
    """Compute dashboard and analytics metrics for a school."""

    @staticmethod
    def compute_stats(*, school: "School") -> dict[str, Any]:
        """Return overview + performance KPIs for the stats endpoint."""
        from django.db.models import Avg, Q

        from apps.core.models import (
            Achievement,
            Artifact,
            Learner,
            LearnerCourseEnrollment,
            LearnerLevelProgress,
        )
        from django.contrib.auth import get_user_model

        User = get_user_model()

        total_students = Learner.objects.filter(tenant=school).count()
        total_teachers = (
            User.objects.filter(
                Q(tenant=school) | Q(teacher_schools=school), role="teacher"
            )
            .distinct()
            .count()
        )
        active_enrollments = LearnerCourseEnrollment.objects.filter(
            learner__tenant=school, is_active=True
        ).count()
        total_badges = Achievement.objects.filter(learner__tenant=school).count()
        total_artifacts = Artifact.objects.filter(learner__tenant=school).count()
        avg_completion = (
            LearnerLevelProgress.objects.filter(
                enrollment__learner__tenant=school
            ).aggregate(avg=Avg("modules_completed"))["avg"]
            or 0
        )

        return {
            "overview": {
                "total_students": total_students,
                "total_teachers": total_teachers,
                "active_students": active_enrollments,
            },
            "performance": {
                "total_badges_awarded": total_badges,
                "total_artifacts_submitted": total_artifacts,
                "average_completion_rate": round(avg_completion, 1),
            },
        }

    @staticmethod
    def compute_analytics(*, school: "School") -> dict[str, Any]:
        """Return detailed analytics for the analytics page."""
        from django.db.models import Avg, Count, Q, Sum
        from django.utils import timezone

        from apps.core.models import (
            Achievement,
            Artifact,
            Course,
            Learner,
            LearnerCourseEnrollment,
            LearnerLevelProgress,
        )
        from django.contrib.auth import get_user_model

        User = get_user_model()

        now = timezone.now()
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        overview = SchoolAnalyticsService._overview(
            school, User, Learner, LearnerCourseEnrollment, Course, Q
        )
        performance = SchoolAnalyticsService._performance(
            school, Avg, LearnerLevelProgress, Achievement, Artifact
        )
        trends = SchoolAnalyticsService._trends(
            school, LearnerCourseEnrollment, Achievement, LearnerLevelProgress,
            start_of_month,
        )
        top_performers = SchoolAnalyticsService._top_performers(
            school, Learner, Count, Sum
        )
        course_stats = SchoolAnalyticsService._course_stats(
            school, Course, LearnerCourseEnrollment, LearnerLevelProgress, Q
        )

        return {
            "overview": overview,
            "performance": performance,
            "trends": trends,
            "topPerformers": top_performers,
            "courseStats": course_stats,
        }

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _overview(
        school: "School", User: Any, Learner: Any,
        LearnerCourseEnrollment: Any, Course: Any, Q: Any,
    ) -> dict[str, Any]:
        total_students = Learner.objects.filter(tenant=school).count()
        active_students = (
            LearnerCourseEnrollment.objects.filter(
                learner__tenant=school, is_active=True
            )
            .values("learner")
            .distinct()
            .count()
        )
        total_teachers = (
            User.objects.filter(
                Q(tenant=school) | Q(teacher_schools=school), role="teacher"
            )
            .distinct()
            .count()
        )
        total_courses = Course.objects.filter(
            Q(tenant=None) | Q(tenant=school)
        ).count()
        return {
            "total_students": total_students,
            "active_students": active_students,
            "total_teachers": total_teachers,
            "total_courses": total_courses,
        }

    @staticmethod
    def _performance(
        school: "School", Avg: Any, LearnerLevelProgress: Any,
        Achievement: Any, Artifact: Any,
    ) -> dict[str, Any]:
        avg_completion = (
            LearnerLevelProgress.objects.filter(
                enrollment__learner__tenant=school
            ).aggregate(avg=Avg("modules_completed"))["avg"]
            or 0
        )
        avg_score = (
            LearnerLevelProgress.objects.filter(
                enrollment__learner__tenant=school
            ).aggregate(avg=Avg("assessment_score"))["avg"]
            or 0
        )
        return {
            "average_completion_rate": round(avg_completion, 1),
            "average_assessment_score": round(avg_score, 1),
            "total_badges_awarded": Achievement.objects.filter(
                learner__tenant=school
            ).count(),
            "total_artifacts_submitted": Artifact.objects.filter(
                learner__tenant=school
            ).count(),
        }

    @staticmethod
    def _trends(
        school: "School",
        LearnerCourseEnrollment: Any,
        Achievement: Any,
        LearnerLevelProgress: Any,
        start_of_month: Any,
    ) -> dict[str, Any]:
        return {
            "enrollments_this_month": LearnerCourseEnrollment.objects.filter(
                learner__tenant=school, enrolled_at__gte=start_of_month
            ).count(),
            "badges_this_month": Achievement.objects.filter(
                learner__tenant=school, earned_at__gte=start_of_month
            ).count(),
            "completion_this_month": LearnerLevelProgress.objects.filter(
                enrollment__learner__tenant=school,
                updated_at__gte=start_of_month,
                completed=True,
            ).count(),
        }

    @staticmethod
    def _top_performers(
        school: "School", Learner: Any, Count: Any, Sum: Any
    ) -> list[dict[str, Any]]:
        qs = (
            Learner.objects.filter(tenant=school)
            .annotate(
                badges_count=Count("achievements"),
                completed_modules=Sum(
                    "course_enrollments__level_progress__modules_completed"
                ),
            )
            .order_by("-badges_count")[:5]
        )
        return [
            {
                "student_name": s.full_name,
                "badges_count": s.badges_count,
                "completion_rate": min(100, (s.completed_modules or 0) * 5),
            }
            for s in qs
        ]

    @staticmethod
    def _course_stats(
        school: "School",
        Course: Any,
        LearnerCourseEnrollment: Any,
        LearnerLevelProgress: Any,
        Q: Any,
    ) -> list[dict[str, Any]]:
        courses = Course.objects.filter(Q(tenant=None) | Q(tenant=school))
        stats: list[dict[str, Any]] = []
        for course in courses:
            enrolled = LearnerCourseEnrollment.objects.filter(
                learner__tenant=school, course=course
            ).count()
            if not enrolled:
                continue
            completed_levels = LearnerLevelProgress.objects.filter(
                enrollment__learner__tenant=school,
                enrollment__course=course,
                completed=True,
            ).count()
            avg_prog = min(100, (completed_levels / enrolled) * 20)
            stats.append({
                "course_name": course.name,
                "enrolled_students": enrolled,
                "completion_rate": int(avg_prog),
            })
        return stats
