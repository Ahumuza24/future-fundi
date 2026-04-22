"""
Add GrowthProfile model (PRD §2.2, §3.2).

One profile per learner (OneToOne). Stores the 5-layer Growth Tree data:
  Roots   → wellbeing, confidence, motivation, self-management,
             collaboration, safe tool behaviour
  Trunk   → numeracy, communication, digital/data fluency, making, tool use
  Branches → pathway-specific specialisation scores
  Leaves  → denormalised artifact count (updated by signals)
  Fruit   → denormalised recognition count (updated by signals)

The JSON shape for roots_score and trunk_score is intentionally open so
the curriculum team can add new dimensions without a schema migration.
"""

import uuid

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0041_add_certification_record"),
    ]

    operations = [
        migrations.CreateModel(
            name="GrowthProfile",
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
                    "learner",
                    models.OneToOneField(
                        to="core.Learner",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="growth_profile",
                    ),
                ),
                (
                    "roots_score",
                    models.JSONField(
                        default=dict,
                        help_text=(
                            "Sub-scores per Roots dimension (each 0–100): "
                            "wellbeing, confidence, motivation, self_management, "
                            "collaboration, safe_tool_behaviour"
                        ),
                    ),
                ),
                (
                    "trunk_score",
                    models.JSONField(
                        default=dict,
                        help_text=(
                            "Sub-scores per Trunk dimension (each 0–100): "
                            "numeracy, communication_written, communication_verbal, "
                            "communication_visual, digital_fluency, data_fluency, "
                            "making, tool_use"
                        ),
                    ),
                ),
                (
                    "branches",
                    models.JSONField(
                        default=list,
                        help_text=(
                            "Specialisation scores per pathway branch. "
                            'Shape: [{"branch_name": str, "score": 0-100, '
                            '"primary": bool}]'
                        ),
                    ),
                ),
                (
                    "leaves_count",
                    models.PositiveIntegerField(
                        default=0,
                        help_text=(
                            "Total submitted artifacts (Leaves). "
                            "Kept in sync via signals."
                        ),
                    ),
                ),
                (
                    "fruit_count",
                    models.PositiveIntegerField(
                        default=0,
                        help_text=(
                            "Total recognition objects earned — badges + "
                            "microcredentials + certifications (Fruit). "
                            "Kept in sync via signals."
                        ),
                    ),
                ),
                (
                    "updated_at",
                    models.DateTimeField(auto_now=True),
                ),
            ],
            options={
                "verbose_name": "Growth Profile",
                "verbose_name_plural": "Growth Profiles",
                "db_table": "core_growth_profile",
            },
        ),
    ]
