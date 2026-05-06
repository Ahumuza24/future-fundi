from __future__ import annotations

from django.conf import settings
from django.db import models

from .base import BaseUUIDModel, TenantModel
from .curriculum import Module
from .hierarchy import Pathway
from .learner import Learner


class TeacherTask(BaseUUIDModel):
    """A task/to-do item created by a teacher.

    Teachers can create tasks to manage their workload, lesson plans,
    reminders, and other duties.
    """

    PRIORITY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
        ("urgent", "Urgent"),
    ]
    STATUS_CHOICES = [
        ("todo", "To Do"),
        ("in_progress", "In Progress"),
        ("done", "Done"),
    ]

    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tasks",
        limit_choices_to={"role": "teacher"},
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    due_date = models.DateField(null=True, blank=True, db_index=True)
    priority = models.CharField(
        max_length=10, choices=PRIORITY_CHOICES, default="medium", db_index=True
    )
    status = models.CharField(
        max_length=15, choices=STATUS_CHOICES, default="todo", db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "core_teacher_task"
        verbose_name = "Teacher Task"
        verbose_name_plural = "Teacher Tasks"
        ordering = ["due_date", "-priority"]

    def __str__(self) -> str:
        return f"{self.title} ({self.teacher.get_full_name()})"


class PodClass(TenantModel):
    """Class scheduling entity."""

    name = models.CharField(max_length=255)
    schedule = models.JSONField(
        default=dict,
        help_text='e.g., {"days": ["Mon","Wed"], "time": "14:00"}',
    )


class Session(TenantModel):
    """Learning session delivered by a teacher.

    Represents a single teaching session with learners.
    Teachers mark attendance and capture artifacts per session.
    """

    STATUS_CHOICES = [
        ("scheduled", "Scheduled"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]

    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sessions_taught",
        limit_choices_to={"role": "teacher"},
        help_text="Teacher delivering this session",
    )
    module = models.ForeignKey(
        Module,
        on_delete=models.CASCADE,
        related_name="sessions",
        help_text="Module/curriculum being taught",
    )
    learners = models.ManyToManyField(
        Learner,
        through="Attendance",
        related_name="sessions_attended",
        help_text="Learners in this session",
    )
    date = models.DateField(db_index=True, help_text="Session date")
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="scheduled", db_index=True
    )
    attendance_marked = models.BooleanField(default=False, db_index=True)
    notes = models.TextField(blank=True, help_text="Session notes or observations")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "core_session"
        verbose_name = "Session"
        verbose_name_plural = "Sessions"
        ordering = ["-date", "-start_time"]
        indexes = [
            models.Index(fields=["teacher", "date"]),
            models.Index(fields=["status", "date"]),
        ]

    def __str__(self) -> str:
        return f"{self.module.name} - {self.date} ({self.teacher.get_full_name()})"


class Attendance(BaseUUIDModel):
    """Attendance record for a learner in a session."""

    STATUS_CHOICES = [
        ("present", "Present"),
        ("absent", "Absent"),
        ("late", "Late"),
        ("excused", "Excused"),
    ]

    session = models.ForeignKey(
        Session, on_delete=models.CASCADE, related_name="attendance_records"
    )
    learner = models.ForeignKey(
        Learner, on_delete=models.CASCADE, related_name="attendance_records"
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="present", db_index=True
    )
    marked_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "core_attendance"
        verbose_name = "Attendance"
        verbose_name_plural = "Attendance Records"
        unique_together = [["session", "learner"]]
        ordering = ["-marked_at"]

    def __str__(self) -> str:
        return f"{self.learner.full_name} - {self.session} ({self.status})"


class Activity(BaseUUIDModel):
    """Upcoming activities for learners.

    Managed by curriculum designers or admin users via the content management system.
    """

    STATUS_CHOICES = [
        ("upcoming", "Upcoming"),
        ("ongoing", "Ongoing"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]

    name = models.CharField(max_length=255, db_index=True)
    description = models.TextField(blank=True)
    date = models.DateField(db_index=True, help_text="Activity date")
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    location = models.CharField(max_length=255, blank=True)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="upcoming", db_index=True
    )
    course = models.ForeignKey(
        Pathway,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="activities",
        help_text="Related pathway",
    )
    media_files = models.JSONField(
        default=list, blank=True, help_text="List of media file references"
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="activities_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "core_activity"
        verbose_name = "Activity"
        verbose_name_plural = "Activities"
        ordering = ["date", "start_time"]

    def __str__(self) -> str:
        return f"{self.name} - {self.date}"
