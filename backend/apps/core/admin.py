from django.contrib import admin
from .models import (
    School,
    Learner,
    ParentContact,
    Artifact,
    Module,
    Assessment,
    PathwayInputs,
    GateSnapshot,
    Credential,
    Outcome,
    PodClass,
    Observation,
    WeeklyPulse,
    SafetyIncident,
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
    list_display = ("name", "tenant")


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
