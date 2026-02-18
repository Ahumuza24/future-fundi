"""Role-based access control permissions for Future Fundi Dashboard.

Roles:
- learner: Can view own data, submit artifacts
- teacher: Can view learners in their classes, submit observations
- parent: Can view their child's data
- leader: Can view all data in their school (tenant)
- admin: Full access (superuser)
"""

from __future__ import annotations

from apps.core.roles import UserRole
from apps.core.scope import is_global_admin
from rest_framework import permissions


def _same_school(user, obj, school_id=None) -> bool:
    effective_school_id = school_id or getattr(user, "tenant_id", None)
    if not effective_school_id:
        return False

    if hasattr(obj, "tenant"):
        return str(obj.tenant_id) == str(effective_school_id)
    if hasattr(obj, "learner") and hasattr(obj.learner, "tenant_id"):
        return str(obj.learner.tenant_id) == str(effective_school_id)
    return False


class IsLearner(permissions.BasePermission):
    """Permission for learners to access their own data."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == UserRole.LEARNER

    def has_object_permission(self, request, view, obj):
        # Learners can only access their own learner profile
        if hasattr(obj, "user"):
            return obj.user == request.user
        if hasattr(obj, "learner") and hasattr(obj.learner, "user"):
            return obj.learner.user == request.user
        return False


class IsTeacher(permissions.BasePermission):
    """Permission for teachers to access learner data in their classes."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == UserRole.TEACHER

    def has_object_permission(self, request, view, obj):
        school = getattr(request, "school", None)
        return _same_school(request.user, obj, getattr(school, "id", None))


class IsParent(permissions.BasePermission):
    """Permission for parents to access their child's data."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == UserRole.PARENT

    def has_object_permission(self, request, view, obj):
        # Parents can only access their child's learner profile
        # This requires a ParentContact relationship check
        from apps.core.models import ParentContact

        if hasattr(obj, "learner"):
            learner = obj.learner
        elif hasattr(obj, "user"):
            from apps.core.models import Learner

            try:
                learner = Learner.objects.get(user=obj.user)
            except Learner.DoesNotExist:
                return False
        else:
            return False

        # Check if user is a parent contact for this learner
        return ParentContact.objects.filter(
            learner=learner, email=request.user.email
        ).exists()


class IsLeader(permissions.BasePermission):
    """Permission for school leaders/admins to access all data in their school."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in [
            UserRole.LEADER,
            UserRole.ADMIN,
        ]

    def has_object_permission(self, request, view, obj):
        # Platform admins have global access.
        if is_global_admin(request.user):
            return True
        if request.user.role == UserRole.ADMIN and request.user.tenant_id:
            return _same_school(request.user, obj, request.user.tenant_id)
        if request.user.role == UserRole.LEADER:
            school = getattr(request, "school", None)
            return _same_school(request.user, obj, getattr(school, "id", None))
        return True  # Allow if no tenant check needed


class IsTeacherOrLeader(permissions.BasePermission):
    """Permission for teachers or leaders."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in [
            UserRole.TEACHER,
            UserRole.LEADER,
            UserRole.ADMIN,
        ]

    def has_object_permission(self, request, view, obj):
        if is_global_admin(request.user):
            return True
        school = getattr(request, "school", None)
        return _same_school(request.user, obj, getattr(school, "id", None))


class IsLearnerOrParent(permissions.BasePermission):
    """Permission for learners or their parents."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in [
            UserRole.LEARNER,
            UserRole.PARENT,
        ]

    def has_object_permission(self, request, view, obj):
        if request.user.role == UserRole.LEARNER:
            # Learner can access their own data
            if hasattr(obj, "user"):
                return obj.user == request.user
            if hasattr(obj, "learner") and hasattr(obj.learner, "user"):
                return obj.learner.user == request.user

        # Parent permission check
        if request.user.role == UserRole.PARENT:
            from apps.core.models import ParentContact

            if hasattr(obj, "learner"):
                learner = obj.learner
            elif hasattr(obj, "user"):
                from apps.core.models import Learner

                try:
                    learner = Learner.objects.get(user=obj.user)
                except Learner.DoesNotExist:
                    return False
            else:
                return False

            return ParentContact.objects.filter(
                learner=learner, email=request.user.email
            ).exists()

        return False


class IsSchoolAdmin(permissions.BasePermission):
    """Permission for school admins to access all data in their school."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.role == UserRole.SCHOOL or request.user.is_superuser
        )

    def has_object_permission(self, request, view, obj):
        # Admins can access any data in their tenant
        if request.user.is_superuser:
            return True

        school = getattr(request, "school", None)
        return _same_school(request.user, obj, getattr(school, "id", None))
