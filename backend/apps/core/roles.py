from __future__ import annotations

from django.db import models


class UserRole(models.TextChoices):
    """Canonical user roles used across the platform."""

    LEARNER = "learner", "Learner"
    TEACHER = "teacher", "Teacher"
    PARENT = "parent", "Parent"
    PROGRAM_MANAGER = "program_manager", "Program Manager"
    ADMIN = "admin", "Admin"
    DATA_ENTRY = "data_entry", "Data Entry"
    SCHOOL = "school", "School Admin"
    CURRICULUM_DESIGNER = "curriculum_designer", "Curriculum Designer"


SCHOOL_STAFF_ROLES = {
    UserRole.TEACHER,
    UserRole.PROGRAM_MANAGER,
    UserRole.SCHOOL,
    UserRole.DATA_ENTRY,
}
