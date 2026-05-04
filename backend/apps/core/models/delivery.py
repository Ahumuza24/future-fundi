from __future__ import annotations

from django.db import models

from .base import BaseUUIDModel
from .curriculum import Module


class Unit(BaseUUIDModel):
    """A topic cluster inside a Module (PRD §2.1, layer 5).

    Each Module contains 3–6 Units.
    Completing a Unit's observable criteria triggers badge issuance (PRD F-06).
    """

    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("active", "Active"),
        ("archived", "Archived"),
    ]

    module = models.ForeignKey(
        Module,
        on_delete=models.CASCADE,
        related_name="units",
        help_text="Parent module this unit belongs to",
    )
    title = models.CharField(max_length=255, db_index=True)
    learning_objectives = models.JSONField(
        default=list,
        help_text="2–4 observable learning objectives for this unit",
    )
    sequence_order = models.PositiveIntegerField(
        default=1, help_text="Display order within the parent module (1-based)"
    )
    badge_criteria = models.TextField(
        blank=True,
        help_text="Observable skill description used to award the badge linked to this unit",
    )
    unlock_gate = models.JSONField(
        default=dict,
        help_text='Gate rule: {"type": "previous_unit"|"open", "ref_id": "<uuid>"|null}',
    )
    status = models.CharField(
        max_length=16, choices=STATUS_CHOICES, default="draft", db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "core_unit"
        verbose_name = "Unit"
        verbose_name_plural = "Units"
        ordering = ["module", "sequence_order"]
        constraints = [
            models.UniqueConstraint(
                fields=["module", "sequence_order"],
                name="unique_unit_order_per_module",
            )
        ]

    def __str__(self) -> str:
        return f"{self.module.name} › {self.title}"


class Lesson(BaseUUIDModel):
    """A single instructional session inside a Unit (PRD §2.1, layer 6).

    Each Unit contains 2–4 Lessons.
    learner_content and teacher_content are stored separately so teacher-only
    material is never exposed to learners or parents (PRD §5.2, §8.3).
    """

    COMPLETION_TRIGGER_CHOICES = [
        ("task_submission", "Task Submission"),
        ("teacher_sign_off", "Teacher Sign-Off"),
        ("auto_on_time", "Auto on Time"),
    ]
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("active", "Active"),
        ("archived", "Archived"),
    ]

    unit = models.ForeignKey(
        Unit,
        on_delete=models.CASCADE,
        related_name="lessons",
        help_text="Parent unit this lesson belongs to",
    )
    title = models.CharField(max_length=255, db_index=True)
    duration_minutes = models.PositiveIntegerField(
        default=60, help_text="Expected session duration in minutes"
    )
    learner_objectives = models.JSONField(
        default=list, help_text="Objectives visible to learners for this lesson"
    )
    learner_content = models.TextField(
        blank=True, help_text="Rich text / markdown content shown to learners"
    )
    teacher_content = models.TextField(
        blank=True,
        help_text="Facilitator guide — teacher-only. Never exposed to learners or parents.",
    )
    resource_links = models.JSONField(
        default=list,
        help_text='Links list: [{"url":"...", "title":"...", "type":"learner"|"teacher"}]',
    )
    unlock_gate = models.JSONField(
        default=dict,
        help_text='Gate rule: {"type": "previous_lesson"|"unit_open", "ref_id": "<uuid>"|null}',
    )
    completion_trigger = models.CharField(
        max_length=24,
        choices=COMPLETION_TRIGGER_CHOICES,
        default="task_submission",
        help_text="What marks this lesson as complete",
    )
    sequence_order = models.PositiveIntegerField(
        default=1, help_text="Display order within the parent unit (1-based)"
    )
    status = models.CharField(
        max_length=16, choices=STATUS_CHOICES, default="draft", db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "core_lesson"
        verbose_name = "Lesson"
        verbose_name_plural = "Lessons"
        ordering = ["unit", "sequence_order"]
        constraints = [
            models.UniqueConstraint(
                fields=["unit", "sequence_order"],
                name="unique_lesson_order_per_unit",
            )
        ]

    def __str__(self) -> str:
        return f"{self.unit.title} › {self.title}"


class LearningTask(BaseUUIDModel):
    """A discrete learner action inside a Lesson (PRD §2.1, layer 7).

    Each Lesson contains 2–5 LearningTasks.
    Named LearningTask (not Task) to avoid confusion with TeacherTask.

    teacher_rubric and answer_key are NEVER exposed to learners or parents
    (PRD §5.2, §8.3).
    """

    TYPE_OBSERVATION = "observation"
    TYPE_SUBMISSION = "submission"
    TYPE_QUIZ = "quiz"
    TYPE_REFLECTION = "reflection"
    TYPE_PRACTICAL = "practical"
    TYPE_PEER_REVIEW = "peer_review"
    TYPE_CHOICES = [
        (TYPE_OBSERVATION, "Observation"),
        (TYPE_SUBMISSION, "Submission"),
        (TYPE_QUIZ, "Quiz"),
        (TYPE_REFLECTION, "Reflection"),
        (TYPE_PRACTICAL, "Practical"),
        (TYPE_PEER_REVIEW, "Peer Review"),
    ]
    ARTIFACT_TYPE_CHOICES = [
        ("photo", "Photo"),
        ("file", "File"),
        ("text", "Text"),
        ("video", "Video"),
        ("code", "Code"),
        ("link", "Link"),
    ]
    COMPLETION_TRIGGER_CHOICES = [
        ("submission", "Submission"),
        ("teacher_verification", "Teacher Verification"),
        ("auto", "Auto"),
    ]

    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name="tasks",
        help_text="Parent lesson this task belongs to",
    )
    title = models.CharField(max_length=255, db_index=True)
    type = models.CharField(
        max_length=16, choices=TYPE_CHOICES, db_index=True,
        help_text="Category of task the learner must perform",
    )
    learner_instructions = models.TextField(
        help_text="Step-by-step instructions shown to the learner"
    )
    teacher_rubric = models.TextField(
        blank=True,
        help_text="Marking rubric — teacher-only. Never exposed to learners or parents.",
    )
    answer_key = models.TextField(
        blank=True,
        help_text="Expected output / answer key — teacher-only. Never exposed to learners or parents.",
    )
    evidence_required = models.BooleanField(
        default=False,
        help_text=(
            "If True, learner must submit an artifact to complete this task "
            "(PRD F-09: no recognition without evidence)."
        ),
    )
    artifact_type = models.CharField(
        max_length=8,
        choices=ARTIFACT_TYPE_CHOICES,
        null=True,
        blank=True,
        help_text="Expected artifact format when evidence_required is True",
    )
    completion_trigger = models.CharField(
        max_length=24,
        choices=COMPLETION_TRIGGER_CHOICES,
        default="submission",
        help_text="What marks this task as complete",
    )
    sequence_order = models.PositiveIntegerField(
        default=1, help_text="Display order within the parent lesson (1-based)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "core_learning_task"
        verbose_name = "Learning Task"
        verbose_name_plural = "Learning Tasks"
        ordering = ["lesson", "sequence_order"]
        constraints = [
            models.UniqueConstraint(
                fields=["lesson", "sequence_order"],
                name="unique_task_order_per_lesson",
            )
        ]

    def __str__(self) -> str:
        return f"{self.lesson.title} › {self.title}"
