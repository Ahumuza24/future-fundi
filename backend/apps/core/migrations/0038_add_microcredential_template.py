"""
Add MicrocredentialTemplate model (PRD §3.4).

MicrocredentialTemplate is the reusable definition of a microcredential.
Each Module has at most one MicrocredentialTemplate (OneToOne).
Actual issued instances are MicrocredentialRecord (0039).
"""

import uuid

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0037_add_badge_record"),
    ]

    operations = [
        migrations.CreateModel(
            name="MicrocredentialTemplate",
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
                    models.OneToOneField(
                        to="core.Module",
                        on_delete=django.db.models.deletion.SET_NULL,
                        null=True,
                        blank=True,
                        related_name="microcredential_template",
                        help_text=(
                            "Module whose full completion triggers this "
                            "microcredential"
                        ),
                    ),
                ),
                (
                    "title",
                    models.CharField(max_length=255, db_index=True),
                ),
                (
                    "description",
                    models.TextField(blank=True),
                ),
            ],
            options={
                "verbose_name": "Microcredential Template",
                "verbose_name_plural": "Microcredential Templates",
                "db_table": "core_microcredential_template",
                "ordering": ["title"],
            },
        ),
    ]
