"""
Rename Course → Pathway and add PRD-required fields:
  icon, color, age_band_min, age_band_target, status.

The DB table is also renamed from core_course → core_pathway.
All existing FK columns on related models (course_id) remain unchanged
in the database; only the Django model name in the migration state changes.
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0027_artifact_optional_tenant"),
    ]

    operations = [
        # 1. Rename the model in Django's migration state.
        #    All ForeignKey references to 'Course' are auto-updated to 'Pathway'
        #    by the migration framework; the underlying DB columns stay as
        #    `course_id` on related tables.
        migrations.RenameModel(
            old_name="Course",
            new_name="Pathway",
        ),
        # 2. Rename the physical DB table.
        migrations.AlterModelTable(
            name="pathway",
            table="core_pathway",
        ),
        # 3. Update verbose names and ordering to match new identity.
        migrations.AlterModelOptions(
            name="pathway",
            options={
                "ordering": ["name"],
                "verbose_name": "Pathway",
                "verbose_name_plural": "Pathways",
                "indexes": [],
            },
        ),
        # 4. Add PRD fields -------------------------------------------------
        migrations.AddField(
            model_name="pathway",
            name="icon",
            field=models.CharField(
                blank=True,
                default="",
                max_length=100,
                help_text="Icon name, emoji, or URL for this pathway",
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="pathway",
            name="color",
            field=models.CharField(
                blank=True,
                default="#3B82F6",
                max_length=7,
                help_text="Hex color code for UI theming (e.g. #3B82F6)",
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="pathway",
            name="age_band_min",
            field=models.PositiveIntegerField(
                default=6,
                help_text="Minimum recommended age for this pathway",
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="pathway",
            name="age_band_target",
            field=models.PositiveIntegerField(
                default=12,
                help_text="Target/ideal starting age for this pathway",
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="pathway",
            name="status",
            field=models.CharField(
                choices=[
                    ("draft", "Draft"),
                    ("active", "Active"),
                    ("archived", "Archived"),
                ],
                default="draft",
                max_length=16,
                db_index=True,
                help_text="Publication status; only Active pathways are visible to learners",
            ),
        ),
    ]
