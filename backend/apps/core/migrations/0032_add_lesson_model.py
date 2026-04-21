"""
Add Lesson model — sits between Unit and LearningTask in the learning hierarchy.

  Unit
    └── Lesson  ← new
          └── LearningTask (coming in 0033)

Key design points:
- learner_content and teacher_content are stored separately so teacher-only
  material (rubrics, facilitator guides, timing notes) is never exposed to
  learners (PRD §5.2, §8.3).
- resource_links is a JSON list: [{"url": "...", "title": "...", "type": "learner"|"teacher"}]
- completion_trigger controls how the lesson is marked done.
- unlock_gate mirrors the Unit pattern (PRD §9.1).
"""

import uuid

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0031_add_unit_model"),
    ]

    operations = [
        migrations.CreateModel(
            name="Lesson",
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
                    models.ForeignKey(
                        to="core.Unit",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="lessons",
                        help_text="Parent unit this lesson belongs to",
                    ),
                ),
                (
                    "title",
                    models.CharField(
                        max_length=255,
                        db_index=True,
                    ),
                ),
                (
                    "duration_minutes",
                    models.PositiveIntegerField(
                        default=60,
                        help_text="Expected session duration in minutes",
                    ),
                ),
                (
                    "learner_objectives",
                    models.JSONField(
                        default=list,
                        help_text="Objectives visible to learners for this lesson",
                    ),
                ),
                # Learner-facing instructional content (unlocked once gate cleared).
                (
                    "learner_content",
                    models.TextField(
                        blank=True,
                        help_text="Rich text / markdown content shown to learners",
                    ),
                ),
                # Teacher-only: facilitation guide, timing notes, common mistakes.
                # NEVER exposed to learners or parents (PRD §5.2).
                (
                    "teacher_content",
                    models.TextField(
                        blank=True,
                        help_text=(
                            "Facilitator guide — teacher-only. "
                            "Never exposed to learners or parents."
                        ),
                    ),
                ),
                (
                    "resource_links",
                    models.JSONField(
                        default=list,
                        help_text=(
                            'Links list: [{"url":"...", "title":"...", '
                            '"type":"learner"|"teacher"}]'
                        ),
                    ),
                ),
                (
                    "unlock_gate",
                    models.JSONField(
                        default=dict,
                        help_text=(
                            'Gate rule: {"type": "previous_lesson"|"unit_open", '
                            '"ref_id": "<uuid>"|null}'
                        ),
                    ),
                ),
                (
                    "completion_trigger",
                    models.CharField(
                        choices=[
                            ("task_submission", "Task Submission"),
                            ("teacher_sign_off", "Teacher Sign-Off"),
                            ("auto_on_time", "Auto on Time"),
                        ],
                        default="task_submission",
                        max_length=24,
                        help_text="What marks this lesson as complete",
                    ),
                ),
                (
                    "sequence_order",
                    models.PositiveIntegerField(
                        default=1,
                        help_text="Display order within the parent unit (1-based)",
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
                "verbose_name": "Lesson",
                "verbose_name_plural": "Lessons",
                "db_table": "core_lesson",
                "ordering": ["unit", "sequence_order"],
                "constraints": [
                    models.UniqueConstraint(
                        fields=["unit", "sequence_order"],
                        name="unique_lesson_order_per_unit",
                    )
                ],
            },
        ),
    ]
