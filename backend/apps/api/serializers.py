from __future__ import annotations

from apps.core.models import (
    Achievement,
    Activity,
    Artifact,
    Assessment,
    Attendance,
    Badge,
    Career,
    Course,
    CourseLevel,
    Credential,
    Learner,
    LearnerCourseEnrollment,
    LearnerLevelProgress,
    Module,
    PathwayInputs,
    PodClass,
    School,
    Session,
    WeeklyPulse,
)
from apps.core.roles import UserRole
from django.contrib.auth import get_user_model
from rest_framework import serializers

# Import standard response but we might not use it directly inside serializers
# as DRF handles validation errors via exceptions.
# However, let's keep it clean.
# Actually, the exception handler we added earlier will catch ValidationError and format it.
# So we just need to ensure we raise serializers.ValidationError.
from .utils.validators import validate_password_strength

User = get_user_model()


# User and Tenant Serializers for Admin
class TenantSerializer(serializers.ModelSerializer):
    """Serializer for School model.

    Kept as `TenantSerializer` for backward compatibility with existing imports.
    """

    class Meta:
        model = School
        fields = ["id", "name", "code"]
        read_only_fields = ["id"]


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model."""

    tenant = TenantSerializer(read_only=True)
    school = TenantSerializer(source="tenant", read_only=True)
    schools = TenantSerializer(source="teacher_schools", many=True, read_only=True)
    tenant_id = serializers.PrimaryKeyRelatedField(
        queryset=School.objects.all(),
        source="tenant",
        write_only=True,
        required=False,
        allow_null=True,
    )
    school_id = serializers.PrimaryKeyRelatedField(
        queryset=School.objects.all(),
        source="tenant",
        write_only=True,
        required=False,
        allow_null=True,
    )
    school_ids = serializers.ListField(
        child=serializers.UUIDField(), required=False, write_only=True
    )

    pathways = serializers.PrimaryKeyRelatedField(
        source="courses_taught", many=True, read_only=True
    )
    pathway_ids = serializers.ListField(
        child=serializers.UUIDField(), required=False, write_only=True
    )
    current_class = serializers.CharField(
        required=False, allow_blank=True, max_length=100
    )

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "current_class",
            "pathways",
            "pathway_ids",
            "is_active",
            "tenant",
            "tenant_id",
            "school",
            "school_id",
            "schools",
            "school_ids",
            "date_joined",
            "last_login",
            "password",
        ]
        read_only_fields = ["id", "date_joined", "last_login"]
        extra_kwargs = {"password": {"write_only": True}}

    def validate_school_ids(self, value):
        if not value:
            return value

        existing_ids = {
            str(sid) for sid in School.objects.filter(id__in=value).values_list("id", flat=True)
        }
        missing_ids = [str(sid) for sid in value if str(sid) not in existing_ids]
        if missing_ids:
            raise serializers.ValidationError(
                f"Invalid school ids: {', '.join(missing_ids)}"
            )
        return value

    def validate(self, attrs):
        role = attrs.get("role", getattr(self.instance, "role", None))
        if role != UserRole.TEACHER:
            return attrs

        tenant = attrs.get("tenant", getattr(self.instance, "tenant", None))
        school_ids = attrs.get("school_ids")

        effective_school_ids = set()
        if school_ids is None and self.instance is not None:
            effective_school_ids.update(self.instance.get_accessible_school_ids())
        elif school_ids is not None:
            effective_school_ids.update(str(sid) for sid in school_ids)

        if tenant is not None:
            effective_school_ids.add(str(tenant.id))

        if not effective_school_ids:
            raise serializers.ValidationError(
                {"school_ids": "Teacher accounts must be assigned to at least one school."}
            )

        return attrs

    def _sync_teacher_schools(self, user, school_ids):
        """Apply teacher school mappings and keep a primary school for compatibility."""
        if user.role != UserRole.TEACHER:
            if school_ids is not None:
                user.teacher_schools.clear()
            return

        if school_ids is None:
            # Keep existing mappings, but make sure primary school is represented.
            if user.tenant_id and not user.teacher_schools.filter(id=user.tenant_id).exists():
                user.teacher_schools.add(user.tenant_id)
            return

        schools = list(School.objects.filter(id__in=school_ids).order_by("name"))
        user.teacher_schools.set(schools)

        if schools:
            if not user.tenant_id or user.tenant_id not in {s.id for s in schools}:
                user.tenant = schools[0]
                user.save(update_fields=["tenant"])
        elif user.tenant_id:
            user.teacher_schools.add(user.tenant_id)

    def create(self, validated_data):
        """Create user with hashed password."""
        from apps.core.models import Learner

        password = validated_data.pop("password", None)
        school_ids = validated_data.pop("school_ids", None)
        pathway_ids = validated_data.pop("pathway_ids", [])
        current_class = validated_data.pop("current_class", "")

        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()

        # Assign pathways if applicable
        if pathway_ids and user.role == UserRole.TEACHER:
            user.courses_taught.set(pathway_ids)

        self._sync_teacher_schools(user, school_ids)

        # Create Learner profile if role is learner
        if user.role == UserRole.LEARNER:
            Learner.objects.create(
                user=user,
                tenant=user.tenant,
                first_name=user.first_name,
                last_name=user.last_name,
                current_class=current_class,
            )

        return user

    def update(self, instance, validated_data):
        """Update user, handling password separately."""
        from apps.core.models import Learner

        password = validated_data.pop("password", None)
        school_ids = validated_data.pop("school_ids", None)
        pathway_ids = validated_data.pop("pathway_ids", None)
        current_class = validated_data.pop("current_class", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()

        # Update pathways if provided
        if pathway_ids is not None and instance.role == UserRole.TEACHER:
            instance.courses_taught.set(pathway_ids)

        self._sync_teacher_schools(instance, school_ids)

        # Update Learner profile if applicable
        if instance.role == UserRole.LEARNER and current_class is not None:
            learner, created = Learner.objects.get_or_create(
                user=instance,
                defaults={
                    "tenant": instance.tenant,
                    "first_name": instance.first_name,
                    "last_name": instance.last_name,
                },
            )
            learner.current_class = current_class
            learner.save()

        return instance


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


class SchoolLearnerSerializer(serializers.ModelSerializer):
    """Extended learner serializer for school dashboard — includes username and enrolled pathways."""

    full_name = serializers.ReadOnlyField()
    age = serializers.ReadOnlyField()
    username = serializers.SerializerMethodField()
    pathways = serializers.SerializerMethodField()
    parent_name = serializers.CharField(source="parent.get_full_name", read_only=True)

    class Meta:
        model = Learner
        fields = [
            "id",
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
            "username",
            "pathways",
        ]
        read_only_fields = ["id"]

    def get_username(self, obj):
        if obj.user:
            return obj.user.username
        return None

    def get_pathways(self, obj):
        enrollments = obj.course_enrollments.filter(is_active=True).select_related(
            "course"
        )
        return [
            {"id": str(e.course.id), "name": e.course.name}
            for e in enrollments
            if e.course
        ]


class ChildCreateSerializer(serializers.ModelSerializer):
    """Serializer for parents to create/add children with login credentials."""

    username = serializers.CharField(write_only=True, required=True)
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, required=True)
    pathway_ids = serializers.ListField(
        child=serializers.UUIDField(), required=False, write_only=True, allow_empty=True
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
            "username",
            "password",
            "password_confirm",
            "pathway_ids",
        ]

    def validate(self, attrs):
        # Check if passwords match
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password": "Passwords do not match."})

        validate_password_strength(attrs["password"])

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

        # Validate max 2 pathways
        pathways = attrs.get("pathway_ids", [])
        if len(pathways) > 2:
            raise serializers.ValidationError(
                {"pathway_ids": "You can select a maximum of 2 pathways."}
            )

        return attrs

    def create(self, validated_data):
        from apps.core.models import Course, LearnerCourseEnrollment
        from apps.users.models import User

        # Extract user-related fields
        username = validated_data.pop("username")
        password = validated_data.pop("password")
        validated_data.pop("password_confirm")  # Remove confirm password
        pathway_ids = validated_data.pop("pathway_ids", [])

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

        # Enroll in selected pathways
        for course_id in pathway_ids:
            try:
                course = Course.objects.get(id=course_id, tenant=tenant)
                # Find the first level
                first_level = course.levels.order_by("level_number").first()
                LearnerCourseEnrollment.objects.create(
                    learner=learner,
                    course=course,
                    current_level=first_level,
                    is_active=True,
                )
            except Course.DoesNotExist:
                # Skip if course doesn't exist or doesn't belong to tenant
                continue

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
    learners = serializers.SerializerMethodField()

    def get_learners(self, obj):
        course = obj.module.course
        if course:
            from apps.core.models import Learner

            learners = Learner.objects.filter(
                course_enrollments__course=course, course_enrollments__is_active=True
            ).distinct()
            return LearnerSerializer(learners, many=True).data
        return LearnerSerializer(obj.learners.all(), many=True).data

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


# =============================================================================
# TEACHER-SPECIFIC SERIALIZERS
# =============================================================================


class BadgeSerializer(serializers.ModelSerializer):
    """Serializer for Badge model - used by teachers to award badges."""

    from apps.core.models import Badge

    learner_name = serializers.CharField(source="learner.full_name", read_only=True)
    awarded_by_name = serializers.CharField(
        source="awarded_by.get_full_name", read_only=True
    )
    module_name = serializers.CharField(
        source="module.name", read_only=True, allow_null=True
    )

    class Meta:
        model = Badge
        fields = [
            "id",
            "learner",
            "learner_name",
            "module",
            "module_name",
            "badge_name",
            "description",
            "awarded_by",
            "awarded_by_name",
            "awarded_at",
        ]
        read_only_fields = ["id", "awarded_by", "awarded_at"]

    def create(self, validated_data):
        # Set awarded_by from request user
        request = self.context.get("request")
        if request and hasattr(request, "user"):
            validated_data["awarded_by"] = request.user
            # Scope badge to selected school context.
            validated_data["tenant"] = getattr(request, "school", None) or request.user.tenant
        return super().create(validated_data)


class CredentialSerializer(serializers.ModelSerializer):
    """Serializer for Credential (microcredential) model."""

    from apps.core.models import Credential

    learner_name = serializers.CharField(source="learner.full_name", read_only=True)

    class Meta:
        model = Credential
        fields = [
            "id",
            "learner",
            "learner_name",
            "name",
            "issuer",
            "issued_at",
        ]
        read_only_fields = ["id"]


class StudentEnrollmentSerializer(serializers.ModelSerializer):
    """Serializer for enrolling students in courses."""

    learner_name = serializers.CharField(source="learner.full_name", read_only=True)
    course_name = serializers.CharField(source="course.name", read_only=True)
    current_level_name = serializers.CharField(
        source="current_level.name", read_only=True, allow_null=True
    )

    class Meta:
        model = LearnerCourseEnrollment
        fields = [
            "id",
            "learner",
            "learner_name",
            "course",
            "course_name",
            "current_level",
            "current_level_name",
            "enrolled_at",
            "is_active",
        ]
        read_only_fields = ["id", "enrolled_at"]


class TeacherStudentSerializer(serializers.ModelSerializer):
    """Detailed student serializer for teachers - includes progress, badges, etc."""

    user_email = serializers.EmailField(source="user.email", read_only=True)
    badges_count = serializers.SerializerMethodField()
    credentials_count = serializers.SerializerMethodField()
    attendance_rate = serializers.SerializerMethodField()

    class Meta:
        model = Learner
        fields = [
            "id",
            "first_name",
            "last_name",
            "full_name",
            "user_email",
            "current_school",
            "current_class",
            "badges_count",
            "credentials_count",
            "attendance_rate",
        ]
        read_only_fields = ["id", "full_name"]

    def get_badges_count(self, obj):
        """Get count of badges earned by this learner."""
        return obj.badges.count()

    def get_credentials_count(self, obj):
        """Get count of credentials earned by this learner."""
        return obj.credentials.count()

    def get_attendance_rate(self, obj):
        """Calculate attendance rate for this learner."""
        from apps.core.models import Attendance

        total_sessions = Attendance.objects.filter(learner=obj).count()
        if total_sessions == 0:
            return 100  # No sessions yet, default to 100%

        present_sessions = Attendance.objects.filter(
            learner=obj, status__in=["present", "late"]
        ).count()

        return round((present_sessions / total_sessions) * 100, 1)


class PodClassSerializer(serializers.ModelSerializer):
    """Serializer for Pod/Class details."""

    class Meta:
        model = PodClass
        fields = ["id", "name"]


class CareerSerializer(serializers.ModelSerializer):
    """Serializer for Career info."""

    class Meta:
        model = Career
        fields = ["id", "title", "description"]


class PathwaySerializer(serializers.ModelSerializer):
    """List serializer for Pathways (Courses)."""

    careers = CareerSerializer(many=True, read_only=True)
    levels = CourseLevelSerializer(many=True, read_only=True)
    level_count = serializers.IntegerField(source="levels.count", read_only=True)

    class Meta:
        model = Course
        fields = ["id", "name", "description", "careers", "level_count", "levels"]


class SchoolStudentCreateSerializer(serializers.ModelSerializer):
    """Serializer for School Admins to create students."""

    username = serializers.CharField(write_only=True, required=True)
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    email = serializers.EmailField(write_only=True, required=False, allow_blank=True)
    pod_class_id = serializers.UUIDField(
        write_only=True, required=False, allow_null=True
    )
    pathway_ids = serializers.ListField(
        child=serializers.UUIDField(), required=False, write_only=True, allow_empty=True
    )
    current_class = serializers.CharField(required=False, allow_blank=True)

    # Optional date of birth handling to avoid strict format or handle partial?
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    school_id = serializers.UUIDField(required=False, write_only=True)

    class Meta:
        model = Learner
        fields = [
            "first_name",
            "last_name",
            "date_of_birth",
            "current_class",
            "username",
            "password",
            "email",
            "pod_class_id",
            "pathway_ids",
            "consent_media",
            "equity_flag",
            "school_id",
        ]

    def validate_username(self, value):
        from apps.users.models import User

        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def validate(self, attrs):
        """Enforce password strength and school scoping rules."""
        password = attrs.get("password", "")
        validate_password_strength(password)

        request = self.context.get("request")
        if not request:
            return attrs

        from apps.core.scope import get_user_allowed_school_ids

        actor = request.user
        school_id = attrs.get("school_id") or request.data.get("school_id")
        allowed_school_ids = get_user_allowed_school_ids(actor)
        context_school = getattr(request, "school", None)

        # Only platform admins can create learners for arbitrary schools.
        if actor.role != "admin" and not actor.is_superuser:
            if actor.role == "teacher" and not context_school:
                raise serializers.ValidationError(
                    {"school_id": "Select a school context before adding students."}
                )

            if school_id and str(school_id) not in allowed_school_ids:
                raise serializers.ValidationError(
                    {"school_id": "You can only create students in your assigned schools."}
                )
            if (
                actor.role == "teacher"
                and school_id
                and context_school
                and str(school_id) != str(context_school.id)
            ):
                raise serializers.ValidationError(
                    {
                        "school_id": (
                            "Selected school does not match your active school context. "
                            "Switch school first."
                        )
                    }
                )
            if not school_id and not context_school and not allowed_school_ids:
                raise serializers.ValidationError(
                    {"school_id": "Select a school before creating a student."}
                )

        return attrs

    def create(self, validated_data):
        from datetime import date

        from apps.core.models import Course, LearnerCourseEnrollment, PodClass, School
        from apps.core.scope import get_user_allowed_school_ids
        from apps.users.models import User
        from django.db.models import Q

        request = self.context["request"]
        school_admin = request.user
        request_school = getattr(request, "school", None)
        allowed_school_ids = get_user_allowed_school_ids(school_admin)
        # Robustly get school_id - handle case where field might be stripped
        school_id = validated_data.pop("school_id", None)
        if not school_id and "school_id" in request.data:
            school_id = request.data.get("school_id")

        if school_admin.role == "teacher" and request_school:
            tenant = request_school
        elif school_id:
            try:
                # Handle potential UUID string or object
                sid = str(school_id)
                if (
                    school_admin.role != "admin"
                    and not school_admin.is_superuser
                    and sid not in allowed_school_ids
                ):
                    raise serializers.ValidationError(
                        {
                            "school_id": "You can only create students in your assigned schools."
                        }
                    )
                tenant = School.objects.get(id=sid)
            except (School.DoesNotExist, ValueError):
                raise serializers.ValidationError({"school_id": "Invalid school ID"})
        else:
            tenant = request_school or school_admin.tenant

        # Validate that the user has a school/tenant assigned or selected one
        if not tenant:
            raise serializers.ValidationError(
                {
                    "error": "You must select a school or be assigned to one before you can add students."
                }
            )

        username = validated_data.pop("username")
        password = validated_data.pop("password")
        email = validated_data.pop("email", "")

        pathway_ids = validated_data.pop("pathway_ids", [])
        pod_class_id = validated_data.pop("pod_class_id", None)

        # Handle class assignment:
        # If pod_class_id is provided, look up the PodClass name
        # Otherwise, keep whatever current_class string was sent (e.g. "P.1")
        if pod_class_id:
            try:
                pod = PodClass.objects.get(id=pod_class_id, tenant=tenant)
                validated_data["current_class"] = pod.name
            except PodClass.DoesNotExist:
                raise serializers.ValidationError(
                    {"pod_class_id": "Invalid class for the selected school."}
                )

        # Auto-set school info
        if tenant:
            validated_data["current_school"] = tenant.name

        # Auto-set joined_at to today if not provided
        if not validated_data.get("joined_at"):
            validated_data["joined_at"] = date.today()

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            role="learner",
            tenant=tenant,
            is_active=True,
        )

        # Ensure no conflict in validated_data
        validated_data.pop("tenant", None)
        learner = Learner.objects.create(tenant=tenant, user=user, **validated_data)

        # Enroll in pathways
        for pid in pathway_ids:
            try:
                if school_admin.role == "teacher":
                    course = Course.objects.filter(id=pid).first()
                else:
                    # Find course (Global, Student's Tenant, or Admin Tenant)
                    q_filter = Q(tenant=None)
                    if tenant:
                        q_filter |= Q(tenant=tenant)
                    if school_admin.role == "admin" and school_admin.tenant:
                        q_filter |= Q(tenant=school_admin.tenant)
                    course = Course.objects.filter(q_filter, id=pid).first()

                if course:
                    first_level = course.levels.order_by("level_number").first()
                    LearnerCourseEnrollment.objects.create(
                        learner=learner,
                        course=course,
                        current_level=first_level,
                        is_active=True,
                    )
            except Course.DoesNotExist:
                continue

        return learner
