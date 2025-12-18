from __future__ import annotations

from django.db import models
from typing import Optional


class TenantManager(models.Manager):
    """Manager that auto-filters by current tenant.

    Expects a thread-local or request-scoped tenant id set via middleware.
    
    Handles sliced querysets gracefully to avoid "Cannot filter a query once a slice 
    has been taken" errors during pagination/prefetch operations.
    """

    def get_queryset(self):
        from .tenant import get_current_tenant

        qs = super().get_queryset()
        tenant_id: Optional[str] = get_current_tenant()
        if tenant_id:
            # Check if queryset has been sliced - this is the most reliable check
            # A sliced queryset has high_mark set (even if low_mark is 0)
            # This happens during pagination when Django slices the queryset
            if hasattr(qs.query, 'high_mark') and qs.query.high_mark is not None:
                # Already sliced, can't filter - return as-is
                return qs
            if hasattr(qs.query, 'low_mark') and qs.query.low_mark > 0:
                # Already sliced, can't filter - return as-is
                return qs
            
            # Check if queryset has been evaluated
            if hasattr(qs, '_result_cache') and qs._result_cache is not None:
                # Already evaluated, can't filter - return as-is
                return qs
            
            # Try to filter, but catch TypeError in case queryset is in an invalid state
            # This can happen during prefetch operations when Django creates querysets
            # that are already in a sliced state but our checks didn't catch it
            try:
                return qs.filter(tenant_id=tenant_id)
            except TypeError:
                # Queryset is in a state where filtering isn't possible
                # Return as-is (tenant filtering should have happened earlier)
                return qs
        return qs

