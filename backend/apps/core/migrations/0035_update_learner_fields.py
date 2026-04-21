"""
Update Learner model to align with PRD §3.1.

Changes:
  - Add `level`           — competency level (Explorer / Builder / Practitioner /
                            Pre-Professional). Skill-based, NOT age-based (PRD §2.3).
  - Add `age_band`        — informational grouping; nullable so existing records
                            without a DOB are not forced into a band.
  - Add `current_track`   — FK to Track; set when learner is enrolled in a track.
  - Add `current_program` — FK to Program; set when learner is enrolled in a program.

`current_pathway_id` from the PRD is already served by the existing
`LearnerCourseEnrollment.course` (now pointing at Pathway after 0028).
`current_module_id` is tracked via Session and LearnerLevelProgress.
Both are therefore not duplicated here.
"""

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0034_update_module_for_program"),
    ]

    operations = [
        migrations.AddField(
            model_name="learner",
            name="level",
            field=models.CharField(
                choices=[
                    ("explorer", "Explorer"),
                    ("builder", "Builder"),
                    ("practitioner", "Practitioner"),
                    ("pre_professional", "Pre-Professional"),
                ],
                default="explorer",
                max_length=24,
                db_index=True,
                help_text=(
                    "Competency level — skill-based, not age-based (PRD §2.3). "
                    "A 14-year-old joining for the first time starts at Explorer."
                ),
            ),
        ),
        migrations.AddField(
            model_name="learner",
            name="age_band",
            field=models.CharField(
                choices=[
                    ("6-8", "6–8"),
                    ("9-12", "9–12"),
                    ("13-15", "13–15"),
                    ("16-18", "16–18"),
                ],
                max_length=8,
                null=True,
                blank=True,
                db_index=True,
                help_text=(
                    "Informational age grouping. "
                    "Computed from date_of_birth; can be set manually if DOB unknown."
                ),
            ),
        ),
        migrations.AddField(
            model_name="learner",
            name="current_track",
            field=models.ForeignKey(
                to="core.Track",
                on_delete=django.db.models.deletion.SET_NULL,
                null=True,
                blank=True,
                related_name="current_learners",
                help_text="Track the learner is currently enrolled in",
            ),
        ),
        migrations.AddField(
            model_name="learner",
            name="current_program",
            field=models.ForeignKey(
                to="core.Program",
                on_delete=django.db.models.deletion.SET_NULL,
                null=True,
                blank=True,
                related_name="current_learners",
                help_text="Program the learner is currently enrolled in",
            ),
        ),
    ]
