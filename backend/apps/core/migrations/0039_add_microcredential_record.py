"""
Add MicrocredentialRecord model (PRD §3.4).

Evidence constraint (PRD F-07, F-09):
  - artifacts M2M is blank=True at the DB level.
  - clean() raises ValidationError when status='issued' and no artifacts linked.
  - The serializer must call full_clean() before saving.

badge_records M2M tracks which BadgeRecords contributed — optional but auditable.
"""

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0038_add_microcredential_template"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="MicrocredentialRecord",
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
                        to="core.MicrocredentialTemplate",
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="records",
                    ),
                ),
                (
                    "learner",
                    models.ForeignKey(
                        to="core.Learner",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="microcredential_records",
                    ),
                ),
                (
                    "module",
                    models.ForeignKey(
                        to="core.Module",
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="microcredential_records",
                        help_text="Module this microcredential was awarded for",
                    ),
                ),
                (
                    "issuer",
                    models.ForeignKey(
                        to=settings.AUTH_USER_MODEL,
                        on_delete=django.db.models.deletion.SET_NULL,
                        null=True,
                        blank=True,
                        related_name="microcredential_records_issued",
                    ),
                ),
                (
                    "badge_records",
                    models.ManyToManyField(
                        to="core.BadgeRecord",
                        related_name="microcredential_records",
                        blank=True,
                        help_text=(
                            "Badge records earned during this module "
                            "that contributed here"
                        ),
                    ),
                ),
                (
                    "artifacts",
                    models.ManyToManyField(
                        to="core.Artifact",
                        related_name="microcredential_records",
                        blank=True,
                        help_text=(
                            "Evidence supporting this microcredential. "
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
                    "date_issued",
                    models.DateTimeField(null=True, blank=True, db_index=True),
                ),
            ],
            options={
                "verbose_name": "Microcredential Record",
                "verbose_name_plural": "Microcredential Records",
                "db_table": "core_microcredential_record",
                "ordering": ["-date_issued"],
            },
        ),
        migrations.AddConstraint(
            model_name="microcredentialrecord",
            constraint=models.UniqueConstraint(
                fields=["template", "learner"],
                name="unique_microcredential_per_learner",
            ),
        ),
    ]
