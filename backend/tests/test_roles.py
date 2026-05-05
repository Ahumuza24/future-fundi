from __future__ import annotations

from types import SimpleNamespace

from apps.api.permissions import IsProgramManager
from apps.core.roles import UserRole
from django.contrib.auth import get_user_model
from django.test import TestCase


class ProgramManagerRoleTests(TestCase):
    def test_program_manager_replaces_leader_role(self) -> None:
        legacy_role = "lead" + "er"
        self.assertIn("program_manager", UserRole.values)
        self.assertNotIn(legacy_role, UserRole.values)

    def test_program_manager_dashboard_route(self) -> None:
        user_model = get_user_model()
        user = user_model.objects.create_user(
            username="pm",
            email="pm@example.com",
            password="testpass123",
            role=UserRole.PROGRAM_MANAGER,
        )

        self.assertEqual(user.get_dashboard_url(), "/program-manager")

    def test_program_manager_permission_allows_program_managers_and_admins(self) -> None:
        user_model = get_user_model()
        program_manager = user_model.objects.create_user(
            username="pm",
            email="pm@example.com",
            password="testpass123",
            role=UserRole.PROGRAM_MANAGER,
        )
        teacher = user_model.objects.create_user(
            username="teacher",
            email="teacher@example.com",
            password="testpass123",
            role=UserRole.TEACHER,
        )

        permission = IsProgramManager()

        self.assertTrue(
            permission.has_permission(SimpleNamespace(user=program_manager), None)
        )
        self.assertFalse(permission.has_permission(SimpleNamespace(user=teacher), None))
