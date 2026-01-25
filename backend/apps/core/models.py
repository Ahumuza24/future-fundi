from __future__ import annotations

import uuid

from django.conf import settings
from django.db import models

from .managers import TenantManager


class BaseUUIDModel(models.Model):
    """Base model with UUID primary key."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Meta:
        abstract = True


class School(BaseUUIDModel):
    """Tenant entity representing a school."""

    name = models.CharField(max_length=255, db_index=True)
    code = models.CharField(max_length=64, unique=True)

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.name} ({self.code})"


class TenantModel(BaseUUIDModel):
    """Abstract model for tenant-scoped entities."""

    tenant = models.ForeignKey(School, on_delete=models.CASCADE)

    objects = TenantManager()

    class Meta:
        abstract = True


class Learner(BaseUUIDModel):
    """Learner profile owned by a parent user.

    Learners can optionally have their own user accounts for logging in.
    They are managed by their parent who has a User account with role='parent'.
    One parent can have multiple children.

    Note: Tenant is optional to allow parents to register children before
    being assigned to a school.
    """

    tenant = models.ForeignKey(
        School,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text="School/organization (optional until parent is assigned)",
    )
    parent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="children",
        limit_choices_to={"role": "parent"},
        help_text="Parent/guardian who manages this learner",
    )
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="learner_profile",
        null=True,
        blank=True,
        help_text="Optional user account for the learner to log in",
    )
    first_name = models.CharField(max_length=128)
    last_name = models.CharField(max_length=128)
    date_of_birth = models.DateField(
        null=True, blank=True, help_text="Child's date of birth"
    )
    current_school = models.CharField(
        max_length=255, blank=True, default="", help_text="Current school name"
    )
    current_class = models.CharField(
        max_length=100, blank=True, default="", help_text="Current class/grade"
    )
    consent_media = models.BooleanField(
        default=False, db_index=True, help_text="Parent consent for media capture"
    )
    equity_flag = models.BooleanField(
        default=False, db_index=True, help_text="Requires additional support"
    )
    joined_at = models.DateField(
        null=True, blank=True, help_text="Date enrolled in program"
    )

    # Use default manager instead of TenantManager
    objects = models.Manager()

    class Meta:
        db_table = "core_learner"
        verbose_name = "Learner"
        verbose_name_plural = "Learners"
        ordering = ["first_name", "last_name"]
        indexes = [
            models.Index(fields=["parent", "tenant"]),
        ]

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.first_name} {self.last_name}"

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"

    @property
    def age(self) -> int | None:
        """Calculate age from date of birth."""
        if not self.date_of_birth:
            return None
        from datetime import date

        today = date.today()
        return (
            today.year
            - self.date_of_birth.year
            - (
                (today.month, today.day)
                < (self.date_of_birth.month, self.date_of_birth.day)
            )
        )


class ParentContact(TenantModel):
    """Parent/guardian contact with preferred channels."""

    learner = models.ForeignKey(
        Learner, on_delete=models.CASCADE, related_name="parents"
    )
    whatsapp = models.CharField(max_length=32, blank=True)
    sms = models.CharField(max_length=32, blank=True)
    email = models.EmailField(blank=True)
    preferred_channel = models.CharField(max_length=16, default="whatsapp")
    language = models.CharField(max_length=8, default="en")


class Artifact(TenantModel):
    """Weekly learner artifact (photos, metrics, reflection)."""

    learner = models.ForeignKey(
        Learner, on_delete=models.CASCADE, related_name="artifacts"
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="artifacts_created",
        help_text="Teacher who captured this artifact",
    )
    title = models.CharField(max_length=255)
    reflection = models.TextField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True, db_index=True)
    media_refs = models.JSONField(default=list)  # e.g., [{"s3_key": "..."}]


class Module(BaseUUIDModel):
    """Curriculum module catalog - Global content shared across all schools."""

    name = models.CharField(max_length=255, db_index=True)
    description = models.TextField(blank=True)

    # Rich content fields
    content = models.TextField(
        blank=True, help_text="Rich text content, videos, images"
    )
    suggested_activities = models.JSONField(
        default=list, blank=True, help_text="List of activities"
    )
    materials = models.JSONField(
        default=list, blank=True, help_text="List of materials"
    )
    competences = models.JSONField(
        default=list, blank=True, help_text="List of competencies"
    )

    # Media files (images, videos) - stored as list of file URLs/paths
    media_files = models.JSONField(
        default=list,
        blank=True,
        help_text="List of uploaded media files [{type, url, name}]",
    )

    # Link to a primary course (Pathway) - optional if shared, but useful for hierarchy
    course = models.ForeignKey(
        "Course",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="modules",
        help_text="Primary pathway this module belongs to",
    )

    objects = models.Manager()  # Explicit default manager


class Assessment(TenantModel):
    """Mini-assessments linked to a learner."""

    learner = models.ForeignKey(
        "Learner", on_delete=models.CASCADE, related_name="assessments"
    )
    module = models.ForeignKey(
        "Module", on_delete=models.SET_NULL, null=True, blank=True
    )
    score = models.IntegerField(default=0)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)


class PathwayInputs(TenantModel):
    """Inputs for pathway scoring."""

    learner = models.ForeignKey(
        "Learner", on_delete=models.CASCADE, related_name="pathway_inputs"
    )
    interest_persistence = models.IntegerField(default=0)
    skill_readiness = models.IntegerField(default=0)
    enjoyment = models.IntegerField(default=0)
    local_demand = models.IntegerField(default=0)
    breadth = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)


class GateSnapshot(TenantModel):
    """Historical snapshot of pathway data and gate determination."""

    learner = models.ForeignKey(
        "Learner", on_delete=models.CASCADE, related_name="gate_snapshots"
    )
    score = models.IntegerField(default=0)
    gate = models.CharField(max_length=16, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)


class Credential(TenantModel):
    """Micro-credential earned by learners."""

    learner = models.ForeignKey(
        "Learner", on_delete=models.CASCADE, related_name="credentials"
    )
    name = models.CharField(max_length=255)
    issuer = models.CharField(max_length=255, blank=True)
    issued_at = models.DateField(null=True, blank=True, db_index=True)


class Outcome(TenantModel):
    """Outcomes such as shadow days or internships."""

    learner = models.ForeignKey(
        "Learner", on_delete=models.CASCADE, related_name="outcomes"
    )
    type = models.CharField(max_length=64, db_index=True)
    occurred_at = models.DateField(null=True, blank=True, db_index=True)
    notes = models.TextField(blank=True)


class PodClass(TenantModel):
    """Class scheduling entity."""

    name = models.CharField(max_length=255)
    schedule = models.JSONField(
        default=dict
    )  # e.g., {"days": ["Mon","Wed"], "time": "14:00"}


class Observation(TenantModel):
    """Teacher observations for learners."""

    learner = models.ForeignKey(
        "Learner", on_delete=models.CASCADE, related_name="observations"
    )
    text = models.TextField()
    observed_at = models.DateTimeField(auto_now_add=True, db_index=True)


class WeeklyPulse(TenantModel):
    """Student mood check-ins."""

    learner = models.ForeignKey(
        "Learner", on_delete=models.CASCADE, related_name="weekly_pulses"
    )
    mood = models.IntegerField(default=0, db_index=True)  # 0-100 or enum mapping
    win = models.TextField(blank=True)
    worry = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)


class SafetyIncident(TenantModel):
    """Incident tracking."""

    learner = models.ForeignKey(
        "Learner", on_delete=models.CASCADE, related_name="incidents"
    )
    description = models.TextField()
    severity = models.CharField(max_length=16, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)


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
        "Module",
        on_delete=models.CASCADE,
        related_name="sessions",
        help_text="Module/curriculum being taught",
    )
    learners = models.ManyToManyField(
        "Learner",
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
        "Session", on_delete=models.CASCADE, related_name="attendance_records"
    )
    learner = models.ForeignKey(
        "Learner", on_delete=models.CASCADE, related_name="attendance_records"
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


# =============================================================================
# COURSES & LEVELS SYSTEM
# =============================================================================


class Course(BaseUUIDModel):
    """A structured course within a domain for a specific age band.

    Courses are created by Super Admins and contain progressive levels.
    Learners are enrolled in courses based on their age.

    Examples:
    - Robotics for Ages 6-8
    - Coding Foundations for Ages 9-12
    """

    name = models.CharField(max_length=255, db_index=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Optional tenant scope (None = global course available to all schools)
    tenant = models.ForeignKey(
        School,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text="If set, course is only for this school. If null, available globally.",
    )

    class Meta:
        db_table = "core_course"
        verbose_name = "Course"
        verbose_name_plural = "Courses"
        ordering = ["name"]
        indexes = [
            models.Index(fields=["is_active"]),
        ]

    def __str__(self) -> str:
        return f"{self.name}"


class Career(BaseUUIDModel):
    """Potential careers linked to a pathway (Course) - Global content."""

    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="careers")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    objects = models.Manager()  # Explicit default manager

    def __str__(self) -> str:
        return f"{self.title} ({self.course.name})"


class CourseLevel(BaseUUIDModel):
    """A progressive level within a course.

    Each level has completion criteria that must be met before
    the learner can progress to the next level.
    """

    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="levels")
    level_number = models.PositiveIntegerField(
        default=1, help_text="Order of this level (1, 2, 3...)"
    )
    name = models.CharField(max_length=255, help_text="e.g., 'Level 1: Foundations'")
    description = models.TextField(blank=True)
    learning_outcomes = models.JSONField(
        default=list, help_text="List of learning outcomes for this level"
    )

    # Completion requirements
    required_modules_count = models.PositiveIntegerField(
        default=4, help_text="Number of modules to complete"
    )
    required_artifacts_count = models.PositiveIntegerField(
        default=6, help_text="Minimum artifacts to submit"
    )
    required_assessment_score = models.PositiveIntegerField(
        default=70, help_text="Minimum assessment score (0-100)"
    )
    requires_teacher_confirmation = models.BooleanField(
        default=False, help_text="If true, teacher must confirm completion"
    )

    # Linked modules (optional - for tracking which specific modules are required)
    required_modules = models.ManyToManyField(
        Module,
        blank=True,
        related_name="course_levels",
        help_text="Specific modules required for this level",
    )

    class Meta:
        db_table = "core_course_level"
        verbose_name = "Course Level"
        verbose_name_plural = "Course Levels"
        ordering = ["course", "level_number"]
        unique_together = [["course", "level_number"]]

    def __str__(self) -> str:
        return f"{self.course.name} - Level {self.level_number}: {self.name}"


class LearnerCourseEnrollment(BaseUUIDModel):
    """Tracks which courses a learner is enrolled in.

    Learners are enrolled by admins/program leads based on age eligibility.
    """

    learner = models.ForeignKey(
        Learner, on_delete=models.CASCADE, related_name="course_enrollments"
    )
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="enrollments"
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
            f"Level {self.current_level.level_number}"
            if self.current_level
            else "Not started"
        )
        return f"{self.learner.full_name} in {self.course.name} ({level_info})"

    def get_completed_levels(self):
        """Get all completed levels for this enrollment."""
        return self.level_progress.filter(completed=True).order_by(
            "level__level_number"
        )

    def check_and_promote(self):
        """Check if learner can be promoted to next level and do so if eligible.

        Returns True if promotion occurred, False otherwise.
        """
        if not self.current_level:
            return False

        # Get progress for current level
        try:
            progress = self.level_progress.get(level=self.current_level)
        except LearnerLevelProgress.DoesNotExist:
            return False

        # Check if all criteria are met
        if not progress.is_complete():
            return False

        # Mark current level as completed
        if not progress.completed:
            progress.completed = True
            from django.utils import timezone

            progress.completed_at = timezone.now()
            progress.save()

        # Find next level
        next_level = CourseLevel.objects.filter(
            course=self.course, level_number=self.current_level.level_number + 1
        ).first()

        if next_level:
            # Promote to next level
            self.current_level = next_level
            self.save()

            # Create progress record for new level
            LearnerLevelProgress.objects.get_or_create(
                enrollment=self, level=next_level
            )
            return True
        else:
            # Course completed!
            from django.utils import timezone

            self.completed_at = timezone.now()
            self.save()
            return True

        return False


class LearnerLevelProgress(BaseUUIDModel):
    """Tracks a learner's progress within a specific level.

    Progress data is updated by teachers as they:
    - Mark module completion
    - Capture artifacts
    - Record assessments
    """

    enrollment = models.ForeignKey(
        LearnerCourseEnrollment, on_delete=models.CASCADE, related_name="level_progress"
    )
    level = models.ForeignKey(
        CourseLevel, on_delete=models.CASCADE, related_name="learner_progress"
    )

    # Progress tracking
    modules_completed = models.PositiveIntegerField(default=0)
    artifacts_submitted = models.PositiveIntegerField(default=0)
    assessment_score = models.PositiveIntegerField(
        default=0, help_text="Best assessment score"
    )
    teacher_confirmed = models.BooleanField(default=False)

    # Completion status
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
        """Calculate overall completion percentage."""
        if not self.level:
            return 0

        criteria_met = 0
        total_criteria = 3  # modules, artifacts, assessment

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
        """Check if all completion criteria are met."""
        if not self.level:
            return False

        modules_ok = self.modules_completed >= self.level.required_modules_count
        artifacts_ok = self.artifacts_submitted >= self.level.required_artifacts_count
        assessment_ok = self.assessment_score >= self.level.required_assessment_score

        if self.level.requires_teacher_confirmation:
            return (
                modules_ok and artifacts_ok and assessment_ok and self.teacher_confirmed
            )

        return modules_ok and artifacts_ok and assessment_ok

    def update_progress(
        self, modules: int = None, artifacts: int = None, score: int = None
    ):
        """Update progress and check for auto-promotion."""
        if modules is not None:
            self.modules_completed = modules
        if artifacts is not None:
            self.artifacts_submitted = artifacts
        if score is not None and score > self.assessment_score:
            self.assessment_score = score

        self.save()

        # Check for auto-promotion
        self.enrollment.check_and_promote()


class Achievement(BaseUUIDModel):
    """Badges/achievements earned by learners.

    Awarded automatically when completing levels or manually by teachers.
    """

    ACHIEVEMENT_TYPES = [
        ("level_complete", "Level Completed"),
        ("course_complete", "Course Completed"),
        ("skill_mastery", "Skill Mastery"),
        ("participation", "Participation"),
        ("special", "Special Achievement"),
    ]

    learner = models.ForeignKey(
        Learner, on_delete=models.CASCADE, related_name="achievements"
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    achievement_type = models.CharField(
        max_length=50, choices=ACHIEVEMENT_TYPES, default="level_complete"
    )
    icon = models.CharField(max_length=100, blank=True, help_text="Icon name or emoji")

    # Link to what earned it (optional)
    course = models.ForeignKey(Course, on_delete=models.SET_NULL, null=True, blank=True)
    level = models.ForeignKey(
        CourseLevel, on_delete=models.SET_NULL, null=True, blank=True
    )

    earned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "core_achievement"
        verbose_name = "Achievement"
        verbose_name_plural = "Achievements"
        ordering = ["-earned_at"]

    def __str__(self) -> str:
        return f"{self.learner.full_name} - {self.name}"
