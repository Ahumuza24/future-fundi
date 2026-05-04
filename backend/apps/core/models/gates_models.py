from __future__ import annotations

from django.conf import settings
from django.db import models

from .base import BaseUUIDModel


class AdminOverride(BaseUUIDModel):
    """Audit log for admin gate overrides (PRD §3.7).

    Every override is write-once. The gate engine checks this table before
    rejecting a learner at any layer.
    """

    LAYER_CHOICES = [
        ("pathway", "Pathway"),
        ("track", "Track"),
        ("program", "Program"),
        ("module", "Module"),
        ("unit", "Unit"),
        ("lesson", "Lesson"),
        ("task", "Task"),
    ]

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="admin_overrides",
        help_text="Admin/teacher who granted this override",
    )
    learner = models.ForeignKey(
        "Learner",
        on_delete=models.CASCADE,
        related_name="admin_overrides",
    )
    layer = models.CharField(max_length=10, choices=LAYER_CHOICES, db_index=True)
    layer_ref_id = models.UUIDField(
        db_index=True,
        help_text="PK of the Pathway/Track/Program/Module/Unit/Lesson/Task being unlocked",
    )
    reason = models.TextField(help_text="Mandatory justification for the override")
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "core_admin_override"
        verbose_name = "Admin Override"
        verbose_name_plural = "Admin Overrides"
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["learner", "layer", "layer_ref_id"]),
        ]

    def __str__(self) -> str:
        return f"Override({self.layer}:{self.layer_ref_id}) for {self.learner} by {self.actor}"
