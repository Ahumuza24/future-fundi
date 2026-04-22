"""
Add AdminOverride model (PRD §3.7).

Write-once audit log for gate overrides. Every row records who granted the
override (actor), for whom (learner), at which layer, the specific object's
PK (layer_ref_id), the mandatory reason, and an auto timestamp.

GateService checks this table before rejecting a learner at any layer.
"""

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0044_add_lesson_progress"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="AdminOverride",
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
                    "actor",
                    models.ForeignKey(
                        to=settings.AUTH_USER_MODEL,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="admin_overrides",
                        help_text="Admin/teacher who granted this override",
                    ),
                ),
                (
                    "learner",
                    models.ForeignKey(
                        to="core.Learner",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="admin_overrides",
                    ),
                ),
                (
                    "layer",
                    models.CharField(
                        max_length=10,
                        choices=[
                            ("pathway", "Pathway"),
                            ("track", "Track"),
                            ("program", "Program"),
                            ("module", "Module"),
                            ("unit", "Unit"),
                            ("lesson", "Lesson"),
                            ("task", "Task"),
                        ],
                        db_index=True,
                    ),
                ),
                (
                    "layer_ref_id",
                    models.UUIDField(
                        db_index=True,
                        help_text=(
                            "PK of the Pathway/Track/Program/Module/Unit/Lesson/Task "
                            "being unlocked"
                        ),
                    ),
                ),
                (
                    "reason",
                    models.TextField(
                        help_text="Mandatory justification for the override"
                    ),
                ),
                (
                    "timestamp",
                    models.DateTimeField(auto_now_add=True, db_index=True),
                ),
            ],
            options={
                "verbose_name": "Admin Override",
                "verbose_name_plural": "Admin Overrides",
                "db_table": "core_admin_override",
                "ordering": ["-timestamp"],
            },
        ),
        migrations.AddIndex(
            model_name="adminoverride",
            index=models.Index(
                fields=["learner", "layer", "layer_ref_id"],
                name="admin_override_learner_layer_ref_idx",
            ),
        ),
    ]
