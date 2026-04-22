"""
Add CertificationRecord model (PRD §3.4).

Evidence constraints (PRD F-08, F-09):

1. capstone_artifact is a NON-NULLABLE ForeignKey with on_delete=PROTECT.
   This is enforced at the database level — a CertificationRecord row cannot
   be inserted without a valid Artifact PK.  This is the strongest guarantee
   available in the Django ORM and requires no application-layer code.

2. microcredential_records M2M: 3–5 required.
   Django M2M cannot enforce a min/max count in SQL, so this is checked in
   clean() when status transitions to 'issued'.

3. PROTECT on both capstone_artifact and template prevents data loss:
   - An artifact supporting a certification cannot be silently deleted.
   - A template cannot be deleted while issued certifications reference it.
"""

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0040_add_certification_template"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="CertificationRecord",
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
                        to="core.CertificationTemplate",
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="records",
                    ),
                ),
                (
                    "learner",
                    models.ForeignKey(
                        to="core.Learner",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="certification_records",
                    ),
                ),
                (
                    "program",
                    models.ForeignKey(
                        to="core.Program",
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="certification_records",
                    ),
                ),
                (
                    "reviewer",
                    models.ForeignKey(
                        to=settings.AUTH_USER_MODEL,
                        on_delete=django.db.models.deletion.SET_NULL,
                        null=True,
                        blank=True,
                        related_name="certification_records_reviewed",
                    ),
                ),
                (
                    "microcredential_records",
                    models.ManyToManyField(
                        to="core.MicrocredentialRecord",
                        related_name="certification_records",
                        blank=True,
                        help_text=(
                            "3–5 microcredentials required at issuance "
                            "(PRD F-08, §12)"
                        ),
                    ),
                ),
                # Non-nullable FK — DB-level evidence enforcement (PRD F-09).
                # PROTECT prevents deleting an artifact a certification depends on.
                (
                    "capstone_artifact",
                    models.ForeignKey(
                        to="core.Artifact",
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="certification_records",
                        help_text=(
                            "Required capstone artifact. Non-nullable = "
                            "DB-level evidence enforcement (PRD F-09)."
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
                "verbose_name": "Certification Record",
                "verbose_name_plural": "Certification Records",
                "db_table": "core_certification_record",
                "ordering": ["-date_issued"],
            },
        ),
        migrations.AddConstraint(
            model_name="certificationrecord",
            constraint=models.UniqueConstraint(
                fields=["template", "learner"],
                name="unique_certification_per_learner",
            ),
        ),
    ]
