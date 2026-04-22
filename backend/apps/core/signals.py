"""
Django signals for apps.core.

Responsibilities:
  1. Keep GrowthProfile.leaves_count in sync with Artifact submissions.
  2. Keep GrowthProfile.fruit_count in sync with issued BadgeRecord,
     MicrocredentialRecord, and CertificationRecord rows.
  3. Auto-create a GrowthProfile when a Learner is created.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

if TYPE_CHECKING:
    from apps.core.models import Learner


# ---------------------------------------------------------------------------
# Auto-create GrowthProfile on Learner creation
# ---------------------------------------------------------------------------

@receiver(post_save, sender="core.Learner")
def create_growth_profile(sender: type, instance: "Learner", created: bool, **kwargs: object) -> None:
    if not created:
        return
    from apps.core.models import GrowthProfile

    GrowthProfile.objects.get_or_create(learner=instance)


# ---------------------------------------------------------------------------
# Leaves counter — tracks Artifact submissions
# ---------------------------------------------------------------------------

def _refresh_leaves(learner: "Learner") -> None:
    from apps.core.models import Artifact, GrowthProfile

    count = Artifact.objects.filter(learner=learner).count()
    GrowthProfile.objects.filter(learner=learner).update(leaves_count=count)


@receiver(post_save, sender="core.Artifact")
def artifact_saved(sender: type, instance: object, **kwargs: object) -> None:
    _refresh_leaves(instance.learner)  # type: ignore[attr-defined]


@receiver(post_delete, sender="core.Artifact")
def artifact_deleted(sender: type, instance: object, **kwargs: object) -> None:
    _refresh_leaves(instance.learner)  # type: ignore[attr-defined]


# ---------------------------------------------------------------------------
# Fruit counter — tracks issued recognition objects
# ---------------------------------------------------------------------------

def _refresh_fruit(learner: "Learner") -> None:
    from apps.core.models import (
        BadgeRecord,
        CertificationRecord,
        GrowthProfile,
        MicrocredentialRecord,
    )

    badges = BadgeRecord.objects.filter(learner=learner, status="issued").count()
    micros = MicrocredentialRecord.objects.filter(learner=learner, status="issued").count()
    certs = CertificationRecord.objects.filter(learner=learner, status="issued").count()
    GrowthProfile.objects.filter(learner=learner).update(fruit_count=badges + micros + certs)


@receiver(post_save, sender="core.BadgeRecord")
def badge_record_saved(sender: type, instance: object, **kwargs: object) -> None:
    _refresh_fruit(instance.learner)  # type: ignore[attr-defined]


@receiver(post_delete, sender="core.BadgeRecord")
def badge_record_deleted(sender: type, instance: object, **kwargs: object) -> None:
    _refresh_fruit(instance.learner)  # type: ignore[attr-defined]


@receiver(post_save, sender="core.MicrocredentialRecord")
def micro_record_saved(sender: type, instance: object, **kwargs: object) -> None:
    _refresh_fruit(instance.learner)  # type: ignore[attr-defined]


@receiver(post_delete, sender="core.MicrocredentialRecord")
def micro_record_deleted(sender: type, instance: object, **kwargs: object) -> None:
    _refresh_fruit(instance.learner)  # type: ignore[attr-defined]


@receiver(post_save, sender="core.CertificationRecord")
def cert_record_saved(sender: type, instance: object, **kwargs: object) -> None:
    _refresh_fruit(instance.learner)  # type: ignore[attr-defined]


@receiver(post_delete, sender="core.CertificationRecord")
def cert_record_deleted(sender: type, instance: object, **kwargs: object) -> None:
    _refresh_fruit(instance.learner)  # type: ignore[attr-defined]
