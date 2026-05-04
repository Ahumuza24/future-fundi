from __future__ import annotations

from datetime import date

from django.conf import settings
from django.db import models

from .base import BaseUUIDModel, School, TenantModel


class Learner(BaseUUIDModel):
    """Learner profile owned by a parent user.

    Learners can optionally have their own user accounts for logging in.
    They are managed by their parent who has a User account with role='parent'.
    One parent can have multiple children.

    Note: Tenant is optional to allow parents to register children before
    being assigned to a school.
    """

    tenant = models.ForeignKey(
        School,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text="School/organization (optional until parent is assigned)",
    )
    parent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="children",
        limit_choices_to={"role": "parent"},
        null=True,
        blank=True,
        help_text="Parent/guardian who manages this learner",
    )
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="learner_profile",
        null=True,
        blank=True,
        help_text="Optional user account for the learner to log in",
    )
    first_name = models.CharField(max_length=128)
    last_name = models.CharField(max_length=128)
    date_of_birth = models.DateField(null=True, blank=True, help_text="Child's date of birth")
    current_school = models.CharField(
        max_length=255, blank=True, default="", help_text="Current school name"
    )
    current_class = models.CharField(
        max_length=100, blank=True, default="", help_text="Current class/grade"
    )
    consent_media = models.BooleanField(
        default=False, db_index=True, help_text="Parent consent for media capture"
    )
    equity_flag = models.BooleanField(
        default=False, db_index=True, help_text="Requires additional support"
    )
    joined_at = models.DateField(null=True, blank=True, help_text="Date enrolled in program")

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
    level = models.CharField(
        max_length=24,
        choices=LEVEL_CHOICES,
        default=LEVEL_EXPLORER,
        db_index=True,
        help_text=(
            "Competency level — skill-based, not age-based (PRD §2.3). "
            "A 14-year-old joining for the first time starts at Explorer."
        ),
    )

    AGE_BAND_6_8 = "6-8"
    AGE_BAND_9_12 = "9-12"
    AGE_BAND_13_15 = "13-15"
    AGE_BAND_16_18 = "16-18"
    AGE_BAND_CHOICES = [
        (AGE_BAND_6_8, "6–8"),
        (AGE_BAND_9_12, "9–12"),
        (AGE_BAND_13_15, "13–15"),
        (AGE_BAND_16_18, "16–18"),
    ]
    age_band = models.CharField(
        max_length=8,
        choices=AGE_BAND_CHOICES,
        null=True,
        blank=True,
        db_index=True,
        help_text=(
            "Informational age grouping. "
            "Computed from date_of_birth; can be set manually if DOB unknown."
        ),
    )

    current_track = models.ForeignKey(
        "Track",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="current_learners",
        help_text="Track the learner is currently enrolled in",
    )
    current_program = models.ForeignKey(
        "Program",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="current_learners",
        help_text="Program the learner is currently enrolled in",
    )

    objects = models.Manager()

    class Meta:
        db_table = "core_learner"
        verbose_name = "Learner"
        verbose_name_plural = "Learners"
        ordering = ["first_name", "last_name"]
        indexes = [
            models.Index(fields=["parent", "tenant"]),
        ]

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.first_name} {self.last_name}"

    @property
    def school(self):
        return self.tenant

    @school.setter
    def school(self, value):
        self.tenant = value

    @property
    def school_id(self):
        return self.tenant_id

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"

    @property
    def age(self) -> int | None:
        if not self.date_of_birth:
            return None
        today = date.today()
        return (
            today.year
            - self.date_of_birth.year
            - ((today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day))
        )


class ParentContact(TenantModel):
    """Parent/guardian contact with preferred channels."""

    learner = models.ForeignKey("Learner", on_delete=models.CASCADE, related_name="parents")
    whatsapp = models.CharField(max_length=32, blank=True)
    sms = models.CharField(max_length=32, blank=True)
    email = models.EmailField(blank=True)
    preferred_channel = models.CharField(max_length=16, default="whatsapp")
    language = models.CharField(max_length=8, default="en")

    def __str__(self) -> str:  # pragma: no cover
        return f"ParentContact({self.learner})"
