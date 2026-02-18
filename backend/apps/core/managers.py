from __future__ import annotations

from django.db import models
from django.db.models import Q


class TenantManager(models.Manager):
    """Explicit school-scoping manager.

    We intentionally do not auto-filter querysets implicitly.
    Hidden global filters make debugging and feature work harder.
    Use helper methods (`for_school`, `global_or_school`) or explicit filters in views.
    """

    def get_queryset(self):
        return super().get_queryset()

    def for_school(self, school_id):
        if not school_id:
            return self.get_queryset().none()
        return self.get_queryset().filter(tenant_id=school_id)

    def global_or_school(self, school_id):
        if not school_id:
            return self.get_queryset().filter(tenant__isnull=True)
        return self.get_queryset().filter(Q(tenant__isnull=True) | Q(tenant_id=school_id))
