"""
Add Track model — sits between Pathway and Program in the learning hierarchy.

  Pathway
    └── Track  ← new
          └── Program (coming in 0030)
"""

import uuid

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0028_rename_course_to_pathway"),
    ]

    operations = [
        migrations.CreateModel(
            name="Track",
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
                    "pathway",
                    models.ForeignKey(
                        to="core.Pathway",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="tracks",
                        help_text="Parent pathway this track belongs to",
                    ),
                ),
                (
                    "title",
                    models.CharField(
                        max_length=255,
                        db_index=True,
                        help_text="Specialisation name, e.g. 'Robot Programming'",
                    ),
                ),
                (
                    "description",
                    models.TextField(
                        blank=True,
                        help_text="Learner-facing description of this track",
                    ),
                ),
                (
                    "sequence_order",
                    models.PositiveIntegerField(
                        default=1,
                        help_text="Display order within the parent pathway (1-based)",
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
                "verbose_name": "Track",
                "verbose_name_plural": "Tracks",
                "db_table": "core_track",
                "ordering": ["pathway", "sequence_order"],
                "constraints": [
                    models.UniqueConstraint(
                        fields=["pathway", "sequence_order"],
                        name="unique_track_order_per_pathway",
                    )
                ],
            },
        ),
    ]
