"""
Add ModuleProgress model (PRD §3.6).

Tracks per-learner progress through a Module, including attendance,
artifact submission, reflection, teacher verification, and quiz state.
GateService reads completion_status to determine if a learner may advance
to the next Module in sequence.
"""

import uuid

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0042_add_growth_profile"),
    ]

    operations = [
        migrations.CreateModel(
            name="ModuleProgress",
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
                    models.ForeignKey(
                        to="core.Learner",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="module_progress",
                    ),
                ),
                (
                    "module",
                    models.ForeignKey(
                        to="core.Module",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="learner_progress",
                    ),
                ),
                (
                    "units_completed",
                    models.PositiveIntegerField(default=0),
                ),
                (
                    "units_total",
                    models.PositiveIntegerField(default=0),
                ),
                (
                    "attendance_count",
                    models.PositiveIntegerField(default=0),
                ),
                (
                    "artifact_submitted",
                    models.BooleanField(default=False),
                ),
                (
                    "reflection_submitted",
                    models.BooleanField(default=False),
                ),
                (
                    "teacher_verified",
                    models.BooleanField(default=False),
                ),
                (
                    "quiz_passed",
                    models.BooleanField(default=False),
                ),
                (
                    "microcredential_eligible",
                    models.BooleanField(default=False),
                ),
                (
                    "completion_status",
                    models.CharField(
                        max_length=20,
                        choices=[
                            ("not_started", "Not Started"),
                            ("in_progress", "In Progress"),
                            ("partial_complete", "Partial Complete"),
                            ("complete", "Complete"),
                        ],
                        default="not_started",
                        db_index=True,
                    ),
                ),
            ],
            options={
                "verbose_name": "Module Progress",
                "verbose_name_plural": "Module Progress",
                "db_table": "core_module_progress",
            },
        ),
        migrations.AddConstraint(
            model_name="moduleprogress",
            constraint=models.UniqueConstraint(
                fields=["learner", "module"],
                name="unique_module_progress_per_learner",
            ),
        ),
    ]
