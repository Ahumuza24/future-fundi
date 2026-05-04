from __future__ import annotations

from django.conf import settings
from django.db import models

from .base import BaseUUIDModel, School


class Pathway(BaseUUIDModel):
    """A broad future direction (e.g. Robotics, AI) — top of the learning hierarchy.

    Pathways are global (not school-scoped) and are created by admins.
    Each pathway contains 2–4 Tracks.

    Was previously named 'Course' — renamed in migration 0028.
    """

    STATUS_DRAFT = "draft"
    STATUS_ACTIVE = "active"
    STATUS_ARCHIVED = "archived"
    STATUS_CHOICES = [
        (STATUS_DRAFT, "Draft"),
        (STATUS_ACTIVE, "Active"),
        (STATUS_ARCHIVED, "Archived"),
    ]

    name = models.CharField(max_length=255, db_index=True)
    description = models.TextField(blank=True)
    icon = models.CharField(
        max_length=100, blank=True, default="",
        help_text="Icon name, emoji, or URL for this pathway",
    )
    color = models.CharField(
        max_length=7, blank=True, default="#3B82F6",
        help_text="Hex color code for UI theming (e.g. #3B82F6)",
    )
    age_band_min = models.PositiveIntegerField(
        default=6, help_text="Minimum recommended age for this pathway"
    )
    age_band_target = models.PositiveIntegerField(
        default=12, help_text="Target/ideal starting age for this pathway"
    )
    status = models.CharField(
        max_length=16,
        choices=STATUS_CHOICES,
        default=STATUS_DRAFT,
        db_index=True,
        help_text="Publication status; only Active pathways are visible to learners",
    )
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    tenant = models.ForeignKey(
        School,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text="If set, pathway is only for this school. If null, available globally.",
    )
    teachers = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="courses_taught",
        blank=True,
        limit_choices_to={"role": "teacher"},
        help_text="Teachers assigned to this pathway",
    )

    class Meta:
        db_table = "core_pathway"
        verbose_name = "Pathway"
        verbose_name_plural = "Pathways"
        ordering = ["name"]
        indexes = [
            models.Index(fields=["is_active"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self) -> str:
        return f"{self.name}"


# Backward-compatibility alias — keeps existing serializers/views working
# after the Course → Pathway rename (Phase 1 migration 0028).
Course = Pathway


class Track(BaseUUIDModel):
    """A specialisation within a Pathway (PRD §2.1, layer 2).

    Each Pathway contains 2–4 Tracks.
    Example: Pathway='Robotics' → Track='Robot Programming'
    """

    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("active", "Active"),
        ("archived", "Archived"),
    ]

    pathway = models.ForeignKey(
        Pathway,
        on_delete=models.CASCADE,
        related_name="tracks",
        help_text="Parent pathway this track belongs to",
    )
    title = models.CharField(
        max_length=255, db_index=True,
        help_text="Specialisation name, e.g. 'Robot Programming'",
    )
    description = models.TextField(blank=True, help_text="Learner-facing description of this track")
    sequence_order = models.PositiveIntegerField(
        default=1, help_text="Display order within the parent pathway (1-based)"
    )
    status = models.CharField(
        max_length=16, choices=STATUS_CHOICES, default="draft", db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "core_track"
        verbose_name = "Track"
        verbose_name_plural = "Tracks"
        ordering = ["pathway", "sequence_order"]
        constraints = [
            models.UniqueConstraint(
                fields=["pathway", "sequence_order"],
                name="unique_track_order_per_pathway",
            )
        ]

    def __str__(self) -> str:
        return f"{self.pathway.name} › {self.title}"


class Program(BaseUUIDModel):
    """A bundled module sequence leading to a certification (PRD §2.1, layer 3).

    Each Track contains 2–3 Programs.
    The `level` is competency-based, not age-based (PRD §2.3).
    Example: Track='Robot Programming' → Program='Robotics Foundations (Explorer)'
    """

    LEVEL_EXPLORER = "explorer"
    LEVEL_BUILDER = "builder"
    LEVEL_PRACTITIONER = "practitioner"
    LEVEL_PRE_PROFESSIONAL = "pre_professional"
    LEVEL_CHOICES = [
        (LEVEL_EXPLORER, "Explorer"),
        (LEVEL_BUILDER, "Builder"),
        (LEVEL_PRACTITIONER, "Practitioner"),
        (LEVEL_PRE_PROFESSIONAL, "Pre-Professional"),
    ]
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("active", "Active"),
        ("archived", "Archived"),
    ]

    track = models.ForeignKey(
        Track,
        on_delete=models.CASCADE,
        related_name="programs",
        help_text="Parent track this program belongs to",
    )
    title = models.CharField(
        max_length=255, db_index=True,
        help_text="e.g. 'Robotics Foundations Program'",
    )
    level = models.CharField(
        max_length=24,
        choices=LEVEL_CHOICES,
        default=LEVEL_EXPLORER,
        db_index=True,
        help_text="Competency level for this program. Levels are skill-based, not age-based.",
    )
    description = models.TextField(
        blank=True,
        help_text="Learner-facing outcome statement, e.g. 'By the end you will be able to…'",
    )
    sequence_order = models.PositiveIntegerField(
        default=1, help_text="Display order within the parent track (1-based)"
    )
    status = models.CharField(
        max_length=16, choices=STATUS_CHOICES, default="draft", db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "core_program"
        verbose_name = "Program"
        verbose_name_plural = "Programs"
        ordering = ["track", "sequence_order"]
        constraints = [
            models.UniqueConstraint(
                fields=["track", "sequence_order"],
                name="unique_program_order_per_track",
            )
        ]

    def __str__(self) -> str:
        return f"{self.track.title} › {self.title} ({self.get_level_display()})"
