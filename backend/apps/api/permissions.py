"""Role-based access control permissions for Future Fundi Dashboard.

Roles:
- learner: Can view own data, submit artifacts
- teacher: Can view learners in their classes, submit observations
- parent: Can view their child's data
- leader: Can view all data in their school (tenant)
- admin: Full access (superuser)
"""

from __future__ import annotations

from rest_framework import permissions


class IsLearner(permissions.BasePermission):
    """Permission for learners to access their own data."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "learner"

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
        return request.user.is_authenticated and request.user.role == "teacher"

    def has_object_permission(self, request, view, obj):
        # Teachers can access any learner in their tenant
        # In the future, this can be restricted to learners in their classes
        if hasattr(obj, "tenant"):
            return obj.tenant == request.user.tenant
        if hasattr(obj, "learner") and hasattr(obj.learner, "tenant"):
            return obj.learner.tenant == request.user.tenant
        return False


class IsParent(permissions.BasePermission):
    """Permission for parents to access their child's data."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "parent"

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
    """Permission for school leaders/admins to access all data in their tenant."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in [
            "leader",
            "admin",
        ]

    def has_object_permission(self, request, view, obj):
        # Leaders can access any data in their tenant
        if hasattr(obj, "tenant"):
            return obj.tenant == request.user.tenant
        if hasattr(obj, "learner") and hasattr(obj.learner, "tenant"):
            return obj.learner.tenant == request.user.tenant
        return True  # Allow if no tenant check needed


class IsTeacherOrLeader(permissions.BasePermission):
    """Permission for teachers or leaders."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in [
            "teacher",
            "leader",
            "admin",
        ]

    def has_object_permission(self, request, view, obj):
        if request.user.role in ["leader", "admin"]:
            return True
        # Teacher permission check
        if hasattr(obj, "tenant"):
            return obj.tenant == request.user.tenant
        return False


class IsLearnerOrParent(permissions.BasePermission):
    """Permission for learners or their parents."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in [
            "learner",
            "parent",
        ]

    def has_object_permission(self, request, view, obj):
        if request.user.role == "learner":
            # Learner can access their own data
            if hasattr(obj, "user"):
                return obj.user == request.user
            if hasattr(obj, "learner") and hasattr(obj.learner, "user"):
                return obj.learner.user == request.user

        # Parent permission check
        if request.user.role == "parent":
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
    """Permission for school admins to access all data in their tenant."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.role == "school" or request.user.is_superuser
        )

    def has_object_permission(self, request, view, obj):
        # Admins can access any data in their tenant
        if request.user.is_superuser:
            return True

        if hasattr(obj, "tenant"):
            return obj.tenant == request.user.tenant
        if hasattr(obj, "learner") and hasattr(obj.learner, "tenant"):
            return obj.learner.tenant == request.user.tenant
        return False
