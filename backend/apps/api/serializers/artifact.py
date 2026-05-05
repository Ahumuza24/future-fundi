from __future__ import annotations

from apps.core.models import Artifact
from rest_framework import serializers


class ArtifactSerializer(serializers.ModelSerializer):
    """Serializer for learner artifacts."""

    learner_name = serializers.CharField(source="learner.full_name", read_only=True)
    module_name = serializers.CharField(source="module.name", read_only=True)

    class Meta:
        model = Artifact
        fields = [
            "id",
            "learner",
            "learner_name",
            "title",
            "reflection",
            "submitted_at",
            "media_refs",
            "module_name",
            "status",
            "uploaded_by_student",
            "rejection_reason",
        ]
        read_only_fields = [
            "id", "submitted_at", "status", "uploaded_by_student", "rejection_reason"
        ]


class QuickArtifactSerializer(serializers.ModelSerializer):
    """Quick artifact capture serializer for teachers."""

    learner_name = serializers.CharField(source="learner.full_name", read_only=True)
    reviewed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Artifact
        fields = [
            "id",
            "learner",
            "learner_name",
            "title",
            "reflection",
            "media_refs",
            "submitted_at",
            "status",
            "uploaded_by_student",
            "reviewed_by",
            "reviewed_by_name",
            "reviewed_at",
            "rejection_reason",
        ]
        read_only_fields = [
            "id", "learner", "created_by", "module", "submitted_at",
            "reviewed_by", "reviewed_at", "status", "uploaded_by_student",
        ]

    def get_reviewed_by_name(self, obj: Artifact) -> str | None:
        if obj.reviewed_by:
            return obj.reviewed_by.get_full_name() or obj.reviewed_by.username
        return None


class StudentArtifactUploadSerializer(serializers.ModelSerializer):
    """Serializer for student-submitted artifacts.

    Artifacts start with status='pending' and must be approved by a teacher
    before counting in progress metrics.
    """

    module_id = serializers.UUIDField(required=False, allow_null=True, write_only=True)
    task_id = serializers.UUIDField(required=False, allow_null=True, write_only=True)

    class Meta:
        model = Artifact
        fields = [
            "id",
            "title",
            "reflection",
            "media_refs",
            "submitted_at",
            "status",
            "rejection_reason",
            "module_id",
            "task_id",
        ]
        read_only_fields = ["id", "submitted_at", "status", "rejection_reason", "media_refs"]

    def validate_module_id(self, value):
        if value is None:
            return None
        from apps.core.models import Module
        try:
            return Module.objects.get(id=value)
        except Module.DoesNotExist:
            raise serializers.ValidationError("Selected microcredential not found.")

    def validate_task_id(self, value):
        if value is None:
            return None
        from apps.core.models import LearningTask
        try:
            return LearningTask.objects.select_related("lesson__unit__module").get(id=value)
        except LearningTask.DoesNotExist:
            raise serializers.ValidationError("Selected learning task not found.")

    def create(self, validated_data: dict) -> Artifact:
        module = validated_data.pop("module_id", None)
        task = validated_data.pop("task_id", None)
        if task and module is None:
            module = task.lesson.unit.module
        artifact = super().create(validated_data)
        if module:
            artifact.module = module
            artifact.save(update_fields=["module"])
        return artifact


class ArtifactReviewSerializer(serializers.Serializer):
    """Serializer for teacher approval/rejection of student artifacts."""

    ACTION_APPROVE = "approve"
    ACTION_REJECT = "reject"
    ACTION_CHOICES = [(ACTION_APPROVE, "Approve"), (ACTION_REJECT, "Reject")]

    action = serializers.ChoiceField(choices=ACTION_CHOICES)
    rejection_reason = serializers.CharField(
        max_length=1000,
        required=False,
        allow_blank=True,
        help_text="Required when action is 'reject'",
    )

    def validate(self, attrs: dict) -> dict:
        if attrs["action"] == self.ACTION_REJECT and not attrs.get("rejection_reason", "").strip():
            raise serializers.ValidationError(
                {"rejection_reason": "A reason is required when rejecting an artifact."}
            )
        return attrs
