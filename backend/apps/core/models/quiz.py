from __future__ import annotations

from django.conf import settings
from django.db import models

from .base import BaseUUIDModel, School, TenantModel
from .curriculum import Module
from .learner import Learner


class Quiz(TenantModel):
    """Quiz/Assessment created by teachers.

    Supports multiple-choice questions with auto-grading.
    """

    title = models.CharField(max_length=255, db_index=True)
    description = models.TextField(blank=True)
    module = models.ForeignKey(
        Module,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="quizzes",
        help_text="Module this quiz is associated with",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="quizzes_created",
        limit_choices_to={"role": "teacher"},
        help_text="Teacher who created this quiz",
    )
    questions = models.JSONField(
        default=list,
        help_text='List: [{"question": "...", "options": ["A","B","C"], "correct_answer": 0}]',
    )
    passing_score = models.IntegerField(
        default=70, help_text="Minimum score to pass (0-100)"
    )
    time_limit_minutes = models.IntegerField(
        null=True, blank=True, help_text="Time limit in minutes (optional)"
    )
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "core_quiz"
        verbose_name = "Quiz"
        verbose_name_plural = "Quizzes"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.title} by {self.created_by.get_full_name()}"


class QuizAttempt(BaseUUIDModel):
    """Student's attempt at completing a quiz."""

    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="attempts")
    learner = models.ForeignKey(
        Learner, on_delete=models.CASCADE, related_name="quiz_attempts"
    )
    answers = models.JSONField(
        default=list, help_text="List of answer indices, e.g. [0, 2, 1, 3]"
    )
    score = models.IntegerField(help_text="Score achieved (0-100)")
    passed = models.BooleanField(default=False, help_text="Whether the student passed")
    feedback = models.TextField(
        blank=True, help_text="Teacher's feedback on this attempt"
    )
    graded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="quiz_attempts_graded",
        limit_choices_to={"role": "teacher"},
    )
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    tenant = models.ForeignKey(
        School,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )

    class Meta:
        db_table = "core_quiz_attempt"
        verbose_name = "Quiz Attempt"
        verbose_name_plural = "Quiz Attempts"
        ordering = ["-started_at"]
        indexes = [
            models.Index(fields=["learner", "quiz"]),
            models.Index(fields=["quiz", "completed_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.learner.full_name} - {self.quiz.title} ({self.score}%)"
