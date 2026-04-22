from django.contrib import admin

from .models import (
    AdminOverride,
    Artifact,
    Assessment,
    BadgeRecord,
    BadgeTemplate,
    CertificationRecord,
    CertificationTemplate,
    Credential,
    GateSnapshot,
    GrowthProfile,
    Learner,
    LessonProgress,
    MicrocredentialRecord,
    MicrocredentialTemplate,
    Module,
    ModuleProgress,
    Observation,
    Outcome,
    ParentContact,
    PathwayInputs,
    PodClass,
    Program,
    SafetyIncident,
    School,
    Track,
    Unit,
    WeeklyPulse,
)


@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = ("name", "code")


@admin.register(Learner)
class LearnerAdmin(admin.ModelAdmin):
    list_display = ("first_name", "last_name", "tenant", "consent_media")


@admin.register(ParentContact)
class ParentContactAdmin(admin.ModelAdmin):
    list_display = ("learner", "preferred_channel", "language")


@admin.register(Artifact)
class ArtifactAdmin(admin.ModelAdmin):
    list_display = ("title", "learner", "submitted_at")


@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    list_display = ("name", "course")


@admin.register(Assessment)
class AssessmentAdmin(admin.ModelAdmin):
    list_display = ("learner", "module", "score", "created_at")


@admin.register(PathwayInputs)
class PathwayInputsAdmin(admin.ModelAdmin):
    list_display = (
        "learner",
        "interest_persistence",
        "skill_readiness",
        "enjoyment",
        "local_demand",
        "breadth",
        "created_at",
    )


@admin.register(GateSnapshot)
class GateSnapshotAdmin(admin.ModelAdmin):
    list_display = ("learner", "gate", "score", "created_at")


@admin.register(Credential)
class CredentialAdmin(admin.ModelAdmin):
    list_display = ("learner", "name", "issuer", "issued_at")


@admin.register(Outcome)
class OutcomeAdmin(admin.ModelAdmin):
    list_display = ("learner", "type", "occurred_at")


@admin.register(PodClass)
class PodClassAdmin(admin.ModelAdmin):
    list_display = ("name", "tenant")


@admin.register(Observation)
class ObservationAdmin(admin.ModelAdmin):
    list_display = ("learner", "observed_at")


@admin.register(WeeklyPulse)
class WeeklyPulseAdmin(admin.ModelAdmin):
    list_display = ("learner", "mood", "created_at")


@admin.register(SafetyIncident)
class SafetyIncidentAdmin(admin.ModelAdmin):
    list_display = ("learner", "severity", "created_at")


# ---------------------------------------------------------------------------
# Phase 1: Hierarchy
# ---------------------------------------------------------------------------

@admin.register(Track)
class TrackAdmin(admin.ModelAdmin):
    list_display = ("title", "pathway", "sequence_order", "status")
    list_filter = ("status", "pathway")


@admin.register(Program)
class ProgramAdmin(admin.ModelAdmin):
    list_display = ("title", "track", "level", "sequence_order", "status")
    list_filter = ("status", "level")


@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ("title", "module", "sequence_order")


# ---------------------------------------------------------------------------
# Phase 2: Recognition stack
# ---------------------------------------------------------------------------

@admin.register(BadgeTemplate)
class BadgeTemplateAdmin(admin.ModelAdmin):
    list_display = ("title", "unit")
    search_fields = ("title",)


@admin.register(BadgeRecord)
class BadgeRecordAdmin(admin.ModelAdmin):
    list_display = ("learner", "template", "status", "source", "date_awarded")
    list_filter = ("status", "source")
    raw_id_fields = ("learner", "template", "issuer")


@admin.register(MicrocredentialTemplate)
class MicrocredentialTemplateAdmin(admin.ModelAdmin):
    list_display = ("title", "module")
    search_fields = ("title",)


@admin.register(MicrocredentialRecord)
class MicrocredentialRecordAdmin(admin.ModelAdmin):
    list_display = ("learner", "template", "module", "status", "date_issued")
    list_filter = ("status",)
    raw_id_fields = ("learner", "template", "module", "issuer")


@admin.register(CertificationTemplate)
class CertificationTemplateAdmin(admin.ModelAdmin):
    list_display = ("title", "program")
    search_fields = ("title",)


@admin.register(CertificationRecord)
class CertificationRecordAdmin(admin.ModelAdmin):
    list_display = ("learner", "template", "program", "status", "date_issued")
    list_filter = ("status",)
    raw_id_fields = ("learner", "template", "program", "reviewer", "capstone_artifact")


@admin.register(GrowthProfile)
class GrowthProfileAdmin(admin.ModelAdmin):
    list_display = ("learner", "leaves_count", "fruit_count", "updated_at")
    readonly_fields = ("updated_at",)


# ---------------------------------------------------------------------------
# Phase 3: Gate engine
# ---------------------------------------------------------------------------

@admin.register(ModuleProgress)
class ModuleProgressAdmin(admin.ModelAdmin):
    list_display = ("learner", "module", "completion_status", "teacher_verified", "quiz_passed")
    list_filter = ("completion_status",)
    raw_id_fields = ("learner", "module")


@admin.register(LessonProgress)
class LessonProgressAdmin(admin.ModelAdmin):
    list_display = ("learner", "lesson", "completed", "completed_at")
    list_filter = ("completed",)
    raw_id_fields = ("learner", "lesson")


@admin.register(AdminOverride)
class AdminOverrideAdmin(admin.ModelAdmin):
    list_display = ("actor", "learner", "layer", "layer_ref_id", "timestamp")
    list_filter = ("layer",)
    readonly_fields = ("timestamp",)
    raw_id_fields = ("actor", "learner")
    search_fields = ("reason", "layer_ref_id")
