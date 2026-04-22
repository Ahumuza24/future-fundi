"""
Add CertificationTemplate model (PRD §3.4).

CertificationTemplate is the reusable definition of a certification.
Each Program has at most one CertificationTemplate (OneToOne).
Actual issued instances are CertificationRecord (0041).
"""

import uuid

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0039_add_microcredential_record"),
    ]

    operations = [
        migrations.CreateModel(
            name="CertificationTemplate",
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
                    "program",
                    models.OneToOneField(
                        to="core.Program",
                        on_delete=django.db.models.deletion.SET_NULL,
                        null=True,
                        blank=True,
                        related_name="certification_template",
                        help_text=(
                            "Program whose full completion triggers this "
                            "certification"
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
                "verbose_name": "Certification Template",
                "verbose_name_plural": "Certification Templates",
                "db_table": "core_certification_template",
                "ordering": ["title"],
            },
        ),
    ]
