from __future__ import annotations

from django.conf import settings
from apps.core.models import (
    Artifact,
    Assessment,
    Attendance,
    Badge,
    Learner,
    PathwayInputs,
    WeeklyPulse,
)
from rest_framework import serializers

from ..utils.validators import validate_password_strength
from .artifact import ArtifactSerializer


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
    """Extended learner serializer for school dashboard."""

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

    def get_username(self, obj: Learner) -> str | None:
        return obj.user.username if obj.user else None

    def get_pathways(self, obj: Learner) -> list:
        enrollments = obj.course_enrollments.filter(is_active=True).select_related("course")
        return [
            {"id": str(e.course.id), "name": e.course.name}
            for e in enrollments
            if e.course
        ]


class SchoolStudentDetailSerializer(SchoolLearnerSerializer):
    """Detailed learner profile for school admins with progress, artifacts, and attendance."""

    progress = serializers.SerializerMethodField()
    badges = serializers.SerializerMethodField()
    artifacts = serializers.SerializerMethodField()
    attendance = serializers.SerializerMethodField()

    class Meta(SchoolLearnerSerializer.Meta):
        fields = SchoolLearnerSerializer.Meta.fields + [
            "progress", "badges", "artifacts", "attendance"
        ]

    def _resolve_media_url(self, media_obj: dict) -> str | None:
        request = self.context.get("request") if hasattr(self, "context") else None
        candidate = media_obj.get("url") or media_obj.get("file_url")
        if candidate:
            if str(candidate).startswith(("http://", "https://")):
                return candidate
            media_base = getattr(settings, "MEDIA_URL", "/media/")
            normalized = str(candidate).lstrip("/")
            relative_path = f"{media_base.rstrip('/')}/{normalized}"
            return request.build_absolute_uri(relative_path) if request else relative_path
        path = media_obj.get("path")
        if not path:
            return None
        media_path = (
            path if str(path).startswith("/")
            else f"{getattr(settings, 'MEDIA_URL', '/media/').rstrip('/')}/{str(path).lstrip('/')}"
        )
        return request.build_absolute_uri(media_path) if request else media_path

    def get_progress(self, obj: Learner) -> list:
        enrollments = (
            obj.course_enrollments.filter(is_active=True)
            .select_related("course", "current_level")
            .prefetch_related("course__levels", "level_progress")
        )
        result = []
        for enrollment in enrollments:
            course = enrollment.course
            if not course:
                continue
            levels = list(course.levels.all()) if hasattr(course, "levels") else []
            total_modules = sum((lv.required_modules_count or 0) for lv in levels) or 1
            level_progress = list(enrollment.level_progress.all())
            modules_completed = sum((p.modules_completed or 0) for p in level_progress)
            artifacts_submitted = sum((p.artifacts_submitted or 0) for p in level_progress)
            scores = [p.assessment_score for p in level_progress if p.assessment_score is not None]
            avg_score = round(sum(scores) / len(scores), 1) if scores else 0
            pct = min(100, int((modules_completed / total_modules) * 100))
            status = "completed" if (pct >= 100 or enrollment.completed_at) else (
                "needs_attention" if avg_score and avg_score < 50 else "on_track"
            )
            result.append({
                "enrollment_id": str(enrollment.id),
                "course_id": str(course.id),
                "course_name": course.name,
                "current_level": (
                    f"Level {enrollment.current_level.level_number}: {enrollment.current_level.name}"
                    if enrollment.current_level else "Not Started"
                ),
                "completion_percentage": pct,
                "modules_completed": modules_completed,
                "total_modules": total_modules,
                "artifacts_submitted": artifacts_submitted,
                "assessment_score": avg_score,
                "status": status,
            })
        return result

    def get_badges(self, obj: Learner) -> list:
        badges = Badge.objects.filter(learner=obj).select_related("module", "awarded_by").order_by("-awarded_at")
        return [
            {
                "id": str(b.id),
                "name": b.badge_name,
                "description": b.description or "",
                "module_name": b.module.name if b.module else None,
                "awarded_at": b.awarded_at,
                "awarded_by": b.awarded_by.get_full_name() if b.awarded_by else None,
            }
            for b in badges
        ]

    def get_artifacts(self, obj: Learner) -> list:
        artifacts = Artifact.objects.filter(learner=obj).select_related("module").order_by("-submitted_at")
        return [
            {
                "id": str(a.id),
                "title": a.title,
                "reflection": a.reflection,
                "submitted_at": a.submitted_at,
                "module_name": a.module.name if a.module else None,
                "status": a.status,
                "uploaded_by_student": a.uploaded_by_student,
                "rejection_reason": a.rejection_reason,
                "media": [
                    {
                        "type": m.get("type", "file"),
                        "url": self._resolve_media_url(m),
                        "file_url": self._resolve_media_url(m),
                        "filename": m.get("filename"),
                        "thumbnail_url": self._resolve_media_url({"url": m.get("thumbnail_url")}),
                        "size": m.get("size"),
                    }
                    for m in (a.media_refs or [])
                    if isinstance(m, dict)
                ],
            }
            for a in artifacts
        ]

    def get_attendance(self, obj: Learner) -> list:
        records = (
            Attendance.objects.filter(learner=obj)
            .select_related("session", "session__module")
            .order_by("-marked_at")
        )
        return [
            {
                "id": str(r.id),
                "status": r.status,
                "notes": r.notes,
                "marked_at": r.marked_at,
                "session": {
                    "id": str(r.session.id),
                    "date": r.session.date,
                    "module_name": r.session.module.name if r.session.module else None,
                    "status": r.session.status,
                },
            }
            for r in records
        ]


class PathwayInputsSerializer(serializers.ModelSerializer):
    """Serializer for pathway scoring inputs."""

    class Meta:
        model = PathwayInputs
        fields = [
            "id", "learner", "interest_persistence", "skill_readiness",
            "enjoyment", "local_demand", "breadth", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class WeeklyPulseSerializer(serializers.ModelSerializer):
    """Serializer for weekly mood check-ins."""

    class Meta:
        model = WeeklyPulse
        fields = ["id", "learner", "mood", "win", "worry", "created_at"]
        read_only_fields = ["id", "created_at"]


class AssessmentSerializer(serializers.ModelSerializer):
    """Serializer for learner assessments."""

    module_name = serializers.CharField(source="module.name", read_only=True)

    class Meta:
        model = Assessment
        fields = ["id", "learner", "module", "module_name", "score", "notes", "created_at"]
        read_only_fields = ["id", "created_at"]


class ChildDetailSerializer(serializers.ModelSerializer):
    """Detailed child serializer with all related data for parent dashboard."""

    full_name = serializers.ReadOnlyField()
    age = serializers.ReadOnlyField()
    recent_artifacts = ArtifactSerializer(source="artifacts", many=True, read_only=True)
    latest_pathway = PathwayInputsSerializer(source="pathway_inputs.first", read_only=True)
    latest_pulse = WeeklyPulseSerializer(source="weekly_pulses.first", read_only=True)
    recent_assessments = AssessmentSerializer(source="assessments", many=True, read_only=True)
    artifacts_count = serializers.IntegerField(source="artifacts.count", read_only=True)

    class Meta:
        model = Learner
        fields = [
            "id", "first_name", "last_name", "full_name", "date_of_birth", "age",
            "consent_media", "equity_flag", "joined_at",
            "recent_artifacts", "artifacts_count",
            "latest_pathway", "latest_pulse", "recent_assessments",
        ]
        read_only_fields = ["id"]


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
            "first_name", "last_name", "date_of_birth", "current_school",
            "current_class", "consent_media", "equity_flag", "joined_at",
            "username", "password", "password_confirm", "pathway_ids",
        ]

    def validate(self, attrs: dict) -> dict:
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        validate_password_strength(attrs["password"])
        from apps.users.models import User
        if User.objects.filter(username=attrs["username"]).exists():
            raise serializers.ValidationError({"username": "This username is already taken."})
        dob = attrs.get("date_of_birth")
        if dob:
            from datetime import date
            today = date.today()
            age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
            if age < 6 or age > 18:
                raise serializers.ValidationError(
                    {"date_of_birth": "Child must be between 6 and 18 years old."}
                )
        if len(attrs.get("pathway_ids", [])) > 2:
            raise serializers.ValidationError(
                {"pathway_ids": "You can select a maximum of 2 pathways."}
            )
        return attrs

    def create(self, validated_data: dict) -> Learner:
        from apps.core.models import Course, LearnerCourseEnrollment
        from apps.users.models import User

        username = validated_data.pop("username")
        password = validated_data.pop("password")
        validated_data.pop("password_confirm")
        pathway_ids = validated_data.pop("pathway_ids", [])
        parent = self.context["request"].user
        tenant = parent.tenant

        user = User.objects.create_user(
            username=username, password=password,
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            role="learner", tenant=tenant, is_active=True,
        )
        learner = Learner.objects.create(parent=parent, tenant=tenant, user=user, **validated_data)

        for course_id in pathway_ids:
            try:
                course = Course.objects.get(id=course_id, tenant=tenant)
                first_level = course.levels.order_by("level_number").first()
                LearnerCourseEnrollment.objects.create(
                    learner=learner, course=course, current_level=first_level, is_active=True
                )
            except Course.DoesNotExist:
                continue
        return learner


class ChildUpdateSerializer(serializers.ModelSerializer):
    """Serializer for parents to update their children's details."""

    new_password = serializers.CharField(write_only=True, required=False, min_length=8, allow_blank=True)
    new_password_confirm = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Learner
        fields = [
            "first_name", "last_name", "date_of_birth", "current_school",
            "current_class", "consent_media", "equity_flag", "joined_at",
            "new_password", "new_password_confirm",
        ]

    def validate(self, attrs: dict) -> dict:
        new_pw = attrs.get("new_password", "")
        if new_pw or attrs.get("new_password_confirm", ""):
            if new_pw != attrs.get("new_password_confirm", ""):
                raise serializers.ValidationError({"new_password": "Passwords do not match."})
        dob = attrs.get("date_of_birth")
        if dob:
            from datetime import date
            today = date.today()
            age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
            if age < 6 or age > 18:
                raise serializers.ValidationError(
                    {"date_of_birth": "Child must be between 6 and 18 years old."}
                )
        return attrs

    def update(self, instance: Learner, validated_data: dict) -> Learner:
        new_password = validated_data.pop("new_password", None)
        validated_data.pop("new_password_confirm", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if instance.user:
            instance.user.first_name = instance.first_name
            instance.user.last_name = instance.last_name
            if new_password:
                instance.user.set_password(new_password)
            instance.user.save()
        return instance


class TeacherStudentSerializer(serializers.ModelSerializer):
    """Detailed student serializer for teachers — includes progress, badges, etc."""

    user_email = serializers.EmailField(source="user.email", read_only=True)
    badges_count = serializers.SerializerMethodField()
    credentials_count = serializers.SerializerMethodField()
    attendance_rate = serializers.SerializerMethodField()

    class Meta:
        model = Learner
        fields = [
            "id", "first_name", "last_name", "full_name", "user_email",
            "current_school", "current_class",
            "badges_count", "credentials_count", "attendance_rate",
        ]
        read_only_fields = ["id", "full_name"]

    def get_badges_count(self, obj: Learner) -> int:
        return obj.badges.count()

    def get_credentials_count(self, obj: Learner) -> int:
        return obj.credentials.count()

    def get_attendance_rate(self, obj: Learner) -> float:
        total = Attendance.objects.filter(learner=obj).count()
        if total == 0:
            return 0
        present = Attendance.objects.filter(learner=obj, status__in=["present", "late"]).count()
        return round((present / total) * 100, 1)
