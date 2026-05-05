"""Student dashboard API endpoint."""

from datetime import datetime, time

from apps.core.gates import GateService
from apps.core.services.learner_panel_service import LearnerPanelService

from apps.core.models import (
    Achievement,
    Activity,
    Artifact,
    Evidence,
    Learner,
    LearnerCourseEnrollment,
    Module as CourseModule,
    Session,
)
from django.db.models import Q
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from django.core.files.storage import default_storage
from django.conf import settings
import os
import uuid
import json


class IsLearner(permissions.BasePermission):
    """Permission class to ensure user is a learner."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "learner"
        )


class StudentDashboardViewSet(viewsets.ViewSet):
    """ViewSet for student dashboard data."""

    permission_classes = [IsLearner]

    @action(detail=False, methods=["get"], url_path="dashboard")
    def dashboard(self, request):
        """Get complete dashboard data for the authenticated student."""
        user = request.user

        try:
            learner = Learner.objects.get(user=user)
        except Learner.DoesNotExist:
            return Response({"error": "Learner profile not found"}, status=404)

        # Get enrollments with progress
        enrollments = (
            LearnerCourseEnrollment.objects.filter(learner=learner, is_active=True)
            .select_related("course", "current_level")
            .prefetch_related("level_progress")
        )
        enrollment_course_ids = list(enrollments.values_list("course_id", flat=True))

        # Cache the most recent attended session's module per course so we can look
        # up which microcredential was most recently being worked on
        recent_session_module: dict[str, str] = {}
        recent_sessions = (
            Session.objects.filter(
                learners=learner,
                module__course_id__in=enrollment_course_ids,
            )
            .select_related("module")
            .order_by("-date", "-start_time")
        )
        for sess in recent_sessions:
            cid = str(sess.module.course_id) if sess.module else None
            if cid and cid not in recent_session_module:
                recent_session_module[cid] = sess.module.name

        pathways = []
        for enrollment in enrollments:
            # Calculate overall progress
            total_levels = enrollment.course.levels.count()
            completed_levels = enrollment.level_progress.filter(completed=True).count()
            overall_progress = (
                int((completed_levels / total_levels * 100)) if total_levels > 0 else 0
            )

            # Get current level progress
            current_progress_obj = enrollment.level_progress.filter(
                level=enrollment.current_level
            ).first()

            current_level_progress = 0
            if current_progress_obj:
                current_level_progress = int(
                    current_progress_obj.completion_percentage or 0
                )

            # Determine status based on progress.
            # New or untouched enrollments should have a dedicated "not_started" state.
            has_started_level_work = enrollment.level_progress.filter(
                Q(modules_completed__gt=0)
                | Q(artifacts_submitted__gt=0)
                | Q(assessment_score__gt=0)
                | Q(completed=True)
            ).exists()

            is_not_started = (
                overall_progress == 0 and completed_levels == 0 and not has_started_level_work
            )

            if is_not_started:
                status = "not_started"
            elif overall_progress >= 70:
                status = "good"
            elif overall_progress >= 40:
                status = "warning"
            else:
                status = "critical"

            # ── Determine the current microcredential label ──────────────────
            # Prefer: last session's module name (shows what's actively being taught)
            # Fallback: first module in the course (gives something meaningful always)
            course_id_str = str(enrollment.course_id)
            if course_id_str in recent_session_module:
                current_microcredential = recent_session_module[course_id_str]
            else:
                first_module = (
                    CourseModule.objects.filter(course=enrollment.course)
                    .order_by("id")
                    .values_list("name", flat=True)
                    .first()
                )
                current_microcredential = first_module or "Getting Started"

            # Module counts for progress tracking
            total_modules = enrollment.course.modules.count()
            completed_modules = int(total_modules * (overall_progress / 100))

            pathways.append(
                {
                    "id": str(enrollment.id),
                    "title": enrollment.course.name,
                    "description": enrollment.course.description or "",
                    "progress": overall_progress,
                    "currentLevel": (
                        enrollment.current_level.name
                        if enrollment.current_level
                        else "Not Started"
                    ),
                    "currentLevelNumber": (
                        enrollment.current_level.level_number
                        if enrollment.current_level
                        else 0
                    ),
                    "currentModule": current_microcredential,
                    "totalLevels": total_levels,
                    "currentLevelProgress": current_level_progress,
                    "color": self._get_pathway_color(enrollment.course.name),
                    "icon": self._get_pathway_icon(enrollment.course.name),
                    "status": status,
                    "microCredentialsEarned": completed_modules,
                    "totalMicroCredentials": total_modules,
                }
            )

        # Get upcoming activities (sessions and events)
        today = datetime.now().date()
        session_filters = Q(learners=learner)
        if enrollment_course_ids:
            session_filters |= Q(module__course_id__in=enrollment_course_ids)

        upcoming_sessions = Session.objects.filter(
            session_filters,
            date__gte=today,
            status__in=["scheduled", "in_progress"],
        )
        if learner.tenant_id:
            upcoming_sessions = upcoming_sessions.filter(tenant_id=learner.tenant_id)
        upcoming_sessions = (
            upcoming_sessions
            .select_related("module", "module__course")
            .distinct()
            .order_by("date", "start_time")[:10]
        )

        upcoming_activities_list = (
            Activity.objects.filter(
                date__gte=today,
                status__in=["upcoming", "ongoing"],
            )
            .select_related("course")
            .order_by("date", "start_time")[:10]
        )

        # Combine and sort
        upcoming = []
        for session in upcoming_sessions:
            sort_key = datetime.combine(session.date, session.start_time or time.min)
            upcoming.append(
                {
                    "id": str(session.id),
                    "title": session.module.name if session.module else "Class Session",
                    "pathway": session.module.course.name if session.module and getattr(session.module, "course", None) else "General Pathway",
                    "microcredential": session.module.name if session.module else "General Credential",
                    "fullDate": session.date.strftime("%B %d, %Y"),
                    "date": session.date.strftime("%b %d"),
                    "startTime": session.start_time.strftime("%I:%M %p") if session.start_time else "TBD",
                    "endTime": session.end_time.strftime("%I:%M %p") if session.end_time else "TBD",
                    "time": (f"{session.start_time.strftime('%I:%M %p')} - {session.end_time.strftime('%I:%M %p')}" if session.start_time and session.end_time else session.start_time.strftime('%I:%M %p') if session.start_time else "TBD"),
                    "type": "session",
                    "color": "#f97316",  # update to fundi orange
                    "sort_key": sort_key,
                }
            )

        for activity in upcoming_activities_list:
            sort_key = datetime.combine(activity.date, activity.start_time or time.min)
            upcoming.append(
                {
                    "id": str(activity.id),
                    "title": activity.name,
                    "pathway": activity.course.name if hasattr(activity, 'course') and activity.course else "General Pathway",
                    "microcredential": "Activity",
                    "fullDate": activity.date.strftime("%B %d, %Y"),
                    "date": activity.date.strftime("%b %d"),
                    "startTime": activity.start_time.strftime("%I:%M %p") if activity.start_time else "TBD",
                    "endTime": activity.end_time.strftime("%I:%M %p") if getattr(activity, "end_time", None) else "TBD",
                    "time": (f"{activity.start_time.strftime('%I:%M %p')} - {activity.end_time.strftime('%I:%M %p')}" if activity.start_time and getattr(activity, "end_time", None) else activity.start_time.strftime('%I:%M %p') if activity.start_time else "TBD"),
                    "type": "activity",
                    "color": "#f59e0b",  # orange
                    "sort_key": sort_key,
                }
            )

        # Sort by date and time
        upcoming.sort(key=lambda x: x["sort_key"])
        upcoming = [{k: v for k, v in item.items() if k != "sort_key"} for item in upcoming[:5]]

        # Get active projects (artifacts in progress)
        active_artifacts = (
            Artifact.objects.filter(learner=learner)
            .select_related("learner")
            .order_by("-submitted_at")[:3]
        )

        projects = []
        for artifact in active_artifacts:
            # Try to determine which pathway this belongs to
            pathway_name = "General"
            artifact_color = "#6b7280"

            # You could enhance this by linking artifacts to courses

            projects.append(
                {
                    "id": str(artifact.id),
                    "title": artifact.title,
                    "description": (
                        artifact.reflection[:100] + "..."
                        if artifact.reflection and len(artifact.reflection) > 100
                        else artifact.reflection or ""
                    ),
                    "pathway": pathway_name,
                    "progress": 75,  # Could be calculated based on artifact status
                    "status": "In Progress",
                    "dueDate": "This week",  # Could be enhanced with actual due dates
                    "color": artifact_color,
                }
            )

        # Get earned badges/achievements
        achievements = (
            Achievement.objects.filter(learner=learner)
            .select_related("course", "level")
            .order_by("-earned_at")[:6]
        )

        badges = []
        for achievement in achievements:
            # Get pathway name and color
            pathway_name = achievement.course.name if achievement.course else "General"
            pathway_color = self._get_pathway_color(pathway_name)

            badges.append(
                {
                    "id": str(achievement.id),
                    "name": achievement.name,
                    "description": achievement.description or "",
                    "icon": achievement.icon or "🏆",
                    "earnedAt": (
                        achievement.earned_at.isoformat()
                        if achievement.earned_at
                        else None
                    ),
                    "earnedDate": (
                        achievement.earned_at.strftime("%b %Y")
                        if achievement.earned_at
                        else None
                    ),
                    "type": achievement.achievement_type,
                    "pathway": pathway_name,
                    "color": pathway_color,
                    "isLocked": False,
                }
            )

        return Response(
            {
                "learner": {
                    "id": str(learner.id),
                    "firstName": learner.first_name,
                    "lastName": learner.last_name,
                    "fullName": learner.full_name,
                    "currentSchool": learner.current_school or "",
                    "currentClass": learner.current_class or "",
                    "age": learner.age,
                },
                "pathways": pathways,
                "upcomingLessons": upcoming,
                "activeProjects": projects,
                "badges": badges,
            }
        )

    @action(detail=False, methods=["get"], url_path="artifacts")
    def artifacts(self, request):
        """Get all artifacts uploaded by teachers for the authenticated student."""
        user = request.user

        try:
            learner = Learner.objects.get(user=user)
        except Learner.DoesNotExist:
            return Response({"error": "Learner profile not found"}, status=404)

        artifacts_qs = (
            Artifact.objects.filter(learner=learner)
            .order_by("-submitted_at")
        )

        results = []
        for a in artifacts_qs:
            # Try to get teacher/author name via created_by field if it exists
            teacher_name = ""
            if hasattr(a, "created_by") and a.created_by:
                try:
                    teacher_name = a.created_by.get_full_name() or a.created_by.username
                except Exception:
                    pass

            # Normalise media_refs
            media_refs = a.media_refs or []
            if isinstance(media_refs, str):
                import json
                try:
                    media_refs = json.loads(media_refs)
                except Exception:
                    media_refs = []

            results.append({
                "id": str(a.id),
                "title": a.title,
                "reflection": a.reflection or "",
                "submitted_at": a.submitted_at.isoformat() if a.submitted_at else None,
                "teacher_name": teacher_name,
                "media_refs": media_refs if isinstance(media_refs, list) else [],
                "status": a.status,
                "rejection_reason": a.rejection_reason,
            })

        return Response({
            "artifacts": results,
            "total": len(results),
        })

    def _get_pathway_icon(self, course_name: str) -> str:
        """Get an icon name for a pathway based on its name."""
        icons = {
            "robotics": "Bot",
            "coding": "Code",
            "design": "Palette",
            "business": "Briefcase",
            "media": "Video",
            "art": "Paintbrush",
            "music": "Music",
            "science": "Beaker",
        }

        name_lower = course_name.lower()
        for key, icon in icons.items():
            if key in name_lower:
                return icon

        return "GraduationCap"  # default icon

    def _get_pathway_color(self, course_name: str) -> str:
        """Get a color for a pathway based on its name."""
        colors = {
            "robotics": "#8b5cf6",  # purple
            "coding": "#3b82f6",  # blue
            "design": "#ec4899",  # pink
            "business": "#10b981",  # green
            "media": "#f59e0b",  # orange
        }

        name_lower = course_name.lower()
        for key, color in colors.items():
            if key in name_lower:
                return color

        return "#6b7280"  # gray default

    @action(detail=False, methods=["get"], url_path="my-modules")
    def my_modules(self, request):
        """Get all modules for the student's enrolled pathways (courses)."""
        user = request.user

        try:
            learner = Learner.objects.get(user=user)
        except Learner.DoesNotExist:
            return Response({"error": "Learner profile not found"}, status=404)

        # Get active enrollments
        enrollments = (
            LearnerCourseEnrollment.objects.filter(learner=learner, is_active=True)
            .select_related("course")
        )

        # Get all modules for enrolled courses
        from apps.core.models import Module
        course_ids = list(enrollments.values_list("course_id", flat=True))
        modules = Module.objects.filter(course_id__in=course_ids).select_related("course").order_by("course__name", "name")

        # Group modules by pathway/course
        pathways_data = []
        for enrollment in enrollments:
            course = enrollment.course
            course_modules = [m for m in modules if m.course_id == course.id]
            pathways_data.append({
                "course_id": str(course.id),
                "course_name": course.name,
                "modules": [
                    {
                        "id": str(m.id),
                        "name": m.name,
                        "description": getattr(m, "description", ""),
                    }
                    for m in course_modules
                ]
            })

        return Response({
            "pathways": pathways_data,
        })

    @action(detail=False, methods=["post"], url_path="upload-artifact")
    def upload_artifact(self, request):
        """Allow a student to upload a new artifact."""
        import logging
        logger = logging.getLogger(__name__)

        user = request.user

        try:
            learner = Learner.objects.get(user=user)
        except Learner.DoesNotExist:
            return Response({"error": "Learner profile not found"}, status=404)

        from .serializers import StudentArtifactUploadSerializer, QuickArtifactSerializer

        try:
            # Add learner to context or data
            data = request.data.copy()
            serializer = StudentArtifactUploadSerializer(data=data, context={'request': request, 'learner': learner})
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            task = serializer.validated_data.get("task_id")
            module = serializer.validated_data.get("module_id")
            gated_obj = task or module
            if gated_obj is not None:
                gate = GateService.check(learner, gated_obj)
                if not gate.is_open:
                    return Response(
                        {"detail": gate.detail or "This content is locked."},
                        status=status.HTTP_403_FORBIDDEN,
                    )
            
            # Allow learners without a formal school tenant to upload artifacts
            # The current_school field (text) captures the school name for display
            artifact = serializer.save(
                learner=learner,
                tenant=learner.tenant,  # Can be None for independent learners
                uploaded_by_student=True,
                status='pending'
            )
            
            # Save uploaded files
            media_refs = []
            uploaded_files = request.FILES.getlist("files")

            for f in uploaded_files:
                if getattr(settings, "MAX_UPLOAD_SIZE_BYTES", 10 * 1024 * 1024) and f.size > getattr(settings, "MAX_UPLOAD_SIZE_BYTES", 10 * 1024 * 1024):
                    return Response(
                        {"detail": "File too large."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                safe_original_name = os.path.basename(f.name) or "upload"
                safe_name = f"{uuid.uuid4().hex}_{safe_original_name}"
                rel_path = f"artifacts/{artifact.id}/{safe_name}"
                saved_path = default_storage.save(rel_path, f)

                request_obj = request._request if hasattr(request, "_request") else request
                base = getattr(settings, "MEDIA_URL", "/media/")
                file_url = request_obj.build_absolute_uri(f"{base}{saved_path}")

                media_refs.append({
                    "type": f.content_type or "file",
                    "url": file_url,
                    "filename": f.name,
                    "size": f.size,
                    "path": saved_path,
                })
            
            if media_refs:
                artifact.media_refs = media_refs
                artifact.save(update_fields=["media_refs"])

            if task or module:
                resolved_module = module or task.lesson.unit.module
                Evidence.objects.create(
                    tenant=learner.tenant,
                    learner=learner,
                    artifact=artifact,
                    task=task,
                    unit=task.lesson.unit if task else None,
                    module=resolved_module,
                    verification_status=Evidence.STATUS_PENDING,
                )

            return Response(
                {
                    "detail": "Artifact uploaded successfully. Pending teacher approval.",
                    "artifact": QuickArtifactSerializer(artifact).data
                },
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            logger.exception("Error in upload_artifact: %s", str(e))
            return Response(
                {"error": f"Server error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LearnerDashboardViewSet(viewsets.ViewSet):
    """Phase 5 learner dashboard panel endpoints."""

    permission_classes = [IsLearner]

    def _get_learner(self, request):
        try:
            return Learner.objects.select_related(
                "growth_profile", "tenant", "current_program", "current_track"
            ).get(user=request.user)
        except Learner.DoesNotExist:
            return None

    @action(detail=False, methods=["get"], url_path="growth")
    def growth(self, request):
        learner = self._get_learner(request)
        if not learner:
            return Response({"error": "Learner profile not found"}, status=404)
        return Response(LearnerPanelService.growth_summary(learner))

    @action(detail=False, methods=["get"], url_path="module-progress")
    def module_progress(self, request):
        learner = self._get_learner(request)
        if not learner:
            return Response({"error": "Learner profile not found"}, status=404)
        return Response(LearnerPanelService.module_progress(learner) or {})

    @action(detail=False, methods=["get"], url_path="evidence")
    def evidence(self, request):
        learner = self._get_learner(request)
        if not learner:
            return Response({"error": "Learner profile not found"}, status=404)
        return Response({"artifacts": LearnerPanelService.evidence_portfolio(learner)})

    @action(detail=False, methods=["get"], url_path="cohort-position")
    def cohort_position(self, request):
        return Response(
            {"detail": "Cohort comparisons are not available to learner accounts."},
            status=status.HTTP_403_FORBIDDEN,
        )

    @action(detail=False, methods=["get"], url_path="certifications")
    def certifications(self, request):
        learner = self._get_learner(request)
        if not learner:
            return Response({"error": "Learner profile not found"}, status=404)
        return Response(LearnerPanelService.certifications(learner))
