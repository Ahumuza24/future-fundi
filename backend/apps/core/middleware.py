from __future__ import annotations

from django.http import HttpRequest
from typing import Callable

from .tenant import set_current_tenant


class TenantMiddleware:
    """Middleware to set current tenant based on authenticated user.

    Assumes User model has a `tenant_id` field or FK to School.
    """

    def __init__(self, get_response: Callable):
        self.get_response = get_response

    def __call__(self, request: HttpRequest):
        tenant_id = None
        user = getattr(request, "user", None)
        if getattr(user, "is_authenticated", False):
            tenant_id = getattr(user, "tenant_id", None)
        set_current_tenant(tenant_id)
        return self.get_response(request)

