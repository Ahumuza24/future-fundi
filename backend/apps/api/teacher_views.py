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
