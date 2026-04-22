"""
Add LessonProgress model (PRD §9).

Tracks per-learner completion of individual Lessons within a Unit.
GateService uses this to determine whether the previous Lesson in sequence
is complete before opening the next one.
"""

import uuid

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0043_add_module_progress"),
    ]

    operations = [
        migrations.CreateModel(
            name="LessonProgress",
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
                    "learner",
                    models.ForeignKey(
                        to="core.Learner",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="lesson_progress",
                    ),
                ),
                (
                    "lesson",
                    models.ForeignKey(
                        to="core.Lesson",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="learner_progress",
                    ),
                ),
                (
                    "completed",
                    models.BooleanField(default=False, db_index=True),
                ),
                (
                    "completed_at",
                    models.DateTimeField(null=True, blank=True),
                ),
            ],
            options={
                "verbose_name": "Lesson Progress",
                "verbose_name_plural": "Lesson Progress",
                "db_table": "core_lesson_progress",
            },
        ),
        migrations.AddConstraint(
            model_name="lessonprogress",
            constraint=models.UniqueConstraint(
                fields=["learner", "lesson"],
                name="unique_lesson_progress_per_learner",
            ),
        ),
    ]
