"""
Admin monitoring views — Teacher Sessions, Teacher Tasks, Student Attendance.

All endpoints require admin role.
Supports filtering by school, teacher, status, and date range.
"""

import calendar
from datetime import date, timedelta

from apps.core.models import Attendance, Learner, School, Session, TeacherTask
from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

User = get_user_model()


class IsAdminUser(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == "admin"


# ─── helpers ──────────────────────────────────────────────────────────────────

def _serialize_session(s):
    return {
        "id": str(s.id),
        "module": str(s.module_id) if s.module_id else None,
        "module_name": s.module.name if s.module_id else "—",
        "pathway": s.module.course.name if s.module_id and s.module.course_id else "—",
        "teacher_id": str(s.teacher_id),
        "teacher_name": s.teacher.get_full_name() or s.teacher.username,
        "school": s.tenant.name if s.tenant_id else "—",
        "date": str(s.date),
        "start_time": str(s.start_time) if s.start_time else None,
        "end_time": str(s.end_time) if s.end_time else None,
        "status": s.status,
        "attendance_marked": s.attendance_marked,
        "notes": s.notes,
        "created_at": s.created_at.isoformat(),
    }


def _serialize_task(t):
    return {
        "id": str(t.id),
        "teacher_id": str(t.teacher_id),
        "teacher_name": t.teacher.get_full_name() or t.teacher.username,
        "title": t.title,
        "description": t.description,
        "due_date": str(t.due_date) if t.due_date else None,
        "priority": t.priority,
        "status": t.status,
        "created_at": t.created_at.isoformat(),
    }


def _serialize_attendance(a):
    learner = a.learner
    session = a.session
    return {
        "id": str(a.id),
        "learner_id": str(learner.id),
        "learner_name": learner.full_name,
        "session_id": str(session.id),
        "module_name": session.module.name if session.module_id else "—",
        "pathway": session.module.course.name if session.module_id and session.module.course_id else "—",
        "teacher_name": session.teacher.get_full_name() or session.teacher.username,
        "school": session.tenant.name if session.tenant_id else "—",
        "session_date": str(session.date),
        "attendance_status": a.status,
        "notes": a.notes,
        "marked_at": a.marked_at.isoformat() if hasattr(a, "marked_at") and a.marked_at else None,
    }


# ─── ViewSets ─────────────────────────────────────────────────────────────────

class AdminSessionMonitorViewSet(viewsets.ViewSet):
    """
    Admin monitoring of all teacher sessions across all schools.

    GET /api/admin/monitor/sessions/        — list (filterable)
    GET /api/admin/monitor/sessions/summary/ — headline stats
    """

    permission_classes = [IsAdminUser]

    def _get_qs(self, request):
        qs = (
            Session.objects
            .select_related("module__course", "teacher", "tenant")
            .order_by("-date", "-created_at")
        )
        school_id = request.query_params.get("school")
        if school_id:
            qs = qs.filter(tenant_id=school_id)

        teacher_id = request.query_params.get("teacher")
        if teacher_id:
            qs = qs.filter(teacher_id=teacher_id)

        status = request.query_params.get("status")
        if status:
            qs = qs.filter(status=status)

        date_from = request.query_params.get("date_from")
        if date_from:
            qs = qs.filter(date__gte=date_from)

        date_to = request.query_params.get("date_to")
        if date_to:
            qs = qs.filter(date__lte=date_to)

        return qs

    def list(self, request):
        qs = self._get_qs(request)
        page_size = int(request.query_params.get("page_size", 50))
        offset = int(request.query_params.get("offset", 0))
        total = qs.count()
        sessions = qs[offset: offset + page_size]
        return Response({
            "total": total,
            "results": [_serialize_session(s) for s in sessions],
        })

    @action(detail=False, methods=["get"])
    def summary(self, request):
        today = date.today()
        week_start = today - timedelta(days=today.weekday())
        month_start = today.replace(day=1)
        month_last = calendar.monthrange(today.year, today.month)[1]
        month_end = today.replace(day=month_last)

        qs = Session.objects.all()
        school_id = request.query_params.get("school")
        if school_id:
            qs = qs.filter(tenant_id=school_id)

        return Response({
            "today": qs.filter(date=today).count(),
            "this_week": qs.filter(date__gte=week_start, date__lte=today + timedelta(days=6 - today.weekday())).count(),
            "this_month": qs.filter(date__gte=month_start, date__lte=month_end).count(),
            "total": qs.count(),
            "by_status": {
                "scheduled":   qs.filter(status="scheduled").count(),
                "in_progress": qs.filter(status="in_progress").count(),
                "completed":   qs.filter(status="completed").count(),
                "cancelled":   qs.filter(status="cancelled").count(),
            },
            "attendance_pending": qs.filter(
                status__in=["in_progress", "completed"],
                attendance_marked=False,
                date__lte=today,
            ).count(),
        })


class AdminTaskMonitorViewSet(viewsets.ViewSet):
    """
    Admin monitoring of all teacher tasks.

    GET /api/admin/monitor/tasks/         — list (filterable)
    GET /api/admin/monitor/tasks/summary/ — headline stats
    """

    permission_classes = [IsAdminUser]

    def _get_qs(self, request):
        qs = TeacherTask.objects.select_related("teacher").order_by("-created_at")

        teacher_id = request.query_params.get("teacher")
        if teacher_id:
            qs = qs.filter(teacher_id=teacher_id)

        status = request.query_params.get("status")
        if status:
            qs = qs.filter(status=status)

        priority = request.query_params.get("priority")
        if priority:
            qs = qs.filter(priority=priority)

        return qs

    def list(self, request):
        qs = self._get_qs(request)
        page_size = int(request.query_params.get("page_size", 50))
        offset = int(request.query_params.get("offset", 0))
        total = qs.count()
        tasks = qs[offset: offset + page_size]
        return Response({
            "total": total,
            "results": [_serialize_task(t) for t in tasks],
        })

    @action(detail=False, methods=["get"])
    def summary(self, request):
        qs = TeacherTask.objects.all()
        teacher_id = request.query_params.get("teacher")
        if teacher_id:
            qs = qs.filter(teacher_id=teacher_id)

        today = date.today()
        overdue = qs.filter(due_date__lt=today, status__in=["todo", "in_progress"]).count()

        return Response({
            "total": qs.count(),
            "by_status": {
                "todo":        qs.filter(status="todo").count(),
                "in_progress": qs.filter(status="in_progress").count(),
                "done":        qs.filter(status="done").count(),
            },
            "by_priority": {
                "urgent": qs.filter(priority="urgent").count(),
                "high":   qs.filter(priority="high").count(),
                "medium": qs.filter(priority="medium").count(),
                "low":    qs.filter(priority="low").count(),
            },
            "overdue": overdue,
        })


class AdminAttendanceMonitorViewSet(viewsets.ViewSet):
    """
    Admin monitoring of student attendance across all schools.

    GET /api/admin/monitor/attendance/         — list (filterable)
    GET /api/admin/monitor/attendance/summary/ — headline stats
    """

    permission_classes = [IsAdminUser]

    def _get_qs(self, request):
        qs = (
            Attendance.objects
            .select_related("learner", "session__module__course", "session__teacher", "session__tenant")
            .order_by("-session__date")
        )
        school_id = request.query_params.get("school")
        if school_id:
            qs = qs.filter(session__tenant_id=school_id)

        teacher_id = request.query_params.get("teacher")
        if teacher_id:
            qs = qs.filter(session__teacher_id=teacher_id)

        status = request.query_params.get("status")
        if status:
            qs = qs.filter(status=status)

        date_from = request.query_params.get("date_from")
        if date_from:
            qs = qs.filter(session__date__gte=date_from)

        date_to = request.query_params.get("date_to")
        if date_to:
            qs = qs.filter(session__date__lte=date_to)

        learner_id = request.query_params.get("learner")
        if learner_id:
            qs = qs.filter(learner_id=learner_id)

        return qs

    def list(self, request):
        qs = self._get_qs(request)
        page_size = int(request.query_params.get("page_size", 50))
        offset = int(request.query_params.get("offset", 0))
        total = qs.count()
        records = qs[offset: offset + page_size]
        return Response({
            "total": total,
            "results": [_serialize_attendance(a) for a in records],
        })

    @action(detail=False, methods=["get"])
    def summary(self, request):
        qs = Attendance.objects.all()
        school_id = request.query_params.get("school")
        if school_id:
            qs = qs.filter(session__tenant_id=school_id)

        total = qs.count()
        present = qs.filter(status="present").count()
        absent  = qs.filter(status="absent").count()
        late    = qs.filter(status="late").count()

        rate = round(present / total * 100, 1) if total else 0

        today = date.today()
        month_start = today.replace(day=1)

        return Response({
            "total": total,
            "this_month": qs.filter(session__date__gte=month_start).count(),
            "by_status": {
                "present": present,
                "absent":  absent,
                "late":    late,
            },
            "overall_attendance_rate": rate,
        })
