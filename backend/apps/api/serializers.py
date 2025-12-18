from __future__ import annotations

from rest_framework import serializers

from apps.core.models import (
    Learner,
    Artifact,
    PathwayInputs,
)


class LearnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Learner
        fields = [
            "id",
            "first_name",
            "last_name",
            "consent_media",
            "equity_flag",
            "joined_at",
        ]


class ArtifactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Artifact
        fields = [
            "id",
            "learner",
            "title",
            "reflection",
            "submitted_at",
            "media_refs",
        ]


class PathwayInputsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PathwayInputs
        fields = [
            "id",
            "learner",
            "interest_persistence",
            "skill_readiness",
            "enjoyment",
            "local_demand",
            "breadth",
            "created_at",
        ]
