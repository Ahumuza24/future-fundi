from __future__ import annotations

import uuid

from apps.core.roles import UserRole
from django.contrib.auth.models import AbstractUser
from django.db import models


def user_avatar_path(instance, filename):
    """Generate upload path for user avatars."""
    ext = filename.split(".")[-1]
    return f"avatars/{instance.id}.{ext}"


class User(AbstractUser):
    """Custom user with tenant association and role-based access control.

    Roles:
    - learner: Student using the platform
    - teacher: L1/L2 teachers who capture artifacts and assessments
    - parent: Parents/guardians viewing their child's progress
    - leader: School leaders with dashboard access
    - admin: System administrators with full access
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        "core.School",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="users",
    )
    teacher_schools = models.ManyToManyField(
        "core.School",
        blank=True,
        related_name="teachers",
        help_text="Schools this teacher can access.",
    )
    role = models.CharField(
        max_length=32,
        choices=UserRole.choices,
        default=UserRole.LEARNER,
        db_index=True,
    )
    avatar = models.ImageField(
        upload_to=user_avatar_path,
        null=True,
        blank=True,
        help_text="User profile picture",
    )

    class Meta:
        db_table = "users_user"
        verbose_name = "User"
        verbose_name_plural = "Users"
        indexes = [
            models.Index(fields=["role", "tenant"]),
            models.Index(fields=["email"]),
        ]

    def __str__(self) -> str:
        return f"{self.username} ({self.get_role_display()})"

    @property
    def is_learner(self) -> bool:
        return self.role == UserRole.LEARNER

    @property
    def is_teacher(self) -> bool:
        return self.role == UserRole.TEACHER

    @property
    def is_parent(self) -> bool:
        return self.role == UserRole.PARENT

    @property
    def is_leader(self) -> bool:
        return self.role == UserRole.LEADER

    @property
    def is_admin_user(self) -> bool:
        return self.role == UserRole.ADMIN or self.is_superuser

    @property
    def is_school_admin(self) -> bool:
        return self.role == UserRole.SCHOOL

    @property
    def school(self):
        """Backward-compatible alias: school == tenant."""
        return self.tenant

    @school.setter
    def school(self, value):
        self.tenant = value

    @property
    def school_id(self):
        """Backward-compatible alias: school_id == tenant_id."""
        return self.tenant_id

    def get_dashboard_url(self) -> str:
        """Return the appropriate dashboard URL based on user role."""
        dashboard_map = {
            UserRole.LEARNER: "/student",
            UserRole.TEACHER: "/teacher",
            UserRole.PARENT: "/parent",
            UserRole.LEADER: "/leader",
            UserRole.ADMIN: "/admin",
            UserRole.DATA_ENTRY: "/admin/curriculum-entry",
            UserRole.SCHOOL: "/school",
        }
        return dashboard_map.get(self.role, "/student")

    def get_accessible_school_ids(self) -> set[str]:
        """Return school ids this user can operate in."""
        school_ids: set[str] = set()

        if self.tenant_id:
            school_ids.add(str(self.tenant_id))

        if self.role == UserRole.TEACHER:
            school_ids.update(
                str(sid) for sid in self.teacher_schools.values_list("id", flat=True)
            )

        return school_ids
