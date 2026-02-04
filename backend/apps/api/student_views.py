"""Student dashboard API endpoint."""

from datetime import datetime, timedelta

from apps.api.serializers import (
    AchievementSerializer,
    ArtifactSerializer,
    LearnerCourseEnrollmentSerializer,
    LearnerSerializer,
)
from apps.core.models import (
    Achievement,
    Activity,
    Artifact,
    Learner,
    LearnerCourseEnrollment,
    Session,
)
from django.db.models import Count, Prefetch, Q
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response


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

        print(
            f"[DEBUG] Found {enrollments.count()} enrollments for learner {learner.full_name}"
        )

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

            # Determine status based on progress
            if overall_progress >= 70:
                status = "good"
            elif overall_progress >= 40:
                status = "warning"
            else:
                status = "critical"

            # Get total modules for this course
            total_modules = enrollment.course.modules.count()
            # Get completed modules (simplified - you may want to track this differently)
            completed_modules = int(total_modules * (overall_progress / 100))

            pathways.append(
                {
                    "id": str(enrollment.id),
                    "title": enrollment.course.name,  # Changed from 'name' to 'title'
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
                    "currentModule": (
                        enrollment.current_level.name
                        if enrollment.current_level
                        else "Getting Started"
                    ),
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
        upcoming_sessions = (
            Session.objects.filter(
                learners=learner,
                date__gte=today,
                status__in=["scheduled", "in_progress"],
            )
            .select_related("module")
            .order_by("date", "start_time")[:5]
        )

        upcoming_activities_list = (
            Activity.objects.filter(
                date__gte=today,
                status__in=["upcoming", "ongoing"],
            )
            .select_related("course")
            .order_by("date", "start_time")[:5]
        )

        print(f"[DEBUG] Found {upcoming_sessions.count()} upcoming sessions")
        print(f"[DEBUG] Found {upcoming_activities_list.count()} upcoming activities")

        # Combine and sort
        upcoming = []
        for session in upcoming_sessions:
            upcoming.append(
                {
                    "id": str(session.id),
                    "title": session.module.name if session.module else "Class Session",
                    "date": session.date.strftime("%b %d"),
                    "time": (
                        session.start_time.strftime("%H:%M")
                        if session.start_time
                        else ""
                    ),
                    "type": "session",
                    "color": "#3b82f6",  # blue
                }
            )

        for activity in upcoming_activities_list:
            upcoming.append(
                {
                    "id": str(activity.id),
                    "title": activity.name,
                    "date": activity.date.strftime("%b %d"),
                    "time": (
                        activity.start_time.strftime("%H:%M")
                        if activity.start_time
                        else ""
                    ),
                    "type": "activity",
                    "color": "#f59e0b",  # orange
                }
            )

        # Sort by date and time
        upcoming.sort(key=lambda x: (x["date"], x["time"]))
        upcoming = upcoming[:5]  # Limit to 5

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
                "upcomingActivities": upcoming,
                "activeProjects": projects,
                "badges": badges,
            }
        )

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
