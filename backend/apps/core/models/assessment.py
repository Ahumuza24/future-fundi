from __future__ import annotations

from django.db import models

from .base import TenantModel


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
    mood = models.IntegerField(default=0, db_index=True, help_text="0-100 scale")
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
