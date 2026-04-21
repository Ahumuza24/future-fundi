"""
Add LearningTask model — the bottom layer of the learning hierarchy.

  Lesson
    └── LearningTask  ← new

Named LearningTask (not Task) to avoid confusion with TeacherTask.

Key design points:
- teacher_rubric and answer_key are NEVER exposed to learners or parents
  (PRD §5.2, §8.3).
- evidence_required + artifact_type enforce the PRD hard constraint:
  no recognition without linked evidence (PRD F-09, F-16).
- completion_trigger mirrors the Lesson pattern.
- type covers all six task variants from PRD §3.3.
"""

import uuid

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0032_add_lesson_model"),
    ]

    operations = [
        migrations.CreateModel(
            name="LearningTask",
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
                    "lesson",
                    models.ForeignKey(
                        to="core.Lesson",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="tasks",
                        help_text="Parent lesson this task belongs to",
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
                    "type",
                    models.CharField(
                        choices=[
                            ("observation", "Observation"),
                            ("submission", "Submission"),
                            ("quiz", "Quiz"),
                            ("reflection", "Reflection"),
                            ("practical", "Practical"),
                            ("peer_review", "Peer Review"),
                        ],
                        max_length=16,
                        db_index=True,
                        help_text="Category of task the learner must perform",
                    ),
                ),
                # Learner-facing instructions (visible once parent lesson unlocked).
                (
                    "learner_instructions",
                    models.TextField(
                        help_text="Step-by-step instructions shown to the learner",
                    ),
                ),
                # Teacher-only fields — NEVER exposed to learners or parents.
                (
                    "teacher_rubric",
                    models.TextField(
                        blank=True,
                        help_text=(
                            "Marking rubric — teacher-only. "
                            "Never exposed to learners or parents."
                        ),
                    ),
                ),
                (
                    "answer_key",
                    models.TextField(
                        blank=True,
                        help_text=(
                            "Expected output / answer key — teacher-only. "
                            "Never exposed to learners or parents."
                        ),
                    ),
                ),
                (
                    "evidence_required",
                    models.BooleanField(
                        default=False,
                        help_text=(
                            "If True, learner must submit an artifact to complete "
                            "this task (PRD F-09: no recognition without evidence)."
                        ),
                    ),
                ),
                # artifact_type is only meaningful when evidence_required=True.
                (
                    "artifact_type",
                    models.CharField(
                        choices=[
                            ("photo", "Photo"),
                            ("file", "File"),
                            ("text", "Text"),
                            ("video", "Video"),
                            ("code", "Code"),
                            ("link", "Link"),
                        ],
                        max_length=8,
                        null=True,
                        blank=True,
                        help_text="Expected artifact format when evidence_required is True",
                    ),
                ),
                (
                    "completion_trigger",
                    models.CharField(
                        choices=[
                            ("submission", "Submission"),
                            ("teacher_verification", "Teacher Verification"),
                            ("auto", "Auto"),
                        ],
                        default="submission",
                        max_length=24,
                        help_text="What marks this task as complete",
                    ),
                ),
                (
                    "sequence_order",
                    models.PositiveIntegerField(
                        default=1,
                        help_text="Display order within the parent lesson (1-based)",
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "Learning Task",
                "verbose_name_plural": "Learning Tasks",
                "db_table": "core_learning_task",
                "ordering": ["lesson", "sequence_order"],
                "constraints": [
                    models.UniqueConstraint(
                        fields=["lesson", "sequence_order"],
                        name="unique_task_order_per_lesson",
                    )
                ],
            },
        ),
    ]
