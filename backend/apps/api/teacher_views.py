from __future__ import annotations

from datetime import date, datetime

from apps.core.models import Artifact, Attendance, Learner, Session
from django.db.models import Count, Prefetch, Q
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .serializers import (
    QuickArtifactSerializer,
    SessionDetailSerializer,
    SessionSerializer,
)


class IsTeacher(permissions.BasePermission):
    """Permission class to check if user is a teacher."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "teacher"


class TeacherSessionViewSet(viewsets.ModelViewSet):
    """ViewSet for teachers to manage their sessions.

    Teachers can:
    - View their scheduled sessions
    - Mark attendance
    - Complete sessions
    - View session details
    """

    permission_classes = [IsTeacher]
    serializer_class = SessionSerializer

    def get_serializer_class(self):
        if self.action == "retrieve":
            return SessionDetailSerializer
        return SessionSerializer

    def get_queryset(self):
        """Return only sessions for the authenticated teacher."""
        return (
            Session.objects.filter(teacher=self.request.user)
            .select_related("tenant", "teacher", "module")
            .prefetch_related(
                Prefetch(
                    "attendance_records",
                    queryset=Attendance.objects.select_related("learner"),
                ),
                "learners",
            )
            .order_by("-date", "-start_time")
        )

    @action(detail=False, methods=["get"], url_path="today")
    def today(self, request):
        """Get today's sessions for the teacher."""
        today = date.today()
        sessions = self.get_queryset().filter(date=today)
        serializer = self.get_serializer(sessions, many=True)

        return Response(
            {
                "date": today,
                "sessions": serializer.data,
                "total": sessions.count(),
                "completed": sessions.filter(status="completed").count(),
                "pending": sessions.filter(
                    status__in=["scheduled", "in_progress"]
                ).count(),
            }
        )

    @action(detail=False, methods=["get"], url_path="upcoming")
    def upcoming(self, request):
        """Get upcoming sessions (next 7 days)."""
        today = date.today()
        sessions = self.get_queryset().filter(date__gte=today, status="scheduled")[:20]
        serializer = self.get_serializer(sessions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="start")
    def start_session(self, request, pk=None):
        """Mark session as in progress."""
        session = self.get_object()

        if session.status != "scheduled":
            return Response(
                {"detail": "Session has already been started or completed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        session.status = "in_progress"
        session.start_time = datetime.now().time()
        session.save()

        serializer = self.get_serializer(session)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="complete")
    def complete_session(self, request, pk=None):
        """Mark session as completed."""
        session = self.get_object()

        if session.status == "completed":
            return Response(
                {"detail": "Session is already completed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        session.status = "completed"
        session.end_time = datetime.now().time()
        session.save()

        serializer = self.get_serializer(session)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="mark-attendance")
    def mark_attendance(self, request, pk=None):
        """Mark attendance for learners in this session.

        Expected payload:
        {
            "attendance": [
                {"learner_id": "uuid", "status": "present"},
                {"learner_id": "uuid", "status": "absent"},
                ...
            ]
        }
        """
        session = self.get_object()
        attendance_data = request.data.get("attendance", [])

        if not attendance_data:
            return Response(
                {"detail": "No attendance data provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        created_records = []
        updated_records = []

        for record in attendance_data:
            learner_id = record.get("learner_id")
            attendance_status = record.get("status", "present")
            notes = record.get("notes", "")

            if not learner_id:
                continue

            try:
                learner = Learner.objects.get(id=learner_id)
                attendance, created = Attendance.objects.update_or_create(
                    session=session,
                    learner=learner,
                    defaults={"status": attendance_status, "notes": notes},
                )

                if created:
                    created_records.append(attendance)
                else:
                    updated_records.append(attendance)

            except Learner.DoesNotExist:
                continue

        # Mark session as having attendance marked
        session.attendance_marked = True
        session.save()

        return Response(
            {
                "detail": "Attendance marked successfully",
                "created": len(created_records),
                "updated": len(updated_records),
                "total": len(created_records) + len(updated_records),
            }
        )

    @action(detail=False, methods=["get"], url_path="dashboard")
    def dashboard(self, request):
        """Get teacher dashboard data.

        Returns:
        - Today's sessions
        - Pending tasks (sessions without attendance, artifacts needed)
        - Quick stats
        """
        teacher = request.user
        today = date.today()

        # Today's sessions
        today_sessions = (
            Session.objects.filter(teacher=teacher, date=today)
            .select_related("module")
            .prefetch_related("attendance_records")
        )

        # Pending tasks
        sessions_without_attendance = Session.objects.filter(
            teacher=teacher,
            date__lte=today,
            attendance_marked=False,
            status__in=["in_progress", "completed"],
        ).count()

        # Sessions needing artifacts (completed but no artifacts)
        sessions_needing_artifacts = (
            Session.objects.filter(
                teacher=teacher,
                status="completed",
                date__gte=date.today().replace(day=1),  # This month
            )
            .annotate(
                artifact_count=Count(
                    "learners__artifacts",
                    filter=Q(learners__artifacts__submitted_at__date=today),
                )
            )
            .filter(artifact_count=0)
            .count()
        )

        # Quick stats
        total_sessions_this_week = Session.objects.filter(
            teacher=teacher, date__gte=today, date__lte=today
        ).count()

        return Response(
            {
                "today": {
                    "date": today,
                    "sessions": SessionSerializer(today_sessions, many=True).data,
                    "total": today_sessions.count(),
                    "completed": today_sessions.filter(status="completed").count(),
                },
                "pending_tasks": {
                    "attendance_needed": sessions_without_attendance,
                    "artifacts_needed": sessions_needing_artifacts,
                    "total": sessions_without_attendance + sessions_needing_artifacts,
                },
                "quick_stats": {
                    "sessions_this_week": total_sessions_this_week,
                },
            }
        )


class QuickArtifactViewSet(viewsets.ModelViewSet):
    """Quick artifact capture for teachers."""

    permission_classes = [IsTeacher]
    serializer_class = QuickArtifactSerializer

    def get_queryset(self):
        """Return artifacts created by this teacher."""
        return (
            Artifact.objects.filter(created_by=self.request.user)
            .select_related("learner", "tenant")
            .order_by("-submitted_at")
        )

    def perform_create(self, serializer):
        """Set the teacher as the creator."""
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=["get"], url_path="pending")
    def pending(self, request):
        """Get sessions that need artifact capture."""
        teacher = request.user
        today = date.today()

        # Get completed sessions from today that might need artifacts
        sessions = (
            Session.objects.filter(teacher=teacher, date=today, status="completed")
            .select_related("module")
            .prefetch_related("learners")
        )

        pending_sessions = []
        for session in sessions:
            # Check if all learners have artifacts for this session
            learners_count = session.learners.count()
            artifacts_count = Artifact.objects.filter(
                learner__in=session.learners.all(), submitted_at__date=today
            ).count()

            if artifacts_count < learners_count:
                pending_sessions.append(
                    {
                        "session_id": str(session.id),
                        "module": session.module.name,
                        "learners_count": learners_count,
                        "artifacts_captured": artifacts_count,
                        "artifacts_needed": learners_count - artifacts_count,
                    }
                )

        return Response(
            {"pending_sessions": pending_sessions, "total": len(pending_sessions)}
        )


class BadgeManagementViewSet(viewsets.ModelViewSet):
    """ViewSet for teachers to manage badges.

    Teachers can:
    - Award badges to students
    - View badges they've awarded
    - View a student's badges
    """

    permission_classes = [IsTeacher]

    def get_serializer_class(self):
        from .serializers import BadgeSerializer

        return BadgeSerializer

    def get_queryset(self):
        """Return badges awarded by this teacher or in their courses."""
        from apps.core.models import Badge, Course

        teacher = self.request.user
        # Get courses taught by this teacher
        teacher_courses = Course.objects.filter(teachers=teacher)

        # Return badges for learners in teacher's courses
        from apps.core.models import LearnerCourseEnrollment

        enrolled_learners = LearnerCourseEnrollment.objects.filter(
            course__in=teacher_courses, is_active=True
        ).values_list("learner_id", flat=True)

        return (
            Badge.objects.filter(learner_id__in=enrolled_learners)
            .select_related("learner", "module", "awarded_by")
            .order_by("-awarded_at")
        )

    @action(detail=False, methods=["post"], url_path="award")
    def award_badge(self, request):
        """Award a badge to a student.

        Expected payload:
        {
            "learner_id": "uuid",
            "badge_name": "Robotics Master",
            "description": "Completed advanced robotics module",
            "module_id": "uuid" (optional)
        }
        """
        from .serializers import BadgeSerializer

        serializer = BadgeSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        badge = serializer.save()

        return Response(
            {
                "detail": "Badge awarded successfully",
                "badge": BadgeSerializer(badge).data,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=["get"], url_path="learner/(?P<learner_id>[^/.]+)")
    def learner_badges(self, request, learner_id=None):
        """Get all badges for a specific learner."""
        from apps.core.models import Badge

        from .serializers import BadgeSerializer

        badges = (
            Badge.objects.filter(learner_id=learner_id)
            .select_related("module", "awarded_by")
            .order_by("-awarded_at")
        )

        serializer = BadgeSerializer(badges, many=True)
        return Response(
            {
                "learner_id": learner_id,
                "badges": serializer.data,
                "total": badges.count(),
            }
        )

    @action(detail=False, methods=["get"], url_path="available")
    def available_badges(self, request):
        """Get list of available badge names from modules."""
        from apps.core.models import Course, Module

        teacher = request.user
        teacher_courses = Course.objects.filter(teachers=teacher)

        # Get modules with badge names from teacher's courses
        modules_with_badges = (
            Module.objects.filter(pathway__in=teacher_courses)
            .exclude(badge_name="")
            .values("id", "name", "badge_name")
        )

        return Response(
            {
                "available_badges": list(modules_with_badges),
                "total": modules_with_badges.count(),
            }
        )


class StudentManagementViewSet(viewsets.ViewSet):
    """ViewSet for teachers to manage their students.

    Teachers can:
    - View all students in their assigned pathways/courses
    - Enroll students in courses
    - View detailed student information
    """

    permission_classes = [IsTeacher]

    def create(self, request):
        """Create a new student."""
        from rest_framework import status
        from rest_framework.response import Response

        # Reuse logic from school admin serializer
        from .serializers import SchoolStudentCreateSerializer

        serializer = SchoolStudentCreateSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        learner = serializer.save()

        return Response(
            {"detail": "Student created successfully", "id": learner.id},
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=["get"], url_path="schools")
    def list_schools(self, request):
        """Get list of all schools for selection in dropdowns."""
        from apps.core.models import School

        schools = School.objects.values("id", "name").order_by("name")
        return Response(list(schools))

    def list(self, request):
        """Get all students in teacher's assigned courses."""
        from apps.core.models import Course, LearnerCourseEnrollment

        from .serializers import TeacherStudentSerializer

        teacher = request.user

        # Get courses taught by this teacher
        teacher_courses = Course.objects.filter(teachers=teacher)

        # Get enrolled learners
        enrollments = (
            LearnerCourseEnrollment.objects.filter(
                course__in=teacher_courses, is_active=True
            )
            .select_related("learner", "learner__user")
            .distinct()
        )

        # Extract unique learners
        learners = [enrollment.learner for enrollment in enrollments]

        # Filter by search query if provided
        search = request.query_params.get("search", "")
        if search:
            learners = [l for l in learners if search.lower() in l.full_name.lower()]

        # Filter by course if provided
        course_id = request.query_params.get("course_id", "")
        if course_id:
            course_learners = LearnerCourseEnrollment.objects.filter(
                course_id=course_id, is_active=True
            ).values_list("learner_id", flat=True)
            learners = [l for l in learners if str(l.id) in course_learners]

        serializer = TeacherStudentSerializer(learners, many=True)

        return Response(
            {
                "students": serializer.data,
                "total": len(learners),
                "courses": [{"id": str(c.id), "name": c.name} for c in teacher_courses],
            }
        )

    def retrieve(self, request, pk=None):
        """Get detailed information about a specific student."""
        from apps.core.models import Badge, Credential

        from .serializers import (
            BadgeSerializer,
            CredentialSerializer,
            TeacherStudentSerializer,
        )

        try:
            learner = Learner.objects.select_related("user").get(id=pk)
        except Learner.DoesNotExist:
            return Response(
                {"detail": "Student not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Get student's badges
        badges = (
            Badge.objects.filter(learner=learner)
            .select_related("module", "awarded_by")
            .order_by("-awarded_at")
        )

        # Get student's credentials
        credentials = Credential.objects.filter(learner=learner).order_by("-issued_at")

        # Get student's enrollments
        from apps.core.models import LearnerCourseEnrollment

        from .serializers import StudentEnrollmentSerializer

        enrollments = LearnerCourseEnrollment.objects.filter(
            learner=learner, is_active=True
        ).select_related("course", "current_level")

        return Response(
            {
                "student": TeacherStudentSerializer(learner).data,
                "badges": BadgeSerializer(badges, many=True).data,
                "credentials": CredentialSerializer(credentials, many=True).data,
                "enrollments": StudentEnrollmentSerializer(enrollments, many=True).data,
            }
        )

    @action(detail=False, methods=["post"], url_path="enroll")
    def enroll_student(self, request):
        """Enroll a student in a course.

        Expected payload:
        {
            "learner_id": "uuid",
            "course_id": "uuid",
            "level_id": "uuid" (optional - defaults to first level)
        }
        """
        from apps.core.models import (
            Course,
            CourseLevel,
            LearnerCourseEnrollment,
            LearnerLevelProgress,
        )

        from .serializers import StudentEnrollmentSerializer

        learner_id = request.data.get("learner_id")
        course_id = request.data.get("course_id")
        level_id = request.data.get("level_id")

        if not learner_id or not course_id:
            return Response(
                {"detail": "learner_id and course_id are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            learner = Learner.objects.get(id=learner_id)
            course = Course.objects.get(id=course_id)

            # Verify teacher teaches this course
            if request.user not in course.teachers.all():
                return Response(
                    {"detail": "You are not assigned to this course"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Get or create enrollment
            enrollment, created = LearnerCourseEnrollment.objects.get_or_create(
                learner=learner,
                course=course,
                defaults={
                    "is_active": True,
                    "current_level": (
                        CourseLevel.objects.get(id=level_id)
                        if level_id
                        else course.levels.order_by("level_number").first()
                    ),
                },
            )

            if not created:
                # Reactivate if was inactive
                enrollment.is_active = True
                enrollment.save()

            # Ensure progress record exists for current level
            if enrollment.current_level:
                LearnerLevelProgress.objects.get_or_create(
                    enrollment=enrollment, level=enrollment.current_level
                )

            serializer = StudentEnrollmentSerializer(enrollment)

            return Response(
                {
                    "detail": (
                        "Student enrolled successfully"
                        if created
                        else "Enrollment reactivated"
                    ),
                    "enrollment": serializer.data,
                },
                status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
            )

        except Learner.DoesNotExist:
            return Response(
                {"detail": "Student not found"}, status=status.HTTP_404_NOT_FOUND
            )
        except Course.DoesNotExist:
            return Response(
                {"detail": "Course not found"}, status=status.HTTP_404_NOT_FOUND
            )
        except CourseLevel.DoesNotExist:
            return Response(
                {"detail": "Level not found"}, status=status.HTTP_404_NOT_FOUND
            )


class CredentialManagementViewSet(viewsets.ModelViewSet):
    """ViewSet for teachers to manage microcredentials."""

    permission_classes = [IsTeacher]

    def get_serializer_class(self):
        from .serializers import CredentialSerializer

        return CredentialSerializer

    def get_queryset(self):
        """Return credentials for students in teacher's courses."""
        from apps.core.models import Course, Credential, LearnerCourseEnrollment

        teacher = self.request.user
        teacher_courses = Course.objects.filter(teachers=teacher)

        enrolled_learners = LearnerCourseEnrollment.objects.filter(
            course__in=teacher_courses, is_active=True
        ).values_list("learner_id", flat=True)

        return (
            Credential.objects.filter(learner_id__in=enrolled_learners)
            .select_related("learner")
            .order_by("-issued_at")
        )

    @action(detail=False, methods=["post"], url_path="award")
    def award_credential(self, request):
        """Award a microcredential to a student.

        Expected payload:
        {
            "learner_id": "uuid",
            "name": "Robotics Level 1 Completion",
            "issuer": "Future Fundi Academy",
            "issued_at": "2026-02-10" (optional, defaults to today)
        }
        """
        from datetime import date

        from apps.core.models import Credential

        from .serializers import CredentialSerializer

        data = request.data.copy()
        if "issued_at" not in data:
            data["issued_at"] = date.today()

        serializer = CredentialSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        credential = serializer.save()

        return Response(
            {
                "detail": "Credential awarded successfully",
                "credential": CredentialSerializer(credential).data,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=["get"], url_path="learner/(?P<learner_id>[^/.]+)")
    def learner_credentials(self, request, learner_id=None):
        """Get all credentials for a specific learner."""
        from apps.core.models import Credential

        from .serializers import CredentialSerializer

        credentials = Credential.objects.filter(learner_id=learner_id).order_by(
            "-issued_at"
        )

        serializer = CredentialSerializer(credentials, many=True)
        return Response(
            {
                "learner_id": learner_id,
                "credentials": serializer.data,
                "total": credentials.count(),
            }
        )
