from __future__ import annotations

from datetime import date, datetime

from apps.core.models import Artifact, Attendance, Learner, School, Session
from apps.core.scope import get_user_allowed_school_ids
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


class TeacherSchoolContextMixin:
    """Resolve teacher school context after DRF auth (JWT-safe)."""

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        self._resolve_school_context(request)

    def _requested_school_id(self, request) -> str | None:
        school_id = request.headers.get("X-School-ID") or request.query_params.get(
            "school_id"
        )
        if not school_id and request.method in {"POST", "PUT", "PATCH"}:
            school_id = request.data.get("school_id")
        if school_id is None:
            return None
        value = str(school_id).strip()
        return value or None

    def _set_request_school(self, request, school, allowed_school_ids: list[str]) -> None:
        school_id = str(school.id) if school else None
        request.school = school
        request.school_id = school_id
        request.allowed_school_ids = allowed_school_ids

        raw_request = getattr(request, "_request", None)
        if raw_request is not None:
            raw_request.school = school
            raw_request.school_id = school_id
            raw_request.allowed_school_ids = allowed_school_ids

    def _resolve_school_context(self, request):
        if getattr(request, "_school_context_resolved", False):
            return getattr(request, "school", None)

        user = getattr(request, "user", None)
        existing_school = getattr(request, "school", None)
        existing_allowed = list(getattr(request, "allowed_school_ids", []) or [])

        if not getattr(user, "is_authenticated", False):
            self._set_request_school(request, None, [])
        elif getattr(user, "role", None) != "teacher":
            school = existing_school or getattr(user, "tenant", None)
            allowed_school_ids = existing_allowed or ([str(school.id)] if school else [])
            self._set_request_school(request, school, allowed_school_ids)
        else:
            allowed_school_ids = sorted(get_user_allowed_school_ids(user))
            selected_school_id = self._requested_school_id(request)
            if not selected_school_id and existing_school is not None:
                selected_school_id = str(existing_school.id)

            resolved_school_id = None
            if selected_school_id and selected_school_id in allowed_school_ids:
                resolved_school_id = selected_school_id
            elif len(allowed_school_ids) == 1:
                resolved_school_id = allowed_school_ids[0]

            school = None
            if resolved_school_id:
                if str(getattr(user, "tenant_id", "")) == resolved_school_id:
                    school = getattr(user, "tenant", None)
                if school is None:
                    school = School.objects.filter(id=resolved_school_id).first()

            self._set_request_school(request, school, allowed_school_ids)

        request._school_context_resolved = True
        return getattr(request, "school", None)


class TeacherSessionViewSet(TeacherSchoolContextMixin, viewsets.ModelViewSet):
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
        qs = Session.objects.filter(teacher=self.request.user)
        school = self._resolve_school_context(self.request)
        if school is not None:
            qs = qs.filter(tenant=school)
        else:
            qs = qs.none()

        return (
            qs
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
                if session.tenant_id and learner.tenant_id != session.tenant_id:
                    continue
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
        today = date.today()
        scoped_sessions = self.get_queryset()

        # Today's sessions
        today_sessions = scoped_sessions.filter(date=today)

        # Pending tasks
        sessions_without_attendance = scoped_sessions.filter(
            date__lte=today,
            attendance_marked=False,
            status__in=["in_progress", "completed"],
        ).count()

        # Sessions needing artifacts (completed but no artifacts)
        sessions_needing_artifacts = (
            scoped_sessions.filter(
                status="completed", date__gte=date.today().replace(day=1)  # This month
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
        total_sessions_this_week = scoped_sessions.filter(
            date__gte=today, date__lte=today
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


class QuickArtifactViewSet(TeacherSchoolContextMixin, viewsets.ModelViewSet):
    """Quick artifact capture for teachers."""

    permission_classes = [IsTeacher]
    serializer_class = QuickArtifactSerializer

    def get_queryset(self):
        """Return artifacts created by this teacher."""
        qs = Artifact.objects.filter(created_by=self.request.user)
        school = self._resolve_school_context(self.request)
        if school is not None:
            qs = qs.filter(tenant=school)
        else:
            qs = qs.none()

        return (
            qs
            .select_related("learner", "tenant")
            .order_by("-submitted_at")
        )

    def perform_create(self, serializer):
        """Set the teacher as the creator."""
        learner = serializer.validated_data.get("learner")
        tenant = self._resolve_school_context(self.request) or getattr(learner, "tenant", None)
        serializer.save(created_by=self.request.user, tenant=tenant)

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
        school = self._resolve_school_context(request)
        if school is not None:
            sessions = sessions.filter(tenant=school)
        else:
            sessions = sessions.none()

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


class BadgeManagementViewSet(TeacherSchoolContextMixin, viewsets.ModelViewSet):
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

    def _teacher_learners_queryset(self):
        """Learners in the selected school context."""
        from apps.core.models import Learner

        school = self._resolve_school_context(self.request)
        if school is None:
            return Learner.objects.none()
        return Learner.objects.filter(tenant=school)

    def get_queryset(self):
        """Return badges for learners in the selected school."""
        from apps.core.models import Badge

        return (
            Badge.objects.filter(learner__in=self._teacher_learners_queryset())
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

        learner = serializer.validated_data.get("learner")
        if not self._teacher_learners_queryset().filter(id=learner.id).exists():
            return Response(
                {"detail": "You can only award badges to your own students."},
                status=status.HTTP_403_FORBIDDEN,
            )

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

        if not self._teacher_learners_queryset().filter(id=learner_id).exists():
            return Response(
                {"detail": "Student not found"}, status=status.HTTP_404_NOT_FOUND
            )

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

        courses = Course.objects.filter(is_active=True)

        # Get modules with badge names from school-available courses
        modules_with_badges = (
            Module.objects.filter(course__in=courses)
            .exclude(badge_name="")
            .values("id", "name", "badge_name")
        )

        return Response(
            {
                "available_badges": list(modules_with_badges),
                "total": modules_with_badges.count(),
            }
        )


class StudentManagementViewSet(TeacherSchoolContextMixin, viewsets.ViewSet):
    """ViewSet for teachers to manage their students.

    Teachers can:
    - View all students in their selected school
    - Enroll students in courses
    - View detailed student information
    """

    permission_classes = [IsTeacher]

    def _teacher_courses_queryset(self):
        from apps.core.models import Course

        return Course.objects.filter(is_active=True)

    def _teacher_learners_queryset(self):
        from apps.core.models import Learner

        school = self._resolve_school_context(self.request)
        if school is None:
            return Learner.objects.none()
        return Learner.objects.filter(tenant=school).select_related("user")

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
        """Get school options for teacher context selection."""
        schools_qs = request.user.teacher_schools.all().order_by("name")
        schools = [{"id": str(s.id), "name": s.name} for s in schools_qs]

        # Keep compatibility with older single-school assignments.
        tenant = getattr(request.user, "tenant", None)
        if tenant and not any(s["id"] == str(tenant.id) for s in schools):
            schools.append({"id": str(tenant.id), "name": tenant.name})

        selected_school = self._resolve_school_context(request)
        selected_school_id = str(selected_school.id) if selected_school else None

        return Response(
            {
                "schools": schools,
                "selected_school_id": selected_school_id,
            }
        )

    def list(self, request):
        """Get all students in teacher's selected school."""
        from .serializers import TeacherStudentSerializer

        selected_school = self._resolve_school_context(request)
        teacher_courses = self._teacher_courses_queryset()
        learners_qs = self._teacher_learners_queryset()

        # Filter by search query if provided
        search = request.query_params.get("search", "")
        if search:
            learners_qs = learners_qs.filter(
                Q(first_name__icontains=search) | Q(last_name__icontains=search)
            )

        # Filter by course if provided
        course_id = request.query_params.get("course_id", "")
        if course_id:
            if teacher_courses.filter(id=course_id).exists():
                learners_qs = learners_qs.filter(
                    course_enrollments__course_id=course_id,
                    course_enrollments__is_active=True,
                )
            else:
                learners_qs = learners_qs.none()

        learners = list(learners_qs.distinct())

        serializer = TeacherStudentSerializer(learners, many=True)

        return Response(
            {
                "students": serializer.data,
                "total": len(learners),
                "courses": [{"id": str(c.id), "name": c.name} for c in teacher_courses],
                "selected_school_id": (str(selected_school.id) if selected_school else None),
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
            learner = self._teacher_learners_queryset().get(id=pk)
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
            school = self._resolve_school_context(request)
            if school is None:
                return Response(
                    {"detail": "Select a school before enrolling students."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            learner = Learner.objects.get(id=learner_id, tenant=school)
            course = Course.objects.get(id=course_id)

            # Get or create enrollment
            enrollment, created = LearnerCourseEnrollment.objects.get_or_create(
                learner=learner,
                course=course,
                defaults={
                    "is_active": True,
                    "current_level": (
                        CourseLevel.objects.get(id=level_id, course=course)
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


class CredentialManagementViewSet(TeacherSchoolContextMixin, viewsets.ModelViewSet):
    """ViewSet for teachers to manage microcredentials."""

    permission_classes = [IsTeacher]

    def get_serializer_class(self):
        from .serializers import CredentialSerializer

        return CredentialSerializer

    def _teacher_courses_queryset(self):
        from apps.core.models import Course

        return Course.objects.filter(is_active=True)

    def _teacher_learners_queryset(self):
        from apps.core.models import Learner

        school = self._resolve_school_context(self.request)
        if school is None:
            return Learner.objects.none()
        return Learner.objects.filter(tenant=school)

    def get_queryset(self):
        """Return credentials for students in the selected school."""
        from apps.core.models import Credential

        return (
            Credential.objects.filter(learner__in=self._teacher_learners_queryset())
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

        from .serializers import CredentialSerializer

        data = request.data.copy()
        if "issued_at" not in data:
            data["issued_at"] = date.today()

        serializer = CredentialSerializer(data=data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        learner = serializer.validated_data.get("learner")
        if not self._teacher_learners_queryset().filter(id=learner.id).exists():
            return Response(
                {"detail": "You can only award credentials to your own students."},
                status=status.HTTP_403_FORBIDDEN,
            )

        tenant = self._resolve_school_context(request) or learner.tenant
        if tenant is None:
            return Response(
                {"detail": "Unable to determine tenant for credential award."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        credential = serializer.save(tenant=tenant)

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
        from .serializers import CredentialSerializer

        if not self._teacher_learners_queryset().filter(id=learner_id).exists():
            return Response(
                {"detail": "Student not found"}, status=status.HTTP_404_NOT_FOUND
            )

        credentials = self.get_queryset().filter(learner_id=learner_id)

        serializer = CredentialSerializer(credentials, many=True)
        return Response(
            {
                "learner_id": learner_id,
                "credentials": serializer.data,
                "total": credentials.count(),
            }
        )
