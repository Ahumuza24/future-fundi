from __future__ import annotations

import uuid

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

    ROLE_CHOICES = [
        ("learner", "Learner"),
        ("teacher", "Teacher"),
        ("parent", "Parent"),
        ("leader", "Leader"),
        ("admin", "Admin"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        "core.School",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="users",
    )
    role = models.CharField(
        max_length=32, choices=ROLE_CHOICES, default="learner", db_index=True
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
        return self.role == "learner"

    @property
    def is_teacher(self) -> bool:
        return self.role == "teacher"

    @property
    def is_parent(self) -> bool:
        return self.role == "parent"

    @property
    def is_leader(self) -> bool:
        return self.role == "leader"

    @property
    def is_admin_user(self) -> bool:
        return self.role == "admin" or self.is_superuser

    def get_dashboard_url(self) -> str:
        """Return the appropriate dashboard URL based on user role."""
        dashboard_map = {
            "learner": "/student",
            "teacher": "/teacher",
            "parent": "/parent",
            "leader": "/leader",
            "admin": "/admin",
        }
        return dashboard_map.get(self.role, "/student")
