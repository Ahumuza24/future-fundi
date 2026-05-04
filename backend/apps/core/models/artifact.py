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
