from __future__ import annotations

from apps.core.models import School
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user profile data."""

    tenant_name = serializers.CharField(source="tenant.name", read_only=True)
    tenant_code = serializers.CharField(source="tenant.code", read_only=True)
    school_name = serializers.CharField(source="tenant.name", read_only=True)
    school_code = serializers.CharField(source="tenant.code", read_only=True)
    school_id = serializers.UUIDField(source="tenant_id", read_only=True)
    teacher_school_ids = serializers.SerializerMethodField()
    teacher_schools = serializers.SerializerMethodField()
    dashboard_url = serializers.CharField(read_only=True)
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "tenant",
            "tenant_name",
            "tenant_code",
            "school_id",
            "school_name",
            "school_code",
            "teacher_school_ids",
            "teacher_schools",
            "dashboard_url",
            "date_joined",
            "is_active",
            "avatar",
            "avatar_url",
        ]
        read_only_fields = ["id", "date_joined", "role", "tenant", "avatar_url"]

    def get_avatar_url(self, obj):
        """Return the full URL for the avatar if it exists."""
        if obj.avatar:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.avatar.url)
            return obj.avatar.url
        return None

    def get_teacher_school_ids(self, obj):
        if not obj.is_teacher:
            return []
        return sorted(obj.get_accessible_school_ids())

    def get_teacher_schools(self, obj):
        if not obj.is_teacher:
            return []

        schools = list(
            obj.teacher_schools.all().values("id", "name", "code").order_by("name")
        )
        if obj.tenant_id and not any(str(s["id"]) == str(obj.tenant_id) for s in schools):
            schools.append(
                {"id": obj.tenant.id, "name": obj.tenant.name, "code": obj.tenant.code}
            )
        return [{"id": str(s["id"]), "name": s["name"], "code": s["code"]} for s in schools]


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for parent user registration.

    By default, all new registrations create parent accounts.
    Parents can then add their children through a separate endpoint.
    """

    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )
    password_confirm = serializers.CharField(write_only=True, required=True)
    school_code = serializers.CharField(
        write_only=True, required=False, allow_blank=True
    )

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "password",
            "password_confirm",
            "first_name",
            "last_name",
            "school_code",
        ]
        extra_kwargs = {
            "first_name": {"required": True},
            "last_name": {"required": True},
            "email": {"required": True},
        }

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError(
                {"password": "Password fields didn't match."}
            )

        # Validate school code if provided
        school_code = attrs.get("school_code")
        if school_code:
            try:
                school = School.objects.get(code=school_code)
                attrs["tenant"] = school
            except School.DoesNotExist:
                raise serializers.ValidationError(
                    {"school_code": "Invalid school code."}
                ) from None

        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        validated_data.pop("school_code", None)
        tenant = validated_data.pop("tenant", None)

        # All new registrations are parent accounts
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            role="parent",  # Always create as parent
            tenant=tenant,
        )

        # Note: Learner profiles are created separately by parents
        # through the child management endpoints

        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT serializer that includes user data and role in the response."""

    def validate(self, attrs):
        data = super().validate(attrs)

        # Add user data to response
        request = self.context.get("request")
        user_serializer = UserSerializer(self.user, context={"request": request})
        data["user"] = user_serializer.data

        # Add custom claims to token
        refresh = self.get_token(self.user)
        refresh["role"] = self.user.role
        refresh["tenant_id"] = str(self.user.tenant_id) if self.user.tenant_id else None
        refresh["school_id"] = str(self.user.tenant_id) if self.user.tenant_id else None

        data["refresh"] = str(refresh)
        data["access"] = str(refresh.access_token)

        return data

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token["role"] = user.role
        token["tenant_id"] = str(user.tenant_id) if user.tenant_id else None
        token["school_id"] = str(user.tenant_id) if user.tenant_id else None
        token["username"] = user.username
        token["email"] = user.email

        return token
