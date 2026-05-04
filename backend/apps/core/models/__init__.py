from __future__ import annotations

from .activity import Activity, Attendance, PodClass, Session, TeacherTask
from .artifact import Artifact
from .assessment import (
    Assessment,
    Credential,
    GateSnapshot,
    Observation,
    Outcome,
    PathwayInputs,
    SafetyIncident,
    WeeklyPulse,
)
from .base import BaseUUIDModel, School, TenantModel
from .curriculum import Career, CourseLevel, Module
from .delivery import LearningTask, Lesson, Unit
from .gates_models import AdminOverride
from .hierarchy import Pathway, Program, Track
from .learner import Learner, ParentContact
from .legacy import Achievement, Badge
from .progress import (
    LearnerCourseEnrollment,
    LearnerLevelProgress,
    LessonProgress,
    ModuleProgress,
)
from .quiz import Quiz, QuizAttempt
from .recognition import (
    BadgeRecord,
    BadgeTemplate,
    CertificationRecord,
    CertificationTemplate,
    GrowthProfile,
    MicrocredentialRecord,
    MicrocredentialTemplate,
)

# Backward-compatibility alias — keeps existing serializers/views working
# after the Course → Pathway rename (migration 0028).
Course = Pathway

__all__ = [
    # base
    "BaseUUIDModel",
    "School",
    "TenantModel",
    # hierarchy
    "Pathway",
    "Course",
    "Track",
    "Program",
    # curriculum
    "Module",
    "Career",
    "CourseLevel",
    # delivery
    "Unit",
    "Lesson",
    "LearningTask",
    # learner
    "Learner",
    "ParentContact",
    # artifact
    "Artifact",
    # progress
    "LearnerCourseEnrollment",
    "LearnerLevelProgress",
    "ModuleProgress",
    "LessonProgress",
    # recognition
    "BadgeTemplate",
    "BadgeRecord",
    "MicrocredentialTemplate",
    "MicrocredentialRecord",
    "CertificationTemplate",
    "CertificationRecord",
    "GrowthProfile",
    # gates
    "AdminOverride",
    # legacy
    "Achievement",
    "Badge",
    # activity
    "TeacherTask",
    "PodClass",
    "Session",
    "Attendance",
    "Activity",
    # assessment
    "Assessment",
    "PathwayInputs",
    "GateSnapshot",
    "Credential",
    "Outcome",
    "Observation",
    "WeeklyPulse",
    "SafetyIncident",
    # quiz
    "Quiz",
    "QuizAttempt",
]
