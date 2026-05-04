"""
Add peer review fields to Module (PRD §4.5 F-19).

Modules must pass peer review before their status can change from Draft to Active.
Three fields track this workflow:
  - needs_review: set True when the author submits for review
  - reviewed_by:  FK to the reviewer (curriculum designer / dept lead)
  - reviewed_at:  timestamp when review was completed
"""

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0045_add_admin_override"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="module",
            name="needs_review",
            field=models.BooleanField(
                default=False,
                db_index=True,
                help_text="True when first designer has submitted this module for peer review",
            ),
        ),
        migrations.AddField(
            model_name="module",
            name="reviewed_by",
            field=models.ForeignKey(
                to=settings.AUTH_USER_MODEL,
                on_delete=django.db.models.deletion.SET_NULL,
                null=True,
                blank=True,
                related_name="modules_reviewed",
                help_text="Curriculum designer who completed the peer review",
            ),
        ),
        migrations.AddField(
            model_name="module",
            name="reviewed_at",
            field=models.DateTimeField(
                null=True,
                blank=True,
                help_text="Timestamp when the peer review was completed",
            ),
        ),
        migrations.AddIndex(
            model_name="module",
            index=models.Index(
                fields=["needs_review", "status"],
                name="module_review_status_idx",
            ),
        ),
    ]
