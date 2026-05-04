from __future__ import annotations

from apps.core.models import School
from apps.core.roles import UserRole
from django.contrib.auth import get_user_model
from rest_framework import serializers

from ..utils.validators import validate_password_strength

User = get_user_model()


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
        extra_kwargs = {
            "password": {
                "write_only": True,
                "required": False,
                "allow_blank": True,
            }
        }

    def validate_password(self, value: str) -> str:
        if value and len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters.")
        return value

    def validate_school_ids(self, value: list) -> list:
        if not value:
            return value
        existing_ids = {
            str(sid)
            for sid in School.objects.filter(id__in=value).values_list("id", flat=True)
        }
        missing_ids = [str(sid) for sid in value if str(sid) not in existing_ids]
        if missing_ids:
            raise serializers.ValidationError(
                f"Invalid school ids: {', '.join(missing_ids)}"
            )
        return value

    def validate(self, attrs: dict) -> dict:
        role = attrs.get("role", getattr(self.instance, "role", None))
        if role != UserRole.TEACHER:
            return attrs

        tenant = attrs.get("tenant", getattr(self.instance, "tenant", None))
        school_ids = attrs.get("school_ids")

        effective_school_ids: set = set()
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

    def _sync_teacher_schools(self, user: object, school_ids: list | None) -> None:
        if user.role != UserRole.TEACHER:
            if school_ids is not None:
                user.teacher_schools.clear()
            return

        if school_ids is None:
            if (
                user.tenant_id
                and not user.teacher_schools.filter(id=user.tenant_id).exists()
            ):
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

    def create(self, validated_data: dict) -> object:
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

        if pathway_ids and user.role == UserRole.TEACHER:
            user.courses_taught.set(pathway_ids)

        self._sync_teacher_schools(user, school_ids)

        if user.role == UserRole.LEARNER:
            Learner.objects.create(
                user=user,
                tenant=user.tenant,
                first_name=user.first_name,
                last_name=user.last_name,
                current_class=current_class,
            )

        return user

    def update(self, instance: object, validated_data: dict) -> object:
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

        if pathway_ids is not None and instance.role == UserRole.TEACHER:
            instance.courses_taught.set(pathway_ids)

        self._sync_teacher_schools(instance, school_ids)

        if instance.role == UserRole.LEARNER:
            learner, _ = Learner.objects.get_or_create(
                user=instance,
                defaults={
                    "tenant": instance.tenant,
                    "first_name": instance.first_name,
                    "last_name": instance.last_name,
                    "current_class": current_class or "",
                },
            )
            learner.first_name = instance.first_name
            learner.last_name = instance.last_name
            learner.tenant = instance.tenant
            if current_class is not None:
                learner.current_class = current_class
            learner.save()

        return instance
