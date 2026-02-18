from __future__ import annotations

from django.db import models


class UserRole(models.TextChoices):
    """Canonical user roles used across the platform."""

    LEARNER = "learner", "Learner"
    TEACHER = "teacher", "Teacher"
    PARENT = "parent", "Parent"
    LEADER = "leader", "Leader"
    ADMIN = "admin", "Admin"
    DATA_ENTRY = "data_entry", "Data Entry"
    SCHOOL = "school", "School Admin"


SCHOOL_STAFF_ROLES = {
    UserRole.TEACHER,
    UserRole.LEADER,
    UserRole.SCHOOL,
    UserRole.DATA_ENTRY,
}

