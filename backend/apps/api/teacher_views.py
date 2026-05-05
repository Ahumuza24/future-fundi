from __future__ import annotations

from datetime import date, datetime
from typing import Any

from apps.core.models import Artifact, Attendance, Learner, School, Session
from apps.core.scope import get_user_allowed_school_ids
from apps.core.services.artifact_service import ArtifactService
from apps.core.services.dashboard_service import TeacherDashboardService
from apps.core.services.enrollment_service import EnrollmentResult, EnrollmentService
from django.shortcuts import get_object_or_404
from django.db.models import Count, Prefetch, Q, QuerySet
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from .serializers import (
    QuickArtifactSerializer,
    SessionDetailSerializer,
    SessionSerializer,
)


class IsTeacher(permissions.BasePermission):
    """Permission class to check if user is a teacher."""

    def has_permission(self, request: Request, view: Any) -> bool:
        return request.user.is_authenticated and request.user.role == "teacher"


class TeacherSchoolContextMixin:
    """Resolve teacher school context after DRF auth (JWT-safe)."""

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        self._resolve_school_context(request)

    def _requested_school_id(self, request: Request) -> str | None:
        school_id = request.headers.get("X-School-ID") or request.query_params.get(
            "school_id"
        )
        if not school_id and request.method in {"POST", "PUT", "PATCH"}:
            school_id = request.data.get("school_id")
        if school_id is None:
            return None
        value = str(school_id).strip()
        return value or None

    def _set_request_school(
        self, request: Request, school: School | None, allowed_school_ids: list[str]
    ) -> None:
        school_id = str(school.id) if school else None
        request.school = school
        request.school_id = school_id
        request.allowed_school_ids = allowed_school_ids

        raw_request = getattr(request, "_request", None)
        if raw_request is not None:
            raw_request.school = school
            raw_request.school_id = school_id
            raw_request.allowed_school_ids = allowed_school_ids

    def _resolve_school_context(self, request: Request) -> School | None:
        if getattr(request, "_school_context_resolved", False):
            return getattr(request, "school", None)

        user = getattr(request, "user", None)
        existing_school = getattr(request, "school", None)
        existing_allowed = list(getattr(request, "allowed_school_ids", []) or [])

        if not getattr(user, "is_authenticated", False):
            self._set_request_school(request, None, [])
        elif getattr(user, "role", None) != "teacher":
            school = existing_school or getattr(user, "tenant", None)
            allowed_school_ids = existing_allowed or (
                [str(school.id)] if school else []
            )
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
        from .serializers import SessionCreateSerializer

        if self.action in ("create", "update", "partial_update"):
            return SessionCreateSerializer
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
            qs.select_related("tenant", "teacher", "module")
            .prefetch_related(
                Prefetch(
                    "attendance_records",
                    queryset=Attendance.objects.select_related("learner"),
                ),
                "learners",
            )
            .order_by("-date", "-start_time")
        )

    def perform_create(self, serializer):
        """Attach teacher and school tenant when creating a session."""
        school = self._resolve_school_context(self.request)
        tenant = school or self.request.user.tenant
        serializer.save(teacher=self.request.user, tenant=tenant)

    @action(detail=False, methods=["get"], url_path="list-pathways")
    def list_pathways(self, request):
        """List pathways (courses) with their modules for cascade selection.
        Returns all courses this teacher is assigned to, with their modules.
        Falls back to ALL active courses if the teacher has no course assignments.
        """
        from apps.core.models import Course

        teacher = request.user
        teacher_courses = Course.objects.filter(teachers=teacher, is_active=True)
        # Fall back to all active courses if no direct assignment
        if not teacher_courses.exists():
            teacher_courses = Course.objects.filter(is_active=True)

        result = []
        for course in teacher_courses.prefetch_related("modules"):
            modules = [
                {"id": str(m.id), "name": m.name}
                for m in course.modules.all().order_by("name")
            ]
            result.append(
                {
                    "id": str(course.id),
                    "name": course.name,
                    "description": course.description,
                    "modules": modules,
                }
            )
        return Response(result)

    @action(detail=False, methods=["get"], url_path="list-modules")
    def list_modules(self, request):
        """List modules for a specific course (pathway).
        Query param: course_id
        """
        from apps.core.models import Module

        course_id = request.query_params.get("course_id")
        if not course_id:
            return Response([], status=200)
        modules = Module.objects.filter(course_id=course_id).order_by("name")
        return Response([{"id": str(m.id), "name": m.name} for m in modules])

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
    def dashboard(self, request: Request) -> Response:
        """Get teacher dashboard data with real stats."""
        school = self._resolve_school_context(request)
        data = TeacherDashboardService.compute(
            scoped_sessions=self.get_queryset(),
            school=school,
        )
        return Response(data)


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

        return qs.select_related("learner", "tenant").order_by("-submitted_at")

    def perform_create(self, serializer):
        """Set the teacher as the creator."""
        learner = serializer.validated_data.get("learner")
        tenant = self._resolve_school_context(self.request) or getattr(
            learner, "tenant", None
        )
        serializer.save(created_by=self.request.user, tenant=tenant)

    # ------------------------------------------------------------------
    # Combined create + upload (single multipart request)
    # POST /api/teacher/quick-artifacts/capture/
    # Accepts: learner, title, reflection, module (form fields)
    #          files[] (file fields, multiple)
    #          links[] (JSON-encoded array of {url, label})
    # ------------------------------------------------------------------
    @action(detail=False, methods=["post"], url_path="capture")
    def capture(self, request: Request) -> Response:
        """Create an artifact and upload files in a single multipart request."""
        import json

        learner_id = request.data.get("learner")
        title = request.data.get("title", "").strip()

        if not learner_id:
            return Response({"detail": "learner is required"}, status=status.HTTP_400_BAD_REQUEST)
        if not title:
            return Response({"detail": "title is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            learner = Learner.objects.get(id=learner_id)
        except Learner.DoesNotExist:
            return Response({"detail": "Learner not found"}, status=status.HTTP_404_NOT_FOUND)

        if not self._learner_in_scope(request, learner):
            return Response(
                {"detail": "You can only capture artifacts for learners in your school."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            metrics = json.loads(request.data.get("metrics", "[]"))
        except (json.JSONDecodeError, ValueError):
            metrics = []

        module_obj = self._resolve_module(request.data.get("module"))
        tenant = self._resolve_school_context(request) or getattr(learner, "tenant", None)

        try:
            artifact = ArtifactService.capture(
                learner=learner,
                title=title,
                reflection=request.data.get("reflection", ""),
                created_by=request.user,
                tenant=tenant,
                module=module_obj,
                session_id=request.data.get("session"),
                metrics=metrics,
                uploaded_files=request.FILES.getlist("files"),
                raw_links=request.data.get("links", "[]"),
                request=request,
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                "detail": "Artifact captured successfully",
                "artifact": QuickArtifactSerializer(artifact).data,
            },
            status=status.HTTP_201_CREATED,
        )

    def _learner_in_scope(self, request: Request, learner: Learner) -> bool:
        allowed = getattr(request, "allowed_school_ids", None)
        if allowed is None:
            allowed = get_user_allowed_school_ids(request.user)
        return bool(allowed) and str(learner.tenant_id) in allowed

    @staticmethod
    def _resolve_module(module_id: str | None) -> Any:
        if not module_id:
            return None
        from apps.core.models import Module

        try:
            return Module.objects.get(id=module_id)
        except (Module.DoesNotExist, ValueError):
            return None

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

    @action(detail=False, methods=["get"], url_path="student-submissions")
    def student_submissions(self, request):
        """List student-submitted artifacts for the teacher's school.

        Query Params:
          status: 'pending' | 'approved' | 'rejected' (default all)
          learner_id: filter by specific learner UUID
        """
        from django.db.models import Q

        school = self._resolve_school_context(request)
        if school is None:
            return Response({"results": [], "pending_count": 0, "total": 0})

        # Include artifacts from:
        # 1. Learners formally enrolled in the school (tenant=school)
        # 2. Independent learners whose current_school text matches this school name
        qs = (
            Artifact.objects.filter(
                uploaded_by_student=True,
            )
            .filter(
                Q(tenant=school) |
                Q(tenant__isnull=True, learner__current_school__iexact=school.name)
            )
            .select_related("learner", "reviewed_by", "tenant")
            .order_by("-submitted_at")
        )

        status_filter = request.query_params.get("status")
        if status_filter in (Artifact.STATUS_PENDING, Artifact.STATUS_APPROVED, Artifact.STATUS_REJECTED):
            qs = qs.filter(status=status_filter)

        learner_id = request.query_params.get("learner_id")
        if learner_id:
            qs = qs.filter(learner_id=learner_id)

        from .serializers import QuickArtifactSerializer

        results = []
        for artifact in qs:
            data = QuickArtifactSerializer(artifact).data
            # Enrich with learner details for the review card
            data["learner_name"] = artifact.learner.full_name if artifact.learner else ""
            results.append(data)

        pending_count = Artifact.objects.filter(
            uploaded_by_student=True,
            status=Artifact.STATUS_PENDING,
        ).filter(
            Q(tenant=school) |
            Q(tenant__isnull=True, learner__current_school__iexact=school.name)
        ).count()

        return Response({
            "results": results,
            "pending_count": pending_count,
            "total": len(results),
        })

    @action(detail=True, methods=["post"], url_path="review")
    def review_artifact(self, request, pk=None):
        """Approve or reject a student-submitted artifact.

        Expected payload:
        {
            "action": "approve" | "reject",
            "rejection_reason": "..." (required when action is 'reject')
        }
        """
        from django.utils import timezone

        import logging
        logger = logging.getLogger(__name__)

        from .serializers import ArtifactReviewSerializer, QuickArtifactSerializer

        # Only allow review of student-submitted artifacts
        try:
            artifact = Artifact.objects.get(pk=pk, uploaded_by_student=True)
        except Artifact.DoesNotExist:
            return Response(
                {"detail": "Student artifact not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Scope: teacher must belong to the same school, OR artifact has no school (independent learner)
        school = self._resolve_school_context(request)
        logger.info(f"Review artifact {pk}: school={school.id if school else None}, artifact.tenant_id={artifact.tenant_id}")

        if school is None:
            return Response(
                {"detail": "Please select a school context to review artifacts."},
                status=status.HTTP_403_FORBIDDEN,
            )
        # Allow review if artifact belongs to teacher's school OR artifact has no school assigned
        if artifact.tenant_id is not None and str(artifact.tenant_id) != str(school.id):
            logger.warning(f"Permission denied: artifact.tenant_id={artifact.tenant_id} != school.id={school.id}")
            return Response(
                {"detail": "You can only review artifacts for students in your school."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ArtifactReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        action_choice = serializer.validated_data["action"]
        rejection_reason = serializer.validated_data.get("rejection_reason", "")

        if action_choice == ArtifactReviewSerializer.ACTION_APPROVE:
            artifact.status = Artifact.STATUS_APPROVED
            artifact.rejection_reason = ""
        else:
            artifact.status = Artifact.STATUS_REJECTED
            artifact.rejection_reason = rejection_reason

        artifact.reviewed_by = request.user
        artifact.reviewed_at = timezone.now()
        artifact.save(update_fields=["status", "rejection_reason", "reviewed_by", "reviewed_at"])

        return Response({
            "detail": f"Artifact {action_choice}d successfully.",
            "artifact": QuickArtifactSerializer(artifact).data,
        })


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
        if request.data.get("badge_template_id"):
            from apps.core.models import BadgeTemplate, Evidence
            from apps.core.services.recognition import BadgeIssuanceService

            learner_id = request.data.get("learner_id") or request.data.get("learner")
            learner = self._teacher_learners_queryset().filter(id=learner_id).first()
            if learner is None:
                return Response(
                    {"detail": "You can only award badges to your own students."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            template = get_object_or_404(BadgeTemplate, id=request.data.get("badge_template_id"))
            evidence = Evidence.objects.filter(id__in=request.data.get("evidence_ids", []))
            record = BadgeIssuanceService.issue(
                template=template,
                learner=learner,
                issuer=request.user,
                evidence=evidence,
                verification_ref=request.data.get("verification_ref", ""),
            )
            return Response(
                {
                    "detail": "Badge awarded successfully",
                    "badge_record_id": str(record.id),
                },
                status=status.HTTP_201_CREATED,
            )

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
                "selected_school_id": (
                    str(selected_school.id) if selected_school else None
                ),
            }
        )

    def retrieve(self, request, pk=None):
        """Get detailed information about a specific student."""
        from apps.core.models import Artifact, Badge, Credential

        from .serializers import (
            ArtifactSerializer,
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

        artifacts = (
            Artifact.objects.filter(learner=learner)
            .select_related("module")
            .order_by("-submitted_at")
        )

        return Response(
            {
                "student": TeacherStudentSerializer(learner).data,
                "badges": BadgeSerializer(badges, many=True).data,
                "credentials": CredentialSerializer(credentials, many=True).data,
                "enrollments": StudentEnrollmentSerializer(enrollments, many=True).data,
                "artifacts": ArtifactSerializer(artifacts, many=True).data,
            }
        )

    @action(detail=False, methods=["post"], url_path="enroll")
    def enroll_student(self, request: Request) -> Response:
        """Enroll a student in a course.

        Expected payload:
        {
            "learner_id": "uuid",
            "course_id": "uuid",
            "level_id": "uuid" (optional - defaults to first level)
        }
        """
        from apps.core.models import Course, CourseLevel

        from .serializers import StudentEnrollmentSerializer

        learner_id = request.data.get("learner_id")
        course_id = request.data.get("course_id")
        level_id = request.data.get("level_id")

        if not learner_id or not course_id:
            return Response(
                {"detail": "learner_id and course_id are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        school = self._resolve_school_context(request)
        if school is None:
            return Response(
                {"detail": "Select a school before enrolling students."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            learner = Learner.objects.get(id=learner_id, tenant=school)
            result: EnrollmentResult = EnrollmentService.enroll(
                learner=learner,
                course_id=course_id,
                level_id=level_id,
            )
        except Learner.DoesNotExist:
            return Response({"detail": "Student not found"}, status=status.HTTP_404_NOT_FOUND)
        except Course.DoesNotExist:
            return Response({"detail": "Course not found"}, status=status.HTTP_404_NOT_FOUND)
        except CourseLevel.DoesNotExist:
            return Response({"detail": "Level not found"}, status=status.HTTP_404_NOT_FOUND)

        return Response(
            {
                "detail": "Student enrolled successfully" if result.created else "Enrollment reactivated",
                "enrollment": StudentEnrollmentSerializer(result.enrollment).data,
            },
            status=status.HTTP_201_CREATED if result.created else status.HTTP_200_OK,
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
        if request.data.get("microcredential_template_id"):
            from apps.core.models import BadgeRecord, Evidence, MicrocredentialTemplate
            from apps.core.services.recognition import MicrocredentialIssuanceService

            learner_id = request.data.get("learner_id") or request.data.get("learner")
            learner = self._teacher_learners_queryset().filter(id=learner_id).first()
            if learner is None:
                return Response(
                    {"detail": "You can only award credentials to your own students."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            template = get_object_or_404(
                MicrocredentialTemplate,
                id=request.data.get("microcredential_template_id"),
            )
            evidence = Evidence.objects.filter(id__in=request.data.get("evidence_ids", []))
            badge_records = BadgeRecord.objects.filter(
                id__in=request.data.get("badge_record_ids", []),
                learner=learner,
                status=BadgeRecord.STATUS_ISSUED,
            )
            record = MicrocredentialIssuanceService.issue(
                template=template,
                learner=learner,
                issuer=request.user,
                evidence=evidence,
                badge_records=badge_records,
            )
            return Response(
                {
                    "detail": "Credential awarded successfully",
                    "microcredential_record_id": str(record.id),
                },
                status=status.HTTP_201_CREATED,
            )

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


# ---------------------------------------------------------------------------
# Teacher Tasks ViewSet
# ---------------------------------------------------------------------------


class TeacherTaskViewSet(viewsets.ModelViewSet):
    """ViewSet for teachers to manage their personal tasks/to-do list."""

    permission_classes = [IsTeacher]

    def get_serializer_class(self):
        from .serializers import TeacherTaskSerializer

        return TeacherTaskSerializer

    def get_queryset(self):
        from apps.core.models import TeacherTask

        qs = TeacherTask.objects.filter(teacher=self.request.user)
        # Optional filters
        status_filter = self.request.query_params.get("status")
        priority_filter = self.request.query_params.get("priority")
        if status_filter:
            qs = qs.filter(status=status_filter)
        if priority_filter:
            qs = qs.filter(priority=priority_filter)
        return qs.order_by("due_date", "-priority")

    def perform_create(self, serializer):
        serializer.save(teacher=self.request.user)

    @action(detail=True, methods=["post"], url_path="toggle")
    def toggle_status(self, request, pk=None):
        """Toggle task status: todo → in_progress → done → todo."""
        task = self.get_object()
        cycle = {"todo": "in_progress", "in_progress": "done", "done": "todo"}
        task.status = cycle.get(task.status, "todo")
        task.save()
        from .serializers import TeacherTaskSerializer

        return Response(TeacherTaskSerializer(task).data)

    @action(detail=False, methods=["get"], url_path="summary")
    def summary(self, request):
        """Return task counts grouped by status."""
        from apps.core.models import TeacherTask
        from django.db.models import Count

        qs = TeacherTask.objects.filter(teacher=request.user)
        counts = qs.values("status").annotate(count=Count("id"))
        result = {item["status"]: item["count"] for item in counts}
        return Response(
            {
                "todo": result.get("todo", 0),
                "in_progress": result.get("in_progress", 0),
                "done": result.get("done", 0),
                "total": qs.count(),
            }
        )


class TeacherDashboardViewSet(TeacherSchoolContextMixin, viewsets.ViewSet):
    """Aggregated panel data for the Phase 5 Teacher Dashboard.

    Each action feeds one panel in the frontend dashboard layout.
    All endpoints are school-scoped and require the teacher role.
    """

    permission_classes = [IsTeacher]

    def _require_school(self, request: Request) -> School | None:
        return self._resolve_school_context(request)

    @action(detail=False, methods=["get"], url_path="cohort-progress")
    def cohort_progress(self, request: Request) -> Response:
        from apps.core.services.teacher_panel_service import TeacherPanelService

        school = self._require_school(request)
        if school is None:
            return Response({"detail": "No school context."}, status=status.HTTP_400_BAD_REQUEST)
        return Response(TeacherPanelService.cohort_progress(school))

    @action(detail=False, methods=["get"], url_path="badge-readiness")
    def badge_readiness(self, request: Request) -> Response:
        from apps.core.services.teacher_panel_service import TeacherPanelService

        school = self._require_school(request)
        if school is None:
            return Response({"detail": "No school context."}, status=status.HTTP_400_BAD_REQUEST)
        return Response(TeacherPanelService.badge_readiness(school))

    @action(detail=False, methods=["get"], url_path="microcredential-readiness")
    def microcredential_readiness(self, request: Request) -> Response:
        from apps.core.services.teacher_panel_service import TeacherPanelService

        school = self._require_school(request)
        if school is None:
            return Response({"detail": "No school context."}, status=status.HTTP_400_BAD_REQUEST)
        return Response(TeacherPanelService.microcredential_readiness(school))

    @action(detail=False, methods=["get"], url_path="interventions")
    def interventions(self, request: Request) -> Response:
        from apps.core.services.teacher_panel_service import TeacherPanelService

        school = self._require_school(request)
        if school is None:
            return Response({"detail": "No school context."}, status=status.HTTP_400_BAD_REQUEST)
        return Response(TeacherPanelService.interventions(school))

    @action(detail=False, methods=["get"], url_path="certification-pipeline")
    def certification_pipeline(self, request: Request) -> Response:
        from apps.core.services.teacher_panel_service import TeacherPanelService

        school = self._require_school(request)
        if school is None:
            return Response({"detail": "No school context."}, status=status.HTTP_400_BAD_REQUEST)
        return Response(TeacherPanelService.certification_pipeline(school))

    @action(detail=True, methods=["get"], url_path="dual-view")
    def learner_dual_view(self, request: Request, pk: str | None = None) -> Response:
        from apps.core.services.teacher_panel_service import TeacherPanelService

        school = self._require_school(request)
        if school is None:
            return Response({"detail": "No school context."}, status=status.HTTP_400_BAD_REQUEST)
        data = TeacherPanelService.learner_dual_view(str(pk), school)
        if data is None:
            return Response({"detail": "Learner not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(data)
