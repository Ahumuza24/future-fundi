from __future__ import annotations

from datetime import date, timedelta

from apps.core.models import (
    Artifact,
    Attendance,
    Course,
    Learner,
    LearnerCourseEnrollment,
    LearnerLevelProgress,
    Module,
    PathwayInputs,
    Session,
    WeeklyPulse,
)
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .serializers import (
    ArtifactSerializer,
    ChildCreateSerializer,
    ChildDetailSerializer,
    ChildUpdateSerializer,
    CourseSerializer,
    LearnerSerializer,
    ModuleSerializer,
    PathwayInputsSerializer,
    WeeklyPulseSerializer,
)


class IsParent(permissions.BasePermission):
    """Permission class to check if user is a parent."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "parent"


class ChildViewSet(viewsets.ModelViewSet):
    """ViewSet for parents to manage their children.

    Parents can:
    - List all their children
    - Add a new child
    - View child details (with all dashboard data)
    - Update child information
    - Delete a child
    """

    permission_classes = [IsParent]

    def get_serializer_class(self):
        if self.action == "create":
            return ChildCreateSerializer
        elif self.action in ["update", "partial_update"]:
            return ChildUpdateSerializer
        elif self.action == "retrieve":
            return ChildDetailSerializer
        return LearnerSerializer

    def get_queryset(self):
        """Return only children belonging to the authenticated parent."""
        return (
            Learner.objects.filter(parent=self.request.user)
            .select_related("tenant", "parent")
            .prefetch_related(
                "artifacts", "pathway_inputs", "weekly_pulses", "assessments"
            )
            .order_by("first_name", "last_name")
        )

    def perform_create(self, serializer):
        """Create a child for the authenticated parent."""
        serializer.save()

    @action(detail=True, methods=["get"], url_path="dashboard")
    def dashboard(self, request, pk=None):
        """Get complete dashboard data for a specific child."""
        child = self.get_object()

        # 1. Subscription Status (Placeholder)
        subscription = {
            "status": "active",
            "tier": "Standard",
            "expires_at": (date.today() + timedelta(days=30)).isoformat(),
        }

        # 2. Pathways (Enrollments)
        enrollments = child.course_enrollments.filter(is_active=True).select_related(
            "course", "current_level"
        )
        pathways_data = []
        for enrollment in enrollments:
            pathways_data.append(
                {
                    "id": str(enrollment.course.id),
                    "name": enrollment.course.name,
                    "current_level": (
                        enrollment.current_level.name
                        if enrollment.current_level
                        else "Not Started"
                    ),
                    "progress": 0,  # Calculate actual progress if needed
                    "description": enrollment.course.description,
                }
            )

        # 3. Badges (Derived from completed sessions where module has badge_name)
        # Find sessions attended by child that are completed

        # We assume if they attended a completed session, they completed the module.
        # Ideally we should check if they were 'present'.
        completed_attendances = Attendance.objects.filter(
            learner=child, status="present", session__status="completed"
        ).select_related("session__module")

        badges = []
        seen_badges = set()
        for att in completed_attendances:
            module = att.session.module
            if module.badge_name and module.badge_name not in seen_badges:
                badges.append(
                    {
                        "id": str(module.id),
                        "name": module.badge_name,
                        "module_name": module.name,
                        "earned_at": att.session.date,
                        "icon": "award",  # Placeholder for UI mapping
                    }
                )
                seen_badges.add(module.badge_name)

        # 4. Artifacts
        recent_artifacts = child.artifacts.order_by("-submitted_at")[:6]

        # 5. Upcoming Activities (Sessions)
        upcoming_sessions = Session.objects.filter(
            learners=child, date__gte=date.today(), status="scheduled"
        ).order_by("date", "start_time")[:5]

        upcoming_activities = []
        for session in upcoming_sessions:
            upcoming_activities.append(
                {
                    "id": str(session.id),
                    "title": session.module.name,
                    "date": session.date,
                    "time": session.start_time,
                    "type": "Class",
                }
            )

        # 6. Micro Lessons (Placeholders)
        micro_lessons = [
            {
                "id": "ml-1",
                "title": "Cyber Security Basics",
                "category": "Digital Safety",
                "duration": "15 min",
            },
            {
                "id": "ml-2",
                "title": "Intro to AI",
                "category": "Technology",
                "duration": "20 min",
            },
            {
                "id": "ml-3",
                "title": "Basic Computing",
                "category": "Skills",
                "duration": "30 min",
            },
        ]

        # 7. Teachers (Placeholder/Derived)
        # Getting teachers from enrollments or sessions
        teachers = [
            {
                "id": "t-1",
                "name": "Ms. Sarah",
                "role": "Lead Robot Instructor",
                "avatar": None,
            },
            {"id": "t-2", "name": "Mr. David", "role": "Coding Mentor", "avatar": None},
        ]

        return Response(
            {
                "child": LearnerSerializer(child).data,
                "subscription": subscription,
                "pathways": pathways_data,
                "badges": badges,
                "artifacts": ArtifactSerializer(recent_artifacts, many=True).data,
                "upcoming_activities": upcoming_activities,
                "micro_lessons": micro_lessons,
                "teachers": teachers,
            }
        )

    @action(detail=True, methods=["get"], url_path="artifacts")
    def artifacts(self, request, pk=None):
        """Get all artifacts for a specific child."""
        child = self.get_object()
        artifacts = child.artifacts.order_by("-submitted_at")
        serializer = ArtifactSerializer(artifacts, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="pathway")
    def pathway(self, request, pk=None):
        """Get pathway score and recommendations for a specific child."""
        child = self.get_object()
        latest_inputs = child.pathway_inputs.order_by("-created_at").first()

        if not latest_inputs:
            return Response(
                {"detail": "No pathway inputs available", "score": None, "gate": None}
            )

        from apps.core.services.pathway import (
            calculate_pathway_score,
            determine_gate,
            recommend_next_moves,
        )

        score = calculate_pathway_score(latest_inputs)

        # Check for positive mood
        latest_pulse = child.weekly_pulses.order_by("-created_at").first()
        has_positive_mood = latest_pulse.mood >= 60 if latest_pulse else True

        gate = determine_gate(score, latest_inputs.skill_readiness, has_positive_mood)
        recommendations = recommend_next_moves(latest_inputs, child, gate)

        return Response(
            {
                "score": score,
                "gate": gate,
                "recommendations": recommendations,
                "inputs": PathwayInputsSerializer(latest_inputs).data,
            }
        )

    @action(detail=False, methods=["get"], url_path="summary")
    def summary(self, request):
        """Get summary data for all children of the parent.

        Useful for a family overview dashboard.
        """
        children = self.get_queryset()

        summary_data = []
        for child in children:
            latest_pathway = child.pathway_inputs.order_by("-created_at").first()
            pathway_score = None

            if latest_pathway:
                from apps.core.services.pathway import calculate_pathway_score

                pathway_score = calculate_pathway_score(latest_pathway)

            summary_data.append(
                {
                    "id": str(child.id),
                    "name": child.full_name,
                    "age": child.age,
                    "pathway_score": pathway_score,
                    "artifacts_count": child.artifacts.count(),
                    "joined_at": child.joined_at,
                }
            )

        return Response(
            {
                "children": summary_data,
                "total_children": len(summary_data),
            }
        )
