from __future__ import annotations

from apps.core.roles import UserRole


def get_school_id(user) -> str | None:
    """Return the authenticated user's school id (legacy: tenant_id)."""
    return getattr(user, "tenant_id", None)


def get_user_allowed_school_ids(user) -> set[str]:
    """Return school ids a user is allowed to operate in."""
    if not user or not getattr(user, "is_authenticated", False):
        return set()

    school_ids: set[str] = set()
    tenant_id = get_school_id(user)
    if tenant_id:
        school_ids.add(str(tenant_id))

    if getattr(user, "role", None) == UserRole.TEACHER and hasattr(
        user, "teacher_schools"
    ):
        school_ids.update(
            str(sid) for sid in user.teacher_schools.values_list("id", flat=True)
        )

    return school_ids


def is_global_admin(user) -> bool:
    """Platform admin without school scoping."""
    return getattr(user, "role", None) == UserRole.ADMIN and not get_school_id(user)


def is_school_scoped_admin(user) -> bool:
    """Admin account restricted to a single school."""
    return getattr(user, "role", None) == UserRole.ADMIN and bool(get_school_id(user))
