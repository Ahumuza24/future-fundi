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


class Learner(TenantModel):
    """Learner profile with consent and equity flags."""

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="learner_profile")
    first_name = models.CharField(max_length=128)
    last_name = models.CharField(max_length=128)
    consent_media = models.BooleanField(default=False, db_index=True)
    equity_flag = models.BooleanField(default=False, db_index=True)
    joined_at = models.DateField(null=True, blank=True)

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.first_name} {self.last_name}"


class ParentContact(TenantModel):
    """Parent/guardian contact with preferred channels."""

    learner = models.ForeignKey(Learner, on_delete=models.CASCADE, related_name="parents")
    whatsapp = models.CharField(max_length=32, blank=True)
    sms = models.CharField(max_length=32, blank=True)
    email = models.EmailField(blank=True)
    preferred_channel = models.CharField(max_length=16, default="whatsapp")
    language = models.CharField(max_length=8, default="en")


class Artifact(TenantModel):
    """Weekly learner artifact (photos, metrics, reflection)."""

    learner = models.ForeignKey(Learner, on_delete=models.CASCADE, related_name="artifacts")
    title = models.CharField(max_length=255)
    reflection = models.TextField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True, db_index=True)
    media_refs = models.JSONField(default=list)  # e.g., [{"s3_key": "..."}]


class Module(TenantModel):
    """Curriculum module catalog."""

    name = models.CharField(max_length=255, db_index=True)
    description = models.TextField(blank=True)


class Assessment(TenantModel):
    """Mini-assessments linked to a learner."""

    learner = models.ForeignKey('Learner', on_delete=models.CASCADE, related_name="assessments")
    module = models.ForeignKey('Module', on_delete=models.SET_NULL, null=True, blank=True)
    score = models.IntegerField(default=0)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)


class PathwayInputs(TenantModel):
    """Inputs for pathway scoring."""

    learner = models.ForeignKey('Learner', on_delete=models.CASCADE, related_name="pathway_inputs")
    interest_persistence = models.IntegerField(default=0)
    skill_readiness = models.IntegerField(default=0)
    enjoyment = models.IntegerField(default=0)
    local_demand = models.IntegerField(default=0)
    breadth = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)


class GateSnapshot(TenantModel):
    """Historical snapshot of pathway data and gate determination."""

    learner = models.ForeignKey('Learner', on_delete=models.CASCADE, related_name="gate_snapshots")
    score = models.IntegerField(default=0)
    gate = models.CharField(max_length=16, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)


class Credential(TenantModel):
    """Micro-credential earned by learners."""

    learner = models.ForeignKey('Learner', on_delete=models.CASCADE, related_name="credentials")
    name = models.CharField(max_length=255)
    issuer = models.CharField(max_length=255, blank=True)
    issued_at = models.DateField(null=True, blank=True, db_index=True)


class Outcome(TenantModel):
    """Outcomes such as shadow days or internships."""

    learner = models.ForeignKey('Learner', on_delete=models.CASCADE, related_name="outcomes")
    type = models.CharField(max_length=64, db_index=True)
    occurred_at = models.DateField(null=True, blank=True, db_index=True)
    notes = models.TextField(blank=True)


class PodClass(TenantModel):
    """Class scheduling entity."""

    name = models.CharField(max_length=255)
    schedule = models.JSONField(default=dict)  # e.g., {"days": ["Mon","Wed"], "time": "14:00"}


class Observation(TenantModel):
    """Teacher observations for learners."""

    learner = models.ForeignKey('Learner', on_delete=models.CASCADE, related_name="observations")
    text = models.TextField()
    observed_at = models.DateTimeField(auto_now_add=True, db_index=True)


class WeeklyPulse(TenantModel):
    """Student mood check-ins."""

    learner = models.ForeignKey('Learner', on_delete=models.CASCADE, related_name="weekly_pulses")
    mood = models.IntegerField(default=0, db_index=True)  # 0-100 or enum mapping
    win = models.TextField(blank=True)
    worry = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)


class SafetyIncident(TenantModel):
    """Incident tracking."""

    learner = models.ForeignKey('Learner', on_delete=models.CASCADE, related_name="incidents")
    description = models.TextField()
    severity = models.CharField(max_length=16, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
