"""
Add BadgeTemplate model (PRD §3.4).

BadgeTemplate is the reusable definition of a badge — title, criteria, icon.
Each Unit has at most one BadgeTemplate (OneToOne).
Actual issued instances are created as BadgeRecord (0037).
"""

import uuid

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0035_update_learner_fields"),
    ]

    operations = [
        migrations.CreateModel(
            name="BadgeTemplate",
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
                    "unit",
                    models.OneToOneField(
                        to="core.Unit",
                        on_delete=django.db.models.deletion.SET_NULL,
                        null=True,
                        blank=True,
                        related_name="badge_template",
                        help_text="Unit whose completion triggers this badge",
                    ),
                ),
                (
                    "title",
                    models.CharField(max_length=255, db_index=True),
                ),
                (
                    "criteria",
                    models.TextField(
                        help_text=(
                            "Observable, assessable description of what earns "
                            "this badge"
                        ),
                    ),
                ),
                (
                    "icon_url",
                    models.CharField(
                        max_length=500,
                        blank=True,
                        help_text="URL or storage path to the badge icon image",
                    ),
                ),
            ],
            options={
                "verbose_name": "Badge Template",
                "verbose_name_plural": "Badge Templates",
                "db_table": "core_badge_template",
                "ordering": ["title"],
            },
        ),
    ]
