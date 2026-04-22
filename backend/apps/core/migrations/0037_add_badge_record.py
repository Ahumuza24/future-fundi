"""
Add BadgeRecord model (PRD §3.4).

BadgeRecord is an issued badge instance for a specific learner.
The legacy Badge model is left untouched for backward compatibility.

Evidence constraint (PRD F-09):
  - artifacts M2M is blank=True at the DB level (Django M2M cannot enforce
    min-count in SQL).
  - The constraint fires at the application layer: clean() raises ValidationError
    when status transitions to 'issued' without at least one linked artifact.
  - The serializer must call full_clean() before saving to enforce this.
"""

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0036_add_badge_template"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="BadgeRecord",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        primary_key=True,
                        default=uuid.uuid4,
                        editable=False,
                    ),
                ),
                (
                    "template",
                    models.ForeignKey(
                        to="core.BadgeTemplate",
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="records",
                        help_text="Badge template this record is an instance of",
                    ),
                ),
                (
                    "learner",
                    models.ForeignKey(
                        to="core.Learner",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="badge_records",
                    ),
                ),
                (
                    "issuer",
                    models.ForeignKey(
                        to=settings.AUTH_USER_MODEL,
                        on_delete=django.db.models.deletion.SET_NULL,
                        null=True,
                        blank=True,
                        related_name="badge_records_issued",
                    ),
                ),
                (
                    "artifacts",
                    models.ManyToManyField(
                        to="core.Artifact",
                        related_name="badge_records",
                        blank=True,
                        help_text=(
                            "Evidence supporting this badge. "
                            "At least one required at issuance (PRD F-09)."
                        ),
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("draft", "Draft"),
                            ("issued", "Issued"),
                            ("revoked", "Revoked"),
                        ],
                        default="draft",
                        max_length=10,
                        db_index=True,
                    ),
                ),
                (
                    "source",
                    models.CharField(
                        choices=[
                            ("digital", "Digital"),
                            ("offline_card_sync", "Offline Card Sync"),
                        ],
                        default="digital",
                        max_length=20,
                    ),
                ),
                (
                    "verification_ref",
                    models.CharField(
                        max_length=255,
                        blank=True,
                        help_text=(
                            "External verification reference "
                            "(e.g. Open Badges assertion URL)"
                        ),
                    ),
                ),
                (
                    "date_awarded",
                    models.DateTimeField(null=True, blank=True, db_index=True),
                ),
            ],
            options={
                "verbose_name": "Badge Record",
                "verbose_name_plural": "Badge Records",
                "db_table": "core_badge_record",
                "ordering": ["-date_awarded"],
            },
        ),
        migrations.AddConstraint(
            model_name="badgerecord",
            constraint=models.UniqueConstraint(
                fields=["template", "learner"],
                name="unique_badge_per_learner",
            ),
        ),
    ]
