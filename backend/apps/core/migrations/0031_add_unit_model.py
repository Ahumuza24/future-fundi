"""
Add Unit model — sits between Module and Lesson in the learning hierarchy.

  Module
    └── Unit  ← new
          └── Lesson (coming in 0032)

Each unit has observable badge criteria and an unlock gate so learners
always see what is ahead (preview mode) but can only interact once the
gate is cleared (PRD §9.2).
"""

import uuid

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0030_add_program_model"),
    ]

    operations = [
        migrations.CreateModel(
            name="Unit",
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
                    "module",
                    models.ForeignKey(
                        to="core.Module",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="units",
                        help_text="Parent module this unit belongs to",
                    ),
                ),
                (
                    "title",
                    models.CharField(
                        max_length=255,
                        db_index=True,
                    ),
                ),
                (
                    "learning_objectives",
                    models.JSONField(
                        default=list,
                        help_text="2–4 observable learning objectives for this unit",
                    ),
                ),
                (
                    "sequence_order",
                    models.PositiveIntegerField(
                        default=1,
                        help_text="Display order within the parent module (1-based)",
                    ),
                ),
                (
                    "badge_criteria",
                    models.TextField(
                        blank=True,
                        help_text=(
                            "Observable skill description used to award the badge "
                            "linked to this unit"
                        ),
                    ),
                ),
                # unlock_gate stores the rule for when this unit becomes accessible.
                # Shape: {"type": "previous_unit" | "open", "ref_id": UUID | null}
                (
                    "unlock_gate",
                    models.JSONField(
                        default=dict,
                        help_text=(
                            'Gate rule: {"type": "previous_unit"|"open", '
                            '"ref_id": "<uuid>"|null}'
                        ),
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
                "verbose_name": "Unit",
                "verbose_name_plural": "Units",
                "db_table": "core_unit",
                "ordering": ["module", "sequence_order"],
                "constraints": [
                    models.UniqueConstraint(
                        fields=["module", "sequence_order"],
                        name="unique_unit_order_per_module",
                    )
                ],
            },
        ),
    ]
