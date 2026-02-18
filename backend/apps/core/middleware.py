from __future__ import annotations

from apps.core.models import School
from apps.core.roles import UserRole
from apps.core.scope import get_user_allowed_school_ids
from django.http import HttpRequest
from typing import Callable

class SchoolContextMiddleware:
    """Attach `request.school` explicitly for readability.

    The project historically used "tenant" naming. We keep compatibility while
    exposing a clearer school-centric context in request handling.
    """

    def __init__(self, get_response: Callable):
        self.get_response = get_response

    def __call__(self, request: HttpRequest):
        user = getattr(request, "user", None)
        request.school = None
        request.school_id = None
        request.allowed_school_ids = []

        if getattr(user, "is_authenticated", False):
            if getattr(user, "role", None) == UserRole.TEACHER:
                allowed_school_ids = sorted(get_user_allowed_school_ids(user))
                request.allowed_school_ids = allowed_school_ids

                selected_school_id = (
                    request.headers.get("X-School-ID")
                    or request.GET.get("school_id")
                    or request.POST.get("school_id")
                )

                resolved_school_id = None
                if selected_school_id and selected_school_id in allowed_school_ids:
                    resolved_school_id = selected_school_id
                elif len(allowed_school_ids) == 1:
                    resolved_school_id = allowed_school_ids[0]

                if resolved_school_id:
                    if str(getattr(user, "tenant_id", "")) == resolved_school_id:
                        request.school = getattr(user, "tenant", None)
                    else:
                        request.school = School.objects.filter(id=resolved_school_id).first()
            else:
                request.school = getattr(user, "tenant", None)
                if request.school:
                    request.allowed_school_ids = [str(request.school.id)]

        if request.school:
            request.school_id = str(request.school.id)
        return self.get_response(request)


# Backward-compatible alias for existing imports/settings.
TenantMiddleware = SchoolContextMiddleware
