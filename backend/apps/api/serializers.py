from __future__ import annotations

from apps.core.models import (
    Achievement,
    Activity,
    Artifact,
    Assessment,
    Attendance,
    Career,
    Course,
    CourseLevel,
    Learner,
    LearnerCourseEnrollment,
    LearnerLevelProgress,
    Module,
    PathwayInputs,
    Session,
    WeeklyPulse,
)
from rest_framework import serializers


class LearnerSerializer(serializers.ModelSerializer):
    """Basic learner/child serializer."""

    full_name = serializers.ReadOnlyField()
    age = serializers.ReadOnlyField()
    parent_name = serializers.CharField(source="parent.get_full_name", read_only=True)

    class Meta:
        model = Learner
        fields = [
            "id",
            "parent",
            "first_name",
            "last_name",
            "full_name",
            "date_of_birth",
            "age",
            "current_school",
            "current_class",
            "consent_media",
            "equity_flag",
            "joined_at",
            "parent_name",
        ]
        read_only_fields = ["id", "parent"]


class ChildCreateSerializer(serializers.ModelSerializer):
    """Serializer for parents to create/add children with login credentials."""

    username = serializers.CharField(write_only=True, required=True)
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = Learner
        fields = [
            "first_name",
            "last_name",
            "date_of_birth",
            "current_school",
            "current_class",
            "consent_media",
            "equity_flag",
            "joined_at",
            "username",
            "password",
            "password_confirm",
        ]

    def validate(self, attrs):
        # Check if passwords match
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password": "Passwords do not match."})

        # Check if username already exists
        from apps.users.models import User

        if User.objects.filter(username=attrs["username"]).exists():
            raise serializers.ValidationError(
                {"username": "This username is already taken."}
            )

        # Age Validation
        dob = attrs.get("date_of_birth")
        if dob:
            from datetime import date

            today = date.today()
            age = (
                today.year
                - dob.year
                - ((today.month, today.day) < (dob.month, dob.day))
            )
            if age < 6 or age > 18:
                raise serializers.ValidationError(
                    {"date_of_birth": "Child must be between 6 and 18 years old."}
                )

        return attrs

    def create(self, validated_data):
        from apps.users.models import User

        # Extract user-related fields
        username = validated_data.pop("username")
        password = validated_data.pop("password")
        validated_data.pop("password_confirm")  # Remove confirm password

        # Parent and tenant are set from the request context
        parent = self.context["request"].user
        tenant = parent.tenant

        # Create user account for the child
        user = User.objects.create_user(
            username=username,
            password=password,
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            role="learner",
            tenant=tenant,
            is_active=True,
        )

        # Create learner profile linked to the user
        learner = Learner.objects.create(
            parent=parent, tenant=tenant, user=user, **validated_data  # Can be None
        )

        return learner


class ChildUpdateSerializer(serializers.ModelSerializer):
    """Serializer for parents to update their children's details."""

    new_password = serializers.CharField(
        write_only=True, required=False, min_length=8, allow_blank=True
    )
    new_password_confirm = serializers.CharField(
        write_only=True, required=False, allow_blank=True
    )

    class Meta:
        model = Learner
        fields = [
            "first_name",
            "last_name",
            "date_of_birth",
            "current_school",
            "current_class",
            "consent_media",
            "equity_flag",
            "joined_at",
            "new_password",
            "new_password_confirm",
        ]

    def validate(self, attrs):
        # If password change is requested, validate it
        new_password = attrs.get("new_password", "")
        new_password_confirm = attrs.get("new_password_confirm", "")

        if new_password or new_password_confirm:
            if new_password != new_password_confirm:
                raise serializers.ValidationError(
                    {"new_password": "Passwords do not match."}
                )

        # Age Validation
        dob = attrs.get("date_of_birth")
        # Also check existing instance DOB if not provided in attrs but updated via other fields (though less critical here, if they are changing DOB they send it)
        # But for partial update, attrs might not have date_of_birth.
        # If date_of_birth is passed, validate it.
        if dob:
            from datetime import date

            today = date.today()
            age = (
                today.year
                - dob.year
                - ((today.month, today.day) < (dob.month, dob.day))
            )
            if age < 6 or age > 18:
                raise serializers.ValidationError(
                    {"date_of_birth": "Child must be between 6 and 18 years old."}
                )

        return attrs

    def update(self, instance, validated_data):
        # Extract password fields
        new_password = validated_data.pop("new_password", None)
        validated_data.pop("new_password_confirm", None)

        # Update learner fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update user's first_name and last_name if changed
        if instance.user:
            instance.user.first_name = instance.first_name
            instance.user.last_name = instance.last_name

            # Change password if provided
            if new_password:
                instance.user.set_password(new_password)

            instance.user.save()

        return instance


class ArtifactSerializer(serializers.ModelSerializer):
    """Serializer for learner artifacts."""

    learner_name = serializers.CharField(source="learner.full_name", read_only=True)

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
        ]
        read_only_fields = ["id", "submitted_at"]


class PathwayInputsSerializer(serializers.ModelSerializer):
    """Serializer for pathway scoring inputs."""

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
        read_only_fields = ["id", "created_at"]


class WeeklyPulseSerializer(serializers.ModelSerializer):
    """Serializer for weekly mood check-ins."""

    class Meta:
        model = WeeklyPulse
        fields = [
            "id",
            "learner",
            "mood",
            "win",
            "worry",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class AssessmentSerializer(serializers.ModelSerializer):
    """Serializer for learner assessments."""

    module_name = serializers.CharField(source="module.name", read_only=True)

    class Meta:
        model = Assessment
        fields = [
            "id",
            "learner",
            "module",
            "module_name",
            "score",
            "notes",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class ChildDetailSerializer(serializers.ModelSerializer):
    """Detailed child serializer with all related data for parent dashboard."""

    full_name = serializers.ReadOnlyField()
    age = serializers.ReadOnlyField()
    recent_artifacts = ArtifactSerializer(source="artifacts", many=True, read_only=True)
    latest_pathway = PathwayInputsSerializer(
        source="pathway_inputs.first", read_only=True
    )
    latest_pulse = WeeklyPulseSerializer(source="weekly_pulses.first", read_only=True)
    recent_assessments = AssessmentSerializer(
        source="assessments", many=True, read_only=True
    )
    artifacts_count = serializers.IntegerField(source="artifacts.count", read_only=True)

    class Meta:
        model = Learner
        fields = [
            "id",
            "first_name",
            "last_name",
            "full_name",
            "date_of_birth",
            "age",
            "consent_media",
            "equity_flag",
            "joined_at",
            "recent_artifacts",
            "artifacts_count",
            "latest_pathway",
            "latest_pulse",
            "recent_assessments",
        ]
        read_only_fields = ["id"]


# Teacher-specific serializers


class AttendanceSerializer(serializers.ModelSerializer):
    """Serializer for attendance records."""

    learner_name = serializers.CharField(source="learner.full_name", read_only=True)
    learner_id = serializers.UUIDField(source="learner.id", read_only=True)

    class Meta:
        model = Attendance
        fields = [
            "id",
            "learner",
            "learner_id",
            "learner_name",
            "status",
            "notes",
            "marked_at",
        ]
        read_only_fields = ["id", "marked_at"]


class SessionSerializer(serializers.ModelSerializer):
    """Basic session serializer for list views."""

    module_name = serializers.CharField(source="module.name", read_only=True)
    teacher_name = serializers.CharField(source="teacher.get_full_name", read_only=True)
    learner_count = serializers.SerializerMethodField()
    attendance_count = serializers.SerializerMethodField()

    class Meta:
        model = Session
        fields = [
            "id",
            "teacher",
            "teacher_name",
            "module",
            "module_name",
            "date",
            "start_time",
            "end_time",
            "status",
            "attendance_marked",
            "learner_count",
            "attendance_count",
            "notes",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def get_learner_count(self, obj):
        return obj.learners.count()

    def get_attendance_count(self, obj):
        return obj.attendance_records.filter(status="present").count()


class SessionDetailSerializer(serializers.ModelSerializer):
    """Detailed session serializer with attendance records."""

    module_name = serializers.CharField(source="module.name", read_only=True)
    teacher_name = serializers.CharField(source="teacher.get_full_name", read_only=True)
    attendance_records = AttendanceSerializer(many=True, read_only=True)
    learners = LearnerSerializer(many=True, read_only=True)

    class Meta:
        model = Session
        fields = [
            "id",
            "teacher",
            "teacher_name",
            "module",
            "module_name",
            "date",
            "start_time",
            "end_time",
            "status",
            "attendance_marked",
            "learners",
            "attendance_records",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class QuickArtifactSerializer(serializers.ModelSerializer):
    """Quick artifact capture serializer for teachers."""

    learner_name = serializers.CharField(source="learner.full_name", read_only=True)

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
        ]
        read_only_fields = ["id", "submitted_at"]


# =============================================================================
# COURSE SERIALIZERS
# =============================================================================

# =============================================================================
# COURSE SERIALIZERS
# =============================================================================


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

    def get_completion_requirements(self, obj):
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
        fields = [
            "id",
            "name",
            "description",
            "level_count",
            "is_active",
            "modules",
            "careers",
        ]


class LearnerLevelProgressSerializer(serializers.ModelSerializer):
    """Serializer for level progress."""

    level_name = serializers.CharField(source="level.name", read_only=True)
    level_number = serializers.IntegerField(source="level.level_number", read_only=True)
    completion_percentage = serializers.ReadOnlyField()
    requirements = serializers.SerializerMethodField()

    class Meta:
        model = LearnerLevelProgress
        fields = [
            "id",
            "level",
            "level_name",
            "level_number",
            "modules_completed",
            "artifacts_submitted",
            "assessment_score",
            "teacher_confirmed",
            "completed",
            "completed_at",
            "completion_percentage",
            "requirements",
            "started_at",
            "updated_at",
        ]
        read_only_fields = ["id", "started_at", "updated_at", "completed_at"]

    def get_requirements(self, obj):
        if not obj.level:
            return None
        return {
            "modules": {
                "required": obj.level.required_modules_count,
                "completed": obj.modules_completed,
                "met": obj.modules_completed >= obj.level.required_modules_count,
            },
            "artifacts": {
                "required": obj.level.required_artifacts_count,
                "submitted": obj.artifacts_submitted,
                "met": obj.artifacts_submitted >= obj.level.required_artifacts_count,
            },
            "assessment": {
                "required": obj.level.required_assessment_score,
                "score": obj.assessment_score,
                "met": obj.assessment_score >= obj.level.required_assessment_score,
            },
        }


class LearnerCourseEnrollmentSerializer(serializers.ModelSerializer):
    """Serializer for course enrollments."""

    course_name = serializers.CharField(source="course.name", read_only=True)
    current_level_number = serializers.IntegerField(
        source="current_level.level_number", read_only=True
    )
    current_level_name = serializers.CharField(
        source="current_level.name", read_only=True
    )
    total_levels = serializers.IntegerField(
        source="course.levels.count", read_only=True
    )
    current_progress = serializers.SerializerMethodField()
    completed_levels_count = serializers.SerializerMethodField()

    class Meta:
        model = LearnerCourseEnrollment
        fields = [
            "id",
            "course",
            "course_name",
            "current_level",
            "current_level_number",
            "current_level_name",
            "total_levels",
            "current_progress",
            "completed_levels_count",
            "enrolled_at",
            "completed_at",
            "is_active",
        ]
        read_only_fields = ["id", "enrolled_at", "completed_at"]

    def get_current_progress(self, obj):
        if not obj.current_level:
            return None
        try:
            progress = obj.level_progress.get(level=obj.current_level)
            return LearnerLevelProgressSerializer(progress).data
        except LearnerLevelProgress.DoesNotExist:
            return None

    def get_completed_levels_count(self, obj):
        return obj.level_progress.filter(completed=True).count()


class LearnerCourseEnrollmentDetailSerializer(LearnerCourseEnrollmentSerializer):
    """Detailed enrollment serializer with all level progress."""

    course = CourseSerializer(read_only=True)
    all_progress = serializers.SerializerMethodField()

    class Meta(LearnerCourseEnrollmentSerializer.Meta):
        fields = LearnerCourseEnrollmentSerializer.Meta.fields + ["all_progress"]

    def get_all_progress(self, obj):
        progress_records = obj.level_progress.all().order_by("level__level_number")
        return LearnerLevelProgressSerializer(progress_records, many=True).data


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

    def create(self, validated_data):
        levels_data = validated_data.pop("levels", [])
        course = Course.objects.create(**validated_data)

        for i, level_data in enumerate(levels_data, start=1):
            level_data["level_number"] = i
            CourseLevel.objects.create(course=course, **level_data)

        return course

    def update(self, instance, validated_data):
        levels_data = validated_data.pop("levels", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # If levels provided, update them
        if levels_data is not None:
            # Simple approach: delete and recreate
            instance.levels.all().delete()
            for i, level_data in enumerate(levels_data, start=1):
                level_data["level_number"] = i
                CourseLevel.objects.create(course=instance, **level_data)

        return instance


class ActivitySerializer(serializers.ModelSerializer):
    """Serializer for Activity CRUD operations."""

    course_name = serializers.CharField(source="course.name", read_only=True)
    created_by_name = serializers.CharField(
        source="created_by.get_full_name", read_only=True
    )

    class Meta:
        model = Activity
        fields = [
            "id",
            "name",
            "description",
            "date",
            "start_time",
            "end_time",
            "location",
            "status",
            "course",
            "course_name",
            "media_files",
            "created_by",
            "created_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_by", "created_at", "updated_at"]

    def create(self, validated_data):
        # Set created_by from request user
        request = self.context.get("request")
        if request and hasattr(request, "user"):
            validated_data["created_by"] = request.user
        return super().create(validated_data)
