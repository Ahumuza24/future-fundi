from __future__ import annotations

from django.conf import settings
from django.db import models

from .base import BaseUUIDModel
from .hierarchy import Pathway


class Module(BaseUUIDModel):
    """Curriculum module catalog - Global content shared across all schools."""

    name = models.CharField(max_length=255, db_index=True)
    description = models.TextField(blank=True)
    content = models.TextField(blank=True, help_text="Rich text content, videos, images")
    suggested_activities = models.JSONField(default=list, blank=True, help_text="List of activities")
    materials = models.JSONField(default=list, blank=True, help_text="List of materials")
    competences = models.JSONField(default=list, blank=True, help_text="List of competencies")
    media_files = models.JSONField(
        default=list,
        blank=True,
        help_text="List of uploaded media files [{type, url, name}]",
    )
    program = models.ForeignKey(
        "Program",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="modules",
        help_text=(
            "Program this module belongs to. "
            "Replaces the legacy `course` FK once data is migrated."
        ),
    )
    course = models.ForeignKey(
        Pathway,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="modules",
        help_text="[Deprecated] Use `program` instead.",
    )
    outcome_statement = models.CharField(
        max_length=500,
        blank=True,
        default="",
        help_text="One sentence: 'Learner can…' shown to learners",
    )
    duration_sessions = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Expected number of sessions to complete this module",
    )
    teacher_notes = models.TextField(
        blank=True,
        help_text=(
            "Facilitator notes (misconceptions, differentiation tips). "
            "Teacher-only — never shown to learners or parents."
        ),
    )
    unlock_gate = models.JSONField(
        default=dict,
        help_text=(
            'Gate rule: {"type": "previous_module"|"badge_set"|"none", '
            '"ref_id": "<uuid>"|null}'
        ),
    )
    sequence_order = models.PositiveIntegerField(
        default=1, help_text="Display order within the parent program (1-based)"
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)

    STATUS_DRAFT = "draft"
    STATUS_ACTIVE = "active"
    STATUS_ARCHIVED = "archived"
    STATUS_CHOICES = [
        (STATUS_DRAFT, "Draft"),
        (STATUS_ACTIVE, "Active"),
        (STATUS_ARCHIVED, "Archived"),
    ]
    status = models.CharField(
        max_length=16,
        choices=STATUS_CHOICES,
        default=STATUS_DRAFT,
        db_index=True,
        help_text=(
            "Only Active modules are visible to learners. "
            "Status change Draft→Active requires peer review (PRD §4.5 F-19)."
        ),
    )
    badge_name = models.CharField(
        max_length=255,
        blank=True,
        help_text="Name of the badge earned upon completion of this module",
    )

    # Peer review (PRD F-19: modules must pass review before Draft → Active)
    needs_review = models.BooleanField(
        default=False,
        db_index=True,
        help_text="True when first designer has submitted this module for peer review",
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="modules_reviewed",
        help_text="Curriculum designer who completed the peer review",
    )
    reviewed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp when the peer review was completed",
    )

    objects = models.Manager()

    def __str__(self) -> str:  # pragma: no cover
        return self.name


class Career(BaseUUIDModel):
    """Potential careers linked to a pathway — Global content."""

    course = models.ForeignKey(Pathway, on_delete=models.CASCADE, related_name="careers")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    objects = models.Manager()

    def __str__(self) -> str:
        return f"{self.title} ({self.course.name})"


class CourseLevel(BaseUUIDModel):
    """A progressive level within a pathway (legacy model).

    Note: This model predates the full 7-layer hierarchy. New code should use
    the Track → Program → Module chain. CourseLevel will be deprecated once the
    data migration to Program is complete.
    """

    course = models.ForeignKey(Pathway, on_delete=models.CASCADE, related_name="levels")
    level_number = models.PositiveIntegerField(
        default=1, help_text="Order of this level (1, 2, 3...)"
    )
    name = models.CharField(max_length=255, help_text="e.g., 'Level 1: Foundations'")
    description = models.TextField(blank=True)
    learning_outcomes = models.JSONField(
        default=list, help_text="List of learning outcomes for this level"
    )
    required_modules_count = models.PositiveIntegerField(
        default=4, help_text="Number of modules to complete"
    )
    required_artifacts_count = models.PositiveIntegerField(
        default=6, help_text="Minimum artifacts to submit"
    )
    required_assessment_score = models.PositiveIntegerField(
        default=70, help_text="Minimum assessment score (0-100)"
    )
    requires_teacher_confirmation = models.BooleanField(
        default=False, help_text="If true, teacher must confirm completion"
    )
    required_modules = models.ManyToManyField(
        "Module",
        blank=True,
        related_name="course_levels",
        help_text="Specific modules required for this level",
    )

    class Meta:
        db_table = "core_course_level"
        verbose_name = "Course Level"
        verbose_name_plural = "Course Levels"
        ordering = ["course", "level_number"]
        unique_together = [["course", "level_number"]]

    def __str__(self) -> str:
        return f"{self.course.name} - Level {self.level_number}: {self.name}"
