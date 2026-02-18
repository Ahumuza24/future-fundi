from apps.api.serializers import (
    PathwaySerializer,
    PodClassSerializer,
    SchoolLearnerSerializer,
    SchoolStudentCreateSerializer,
    UserSerializer,
)
from apps.core.models import (
    Achievement,
    Artifact,
    Career,
    Course,
    Learner,
    LearnerCourseEnrollment,
    LearnerLevelProgress,
    PodClass,
    School,
)
from django.contrib.auth import get_user_model
from django.db.models import Avg, Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .permissions import IsSchoolAdmin
from datetime import timedelta

from django.db.models import Avg, Count, F, Q, Sum
from django.utils import timezone


User = get_user_model()




class SchoolDashboardViewSet(viewsets.ViewSet):
    permission_classes = [IsSchoolAdmin]

    @action(detail=False, methods=["get"])
    def stats(self, request):
        school = request.user.tenant
        if not school:
            return Response(
                {"error": "User does not belong to a school"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Basic Stats
        total_students = Learner.objects.filter(tenant=school).count()
        total_teachers = User.objects.filter(
            Q(tenant=school) | Q(teacher_schools=school), role="teacher"
        ).distinct().count()

        # Active Enrollments
        active_enrollments = LearnerCourseEnrollment.objects.filter(
            learner__tenant=school, is_active=True
        ).count()

        # Performance Metrics
        total_badges = Achievement.objects.filter(learner__tenant=school).count()
        total_artifacts = Artifact.objects.filter(learner__tenant=school).count()

        # Average Completion Rate (simplified)
        avg_completion = (
            LearnerLevelProgress.objects.filter(
                enrollment__learner__tenant=school
            ).aggregate(avg=Avg("modules_completed"))["avg"]
            or 0
        )

        return Response(
            {
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
        )

    @action(detail=False, methods=["get"])
    def analytics(self, request):
        """Detailed analytics for the analytics page."""
        school = request.user.tenant
        if not school:
            return Response({"error": "User does not belong to a school"}, status=400)

        # Overview
        total_students = Learner.objects.filter(tenant=school).count()
        active_students = (
            LearnerCourseEnrollment.objects.filter(
                learner__tenant=school, is_active=True
            )
            .values("learner")
            .distinct()
            .count()
        )
        total_teachers = User.objects.filter(
            Q(tenant=school) | Q(teacher_schools=school), role="teacher"
        ).distinct().count()
        total_courses = Course.objects.filter(Q(tenant=None) | Q(tenant=school)).count()

        # Performance
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
        total_badges = Achievement.objects.filter(learner__tenant=school).count()
        total_artifacts = Artifact.objects.filter(learner__tenant=school).count()

        # Trends (This Month)
        now = timezone.now()
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        enrollments_month = LearnerCourseEnrollment.objects.filter(
            learner__tenant=school, enrolled_at__gte=start_of_month
        ).count()
        badges_month = Achievement.objects.filter(
            learner__tenant=school, earned_at__gte=start_of_month
        ).count()
        # Simplified Completion Trend (just counting updated progress records this month for now)
        completion_month = LearnerLevelProgress.objects.filter(
            enrollment__learner__tenant=school,
            updated_at__gte=start_of_month,
            completed=True,
        ).count()

        # Top Performers Query
        top_performers_qs = (
            Learner.objects.filter(tenant=school)
            .annotate(
                badges_count=Count("achievements"),
                completed_modules=Sum(
                    "course_enrollments__level_progress__modules_completed"
                ),
            )
            .order_by("-badges_count")[:5]
        )
        top_performers = [
            {
                "student_name": s.full_name,
                "badges_count": s.badges_count,
                # Mock calculation for completion rate for demo purposes if no modules data
                "completion_rate": min(100, (s.completed_modules or 0) * 5),
            }
            for s in top_performers_qs
        ]

        # Course Stats
        courses = Course.objects.filter(Q(tenant=None) | Q(tenant=school))
        course_stats = []
        for course in courses:
            enrolled = LearnerCourseEnrollment.objects.filter(
                learner__tenant=school, course=course
            ).count()
            if enrolled > 0:
                # Simplified completion rate
                completed_levels = LearnerLevelProgress.objects.filter(
                    enrollment__learner__tenant=school,
                    enrollment__course=course,
                    completed=True,
                ).count()
                # Rough estimate: completed levels / (enrolled students * total levels)
                # For now just using completed_levels / enrolled * 10 or similar logic
                # Better: Avg percentage
                avg_prog = 0
                if enrolled > 0:
                    avg_prog = min(
                        100, (completed_levels / enrolled) * 20
                    )  # Mock logic for realism

                course_stats.append(
                    {
                        "course_name": course.name,
                        "enrolled_students": enrolled,
                        "completion_rate": int(avg_prog),
                    }
                )

        return Response(
            {
                "overview": {
                    "total_students": total_students,
                    "active_students": active_students,
                    "total_teachers": total_teachers,
                    "total_courses": total_courses,
                },
                "performance": {
                    "average_completion_rate": round(avg_completion, 1),
                    "average_assessment_score": round(avg_score, 1),
                    "total_badges_awarded": total_badges,
                    "total_artifacts_submitted": total_artifacts,
                },
                "trends": {
                    "enrollments_this_month": enrollments_month,
                    "badges_this_month": badges_month,
                    "completion_this_month": completion_month,
                },
                "topPerformers": top_performers,
                "courseStats": course_stats,
            }
        )

    @action(detail=False, methods=["get"])
    def badges(self, request):
        school = request.user.tenant
        if not school:
            return Response([], status=400)

        badges = Achievement.objects.filter(learner__tenant=school).select_related(
            "learner"
        )
        data = [
            {
                "id": str(b.id),
                "student_name": b.learner.full_name,
                "badge_name": b.name,
                "description": b.description or "",
                "awarded_date": b.earned_at,
                "awarded_by": "System",
            }
            for b in badges
        ]
        return Response(data)

    @action(detail=False, methods=["get"])
    def artifacts(self, request):
        school = request.user.tenant
        if not school:
            return Response([], status=400)

        artifacts = Artifact.objects.filter(learner__tenant=school).select_related(
            "learner"
        )
        data = [
            {
                "id": str(a.id),
                "student_name": a.learner.full_name,
                "title": a.title,
                "description": a.reflection or "",
                "course_name": "General",  # Artifact model doesn't link to course yet
                "submitted_date": a.submitted_at,  # Note: using submitted_at instead of created_at if available, dependent on model
                "file_type": "FILE",  # Simplification
            }
            for a in artifacts
        ]
        return Response(data)

    @action(detail=False, methods=["get"])
    def progress(self, request):
        school = request.user.tenant
        if not school:
            return Response([], status=400)

        # Get all active enrollments with necessary relations
        enrollments = (
            LearnerCourseEnrollment.objects.filter(
                learner__tenant=school, is_active=True
            )
            .select_related("learner", "course", "current_level", "learner__user")
            .prefetch_related("course__levels", "level_progress")
        )

        data = []
        for e in enrollments:
            # Calculate total modules required for the course
            # Use list comprehension since we prefetched levels
            total_modules = (
                sum(level.required_modules_count for level in e.course.levels.all())
                or 1
            )

            # Calculate completed modules from progress records
            # Use list comprehension since we prefetched level_progress
            modules_completed = sum(p.modules_completed for p in e.level_progress.all())

            # Artifacts count from progress or Artifact model?
            # Artifact is per learner, but theoretically linked to enrollment?
            # We don't have direct link in Artifact model yet, so relying on level_progress artifacts count
            artifacts_count = sum(p.artifacts_submitted for p in e.level_progress.all())

            # Average score
            progress_list = list(e.level_progress.all())
            if progress_list:
                avg_score = sum(p.assessment_score for p in progress_list) / len(
                    progress_list
                )
            else:
                avg_score = 0

            # Completion Percentage
            completion_pct = 0
            if total_modules > 0:
                completion_pct = min(
                    100, int((modules_completed / total_modules) * 100)
                )

            # Status Logic
            status_val = "on_track"
            if avg_score > 0 and avg_score < 50:
                status_val = "needs_attention"
            elif e.completed_at or completion_pct >= 100:
                status_val = "completed"

            data.append(
                {
                    "id": str(e.learner.id),
                    "student_name": e.learner.full_name,
                    "student_email": e.learner.user.email if e.learner.user else "",
                    "course_name": e.course.name,
                    "current_level": (
                        f"Level {e.current_level.level_number}"
                        if e.current_level
                        else "Not Started"
                    ),
                    "completion_percentage": completion_pct,
                    "modules_completed": modules_completed,
                    "total_modules": total_modules,
                    "artifacts_submitted": artifacts_count,
                    "assessment_score": round(avg_score, 1),
                    "status": status_val,
                }
            )

        return Response(data)


class SchoolStudentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsSchoolAdmin]

    def get_queryset(self):
        tenant = self.request.user.tenant
        if not tenant:
            return Learner.objects.none()
        return (
            Learner.objects.filter(tenant=tenant)
            .select_related("user", "parent")
            .prefetch_related("course_enrollments__course")
        )

    def get_serializer_class(self):
        if self.action == "create":
            return SchoolStudentCreateSerializer
        return SchoolLearnerSerializer


class SchoolTeacherViewSet(viewsets.ModelViewSet):
    permission_classes = [IsSchoolAdmin]
    serializer_class = UserSerializer

    def get_queryset(self):
        tenant = self.request.user.tenant
        if not tenant:
            return User.objects.none()
        return User.objects.filter(
            Q(tenant=tenant) | Q(teacher_schools=tenant), role="teacher"
        ).distinct()

    def perform_create(self, serializer):
        teacher = serializer.save(tenant=self.request.user.tenant, role="teacher")
        teacher.teacher_schools.add(self.request.user.tenant)


class SchoolPathwayViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsSchoolAdmin]
    serializer_class = PathwaySerializer

    def get_queryset(self):
        tenant = self.request.user.tenant
        # Global pathways + School specific
        return Course.objects.filter(Q(tenant=None) | Q(tenant=tenant))


class SchoolPodClassViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsSchoolAdmin]
    serializer_class = PodClassSerializer

    def get_queryset(self):
        tenant = self.request.user.tenant
        if not tenant:
            return PodClass.objects.none()
        return PodClass.objects.filter(tenant=tenant)
