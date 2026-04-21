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
    """Abstract model for school-scoped entities.

    Note:
    - Database field remains `tenant` for backward compatibility.
    - Use `.school` / `.school_id` aliases in new code.
    """

    tenant = models.ForeignKey(School, on_delete=models.CASCADE)

    objects = TenantManager()

    class Meta:
        abstract = True

    @property
    def school(self):
        return self.tenant

    @school.setter
    def school(self, value):
        self.tenant = value

    @property
    def school_id(self):
        return self.tenant_id


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
        null=True,
        blank=True,
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

    # ── PRD §2.3 / §3.1 — competency level & age band ────────────────────────
    LEVEL_EXPLORER = "explorer"
    LEVEL_BUILDER = "builder"
    LEVEL_PRACTITIONER = "practitioner"
    LEVEL_PRE_PROFESSIONAL = "pre_professional"
    LEVEL_CHOICES = [
        (LEVEL_EXPLORER, "Explorer"),
        (LEVEL_BUILDER, "Builder"),
        (LEVEL_PRACTITIONER, "Practitioner"),
        (LEVEL_PRE_PROFESSIONAL, "Pre-Professional"),
    ]
    level = models.CharField(
        max_length=24,
        choices=LEVEL_CHOICES,
        default=LEVEL_EXPLORER,
        db_index=True,
        help_text=(
            "Competency level — skill-based, not age-based (PRD §2.3). "
            "A 14-year-old joining for the first time starts at Explorer."
        ),
    )

    AGE_BAND_6_8 = "6-8"
    AGE_BAND_9_12 = "9-12"
    AGE_BAND_13_15 = "13-15"
    AGE_BAND_16_18 = "16-18"
    AGE_BAND_CHOICES = [
        (AGE_BAND_6_8, "6–8"),
        (AGE_BAND_9_12, "9–12"),
        (AGE_BAND_13_15, "13–15"),
        (AGE_BAND_16_18, "16–18"),
    ]
    age_band = models.CharField(
        max_length=8,
        choices=AGE_BAND_CHOICES,
        null=True,
        blank=True,
        db_index=True,
        help_text=(
            "Informational age grouping. "
            "Computed from date_of_birth; can be set manually if DOB unknown."
        ),
    )

    # ── PRD §3.1 — current position in the learning hierarchy ────────────────
    current_track = models.ForeignKey(
        "Track",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="current_learners",
        help_text="Track the learner is currently enrolled in",
    )
    current_program = models.ForeignKey(
        "Program",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="current_learners",
        help_text="Program the learner is currently enrolled in",
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
    def school(self):
        """Backward-compatible alias: school == tenant."""
        return self.tenant

    @school.setter
    def school(self, value):
        self.tenant = value

    @property
    def school_id(self):
        return self.tenant_id

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

    # Override tenant to allow null for independent learners (not in formal schools)
    tenant = models.ForeignKey(
        School,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text="School/organization (optional for independent learners)",
    )

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
    module = models.ForeignKey(
        "Module",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="artifacts",
        help_text="The specific microcredential/module this artifact is tied to",
    )
    # ── Student upload & approval workflow ────────────────────────────────
    STATUS_PENDING = "pending"
    STATUS_APPROVED = "approved"
    STATUS_REJECTED = "rejected"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending Review"),
        (STATUS_APPROVED, "Approved"),
        (STATUS_REJECTED, "Rejected"),
    ]

    status = models.CharField(
        max_length=16,
        choices=STATUS_CHOICES,
        default=STATUS_APPROVED,
        db_index=True,
        help_text="Approval status; teacher-captured artifacts default to approved",
    )
    uploaded_by_student = models.BooleanField(
        default=False,
        db_index=True,
        help_text="True when submitted by the student directly",
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="artifacts_reviewed",
        help_text="Teacher who approved or rejected this student submission",
    )
    reviewed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the teacher reviewed this artifact",
    )
    rejection_reason = models.TextField(
        blank=True,
        help_text="Optional reason provided when rejecting a student artifact",
    )


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

    # ── PRD §3.3 — hierarchy link ─────────────────────────────────────────────
    # New canonical FK: Module → Program (the PRD hierarchy).
    # Nullable until existing modules are reassigned via a data migration.
    program = models.ForeignKey(
        "Program",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="modules",
        help_text=(
            "Program this module belongs to. "
            "Replaces the legacy `course` FK once data is migrated."
        ),
    )

    # Legacy FK kept for backward compatibility with existing API code.
    # Deprecated — use `program` for all new code.
    course = models.ForeignKey(
        "Pathway",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="modules",
        help_text="[Deprecated] Use `program` instead.",
    )

    # ── PRD §3.3 — instructional metadata ────────────────────────────────────
    outcome_statement = models.CharField(
        max_length=500,
        blank=True,
        default="",
        help_text="One sentence: 'Learner can…' shown to learners",
    )
    duration_sessions = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Expected number of sessions to complete this module",
    )

    # Teacher-only — NEVER exposed to learners or parents (PRD §5.2).
    teacher_notes = models.TextField(
        blank=True,
        help_text=(
            "Facilitator notes (misconceptions, differentiation tips). "
            "Teacher-only — never shown to learners or parents."
        ),
    )

    # unlock_gate: {"type": "previous_module"|"badge_set"|"none", "ref_id": UUID|null}
    unlock_gate = models.JSONField(
        default=dict,
        help_text=(
            'Gate rule: {"type": "previous_module"|"badge_set"|"none", '
            '"ref_id": "<uuid>"|null}'
        ),
    )
    sequence_order = models.PositiveIntegerField(
        default=1,
        help_text="Display order within the parent program (1-based)",
    )

    STATUS_DRAFT = "draft"
    STATUS_ACTIVE = "active"
    STATUS_ARCHIVED = "archived"
    STATUS_CHOICES = [
        (STATUS_DRAFT, "Draft"),
        (STATUS_ACTIVE, "Active"),
        (STATUS_ARCHIVED, "Archived"),
    ]
    status = models.CharField(
        max_length=16,
        choices=STATUS_CHOICES,
        default=STATUS_DRAFT,
        db_index=True,
        help_text=(
            "Only Active modules are visible to learners. "
            "Status change Draft→Active requires peer review (PRD §4.5 F-19)."
        ),
    )

    # Gamification (legacy — badge linking moves to BadgeTemplate in Phase 2)
    badge_name = models.CharField(
        max_length=255,
        blank=True,
        help_text="Name of the badge earned upon completion of this module",
    )

    objects = models.Manager()  # Explicit default manager


# =============================================================================
# LEARNING HIERARCHY — LOWER LAYERS (Unit → Lesson → LearningTask)
# Added in Phase 1 migrations 0031–0033 to complete the 7-layer PRD hierarchy.
# =============================================================================


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
        default=1,
        help_text="Display order within the parent module (1-based)",
    )
    badge_criteria = models.TextField(
        blank=True,
        help_text=(
            "Observable skill description used to award the badge "
            "linked to this unit"
        ),
    )
    # {"type": "previous_unit"|"open", "ref_id": UUID|null}
    unlock_gate = models.JSONField(
        default=dict,
        help_text=(
            'Gate rule: {"type": "previous_unit"|"open", '
            '"ref_id": "<uuid>"|null}'
        ),
    )
    status = models.CharField(
        max_length=16,
        choices=STATUS_CHOICES,
        default="draft",
        db_index=True,
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
        default=60,
        help_text="Expected session duration in minutes",
    )
    learner_objectives = models.JSONField(
        default=list,
        help_text="Objectives visible to learners for this lesson",
    )
    # Learner-facing — visible once the gate is cleared.
    learner_content = models.TextField(
        blank=True,
        help_text="Rich text / markdown content shown to learners",
    )
    # Teacher-only — NEVER exposed to learners or parents (PRD §5.2).
    teacher_content = models.TextField(
        blank=True,
        help_text=(
            "Facilitator guide — teacher-only. "
            "Never exposed to learners or parents."
        ),
    )
    # [{"url": "...", "title": "...", "type": "learner"|"teacher"}]
    resource_links = models.JSONField(
        default=list,
        help_text=(
            'Links list: [{"url":"...", "title":"...", '
            '"type":"learner"|"teacher"}]'
        ),
    )
    # {"type": "previous_lesson"|"unit_open", "ref_id": UUID|null}
    unlock_gate = models.JSONField(
        default=dict,
        help_text=(
            'Gate rule: {"type": "previous_lesson"|"unit_open", '
            '"ref_id": "<uuid>"|null}'
        ),
    )
    completion_trigger = models.CharField(
        max_length=24,
        choices=COMPLETION_TRIGGER_CHOICES,
        default="task_submission",
        help_text="What marks this lesson as complete",
    )
    sequence_order = models.PositiveIntegerField(
        default=1,
        help_text="Display order within the parent unit (1-based)",
    )
    status = models.CharField(
        max_length=16,
        choices=STATUS_CHOICES,
        default="draft",
        db_index=True,
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

    evidence_required enforces the PRD hard constraint: no badge,
    microcredential, or certification without at least one linked evidence
    object (PRD F-09).
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
        max_length=16,
        choices=TYPE_CHOICES,
        db_index=True,
        help_text="Category of task the learner must perform",
    )
    # Learner-facing — visible once parent lesson unlocked.
    learner_instructions = models.TextField(
        help_text="Step-by-step instructions shown to the learner",
    )
    # Teacher-only fields — NEVER exposed to learners or parents (PRD §5.2).
    teacher_rubric = models.TextField(
        blank=True,
        help_text=(
            "Marking rubric — teacher-only. "
            "Never exposed to learners or parents."
        ),
    )
    answer_key = models.TextField(
        blank=True,
        help_text=(
            "Expected output / answer key — teacher-only. "
            "Never exposed to learners or parents."
        ),
    )
    evidence_required = models.BooleanField(
        default=False,
        help_text=(
            "If True, learner must submit an artifact to complete this task "
            "(PRD F-09: no recognition without evidence)."
        ),
    )
    # Only meaningful when evidence_required=True.
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
        default=1,
        help_text="Display order within the parent lesson (1-based)",
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


class Pathway(BaseUUIDModel):
    """A broad future direction (e.g. Robotics, AI) — top of the learning hierarchy.

    Pathways are global (not school-scoped) and are created by admins.
    Each pathway contains 2–4 Tracks.  The eight defined pathways are listed
    in PRD §13.

    Was previously named 'Course' — renamed in migration 0028.
    """

    STATUS_DRAFT = "draft"
    STATUS_ACTIVE = "active"
    STATUS_ARCHIVED = "archived"
    STATUS_CHOICES = [
        (STATUS_DRAFT, "Draft"),
        (STATUS_ACTIVE, "Active"),
        (STATUS_ARCHIVED, "Archived"),
    ]

    name = models.CharField(max_length=255, db_index=True)
    description = models.TextField(blank=True)
    icon = models.CharField(
        max_length=100,
        blank=True,
        default="",
        help_text="Icon name, emoji, or URL for this pathway",
    )
    color = models.CharField(
        max_length=7,
        blank=True,
        default="#3B82F6",
        help_text="Hex color code for UI theming (e.g. #3B82F6)",
    )
    age_band_min = models.PositiveIntegerField(
        default=6,
        help_text="Minimum recommended age for this pathway",
    )
    age_band_target = models.PositiveIntegerField(
        default=12,
        help_text="Target/ideal starting age for this pathway",
    )
    status = models.CharField(
        max_length=16,
        choices=STATUS_CHOICES,
        default=STATUS_DRAFT,
        db_index=True,
        help_text="Publication status; only Active pathways are visible to learners",
    )
    # Legacy boolean kept so existing read-paths aren't broken; derive from status.
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Optional tenant scope (None = global pathway available to all schools)
    tenant = models.ForeignKey(
        School,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text="If set, pathway is only for this school. If null, available globally.",
    )

    teachers = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="courses_taught",
        blank=True,
        limit_choices_to={"role": "teacher"},
        help_text="Teachers assigned to this pathway",
    )

    class Meta:
        db_table = "core_pathway"
        verbose_name = "Pathway"
        verbose_name_plural = "Pathways"
        ordering = ["name"]
        indexes = [
            models.Index(fields=["is_active"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self) -> str:
        return f"{self.name}"


# Backward-compatibility alias — all existing `from apps.core.models import Course`
# statements (serializers, views, tests) keep working without any changes.
# New code should use `Pathway` directly.
Course = Pathway


class Track(BaseUUIDModel):
    """A specialisation within a Pathway (PRD §2.1, layer 2).

    Each Pathway contains 2–4 Tracks.
    Example: Pathway='Robotics' → Track='Robot Programming'
    """

    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("active", "Active"),
        ("archived", "Archived"),
    ]

    pathway = models.ForeignKey(
        Pathway,
        on_delete=models.CASCADE,
        related_name="tracks",
        help_text="Parent pathway this track belongs to",
    )
    title = models.CharField(
        max_length=255,
        db_index=True,
        help_text="Specialisation name, e.g. 'Robot Programming'",
    )
    description = models.TextField(
        blank=True,
        help_text="Learner-facing description of this track",
    )
    sequence_order = models.PositiveIntegerField(
        default=1,
        help_text="Display order within the parent pathway (1-based)",
    )
    status = models.CharField(
        max_length=16,
        choices=STATUS_CHOICES,
        default="draft",
        db_index=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "core_track"
        verbose_name = "Track"
        verbose_name_plural = "Tracks"
        ordering = ["pathway", "sequence_order"]
        constraints = [
            models.UniqueConstraint(
                fields=["pathway", "sequence_order"],
                name="unique_track_order_per_pathway",
            )
        ]

    def __str__(self) -> str:
        return f"{self.pathway.name} › {self.title}"


class Program(BaseUUIDModel):
    """A bundled module sequence leading to a certification (PRD §2.1, layer 3).

    Each Track contains 2–3 Programs.
    The `level` is competency-based, not age-based (PRD §2.3).
    Example: Track='Robot Programming' → Program='Robotics Foundations (Explorer)'
    """

    LEVEL_EXPLORER = "explorer"
    LEVEL_BUILDER = "builder"
    LEVEL_PRACTITIONER = "practitioner"
    LEVEL_PRE_PROFESSIONAL = "pre_professional"
    LEVEL_CHOICES = [
        (LEVEL_EXPLORER, "Explorer"),
        (LEVEL_BUILDER, "Builder"),
        (LEVEL_PRACTITIONER, "Practitioner"),
        (LEVEL_PRE_PROFESSIONAL, "Pre-Professional"),
    ]

    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("active", "Active"),
        ("archived", "Archived"),
    ]

    track = models.ForeignKey(
        Track,
        on_delete=models.CASCADE,
        related_name="programs",
        help_text="Parent track this program belongs to",
    )
    title = models.CharField(
        max_length=255,
        db_index=True,
        help_text="e.g. 'Robotics Foundations Program'",
    )
    level = models.CharField(
        max_length=24,
        choices=LEVEL_CHOICES,
        default=LEVEL_EXPLORER,
        db_index=True,
        help_text=(
            "Competency level for this program. "
            "Levels are skill-based, not age-based."
        ),
    )
    description = models.TextField(
        blank=True,
        help_text=(
            "Learner-facing outcome statement, e.g. "
            "'By the end you will be able to…'"
        ),
    )
    sequence_order = models.PositiveIntegerField(
        default=1,
        help_text="Display order within the parent track (1-based)",
    )
    status = models.CharField(
        max_length=16,
        choices=STATUS_CHOICES,
        default="draft",
        db_index=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "core_program"
        verbose_name = "Program"
        verbose_name_plural = "Programs"
        ordering = ["track", "sequence_order"]
        constraints = [
            models.UniqueConstraint(
                fields=["track", "sequence_order"],
                name="unique_program_order_per_track",
            )
        ]

    def __str__(self) -> str:
        return f"{self.track.title} › {self.title} ({self.get_level_display()})"


class Career(BaseUUIDModel):
    """Potential careers linked to a pathway — Global content."""

    course = models.ForeignKey(Pathway, on_delete=models.CASCADE, related_name="careers")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    objects = models.Manager()  # Explicit default manager

    def __str__(self) -> str:
        return f"{self.title} ({self.course.name})"


class CourseLevel(BaseUUIDModel):
    """A progressive level within a pathway (legacy model).

    Each level has completion criteria that must be met before
    the learner can progress to the next level.

    Note: This model predates the full 7-layer hierarchy. New code should use
    the Track → Program → Module chain. CourseLevel will be deprecated once the
    data migration to Program is complete.
    """

    course = models.ForeignKey(Pathway, on_delete=models.CASCADE, related_name="levels")
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
    completed_module_ids = models.JSONField(
        default=list,
        blank=True,
        help_text="List of completed module IDs for this learner at this level.",
    )
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
    course = models.ForeignKey(Pathway, on_delete=models.SET_NULL, null=True, blank=True)
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


class Activity(BaseUUIDModel):
    """Upcoming activities for learners.

    Managed by data_entry or admin users via the curriculum entry dashboard.
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

    # Optional links to curriculum
    course = models.ForeignKey(
        Pathway,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="activities",
        help_text="Related pathway",
    )

    # Media storage (similar to Module)
    media_files = models.JSONField(
        default=list, blank=True, help_text="List of media file references"
    )

    # Tracking
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


class Badge(BaseUUIDModel):
    """Badges awarded to learners for achievements and module completion.

    Teachers can award badges manually or they can be auto-awarded
    when a learner completes a module that has a badge_name defined.
    """

    learner = models.ForeignKey(
        Learner,
        on_delete=models.CASCADE,
        related_name="badges",
        help_text="Learner who earned this badge",
    )
    module = models.ForeignKey(
        Module,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="badges_awarded",
        help_text="Module associated with this badge (if any)",
    )
    badge_name = models.CharField(
        max_length=255,
        help_text="Name of the badge (e.g., 'Robotics Master', 'Code Ninja')",
    )
    description = models.TextField(
        blank=True, help_text="Description of what this badge represents"
    )
    awarded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="badges_awarded",
        limit_choices_to={"role": "teacher"},
        help_text="Teacher who awarded this badge",
    )
    awarded_at = models.DateTimeField(auto_now_add=True, db_index=True)

    # Optional tenant scope
    tenant = models.ForeignKey(
        School,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )

    class Meta:
        db_table = "core_badge"
        verbose_name = "Badge"
        verbose_name_plural = "Badges"
        ordering = ["-awarded_at"]
        indexes = [
            models.Index(fields=["learner", "awarded_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.learner.full_name} - {self.badge_name}"


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

    # Quiz content stored as JSON
    # Format: [{"question": "...", "options": ["A", "B", "C"], "correct_answer": 0}]
    questions = models.JSONField(
        default=list, help_text="List of questions with options and correct answers"
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

    # Student's answers stored as JSON
    # Format: [0, 2, 1, 3, ...]  (indices of selected options)
    answers = models.JSONField(default=list, help_text="List of answer indices")

    score = models.IntegerField(help_text="Score achieved (0-100)")
    passed = models.BooleanField(default=False, help_text="Whether the student passed")

    # Optional teacher feedback
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

    # Optional tenant scope
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
