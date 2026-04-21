"""
Add Program model — sits between Track and Module in the learning hierarchy.

  Pathway
    └── Track
          └── Program  ← new
                └── Module (linked in 0034)

A Program bundles a module sequence leading to a certification.
The `level` field maps to the PRD's four competency levels
(Explorer → Builder → Practitioner → Pre-Professional).
"""

import uuid

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0029_add_track_model"),
    ]

    operations = [
        migrations.CreateModel(
            name="Program",
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
                    "track",
                    models.ForeignKey(
                        to="core.Track",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="programs",
                        help_text="Parent track this program belongs to",
                    ),
                ),
                (
                    "title",
                    models.CharField(
                        max_length=255,
                        db_index=True,
                        help_text="e.g. 'Robotics Foundations Program'",
                    ),
                ),
                (
                    "level",
                    models.CharField(
                        choices=[
                            ("explorer", "Explorer"),
                            ("builder", "Builder"),
                            ("practitioner", "Practitioner"),
                            ("pre_professional", "Pre-Professional"),
                        ],
                        default="explorer",
                        max_length=24,
                        db_index=True,
                        help_text=(
                            "Competency level for this program. "
                            "Levels are skill-based, not age-based."
                        ),
                    ),
                ),
                (
                    "description",
                    models.TextField(
                        blank=True,
                        help_text=(
                            "Learner-facing outcome statement, e.g. "
                            "'By the end you will be able to...'"
                        ),
                    ),
                ),
                (
                    "sequence_order",
                    models.PositiveIntegerField(
                        default=1,
                        help_text="Display order within the parent track (1-based)",
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("draft", "Draft"),
                            ("active", "Active"),
                            ("archived", "Archived"),
                        ],
                        default="draft",
                        max_length=16,
                        db_index=True,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "Program",
                "verbose_name_plural": "Programs",
                "db_table": "core_program",
                "ordering": ["track", "sequence_order"],
                "constraints": [
                    models.UniqueConstraint(
                        fields=["track", "sequence_order"],
                        name="unique_program_order_per_track",
                    )
                ],
            },
        ),
    ]
