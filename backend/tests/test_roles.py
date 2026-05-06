from __future__ import annotations

from types import SimpleNamespace

from apps.api.course_views import CanManageCourses
from apps.api.permissions import IsProgramManager
from apps.core.services.admin_service import AdminBulkImportService
from apps.core.roles import SCHOOL_STAFF_ROLES, UserRole
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
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


class CurriculumDesignerRoleTests(TestCase):
    def test_curriculum_designer_replaces_data_entry_role(self) -> None:
        self.assertIn("curriculum_designer", UserRole.values)
        self.assertNotIn("data_entry", UserRole.values)
        self.assertIn(UserRole.CURRICULUM_DESIGNER, SCHOOL_STAFF_ROLES)

    def test_curriculum_designer_dashboard_route(self) -> None:
        user_model = get_user_model()
        user = user_model.objects.create_user(
            username="designer",
            email="designer@example.com",
            password="testpass123",
            role=UserRole.CURRICULUM_DESIGNER,
        )

        self.assertEqual(user.get_dashboard_url(), "/admin/curriculum-designer")

    def test_course_management_permission_allows_curriculum_designers(self) -> None:
        user_model = get_user_model()
        curriculum_designer = user_model.objects.create_user(
            username="designer",
            email="designer@example.com",
            password="testpass123",
            role=UserRole.CURRICULUM_DESIGNER,
        )
        teacher = user_model.objects.create_user(
            username="teacher-2",
            email="teacher-2@example.com",
            password="testpass123",
            role=UserRole.TEACHER,
        )

        permission = CanManageCourses()

        self.assertTrue(
            permission.has_permission(SimpleNamespace(user=curriculum_designer), None)
        )
        self.assertFalse(permission.has_permission(SimpleNamespace(user=teacher), None))

    def test_bulk_import_maps_legacy_data_entry_to_curriculum_designer(self) -> None:
        csv_file = ContentFile(
            b"username,email,role\nlegacy,legacy@example.com,data_entry\n",
            name="users.csv",
        )

        result = AdminBulkImportService.import_users(csv_file)
        user = get_user_model().objects.get(username="legacy")

        self.assertEqual(result["created"], 1)
        self.assertEqual(result["errors"], [])
        self.assertEqual(user.role, UserRole.CURRICULUM_DESIGNER)
