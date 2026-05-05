from __future__ import annotations

from django.conf import settings
from django.db import models

from .base import BaseUUIDModel, School, TenantModel


class Artifact(TenantModel):
    """Weekly learner artifact (photos, metrics, reflection)."""

    tenant = models.ForeignKey(
        School,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text="School/organization (optional for independent learners)",
    )
    learner = models.ForeignKey(
        "Learner", on_delete=models.CASCADE, related_name="artifacts"
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="artifacts_created",
        help_text="Teacher who captured this artifact",
    )
    title = models.CharField(max_length=255)
    reflection = models.TextField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True, db_index=True)
    media_refs = models.JSONField(default=list)
    module = models.ForeignKey(
        "Module",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="artifacts",
        help_text="The specific microcredential/module this artifact is tied to",
    )

    STATUS_PENDING = "pending"
    STATUS_APPROVED = "approved"
    STATUS_REJECTED = "rejected"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending Review"),
        (STATUS_APPROVED, "Approved"),
        (STATUS_REJECTED, "Rejected"),
    ]
    status = models.CharField(
        max_length=16,
        choices=STATUS_CHOICES,
        default=STATUS_APPROVED,
        db_index=True,
        help_text="Approval status; teacher-captured artifacts default to approved",
    )
    uploaded_by_student = models.BooleanField(
        default=False,
        db_index=True,
        help_text="True when submitted by the student directly",
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="artifacts_reviewed",
        help_text="Teacher who approved or rejected this student submission",
    )
    reviewed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the teacher reviewed this artifact",
    )
    rejection_reason = models.TextField(
        blank=True,
        help_text="Optional reason provided when rejecting a student artifact",
    )

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.title} ({self.learner})"


class Evidence(TenantModel):
    """Canonical evidence record used for progress and recognition decisions."""

    STATUS_PENDING = "pending"
    STATUS_VERIFIED = "verified"
    STATUS_REJECTED = "rejected"
    STATUS_CORRECTED = "corrected"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_VERIFIED, "Verified"),
        (STATUS_REJECTED, "Rejected"),
        (STATUS_CORRECTED, "Corrected"),
    ]

    tenant = models.ForeignKey(
        School,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text="School/organization scope for this evidence.",
    )
    learner = models.ForeignKey(
        "Learner",
        on_delete=models.CASCADE,
        related_name="evidence",
    )
    artifact = models.OneToOneField(
        "Artifact",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="evidence_record",
    )
    task = models.ForeignKey(
        "LearningTask",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="evidence",
    )
    unit = models.ForeignKey(
        "Unit",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="evidence",
    )
    module = models.ForeignKey(
        "Module",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="evidence",
    )
    badge_template = models.ForeignKey(
        "BadgeTemplate",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="evidence",
    )
    microcredential_template = models.ForeignKey(
        "MicrocredentialTemplate",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="evidence",
    )
    certification_template = models.ForeignKey(
        "CertificationTemplate",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="evidence",
    )
    verification_status = models.CharField(
        max_length=16,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
        db_index=True,
    )
    quality_rubric = models.JSONField(default=dict, blank=True)
    verifier = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="evidence_verified",
    )
    verified_at = models.DateTimeField(null=True, blank=True, db_index=True)
    offline_reference = models.CharField(max_length=255, blank=True, db_index=True)
    correction_of = models.ForeignKey(
        "self",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="corrections",
        help_text="Append-only correction lineage. Original evidence is never overwritten.",
    )
    correction_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "core_evidence"
        verbose_name = "Evidence"
        verbose_name_plural = "Evidence"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["learner", "verification_status"]),
            models.Index(fields=["module", "verification_status"]),
            models.Index(fields=["task", "verification_status"]),
        ]

    def __str__(self) -> str:
        return f"Evidence({self.learner}, {self.verification_status})"

    @property
    def is_usable_for_recognition(self) -> bool:
        artifact_approved = (
            self.artifact_id is None or self.artifact.status == Artifact.STATUS_APPROVED
        )
        return self.verification_status == self.STATUS_VERIFIED and artifact_approved
