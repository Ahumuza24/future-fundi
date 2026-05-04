from __future__ import annotations

from apps.core.models import Achievement, Career, Course, CourseLevel, Module
from rest_framework import serializers


class ModuleSerializer(serializers.ModelSerializer):
    """Serializer for curriculum modules (micro-credentials)."""

    class Meta:
        model = Module
        fields = [
            "id",
            "name",
            "description",
            "content",
            "suggested_activities",
            "materials",
            "competences",
            "media_files",
            "course",
            "badge_name",
        ]
        read_only_fields = ["id"]


class CareerSerializer(serializers.ModelSerializer):
    """Serializer for potential careers."""

    class Meta:
        model = Career
        fields = ["id", "title", "description", "course"]
        read_only_fields = ["id"]


class CourseLevelSerializer(serializers.ModelSerializer):
    """Serializer for course levels."""

    completion_requirements = serializers.SerializerMethodField()

    class Meta:
        model = CourseLevel
        fields = [
            "id",
            "level_number",
            "name",
            "description",
            "learning_outcomes",
            "required_modules_count",
            "required_artifacts_count",
            "required_assessment_score",
            "requires_teacher_confirmation",
            "completion_requirements",
        ]

    def get_completion_requirements(self, obj: CourseLevel) -> dict:
        return {
            "modules": obj.required_modules_count,
            "artifacts": obj.required_artifacts_count,
            "assessment_score": obj.required_assessment_score,
            "teacher_confirmation": obj.requires_teacher_confirmation,
        }


class CourseSerializer(serializers.ModelSerializer):
    """Serializer for courses."""

    levels = CourseLevelSerializer(many=True, read_only=True)
    careers = CareerSerializer(many=True, read_only=True)
    modules = ModuleSerializer(many=True, read_only=True)
    level_count = serializers.IntegerField(source="levels.count", read_only=True)

    class Meta:
        model = Course
        fields = [
            "id",
            "name",
            "description",
            "is_active",
            "level_count",
            "levels",
            "careers",
            "modules",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class CourseListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for course listings."""

    level_count = serializers.IntegerField(source="levels.count", read_only=True)
    modules = ModuleSerializer(many=True, read_only=True)
    careers = CareerSerializer(many=True, read_only=True)

    class Meta:
        model = Course
        fields = ["id", "name", "description", "level_count", "is_active", "modules", "careers"]


class CourseAdminSerializer(serializers.ModelSerializer):
    """Admin serializer for creating/updating courses and levels."""

    levels = CourseLevelSerializer(many=True, required=False)
    modules = ModuleSerializer(many=True, read_only=True)
    careers = CareerSerializer(many=True, read_only=True)

    class Meta:
        model = Course
        fields = [
            "id",
            "name",
            "description",
            "is_active",
            "tenant",
            "levels",
            "modules",
            "careers",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def create(self, validated_data: dict) -> Course:
        levels_data = validated_data.pop("levels", [])
        course = Course.objects.create(**validated_data)
        for i, level_data in enumerate(levels_data, start=1):
            level_data["level_number"] = i
            CourseLevel.objects.create(course=course, **level_data)
        return course

    def update(self, instance: Course, validated_data: dict) -> Course:
        levels_data = validated_data.pop("levels", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if levels_data is not None:
            instance.levels.all().delete()
            for i, level_data in enumerate(levels_data, start=1):
                level_data["level_number"] = i
                CourseLevel.objects.create(course=instance, **level_data)
        return instance


class PathwaySerializer(serializers.ModelSerializer):
    """List serializer for Pathways (Courses)."""

    careers = CareerSerializer(many=True, read_only=True)
    levels = CourseLevelSerializer(many=True, read_only=True)
    level_count = serializers.IntegerField(source="levels.count", read_only=True)

    class Meta:
        model = Course
        fields = ["id", "name", "description", "careers", "level_count", "levels"]


class AchievementSerializer(serializers.ModelSerializer):
    """Serializer for achievements."""

    course_name = serializers.CharField(source="course.name", read_only=True)
    level_name = serializers.CharField(source="level.name", read_only=True)

    class Meta:
        model = Achievement
        fields = [
            "id",
            "name",
            "description",
            "achievement_type",
            "icon",
            "course",
            "course_name",
            "level",
            "level_name",
            "earned_at",
        ]
        read_only_fields = ["id", "earned_at"]
