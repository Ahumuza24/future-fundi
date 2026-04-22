"""
Dashboard metric services.

Extracted from:
  - TeacherSessionViewSet.dashboard()  → TeacherDashboardService
  - AdminAnalyticsViewSet.dashboard()  → AdminDashboardService  (stub — full port in next phase)
  - SchoolDashboardViewSet.analytics() → SchoolAnalyticsService (stub — full port in next phase)
"""

from __future__ import annotations

import calendar
from datetime import date, timedelta
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from django.db.models import QuerySet

    from apps.core.models import Artifact, School


class TeacherDashboardService:
    """Compute dashboard metrics for a teacher's session queryset."""

    @staticmethod
    def compute(
        *,
        scoped_sessions: "QuerySet",
        school: "School | None",
        today: date | None = None,
    ) -> dict[str, Any]:
        today = today or date.today()
        week_start, week_end = TeacherDashboardService._current_week(today)
        month_start, month_end = TeacherDashboardService._current_month(today)

        return {
            "today": TeacherDashboardService._today_stats(scoped_sessions, today),
            "pending_tasks": TeacherDashboardService._pending_tasks(
                scoped_sessions, school, today
            ),
            "quick_stats": TeacherDashboardService._quick_stats(
                scoped_sessions, today, week_start, week_end, month_start, month_end
            ),
        }

    # ------------------------------------------------------------------
    # Private helpers — each does ONE thing
    # ------------------------------------------------------------------

    @staticmethod
    def _current_week(today: date) -> tuple[date, date]:
        week_start = today - timedelta(days=today.weekday())
        return week_start, week_start + timedelta(days=6)

    @staticmethod
    def _current_month(today: date) -> tuple[date, date]:
        month_start = today.replace(day=1)
        last_day = calendar.monthrange(today.year, today.month)[1]
        return month_start, today.replace(day=last_day)

    @staticmethod
    def _today_stats(scoped_sessions: "QuerySet", today: date) -> dict[str, Any]:
        from apps.api.serializers import SessionSerializer

        today_qs = scoped_sessions.filter(date=today)
        return {
            "date": today,
            "sessions": SessionSerializer(today_qs, many=True).data,
            "total": today_qs.count(),
            "completed": today_qs.filter(status="completed").count(),
            "pending": today_qs.filter(status__in=["scheduled", "in_progress"]).count(),
        }

    @staticmethod
    def _pending_tasks(
        scoped_sessions: "QuerySet",
        school: "School | None",
        today: date,
    ) -> dict[str, Any]:
        from django.db.models import Count, Q

        attendance_needed = scoped_sessions.filter(
            date__lte=today,
            attendance_marked=False,
            status__in=["in_progress", "completed"],
        ).count()

        student_submissions = TeacherDashboardService._pending_student_submissions(school)

        artifacts_needed = (
            scoped_sessions.filter(
                status="completed",
                date__gte=today.replace(day=1),
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

        return {
            "attendance_needed": attendance_needed,
            "artifacts_needed": artifacts_needed,
            "student_submissions": student_submissions,
            "total": attendance_needed + artifacts_needed + student_submissions,
        }

    @staticmethod
    def _pending_student_submissions(school: "School | None") -> int:
        if school is None:
            return 0
        from apps.core.models import Artifact

        return Artifact.objects.filter(
            uploaded_by_student=True,
            tenant=school,
            status=Artifact.STATUS_PENDING,
        ).count()

    @staticmethod
    def _quick_stats(
        scoped_sessions: "QuerySet",
        today: date,
        week_start: date,
        week_end: date,
        month_start: date,
        month_end: date,
    ) -> dict[str, Any]:
        return {
            "sessions_this_week": scoped_sessions.filter(
                date__gte=week_start, date__lte=week_end
            ).count(),
            "sessions_this_month": scoped_sessions.filter(
                date__gte=month_start, date__lte=month_end
            ).count(),
            "sessions_this_month_completed": scoped_sessions.filter(
                date__gte=month_start, date__lte=month_end, status="completed"
            ).count(),
            "total_sessions": scoped_sessions.count(),
            "total_completed": scoped_sessions.filter(status="completed").count(),
            "week_start": week_start,
            "week_end": week_end,
            "month_start": month_start,
            "month_end": month_end,
        }


class MediaService:
    """Handle module media file upload and deletion."""

    ALLOWED_CONTENT_TYPES: frozenset[str] = frozenset({
        "image/jpeg", "image/png", "image/gif", "image/webp",
        "video/mp4", "video/webm", "video/quicktime",
    })

    @staticmethod
    def upload(*, module: Any, uploaded_file: Any) -> dict[str, Any]:
        """Validate, store, and attach a media file to a module. Returns the media entry."""
        import os
        import uuid

        from django.conf import settings
        from django.core.files.storage import default_storage

        MediaService._validate_content_type(uploaded_file.content_type)
        MediaService._validate_file_size(uploaded_file.size, settings.MAX_UPLOAD_SIZE_BYTES)

        ext = os.path.splitext(uploaded_file.name)[1]
        unique_name = f"{uuid.uuid4().hex}{ext}"
        file_path = f"modules/{module.id}/{unique_name}"
        saved_path = default_storage.save(file_path, uploaded_file)

        file_type = "image" if uploaded_file.content_type.startswith("image/") else "video"
        entry: dict[str, Any] = {
            "id": uuid.uuid4().hex[:8],
            "type": file_type,
            "name": uploaded_file.name,
            "url": default_storage.url(saved_path),
            "content_type": uploaded_file.content_type,
        }

        if module.media_files is None:
            module.media_files = []
        module.media_files.append(entry)
        module.save()
        return entry

    @staticmethod
    def delete(*, module: Any, media_id: str) -> None:
        """Remove a media entry from the module and delete the file from storage."""
        from django.core.files.storage import default_storage

        if not module.media_files:
            raise LookupError("No media files on this module.")

        entry = next((m for m in module.media_files if m.get("id") == media_id), None)
        if entry is None:
            raise LookupError(f"Media '{media_id}' not found.")

        MediaService._delete_file_from_storage(entry.get("url", ""), default_storage)
        module.media_files.remove(entry)
        module.save()

    @staticmethod
    def _validate_content_type(content_type: str) -> None:
        if content_type not in MediaService.ALLOWED_CONTENT_TYPES:
            raise ValueError(
                f"File type '{content_type}' not allowed. "
                "Allowed types: images (jpeg, png, gif, webp) and videos (mp4, webm, quicktime)."
            )

    @staticmethod
    def _validate_file_size(size: int, max_bytes: int) -> None:
        if size > max_bytes:
            from django.conf import settings
            raise ValueError(f"File too large. Max size is {settings.MAX_UPLOAD_SIZE_MB} MB.")

    @staticmethod
    def _delete_file_from_storage(url: str, storage: Any) -> None:
        if not url.startswith("/media/"):
            return
        file_path = url.replace("/media/", "", 1)
        try:
            if storage.exists(file_path):
                storage.delete(file_path)
        except OSError:
            pass  # File already gone — not a failure condition
