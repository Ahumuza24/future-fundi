"""
Admin analytics and bulk-import services.

Extracted from:
  - AdminAnalyticsViewSet.dashboard() → AdminDashboardService
  - AdminUserViewSet.bulk_import()    → AdminBulkImportService
"""

from __future__ import annotations

import csv
from datetime import date, timedelta
from io import StringIO
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    pass


class AdminDashboardService:
    """Compute the admin analytics dashboard payload."""

    @staticmethod
    def compute(*, days: int = 30) -> dict[str, Any]:
        """Return dashboard KPIs + chart series for the given time window."""
        from django.db.models import Count, Q
        from django.db.models.functions import TruncDate
        from django.utils import timezone

        from apps.core.models import (
            Attendance,
            LearnerCourseEnrollment,
            School,
            Session,
        )
        from django.contrib.auth import get_user_model

        User = get_user_model()

        end_dt = timezone.now()
        start_dt = end_dt - timedelta(days=days)
        today = end_dt.date()
        start_date = start_dt.date()

        kpis = AdminDashboardService._kpis(
            User, School, Session, LearnerCourseEnrollment, Attendance,
            start_dt,
        )
        user_growth = AdminDashboardService._user_growth(
            User, LearnerCourseEnrollment, start_date, today,
        )
        session_trend = AdminDashboardService._session_trend(
            Session, start_date, today,
        )
        role_distribution = list(
            User.objects.values("role").annotate(count=Count("id")).order_by("-count")
        )
        school_performance = AdminDashboardService._school_performance(School)
        top_teachers = AdminDashboardService._top_teachers(Session, Q, start_dt)
        attendance_trend = AdminDashboardService._attendance_trend(
            Attendance, start_date, today,
        )
        top_courses = list(
            LearnerCourseEnrollment.objects.filter(is_active=True)
            .values("course__name")
            .annotate(count=Count("id"))
            .order_by("-count")[:8]
        )

        return {
            "meta": {
                "days": days,
                "start_date": start_date.isoformat(),
                "end_date": today.isoformat(),
            },
            "kpis": kpis,
            "user_growth": user_growth,
            "session_trend": session_trend,
            "role_distribution": role_distribution,
            "school_performance": school_performance,
            "top_teachers": top_teachers,
            "attendance_trend": attendance_trend,
            "top_courses": top_courses,
        }

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _kpis(
        User: Any,
        School: Any,
        Session: Any,
        LearnerCourseEnrollment: Any,
        Attendance: Any,
        start_dt: Any,
    ) -> dict[str, Any]:
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        new_users = User.objects.filter(date_joined__gte=start_dt).count()
        total_schools = School.objects.count()
        total_sessions = Session.objects.count()
        new_sessions = Session.objects.filter(created_at__gte=start_dt).count()
        completed_sessions = Session.objects.filter(status="completed").count()
        total_enrollments = LearnerCourseEnrollment.objects.filter(is_active=True).count()
        new_enrollments = LearnerCourseEnrollment.objects.filter(
            enrolled_at__gte=start_dt
        ).count()
        total_attendance = Attendance.objects.count()
        present_attendance = Attendance.objects.filter(status="present").count()
        attendance_rate = (
            round(present_attendance / total_attendance * 100, 1)
            if total_attendance else 0
        )
        session_completion_rate = (
            round(completed_sessions / total_sessions * 100, 1)
            if total_sessions else 0
        )
        return {
            "total_users": total_users,
            "active_users": active_users,
            "new_users": new_users,
            "total_schools": total_schools,
            "total_sessions": total_sessions,
            "new_sessions": new_sessions,
            "completed_sessions": completed_sessions,
            "total_enrollments": total_enrollments,
            "new_enrollments": new_enrollments,
            "attendance_rate": attendance_rate,
            "session_completion_rate": session_completion_rate,
        }

    @staticmethod
    def _user_growth(
        User: Any,
        LearnerCourseEnrollment: Any,
        start_date: date,
        today: date,
    ) -> list[dict[str, Any]]:
        from django.db.models import Count
        from django.db.models.functions import TruncDate

        user_by_day = {
            r["day"]: r["new_users"]
            for r in User.objects.filter(date_joined__date__gte=start_date)
            .annotate(day=TruncDate("date_joined"))
            .values("day")
            .annotate(new_users=Count("id"))
        }
        enroll_by_day = {
            r["day"]: r["new_enrollments"]
            for r in LearnerCourseEnrollment.objects.filter(
                enrolled_at__date__gte=start_date
            )
            .annotate(day=TruncDate("enrolled_at"))
            .values("day")
            .annotate(new_enrollments=Count("id"))
        }
        growth: list[dict[str, Any]] = []
        cur = start_date
        while cur <= today:
            growth.append({
                "date": cur.isoformat(),
                "new_users": user_by_day.get(cur, 0),
                "new_enrollments": enroll_by_day.get(cur, 0),
            })
            cur += timedelta(days=1)
        return growth

    @staticmethod
    def _session_trend(
        Session: Any, start_date: date, today: date
    ) -> list[dict[str, Any]]:
        from django.db.models import Count
        from django.db.models.functions import TruncDate

        rows = (
            Session.objects.filter(date__gte=start_date)
            .annotate(day=TruncDate("date"))
            .values("day", "status")
            .annotate(cnt=Count("id"))
        )
        sess_map: dict[date, dict[str, int]] = {}
        for row in rows:
            d = row["day"]
            if d not in sess_map:
                sess_map[d] = {"total": 0, "completed": 0, "scheduled": 0}
            sess_map[d]["total"] += row["cnt"]
            if row["status"] == "completed":
                sess_map[d]["completed"] = row["cnt"]
            elif row["status"] == "scheduled":
                sess_map[d]["scheduled"] = row["cnt"]

        trend: list[dict[str, Any]] = []
        cur = start_date
        while cur <= today:
            entry = sess_map.get(cur, {"total": 0, "completed": 0, "scheduled": 0})
            trend.append({"date": cur.isoformat(), **entry})
            cur += timedelta(days=1)
        return trend

    @staticmethod
    def _school_performance(School: Any) -> list[dict[str, Any]]:
        from django.db.models import Count

        raw = School.objects.annotate(
            learner_count=Count("learner", distinct=True),
            session_count=Count("session", distinct=True),
        ).order_by("-learner_count")[:10]
        return [
            {"school": s.name, "learners": s.learner_count, "sessions": s.session_count}
            for s in raw
        ]

    @staticmethod
    def _top_teachers(Session: Any, Q: Any, start_dt: Any) -> list[dict[str, Any]]:
        from django.db.models import Count

        rows = list(
            Session.objects.filter(created_at__gte=start_dt)
            .values("teacher__first_name", "teacher__last_name", "teacher__username")
            .annotate(
                sessions=Count("id"),
                completed=Count("id", filter=Q(status="completed")),
            )
            .order_by("-sessions")[:8]
        )
        for t in rows:
            full = f"{t['teacher__first_name']} {t['teacher__last_name']}".strip()
            t["name"] = full or t["teacher__username"]
            del t["teacher__first_name"], t["teacher__last_name"], t["teacher__username"]
        return rows

    @staticmethod
    def _attendance_trend(
        Attendance: Any, start_date: date, today: date
    ) -> list[dict[str, Any]]:
        from django.db.models import Count

        rows = (
            Attendance.objects.filter(session__date__gte=start_date)
            .values("session__date", "status")
            .annotate(cnt=Count("id"))
        )
        att_map: dict[date, dict[str, int]] = {}
        for row in rows:
            d = row["session__date"]
            if d not in att_map:
                att_map[d] = {"present": 0, "absent": 0, "late": 0, "total": 0}
            st = row["status"]
            att_map[d]["total"] += row["cnt"]
            if st in ("present", "absent", "late"):
                att_map[d][st] += row["cnt"]

        trend: list[dict[str, Any]] = []
        cur = start_date
        while cur <= today:
            a = att_map.get(cur, {"present": 0, "absent": 0, "late": 0, "total": 0})
            total_d = a["total"]
            trend.append({
                "date": cur.isoformat(),
                "rate": round(a["present"] / total_d * 100, 1) if total_d else 0,
                "present": a["present"],
                "absent": a["absent"],
                "late": a["late"],
            })
            cur += timedelta(days=1)
        return trend


class AdminBulkImportService:
    """Import users from a CSV upload."""

    REQUIRED_FIELDS: tuple[str, ...] = ("username", "email", "role")
    LEGACY_ROLE_ALIASES: dict[str, str] = {
        "data_entry": "curriculum_designer",
    }

    @staticmethod
    def import_users(csv_file: Any) -> dict[str, Any]:
        """
        Parse csv_file, create User rows, return summary dict.

        Raises:
            UnicodeDecodeError: if file encoding is not UTF-8.
            csv.Error: if CSV structure is malformed.
        """
        decoded = csv_file.read().decode("utf-8")
        io_string = StringIO(decoded)
        reader = csv.DictReader(io_string)

        created_count = 0
        errors: list[str] = []

        for row_num, row in enumerate(reader, start=2):
            ok, err = AdminBulkImportService._process_row(row, row_num)
            if ok:
                created_count += 1
            elif err:
                errors.append(err)

        return {"success": True, "created": created_count, "errors": errors}

    @staticmethod
    def _process_row(row: dict[str, str], row_num: int) -> tuple[bool, str | None]:
        """
        Create one user from a CSV row.

        Returns (True, None) on success, (False, error_message) on failure.
        """
        from django.contrib.auth import get_user_model
        from django.core.exceptions import ValidationError
        from django.db import IntegrityError

        from apps.core.models import School
        from apps.core.roles import UserRole

        User = get_user_model()

        missing = [f for f in AdminBulkImportService.REQUIRED_FIELDS if not row.get(f)]
        if missing:
            return False, f"Row {row_num}: Missing fields {missing}"

        role = AdminBulkImportService.LEGACY_ROLE_ALIASES.get(row["role"], row["role"])
        if role not in UserRole.values:
            return False, f"Row {row_num}: Invalid role {row['role']}"

        user_data: dict[str, Any] = {
            "username": row["username"],
            "email": row["email"],
            "first_name": row.get("first_name", ""),
            "last_name": row.get("last_name", ""),
            "role": role,
        }

        school_id = row.get("school_id") or row.get("tenant_id")
        if school_id:
            try:
                user_data["tenant"] = School.objects.get(id=school_id)
            except School.DoesNotExist:
                return False, f"Row {row_num}: School {school_id} not found"

        try:
            user = User.objects.create_user(**user_data)
            if row.get("password"):
                user.set_password(row["password"])
                user.save(update_fields=["password"])
            return True, None
        except IntegrityError as exc:
            return False, f"Row {row_num}: {exc}"
        except (ValidationError, ValueError) as exc:
            return False, f"Row {row_num}: {exc}"
