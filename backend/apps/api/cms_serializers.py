"""
CMS serializers for the Curriculum Designer portal (PRD §8).

Covers all 7 content object types in the learning hierarchy.
Each writable serializer enforces:
  - structural limits (PRD §12) via structural_limits.enforce()
  - status transition rules (Module: Draft→Active requires peer review)
"""

from __future__ import annotations

from rest_framework import serializers

from apps.core.models import (
    LearningTask,
    Lesson,
    Module,
    Pathway,
    Program,
    Track,
    Unit,
)
from apps.core.services import structural_limits


class PathwayCMSSerializer(serializers.ModelSerializer):
    track_count = serializers.IntegerField(source="tracks.count", read_only=True)

    class Meta:
        model = Pathway
        fields = [
            "id", "name", "description", "icon", "color",
            "age_band_min", "age_band_target", "status",
            "track_count", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class TrackCMSSerializer(serializers.ModelSerializer):
    pathway_name = serializers.CharField(source="pathway.name", read_only=True)
    program_count = serializers.IntegerField(source="programs.count", read_only=True)

    class Meta:
        model = Track
        fields = [
            "id", "pathway", "pathway_name", "title", "description",
            "sequence_order", "status", "program_count", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "pathway_name", "created_at", "updated_at"]

    def validate(self, attrs: dict) -> dict:
        pathway = attrs.get("pathway") or (self.instance.pathway if self.instance else None)
        if pathway and not self.instance:
            structural_limits.enforce(pathway, "track")
        return attrs


class ProgramCMSSerializer(serializers.ModelSerializer):
    track_title = serializers.CharField(source="track.title", read_only=True)
    module_count = serializers.IntegerField(source="modules.count", read_only=True)

    class Meta:
        model = Program
        fields = [
            "id", "track", "track_title", "title", "level", "description",
            "sequence_order", "status", "module_count", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "track_title", "created_at", "updated_at"]

    def validate(self, attrs: dict) -> dict:
        track = attrs.get("track") or (self.instance.track if self.instance else None)
        if track and not self.instance:
            structural_limits.enforce(track, "program")
        return attrs


class ModuleCMSSerializer(serializers.ModelSerializer):
    program_title = serializers.CharField(source="program.title", read_only=True)
    unit_count = serializers.IntegerField(source="units.count", read_only=True)
    reviewed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Module
        fields = [
            "id", "program", "program_title", "name", "outcome_statement",
            "sequence_order", "duration_sessions", "teacher_notes",
            "unlock_gate", "status",
            "needs_review", "reviewed_by", "reviewed_by_name", "reviewed_at",
            "unit_count", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "program_title", "needs_review", "reviewed_by",
            "reviewed_by_name", "reviewed_at", "created_at", "updated_at",
        ]

    def get_reviewed_by_name(self, obj: Module) -> str | None:
        if obj.reviewed_by_id:
            return obj.reviewed_by.get_full_name() or obj.reviewed_by.username
        return None

    def validate(self, attrs: dict) -> dict:
        program = attrs.get("program") or (self.instance.program if self.instance else None)
        if program and not self.instance:
            structural_limits.enforce(program, "module")

        new_status = attrs.get("status")
        if new_status == Module.STATUS_ACTIVE and self.instance:
            if not self.instance.reviewed_by_id:
                raise serializers.ValidationError(
                    {"status": "Module must pass peer review before it can be published."}
                )
        return attrs


class UnitCMSSerializer(serializers.ModelSerializer):
    module_name = serializers.CharField(source="module.name", read_only=True)
    lesson_count = serializers.IntegerField(source="lessons.count", read_only=True)

    class Meta:
        model = Unit
        fields = [
            "id", "module", "module_name", "title", "learning_objectives",
            "sequence_order", "badge_criteria", "unlock_gate", "status",
            "lesson_count", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "module_name", "created_at", "updated_at"]

    def validate(self, attrs: dict) -> dict:
        module = attrs.get("module") or (self.instance.module if self.instance else None)
        if module and not self.instance:
            structural_limits.enforce(module, "unit")
        return attrs


class LessonCMSSerializer(serializers.ModelSerializer):
    unit_title = serializers.CharField(source="unit.title", read_only=True)
    task_count = serializers.IntegerField(source="tasks.count", read_only=True)

    class Meta:
        model = Lesson
        fields = [
            "id", "unit", "unit_title", "title", "duration_minutes",
            "learner_objectives", "learner_content", "teacher_content",
            "resource_links", "unlock_gate", "completion_trigger",
            "sequence_order", "status", "task_count", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "unit_title", "created_at", "updated_at"]

    def validate(self, attrs: dict) -> dict:
        unit = attrs.get("unit") or (self.instance.unit if self.instance else None)
        if unit and not self.instance:
            structural_limits.enforce(unit, "lesson")
        return attrs


class LearningTaskCMSSerializer(serializers.ModelSerializer):
    lesson_title = serializers.CharField(source="lesson.title", read_only=True)

    class Meta:
        model = LearningTask
        fields = [
            "id", "lesson", "lesson_title", "title", "type",
            "learner_instructions", "teacher_rubric", "answer_key",
            "evidence_required", "artifact_type", "completion_trigger",
            "sequence_order", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "lesson_title", "created_at", "updated_at"]

    def validate(self, attrs: dict) -> dict:
        lesson = attrs.get("lesson") or (self.instance.lesson if self.instance else None)
        if lesson and not self.instance:
            structural_limits.enforce(lesson, "task")
        return attrs


class PeerReviewQueueSerializer(serializers.ModelSerializer):
    """Read-only serializer for modules awaiting peer review."""

    program_title = serializers.CharField(source="program.title", read_only=True)
    track_title = serializers.SerializerMethodField()
    pathway_name = serializers.SerializerMethodField()

    class Meta:
        model = Module
        fields = [
            "id", "name", "outcome_statement", "status",
            "program", "program_title", "track_title", "pathway_name",
            "needs_review", "reviewed_by", "reviewed_at", "updated_at",
        ]

    def get_track_title(self, obj: Module) -> str | None:
        return obj.program.track.title if obj.program else None

    def get_pathway_name(self, obj: Module) -> str | None:
        return obj.program.track.pathway.name if obj.program else None
