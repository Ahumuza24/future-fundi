from __future__ import annotations

from django.conf import settings
from django.db import models

from .base import BaseUUIDModel, School
from .curriculum import CourseLevel, Module
from .hierarchy import Pathway
from .learner import Learner


class Achievement(BaseUUIDModel):
    """Badges/achievements earned by learners.

    Awarded automatically when completing levels or manually by teachers.
    """

    ACHIEVEMENT_TYPES = [
        ("level_complete", "Level Completed"),
        ("course_complete", "Course Completed"),
        ("skill_mastery", "Skill Mastery"),
        ("participation", "Participation"),
        ("special", "Special Achievement"),
    ]

    learner = models.ForeignKey(
        Learner, on_delete=models.CASCADE, related_name="achievements"
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    achievement_type = models.CharField(
        max_length=50, choices=ACHIEVEMENT_TYPES, default="level_complete"
    )
    icon = models.CharField(max_length=100, blank=True, help_text="Icon name or emoji")
    course = models.ForeignKey(Pathway, on_delete=models.SET_NULL, null=True, blank=True)
    level = models.ForeignKey(
        CourseLevel, on_delete=models.SET_NULL, null=True, blank=True
    )
    earned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "core_achievement"
        verbose_name = "Achievement"
        verbose_name_plural = "Achievements"
        ordering = ["-earned_at"]

    def __str__(self) -> str:
        return f"{self.learner.full_name} - {self.name}"


class Badge(BaseUUIDModel):
    """Badges awarded to learners for achievements and module completion.

    Teachers can award badges manually or they can be auto-awarded
    when a learner completes a module that has a badge_name defined.
    """

    learner = models.ForeignKey(
        Learner,
        on_delete=models.CASCADE,
        related_name="badges",
        help_text="Learner who earned this badge",
    )
    module = models.ForeignKey(
        Module,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="badges_awarded",
        help_text="Module associated with this badge (if any)",
    )
    badge_name = models.CharField(
        max_length=255,
        help_text="Name of the badge (e.g., 'Robotics Master', 'Code Ninja')",
    )
    description = models.TextField(
        blank=True, help_text="Description of what this badge represents"
    )
    awarded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="badges_awarded",
        limit_choices_to={"role": "teacher"},
        help_text="Teacher who awarded this badge",
    )
    awarded_at = models.DateTimeField(auto_now_add=True, db_index=True)
    tenant = models.ForeignKey(
        School,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )

    class Meta:
        db_table = "core_badge"
        verbose_name = "Badge"
        verbose_name_plural = "Badges"
        ordering = ["-awarded_at"]
        indexes = [
            models.Index(fields=["learner", "awarded_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.learner.full_name} - {self.badge_name}"
