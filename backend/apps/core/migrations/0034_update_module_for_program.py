"""
Update Module model to align with PRD §3.3.

Changes:
  - Add `program` FK (nullable) — Module now belongs to Program, not Course/Pathway.
    The old `course` FK is left in place as a deprecated nullable field so
    existing data and API code are not broken. It can be removed in a
    follow-up migration once the data has been migrated.
  - Add `outcome_statement`  — "Learner can…" sentence (PRD §3.3 Module)
  - Add `duration_sessions`  — expected number of sessions to complete
  - Add `teacher_notes`      — facilitator-only field, never shown to learners
  - Add `unlock_gate`        — JSON gate rule (PRD §9.1)
  - Add `sequence_order`     — display order within parent Program
  - Add `status`             — Draft / Active / Archived lifecycle

The `microcredential_id` FK (FK → MicrocredentialTemplate) is deferred until
the MicrocredentialTemplate model is created in Phase 2.
"""

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0033_add_learning_task_model"),
    ]

    operations = [
        # --- new FK to Program (nullable until existing modules are reassigned) ---
        migrations.AddField(
            model_name="module",
            name="program",
            field=models.ForeignKey(
                to="core.Program",
                on_delete=django.db.models.deletion.SET_NULL,
                null=True,
                blank=True,
                related_name="modules",
                help_text=(
                    "Program this module belongs to. "
                    "Replaces the legacy `course` FK once data is migrated."
                ),
            ),
        ),
        # --- PRD §3.3 content fields -----------------------------------------
        migrations.AddField(
            model_name="module",
            name="outcome_statement",
            field=models.CharField(
                max_length=500,
                blank=True,
                default="",
                help_text="One sentence: 'Learner can…' shown to learners",
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="module",
            name="duration_sessions",
            field=models.PositiveIntegerField(
                null=True,
                blank=True,
                help_text="Expected number of sessions to complete this module",
            ),
        ),
        # Teacher-only field — NEVER exposed to learners or parents (PRD §5.2).
        migrations.AddField(
            model_name="module",
            name="teacher_notes",
            field=models.TextField(
                blank=True,
                help_text=(
                    "Facilitator notes (misconceptions, differentiation tips). "
                    "Teacher-only — never shown to learners or parents."
                ),
            ),
        ),
        migrations.AddField(
            model_name="module",
            name="unlock_gate",
            field=models.JSONField(
                default=dict,
                help_text=(
                    'Gate rule: {"type": "previous_module"|"badge_set"|"none", '
                    '"ref_id": "<uuid>"|null}'
                ),
            ),
        ),
        migrations.AddField(
            model_name="module",
            name="sequence_order",
            field=models.PositiveIntegerField(
                default=1,
                help_text="Display order within the parent program (1-based)",
            ),
        ),
        migrations.AddField(
            model_name="module",
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
                help_text=(
                    "Only Active modules are visible to learners. "
                    "Status change Draft→Active requires peer review (PRD §4.5 F-19)."
                ),
            ),
        ),
    ]
