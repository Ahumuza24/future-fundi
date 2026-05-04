from __future__ import annotations

import uuid

from django.db import models

from apps.core.managers import TenantManager


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
