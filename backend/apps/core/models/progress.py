from __future__ import annotations

from django.db import models
from django.utils import timezone

from .base import BaseUUIDModel
from .curriculum import CourseLevel, Module
from .delivery import Lesson
from .hierarchy import Pathway
from .learner import Learner


class LearnerCourseEnrollment(BaseUUIDModel):
    """Tracks which pathways a learner is enrolled in.

    Learners are enrolled by admins/program leads based on age eligibility.
    """

    learner = models.ForeignKey(
        Learner, on_delete=models.CASCADE, related_name="course_enrollments"
    )
    course = models.ForeignKey(
        Pathway, on_delete=models.CASCADE, related_name="enrollments"
    )
    current_level = models.ForeignKey(
        CourseLevel,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="current_learners",
        help_text="Current level the learner is on",
    )
    enrolled_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(
        null=True, blank=True, help_text="When all levels completed"
    )
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        db_table = "core_learner_course_enrollment"
        verbose_name = "Course Enrollment"
        verbose_name_plural = "Course Enrollments"
        unique_together = [["learner", "course"]]
        ordering = ["-enrolled_at"]

    def __str__(self) -> str:
        level_info = (
            f"Level {self.current_level.level_number}" if self.current_level else "Not started"
        )
        return f"{self.learner.full_name} in {self.course.name} ({level_info})"

    def get_completed_levels(self):
        return self.level_progress.filter(completed=True).order_by("level__level_number")

    def check_and_promote(self) -> bool:
        if not self.current_level:
            return False
        try:
            progress = self.level_progress.get(level=self.current_level)
        except LearnerLevelProgress.DoesNotExist:
            return False
        if not progress.is_complete():
            return False
        if not progress.completed:
            progress.completed = True
            progress.completed_at = timezone.now()
            progress.save()
        next_level = CourseLevel.objects.filter(
            course=self.course, level_number=self.current_level.level_number + 1
        ).first()
        if next_level:
            self.current_level = next_level
            self.save()
            LearnerLevelProgress.objects.get_or_create(enrollment=self, level=next_level)
            return True
        self.completed_at = timezone.now()
        self.save()
        return True


class LearnerLevelProgress(BaseUUIDModel):
    """Tracks a learner's progress within a specific level."""

    enrollment = models.ForeignKey(
        LearnerCourseEnrollment, on_delete=models.CASCADE, related_name="level_progress"
    )
    level = models.ForeignKey(
        CourseLevel, on_delete=models.CASCADE, related_name="learner_progress"
    )
    modules_completed = models.PositiveIntegerField(default=0)
    completed_module_ids = models.JSONField(
        default=list,
        blank=True,
        help_text="List of completed module IDs for this learner at this level.",
    )
    artifacts_submitted = models.PositiveIntegerField(default=0)
    assessment_score = models.PositiveIntegerField(default=0, help_text="Best assessment score")
    teacher_confirmed = models.BooleanField(default=False)
    completed = models.BooleanField(default=False, db_index=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    started_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "core_learner_level_progress"
        verbose_name = "Level Progress"
        verbose_name_plural = "Level Progress Records"
        unique_together = [["enrollment", "level"]]
        ordering = ["level__level_number"]

    def __str__(self) -> str:
        status = "✓" if self.completed else f"{self.completion_percentage}%"
        return f"{self.enrollment.learner.full_name} - {self.level} ({status})"

    @property
    def completion_percentage(self) -> int:
        if not self.level:
            return 0
        criteria_met = 0
        total_criteria = 3
        if self.modules_completed >= self.level.required_modules_count:
            criteria_met += 1
        if self.artifacts_submitted >= self.level.required_artifacts_count:
            criteria_met += 1
        if self.assessment_score >= self.level.required_assessment_score:
            criteria_met += 1
        if self.level.requires_teacher_confirmation:
            total_criteria += 1
            if self.teacher_confirmed:
                criteria_met += 1
        return int((criteria_met / total_criteria) * 100)

    def is_complete(self) -> bool:
        if not self.level:
            return False
        modules_ok = self.modules_completed >= self.level.required_modules_count
        artifacts_ok = self.artifacts_submitted >= self.level.required_artifacts_count
        assessment_ok = self.assessment_score >= self.level.required_assessment_score
        if self.level.requires_teacher_confirmation:
            return modules_ok and artifacts_ok and assessment_ok and self.teacher_confirmed
        return modules_ok and artifacts_ok and assessment_ok

    def update_progress(
        self,
        modules: int | None = None,
        artifacts: int | None = None,
        score: int | None = None,
    ) -> None:
        if modules is not None:
            self.modules_completed = modules
        if artifacts is not None:
            self.artifacts_submitted = artifacts
        if score is not None and score > self.assessment_score:
            self.assessment_score = score
        self.save()
        self.enrollment.check_and_promote()


class ModuleProgress(BaseUUIDModel):
    """Tracks a learner's progress through a Module (PRD §3.6)."""

    STATUS_NOT_STARTED = "not_started"
    STATUS_IN_PROGRESS = "in_progress"
    STATUS_PARTIAL = "partial_complete"
    STATUS_COMPLETE = "complete"
    COMPLETION_STATUS_CHOICES = [
        (STATUS_NOT_STARTED, "Not Started"),
        (STATUS_IN_PROGRESS, "In Progress"),
        (STATUS_PARTIAL, "Partial Complete"),
        (STATUS_COMPLETE, "Complete"),
    ]

    learner = models.ForeignKey(
        "Learner", on_delete=models.CASCADE, related_name="module_progress"
    )
    module = models.ForeignKey(
        Module, on_delete=models.CASCADE, related_name="learner_progress"
    )
    units_completed = models.PositiveIntegerField(default=0)
    units_total = models.PositiveIntegerField(default=0)
    attendance_count = models.PositiveIntegerField(default=0)
    artifact_submitted = models.BooleanField(default=False)
    reflection_submitted = models.BooleanField(default=False)
    teacher_verified = models.BooleanField(default=False)
    quiz_passed = models.BooleanField(default=False)
    microcredential_eligible = models.BooleanField(default=False)
    completion_status = models.CharField(
        max_length=20,
        choices=COMPLETION_STATUS_CHOICES,
        default=STATUS_NOT_STARTED,
        db_index=True,
    )

    class Meta:
        db_table = "core_module_progress"
        verbose_name = "Module Progress"
        verbose_name_plural = "Module Progress"
        constraints = [
            models.UniqueConstraint(
                fields=["learner", "module"],
                name="unique_module_progress_per_learner",
            )
        ]

    def __str__(self) -> str:
        return f"{self.learner} — {self.module} ({self.completion_status})"

    @property
    def completion_pct(self) -> int:
        if self.units_total <= 0:
            return 0
        return round(self.units_completed / self.units_total * 100)

    @property
    def status(self) -> str:
        return self.completion_status

    @property
    def is_complete(self) -> bool:
        return self.completion_status == self.STATUS_COMPLETE


class LessonProgress(BaseUUIDModel):
    """Tracks whether a learner has completed a Lesson (PRD §9)."""

    learner = models.ForeignKey(
        "Learner", on_delete=models.CASCADE, related_name="lesson_progress"
    )
    lesson = models.ForeignKey(
        Lesson, on_delete=models.CASCADE, related_name="learner_progress"
    )
    completed = models.BooleanField(default=False, db_index=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "core_lesson_progress"
        verbose_name = "Lesson Progress"
        verbose_name_plural = "Lesson Progress"
        constraints = [
            models.UniqueConstraint(
                fields=["learner", "lesson"],
                name="unique_lesson_progress_per_learner",
            )
        ]

    def __str__(self) -> str:
        status = "complete" if self.completed else "incomplete"
        return f"{self.learner} — {self.lesson} ({status})"
