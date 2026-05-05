"""Pathway learning view for students."""

from apps.core.models import (
    Learner,
    LearnerCourseEnrollment,
    LearnerLevelProgress,
    LearningTask,
    Lesson,
    Module,
    Program,
    Track,
    Unit,
)
from apps.core.gates import GateService
from django.shortcuts import get_object_or_404
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


class PathwayLearningViewSet(viewsets.ViewSet):
    """ViewSet for pathway learning interface."""

    permission_classes = [IsLearner]

    @action(detail=True, methods=["get"], url_path="learn")
    def learn(self, request, pk=None):
        """Get detailed pathway learning content for a specific enrollment."""
        user = request.user

        try:
            learner = Learner.objects.get(user=user)
        except Learner.DoesNotExist:
            return Response({"error": "Learner profile not found"}, status=404)

        # Get the enrollment
        enrollment = get_object_or_404(
            LearnerCourseEnrollment, id=pk, learner=learner, is_active=True
        )

        course = enrollment.course

        # Get all levels for this course
        levels = course.levels.all().order_by("level_number")

        levels_data = []
        for level in levels:
            # Get learner's progress for this level
            level_progress = LearnerLevelProgress.objects.filter(
                enrollment=enrollment, level=level
            ).first()

            # Get modules for this level
            modules = level.required_modules.all().order_by("name")

            print(
                f"[DEBUG] Level {level.level_number} ({level.name}): {modules.count()} modules"
            )

            # If no required_modules, get all modules for this course
            if modules.count() == 0:
                modules = Module.objects.filter(course=course).order_by("name")
                print(
                    f"[DEBUG] Using course modules instead: {modules.count()} modules"
                )

            modules_data = []
            for module in modules:
                modules_data.append(
                    {
                        "id": str(module.id),
                        "name": module.name,
                        "description": module.description,
                        "content": module.content,
                        "suggestedActivities": module.suggested_activities,
                        "materials": module.materials,
                        "competences": module.competences,
                        "mediaFiles": module.media_files,
                        "badgeName": module.badge_name,
                    }
                )

            # Check if level is locked
            is_locked = False
            if level.level_number > 1:
                # Check if previous level is completed
                previous_level = levels.filter(
                    level_number=level.level_number - 1
                ).first()
                if previous_level:
                    previous_progress = LearnerLevelProgress.objects.filter(
                        enrollment=enrollment, level=previous_level
                    ).first()
                    is_locked = not (previous_progress and previous_progress.completed)

            levels_data.append(
                {
                    "id": str(level.id),
                    "levelNumber": level.level_number,
                    "name": level.name,
                    "description": level.description,
                    "learningOutcomes": level.learning_outcomes,
                    "requiredModulesCount": level.required_modules_count,
                    "requiredArtifactsCount": level.required_artifacts_count,
                    "requiredAssessmentScore": level.required_assessment_score,
                    "requiresTeacherConfirmation": level.requires_teacher_confirmation,
                    "modules": modules_data,
                    "progress": {
                        "completionPercentage": (
                            level_progress.completion_percentage
                            if level_progress
                            else 0
                        ),
                        "completed": (
                            level_progress.completed if level_progress else False
                        ),
                        "completedAt": (
                            level_progress.completed_at.isoformat()
                            if level_progress and level_progress.completed_at
                            else None
                        ),
                    },
                    "isLocked": is_locked,
                    "isCurrent": (
                        enrollment.current_level.id == level.id
                        if enrollment.current_level
                        else False
                    ),
                }
            )

        # Get overall course progress
        total_levels = levels.count()
        completed_levels = LearnerLevelProgress.objects.filter(
            enrollment=enrollment, completed=True
        ).count()
        overall_progress = (
            int((completed_levels / total_levels * 100)) if total_levels > 0 else 0
        )

        return Response(
            {
                "enrollment": {
                    "id": str(enrollment.id),
                    "enrolledAt": (
                        enrollment.enrolled_at.isoformat()
                        if enrollment.enrolled_at
                        else None
                    ),
                },
                "course": {
                    "id": str(course.id),
                    "name": course.name,
                    "description": course.description,
                },
                "currentLevel": {
                    "id": (
                        str(enrollment.current_level.id)
                        if enrollment.current_level
                        else None
                    ),
                    "name": (
                        enrollment.current_level.name
                        if enrollment.current_level
                        else None
                    ),
                    "levelNumber": (
                        enrollment.current_level.level_number
                        if enrollment.current_level
                        else 0
                    ),
                },
                "progress": {
                    "overallPercentage": overall_progress,
                    "completedLevels": completed_levels,
                    "totalLevels": total_levels,
                },
                "levels": levels_data,
                "hierarchy": self._build_gate_hierarchy(learner, course),
            }
        )

    def _gate_payload(self, learner: Learner, obj: object) -> dict:
        result = GateService.check(learner, obj)
        return {
            "is_open": result.is_open,
            "reason": result.reason,
            "detail": result.detail,
        }

    def _access_payload(self, gate: dict, *, can_submit: bool = False) -> dict:
        return {
            "can_preview": True,
            "can_open": gate["is_open"],
            "can_submit": gate["is_open"] and can_submit,
        }

    def _build_gate_hierarchy(self, learner: Learner, pathway) -> dict:
        pathway_gate = self._gate_payload(learner, pathway)
        tracks = (
            Track.objects.filter(pathway=pathway)
            .prefetch_related("programs__modules__units__lessons__tasks")
            .order_by("sequence_order")
        )
        return {
            "id": str(pathway.id),
            "name": pathway.name,
            "gate": pathway_gate,
            "access": self._access_payload(pathway_gate),
            "tracks": [self._track_payload(learner, track) for track in tracks],
        }

    def _track_payload(self, learner: Learner, track: Track) -> dict:
        gate = self._gate_payload(learner, track)
        return {
            "id": str(track.id),
            "title": track.title,
            "gate": gate,
            "access": self._access_payload(gate),
            "programs": [
                self._program_payload(learner, program)
                for program in track.programs.all().order_by("sequence_order")
            ],
        }

    def _program_payload(self, learner: Learner, program: Program) -> dict:
        gate = self._gate_payload(learner, program)
        return {
            "id": str(program.id),
            "title": program.title,
            "gate": gate,
            "access": self._access_payload(gate),
            "modules": [
                self._module_payload(learner, module)
                for module in program.modules.all().order_by("sequence_order")
            ],
        }

    def _module_payload(self, learner: Learner, module: Module) -> dict:
        gate = self._gate_payload(learner, module)
        payload = {
            "id": str(module.id),
            "name": module.name,
            "outcome_statement": module.outcome_statement,
            "gate": gate,
            "access": self._access_payload(gate),
            "units": [
                self._unit_payload(learner, unit)
                for unit in module.units.all().order_by("sequence_order")
            ],
        }
        return payload

    def _unit_payload(self, learner: Learner, unit: Unit) -> dict:
        gate = self._gate_payload(learner, unit)
        payload = {
            "id": str(unit.id),
            "title": unit.title,
            "learning_objectives": unit.learning_objectives,
            "gate": gate,
            "access": self._access_payload(gate),
            "lessons": [
                self._lesson_payload(learner, lesson)
                for lesson in unit.lessons.all().order_by("sequence_order")
            ],
        }
        return payload

    def _lesson_payload(self, learner: Learner, lesson: Lesson) -> dict:
        gate = self._gate_payload(learner, lesson)
        payload = {
            "id": str(lesson.id),
            "title": lesson.title,
            "duration_minutes": lesson.duration_minutes,
            "learner_objectives": lesson.learner_objectives,
            "gate": gate,
            "access": self._access_payload(gate),
            "tasks": [
                self._task_payload(learner, task)
                for task in lesson.tasks.all().order_by("sequence_order")
            ],
        }
        if gate["is_open"]:
            payload["learner_content"] = lesson.learner_content
        return payload

    def _task_payload(self, learner: Learner, task: LearningTask) -> dict:
        gate = self._gate_payload(learner, task)
        payload = {
            "id": str(task.id),
            "title": task.title,
            "type": task.type,
            "evidence_required": task.evidence_required,
            "artifact_type": task.artifact_type,
            "gate": gate,
            "access": self._access_payload(gate, can_submit=task.evidence_required),
        }
        if gate["is_open"]:
            payload["learner_instructions"] = task.learner_instructions
        return payload
