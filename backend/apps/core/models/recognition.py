from __future__ import annotations

from django.conf import settings
from django.db import models

from .base import BaseUUIDModel


class BadgeTemplate(BaseUUIDModel):
    """Reusable badge definition, linked 1-to-1 with a Unit."""

    unit = models.OneToOneField(
        "Unit",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="badge_template",
        help_text="Unit whose completion triggers this badge",
    )
    title = models.CharField(max_length=255, db_index=True)
    criteria = models.TextField()
    icon_url = models.CharField(max_length=500, blank=True)

    class Meta:
        db_table = "core_badge_template"
        verbose_name = "Badge Template"
        verbose_name_plural = "Badge Templates"
        ordering = ["title"]

    def __str__(self) -> str:
        return self.title


class BadgeRecord(BaseUUIDModel):
    """Issued badge instance for a learner (PRD §3.4, F-09)."""

    STATUS_DRAFT = "draft"
    STATUS_ISSUED = "issued"
    STATUS_REVOKED = "revoked"
    STATUS_CHOICES = [
        (STATUS_DRAFT, "Draft"),
        (STATUS_ISSUED, "Issued"),
        (STATUS_REVOKED, "Revoked"),
    ]
    SOURCE_CHOICES = [
        ("digital", "Digital"),
        ("offline_card_sync", "Offline Card Sync"),
    ]

    template = models.ForeignKey(
        "BadgeTemplate",
        on_delete=models.PROTECT,
        related_name="records",
    )
    learner = models.ForeignKey(
        "Learner",
        on_delete=models.CASCADE,
        related_name="badge_records",
    )
    issuer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="badge_records_issued",
    )
    artifacts = models.ManyToManyField(
        "Artifact",
        related_name="badge_records",
        blank=True,
        help_text="Evidence supporting this badge (at least one required at issuance — PRD F-09).",
    )
    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default=STATUS_DRAFT, db_index=True
    )
    source = models.CharField(
        max_length=20, choices=SOURCE_CHOICES, default="digital"
    )
    verification_ref = models.CharField(max_length=255, blank=True)
    date_awarded = models.DateTimeField(null=True, blank=True, db_index=True)

    class Meta:
        db_table = "core_badge_record"
        verbose_name = "Badge Record"
        verbose_name_plural = "Badge Records"
        ordering = ["-date_awarded"]
        constraints = [
            models.UniqueConstraint(
                fields=["template", "learner"],
                name="unique_badge_per_learner",
            )
        ]

    def __str__(self) -> str:
        return f"{self.learner} — {self.template.title}"

    def clean(self) -> None:
        from django.core.exceptions import ValidationError

        if self.status == self.STATUS_ISSUED and self.pk:
            if not self.artifacts.exists():
                raise ValidationError(
                    {"artifacts": "Cannot issue a badge without at least one linked artifact. (PRD F-09)"}
                )


class MicrocredentialTemplate(BaseUUIDModel):
    """Reusable microcredential definition, linked 1-to-1 with a Module."""

    module = models.OneToOneField(
        "Module",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="microcredential_template",
        help_text="Module whose full completion triggers this microcredential",
    )
    title = models.CharField(max_length=255, db_index=True)
    description = models.TextField(blank=True)

    class Meta:
        db_table = "core_microcredential_template"
        verbose_name = "Microcredential Template"
        verbose_name_plural = "Microcredential Templates"
        ordering = ["title"]

    def __str__(self) -> str:
        return self.title


class MicrocredentialRecord(BaseUUIDModel):
    """Issued microcredential instance for a learner (PRD §3.4, F-07, F-09)."""

    template = models.ForeignKey(
        "MicrocredentialTemplate",
        on_delete=models.PROTECT,
        related_name="records",
    )
    learner = models.ForeignKey(
        "Learner",
        on_delete=models.CASCADE,
        related_name="microcredential_records",
    )
    module = models.ForeignKey(
        "Module",
        on_delete=models.PROTECT,
        related_name="microcredential_records",
        help_text="Module this microcredential was awarded for",
    )
    issuer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="microcredential_records_issued",
    )
    badge_records = models.ManyToManyField(
        "BadgeRecord",
        related_name="microcredential_records",
        blank=True,
        help_text="Badge records earned during this module that contributed here",
    )
    artifacts = models.ManyToManyField(
        "Artifact",
        related_name="microcredential_records",
        blank=True,
        help_text="Evidence supporting this microcredential. At least one required at issuance (PRD F-09).",
    )
    status = models.CharField(
        max_length=10,
        choices=[("draft", "Draft"), ("issued", "Issued"), ("revoked", "Revoked")],
        default="draft",
        db_index=True,
    )
    date_issued = models.DateTimeField(null=True, blank=True, db_index=True)

    class Meta:
        db_table = "core_microcredential_record"
        verbose_name = "Microcredential Record"
        verbose_name_plural = "Microcredential Records"
        ordering = ["-date_issued"]
        constraints = [
            models.UniqueConstraint(
                fields=["template", "learner"],
                name="unique_microcredential_per_learner",
            )
        ]

    def __str__(self) -> str:
        return f"{self.learner} — {self.template.title}"

    def clean(self) -> None:
        from django.core.exceptions import ValidationError

        if self.status == "issued" and self.pk:
            if not self.artifacts.exists():
                raise ValidationError(
                    {"artifacts": "Cannot issue a microcredential without at least one linked artifact. (PRD F-09)"}
                )


class CertificationTemplate(BaseUUIDModel):
    """Reusable certification definition, linked 1-to-1 with a Program."""

    program = models.OneToOneField(
        "Program",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="certification_template",
        help_text="Program whose full completion triggers this certification",
    )
    title = models.CharField(max_length=255, db_index=True)
    description = models.TextField(blank=True)

    class Meta:
        db_table = "core_certification_template"
        verbose_name = "Certification Template"
        verbose_name_plural = "Certification Templates"
        ordering = ["title"]

    def __str__(self) -> str:
        return self.title


class CertificationRecord(BaseUUIDModel):
    """Issued certification instance for a learner (PRD §3.4, F-08, F-09)."""

    template = models.ForeignKey(
        "CertificationTemplate",
        on_delete=models.PROTECT,
        related_name="records",
    )
    learner = models.ForeignKey(
        "Learner",
        on_delete=models.CASCADE,
        related_name="certification_records",
    )
    program = models.ForeignKey(
        "Program",
        on_delete=models.PROTECT,
        related_name="certification_records",
    )
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="certification_records_reviewed",
    )
    microcredential_records = models.ManyToManyField(
        "MicrocredentialRecord",
        related_name="certification_records",
        blank=True,
        help_text="3–5 microcredentials required at issuance (PRD F-08, §12)",
    )
    # Non-nullable FK — DB-level evidence enforcement (PRD F-09).
    capstone_artifact = models.ForeignKey(
        "Artifact",
        on_delete=models.PROTECT,
        related_name="certification_records",
        help_text="Required capstone artifact. Non-nullable = DB-level evidence enforcement (PRD F-09).",
    )
    status = models.CharField(
        max_length=10,
        choices=[("draft", "Draft"), ("issued", "Issued"), ("revoked", "Revoked")],
        default="draft",
        db_index=True,
    )
    date_issued = models.DateTimeField(null=True, blank=True, db_index=True)

    class Meta:
        db_table = "core_certification_record"
        verbose_name = "Certification Record"
        verbose_name_plural = "Certification Records"
        ordering = ["-date_issued"]
        constraints = [
            models.UniqueConstraint(
                fields=["template", "learner"],
                name="unique_certification_per_learner",
            )
        ]

    def __str__(self) -> str:
        return f"{self.learner} — {self.template.title}"

    def clean(self) -> None:
        from django.core.exceptions import ValidationError

        if self.status == "issued" and self.pk:
            mc_count = self.microcredential_records.count()
            if mc_count < 3:
                raise ValidationError(
                    {"microcredential_records": f"Certification requires at least 3 microcredentials ({mc_count} linked). (PRD F-08)"}
                )
            if mc_count > 5:
                raise ValidationError(
                    {"microcredential_records": f"Certification requires at most 5 microcredentials ({mc_count} linked). (PRD §12)"}
                )


class GrowthProfile(BaseUUIDModel):
    """5-layer Growth Tree snapshot for a learner (PRD §2.2, §3.2)."""

    learner = models.OneToOneField(
        "Learner",
        on_delete=models.CASCADE,
        related_name="growth_profile",
    )
    roots_score = models.JSONField(
        default=dict,
        help_text=(
            "Sub-scores per Roots dimension (each 0–100): "
            "wellbeing, confidence, motivation, self_management, "
            "collaboration, safe_tool_behaviour"
        ),
    )
    trunk_score = models.JSONField(
        default=dict,
        help_text=(
            "Sub-scores per Trunk dimension (each 0–100): "
            "numeracy, communication_written, communication_verbal, "
            "communication_visual, digital_fluency, data_fluency, making, tool_use"
        ),
    )
    branches = models.JSONField(
        default=list,
        help_text=(
            'Specialisation scores per pathway branch. '
            'Shape: [{"branch_name": str, "score": 0-100, "primary": bool}]'
        ),
    )
    leaves_count = models.PositiveIntegerField(
        default=0,
        help_text="Total submitted artifacts (Leaves). Kept in sync via signals.",
    )
    fruit_count = models.PositiveIntegerField(
        default=0,
        help_text="Total recognition objects earned — badges + microcredentials + certifications (Fruit). Kept in sync via signals.",
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "core_growth_profile"
        verbose_name = "Growth Profile"
        verbose_name_plural = "Growth Profiles"

    def __str__(self) -> str:
        return f"GrowthProfile({self.learner})"
