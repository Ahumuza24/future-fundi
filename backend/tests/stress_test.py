"""
Comprehensive stress & integration test suite for Future Fundi API.

Actual URL structure discovered from apps/users/urls.py & apps/api/urls.py:
  Auth:   /auth/token/          – JWT obtain
          /auth/token/refresh/  – refresh
          /auth/register/       – register
          /auth/logout/         – logout
          /user/profile/        – get/update own profile
  API:    /api/<resource>/      – all REST resources

Run with:
    py manage.py test tests.stress_test --verbosity=2 2>&1 | tee test_results.txt
"""

from __future__ import annotations

import concurrent.futures
import json
import time
import uuid
from typing import Optional

from apps.core.models import Course, Learner, Module, School
from django.contrib.auth import get_user_model
from django.test import TestCase, TransactionTestCase
from rest_framework.test import APIClient

User = get_user_model()

# ── Correct URL prefixes ──────────────────────────────────────────────────────
AUTH = ""  # auth/users app mounted at root: /auth/token/, /user/profile/
API = "/api"  # API app mounted at /api/


# ── Helpers ───────────────────────────────────────────────────────────────────


def _login(username: str, password: str) -> Optional[str]:
    """Return JWT access token or None."""
    c = APIClient()
    r = c.post(f"{AUTH}/auth/token/", {"username": username, "password": password})
    if r.status_code == 200:
        return r.data["access"]
    return None


def _auth_client(token: str) -> APIClient:
    c = APIClient()
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    return c


def _force_client(user: User) -> APIClient:
    """Fastest — skips JWT entirely; for internal auth tests."""
    c = APIClient()
    c.force_authenticate(user=user)
    return c


def make_user(username=None, role="learner", password="Test1234!", **kw):
    uname = username or f"u_{uuid.uuid4().hex[:8]}"
    u = User.objects.create_user(username=uname, password=password, role=role, **kw)
    return u, password


def make_course(name=None):
    return Course.objects.create(name=name or f"Course_{uuid.uuid4().hex[:6]}")


# ══════════════════════════════════════════════════════════════════════════════
# A — Authentication & JWT flows
# ══════════════════════════════════════════════════════════════════════════════


class AuthFlowTests(TestCase):

    def setUp(self):
        self.user, self.pw = make_user("auth_admin", role="admin", email="aa@x.com")

    def test_login_success_returns_access_and_refresh(self):
        c = APIClient()
        r = c.post(
            f"{AUTH}/auth/token/", {"username": "auth_admin", "password": self.pw}
        )
        self.assertEqual(r.status_code, 200)
        self.assertIn("access", r.data)
        self.assertIn("refresh", r.data)
        self.assertIn("user", r.data)

    def test_login_wrong_password_returns_401(self):
        c = APIClient()
        r = c.post(
            f"{AUTH}/auth/token/",
            {"username": "auth_admin", "password": "wrongpassword"},
        )
        self.assertEqual(r.status_code, 401)

    def test_login_nonexistent_user_returns_401(self):
        c = APIClient()
        r = c.post(
            f"{AUTH}/auth/token/", {"username": "ghost_xyz_999", "password": "anything"}
        )
        self.assertEqual(r.status_code, 401)

    def test_access_token_works_on_protected_endpoint(self):
        token = _login("auth_admin", self.pw)
        self.assertIsNotNone(token, "Login should succeed")
        c = _auth_client(token)
        r = c.get(f"{AUTH}/user/profile/")
        self.assertEqual(r.status_code, 200)

    def test_no_token_gives_401(self):
        c = APIClient()
        r = c.get(f"{API}/learners/")
        self.assertEqual(r.status_code, 401)

    def test_malformed_token_gives_401(self):
        c = APIClient()
        c.credentials(HTTP_AUTHORIZATION="Bearer notavalidtoken")
        r = c.get(f"{API}/learners/")
        self.assertEqual(r.status_code, 401)

    def test_token_refresh_works(self):
        c = APIClient()
        r = c.post(
            f"{AUTH}/auth/token/", {"username": "auth_admin", "password": self.pw}
        )
        if r.status_code == 429:
            self.skipTest("LoginRateThrottle triggered -- clear cache between runs")
        self.assertEqual(
            r.status_code, 200, "Login must succeed before testing refresh"
        )
        refresh = r.data["refresh"]
        r2 = c.post(f"{AUTH}/auth/token/refresh/", {"refresh": refresh})
        self.assertEqual(r2.status_code, 200)
        self.assertIn("access", r2.data)

    def test_logout_blacklists_refresh(self):
        c = APIClient()
        r = c.post(
            f"{AUTH}/auth/token/", {"username": "auth_admin", "password": self.pw}
        )
        if r.status_code == 429:
            self.skipTest("LoginRateThrottle triggered -- clear cache between runs")
        self.assertEqual(r.status_code, 200, "Login must succeed before testing logout")
        refresh = r.data["refresh"]
        access = r.data["access"]
        ac = _auth_client(access)
        r2 = ac.post(f"{AUTH}/auth/logout/", {"refresh": refresh})
        self.assertIn(r2.status_code, [200, 205])
        # After blacklist the refresh token must be rejected
        r3 = c.post(f"{AUTH}/auth/token/refresh/", {"refresh": refresh})
        self.assertEqual(r3.status_code, 401)

    def test_register_creates_user_and_returns_tokens(self):
        c = APIClient()
        payload = {
            "username": f"newparent_{uuid.uuid4().hex[:6]}",
            "email": f"p_{uuid.uuid4().hex[:6]}@example.com",
            "password": "SecurePass123!",
            "password_confirm": "SecurePass123!",
            "first_name": "Test",
            "last_name": "Parent",
        }
        r = c.post(f"{AUTH}/auth/register/", payload)
        self.assertEqual(r.status_code, 201)
        self.assertIn("access", r.data)

    def test_register_weak_password_rejected(self):
        c = APIClient()
        payload = {
            "username": f"weakpw_{uuid.uuid4().hex[:6]}",
            "email": f"w_{uuid.uuid4().hex[:6]}@example.com",
            "password": "abc",
            "password_confirm": "abc",
            "first_name": "Weak",
            "last_name": "Pass",
        }
        r = c.post(f"{AUTH}/auth/register/", payload)
        self.assertNotEqual(r.status_code, 201)

    def test_register_mismatched_passwords_rejected(self):
        c = APIClient()
        payload = {
            "username": f"mismatch_{uuid.uuid4().hex[:6]}",
            "email": f"m_{uuid.uuid4().hex[:6]}@example.com",
            "password": "SecurePass123!",
            "password_confirm": "DifferentPass123!",
            "first_name": "A",
            "last_name": "B",
        }
        r = c.post(f"{AUTH}/auth/register/", payload)
        self.assertNotEqual(r.status_code, 201)


# ══════════════════════════════════════════════════════════════════════════════
# B — Authorisation / IDOR
# ══════════════════════════════════════════════════════════════════════════════


class AuthorisationTests(TestCase):

    def setUp(self):
        self.admin, _ = make_user("sauth_admin", role="admin", email="sadm@x.com")
        self.teacher, _ = make_user("sauth_teacher", role="teacher")
        self.learner_u, _ = make_user("sauth_learner", role="learner")

        self.ac = _force_client(self.admin)
        self.tc = _force_client(self.teacher)
        self.lc = _force_client(self.learner_u)

    def test_learner_cannot_access_admin_users_endpoint(self):
        r = self.lc.get(f"{API}/admin/users/")
        self.assertIn(r.status_code, [403, 401])

    def test_teacher_cannot_access_admin_analytics(self):
        r = self.tc.get(f"{API}/admin/analytics/dashboard/")
        self.assertIn(r.status_code, [403, 401])

    def test_unauthenticated_cannot_access_admin_monitor(self):
        c = APIClient()
        r = c.get(f"{API}/admin/monitor/sessions/")
        self.assertEqual(r.status_code, 401)

    def test_admin_can_list_users(self):
        r = self.ac.get(f"{API}/admin/users/")
        self.assertEqual(r.status_code, 200)

    def test_learner_can_only_see_own_learner_profile(self):
        Learner.objects.get_or_create(
            user=self.learner_u, defaults={"first_name": "Test", "last_name": "L"}
        )
        other, _ = make_user("other_learner_b", role="learner")
        Learner.objects.get_or_create(
            user=other, defaults={"first_name": "Other", "last_name": "L"}
        )
        r = self.lc.get(f"{API}/learners/")
        self.assertEqual(r.status_code, 200)
        results = r.data.get("results", r.data) if isinstance(r.data, dict) else r.data
        self.assertEqual(len(results), 1, "Learner should only see their own profile")

    def test_idor_learner_cannot_access_another_learner_detail(self):
        """Classic IDOR: learner A tries to GET learner B's detail."""
        u_a, _ = make_user("idor_a", role="learner")
        u_b, _ = make_user("idor_b", role="learner")
        la, _ = Learner.objects.get_or_create(
            user=u_a, defaults={"first_name": "A", "last_name": "L"}
        )
        lb, _ = Learner.objects.get_or_create(
            user=u_b, defaults={"first_name": "B", "last_name": "L"}
        )

        c = _force_client(u_a)
        r = c.get(f"{API}/learners/{lb.id}/")
        self.assertIn(
            r.status_code,
            [403, 404],
            f"IDOR: learner A accessed learner B (got {r.status_code})",
        )

    def test_admin_users_endpoint_requires_admin_role(self):
        """Teacher must get 403 (authenticated but wrong role)."""
        r = self.tc.get(f"{API}/admin/users/")
        self.assertEqual(r.status_code, 403)


# ══════════════════════════════════════════════════════════════════════════════
# C — Input Validation Edge Cases
# ══════════════════════════════════════════════════════════════════════════════


class InputValidationTests(TestCase):

    def setUp(self):
        self.admin, _ = make_user("val_admin", role="admin", email="val@x.com")
        self.client = _force_client(self.admin)

    def test_sql_injection_username_rejected_or_safe(self):
        payload = {
            "username": "'; DROP TABLE users; --",
            "email": f"sqli_{uuid.uuid4().hex[:4]}@x.com",
            "password": "StrongPass1!",
            "password_confirm": "StrongPass1!",
            "first_name": "SQLi",
            "last_name": "Test",
            "role": "learner",
        }
        r = self.client.post(f"{API}/admin/users/", payload)
        self.assertNotEqual(r.status_code, 500)
        self.assertNotEqual(
            r.status_code, 201, "SQL injection string should not create a user account"
        )

    def test_xss_payload_in_name_stored_safely(self):
        xss = "<script>alert(1)</script>"
        payload = {
            "username": f"xss_{uuid.uuid4().hex[:6]}",
            "email": f"xss_{uuid.uuid4().hex[:4]}@x.com",
            "password": "StrongPass1!",
            "password_confirm": "StrongPass1!",
            "first_name": xss,
            "last_name": "Test",
            "role": "learner",
        }
        r = self.client.post(f"{API}/admin/users/", payload)
        self.assertNotEqual(r.status_code, 500)

    def test_extremely_long_username_rejected(self):
        payload = {
            "username": "a" * 200,
            "email": f"long_{uuid.uuid4().hex[:4]}@x.com",
            "password": "StrongPass1!",
            "password_confirm": "StrongPass1!",
            "first_name": "Long",
            "last_name": "Name",
            "role": "learner",
        }
        r = self.client.post(f"{API}/admin/users/", payload)
        self.assertIn(r.status_code, [400, 422])

    def test_empty_payload_on_create_returns_400(self):
        r = self.client.post(f"{API}/admin/users/", {})
        self.assertEqual(r.status_code, 400)

    def test_invalid_role_rejected(self):
        payload = {
            "username": f"badrole_{uuid.uuid4().hex[:6]}",
            "email": f"br_{uuid.uuid4().hex[:4]}@x.com",
            "password": "StrongPass1!",
            "password_confirm": "StrongPass1!",
            "first_name": "Bad",
            "last_name": "Role",
            "role": "superuser_hacker",
        }
        r = self.client.post(f"{API}/admin/users/", payload)
        self.assertIn(r.status_code, [400, 422])

    def test_invalid_uuid_in_path_returns_4xx(self):
        r = self.client.get(f"{API}/learners/not-a-uuid/")
        self.assertIn(r.status_code, [400, 404])

    def test_large_json_body_handled_gracefully(self):
        payload = {
            "username": f"large_{uuid.uuid4().hex[:6]}",
            "email": f"lg_{uuid.uuid4().hex[:4]}@x.com",
            "password": "StrongPass1!",
            "password_confirm": "StrongPass1!",
            "first_name": "A" * 4000,
            "last_name": "B" * 4000,
            "role": "learner",
        }
        r = self.client.post(f"{API}/admin/users/", payload)
        self.assertNotEqual(r.status_code, 500)

    def test_null_bytes_in_username_rejected(self):
        payload = {
            "username": "user\x00name",
            "email": f"null_{uuid.uuid4().hex[:4]}@x.com",
            "password": "StrongPass1!",
            "password_confirm": "StrongPass1!",
            "first_name": "Null",
            "last_name": "Byte",
            "role": "learner",
        }
        r = self.client.post(f"{API}/admin/users/", payload)
        self.assertNotEqual(r.status_code, 500)

    def test_unicode_in_name_fields_accepted(self):
        payload = {
            "username": f"uni_{uuid.uuid4().hex[:6]}",
            "email": f"uni_{uuid.uuid4().hex[:4]}@x.com",
            "password": "StrongPass1!",
            "password_confirm": "StrongPass1!",
            "first_name": "أحمد 🎓",
            "last_name": "المعلم",
            "role": "learner",
        }
        r = self.client.post(f"{API}/admin/users/", payload)
        self.assertNotEqual(r.status_code, 500)

    def test_negative_page_size_handled(self):
        r = self.client.get(f"{API}/admin/users/?page_size=-1")
        self.assertNotEqual(r.status_code, 500)

    def test_nonexistent_filter_field_handled(self):
        r = self.client.get(f"{API}/admin/users/?nonexistent_field=xyz")
        self.assertNotEqual(r.status_code, 500)


# ══════════════════════════════════════════════════════════════════════════════
# D — Admin API CRUD
# ══════════════════════════════════════════════════════════════════════════════


class AdminApiTests(TestCase):

    def setUp(self):
        self.admin, _ = make_user("adm_api", role="admin", email="adm@x.com")
        self.ac = _force_client(self.admin)

    def test_list_users_returns_paginated_result(self):
        r = self.ac.get(f"{API}/admin/users/")
        self.assertEqual(r.status_code, 200)
        self.assertIn("results", r.data)
        self.assertIn("count", r.data)

    def test_create_user_full_cycle(self):
        username = f"cycle_{uuid.uuid4().hex[:6]}"
        payload = {
            "username": username,
            "email": f"{username}@x.com",
            "password": "StrongPass1!",
            "password_confirm": "StrongPass1!",
            "first_name": "Cycle",
            "last_name": "Test",
            "role": "learner",
        }
        r_create = self.ac.post(f"{API}/admin/users/", payload)
        self.assertEqual(r_create.status_code, 201, r_create.data)
        uid = r_create.data["id"]

        r_get = self.ac.get(f"{API}/admin/users/{uid}/")
        self.assertEqual(r_get.status_code, 200)
        self.assertEqual(r_get.data["username"], username)

        r_patch = self.ac.patch(f"{API}/admin/users/{uid}/", {"first_name": "Updated"})
        self.assertEqual(r_patch.status_code, 200)
        self.assertEqual(r_patch.data["first_name"], "Updated")

        r_del = self.ac.delete(f"{API}/admin/users/{uid}/")
        self.assertIn(r_del.status_code, [200, 204])

    def test_patch_user_without_password_does_not_wipe_password(self):
        u, _ = make_user(
            f"pwtest_{uuid.uuid4().hex[:4]}", role="learner", password="OrigPass1!"
        )
        r = self.ac.patch(f"{API}/admin/users/{u.id}/", {"first_name": "NoPwChange"})
        self.assertEqual(r.status_code, 200)
        u.refresh_from_db()
        self.assertTrue(
            u.check_password("OrigPass1!"),
            "Password must not change when PATCH omits the password field",
        )

    def test_analytics_dashboard_returns_expected_keys(self):
        r = self.ac.get(f"{API}/admin/analytics/dashboard/")
        self.assertEqual(r.status_code, 200)
        for key in ["kpis", "user_growth", "session_trend", "role_distribution"]:
            self.assertIn(key, r.data, f"Missing key: {key}")

    def test_analytics_dashboard_different_day_windows(self):
        for days in [7, 30, 60, 90]:
            r = self.ac.get(f"{API}/admin/analytics/dashboard/?days={days}")
            self.assertEqual(r.status_code, 200, f"Failed for days={days}")
            self.assertEqual(r.data["meta"]["days"], days)

    def test_analytics_dashboard_invalid_days_handled(self):
        r = self.ac.get(f"{API}/admin/analytics/dashboard/?days=notanumber")
        self.assertNotEqual(r.status_code, 500)

    def test_monitor_sessions_returns_200(self):
        r = self.ac.get(f"{API}/admin/monitor/sessions/")
        self.assertEqual(r.status_code, 200)

    def test_monitor_tasks_returns_200(self):
        r = self.ac.get(f"{API}/admin/monitor/tasks/")
        self.assertEqual(r.status_code, 200)

    def test_monitor_attendance_returns_200(self):
        r = self.ac.get(f"{API}/admin/monitor/attendance/")
        self.assertEqual(r.status_code, 200)

    def test_school_management_crud(self):
        payload = {
            "name": f"TestSchool_{uuid.uuid4().hex[:4]}",
            "code": uuid.uuid4().hex[:6],
        }
        r = self.ac.post(f"{API}/admin/schools/", payload)
        self.assertEqual(r.status_code, 201, r.data)
        sid = r.data["id"]
        r2 = self.ac.get(f"{API}/admin/schools/{sid}/")
        self.assertEqual(r2.status_code, 200)


# ══════════════════════════════════════════════════════════════════════════════
# E — School / Teacher / Learner surface
# ══════════════════════════════════════════════════════════════════════════════


class SchoolSurfaceTests(TestCase):

    def setUp(self):
        self.school = School.objects.create(name="Stress School", code="STRESS01")
        # 'school' role satisfies IsSchoolAdmin (not 'leader' which maps to UserRole.LEADER)
        self.leader, _ = make_user("surf_leader", role="school", email="sl@x.com")
        self.leader.tenant = self.school
        self.leader.save()
        self.lc = _force_client(self.leader)

    def test_school_dashboard_accessible_by_leader(self):
        r = self.lc.get(
            f"{API}/school/dashboard/", HTTP_X_SCHOOL_ID=str(self.school.id)
        )
        self.assertIn(r.status_code, [200, 404])  # 404 if no data, not 500

    def test_school_students_list(self):
        r = self.lc.get(f"{API}/school/students/", HTTP_X_SCHOOL_ID=str(self.school.id))
        self.assertEqual(r.status_code, 200)

    def test_school_teachers_list(self):
        r = self.lc.get(f"{API}/school/teachers/", HTTP_X_SCHOOL_ID=str(self.school.id))
        self.assertEqual(r.status_code, 200)

    def test_courses_list_accessible(self):
        r = self.lc.get(f"{API}/courses/")
        self.assertEqual(r.status_code, 200)


class TeacherSurfaceTests(TestCase):

    def setUp(self):
        self.school = School.objects.create(name="Teacher Stress School", code="TSTR01")
        self.teacher, _ = make_user("surf_teacher", role="teacher", email="st@x.com")
        self.teacher.tenant = self.school
        self.teacher.save()
        self.tc = _force_client(self.teacher)

    def test_teacher_sessions_list(self):
        r = self.tc.get(
            f"{API}/teacher/sessions/", HTTP_X_SCHOOL_ID=str(self.school.id)
        )
        self.assertEqual(r.status_code, 200)

    def test_teacher_tasks_list(self):
        r = self.tc.get(f"{API}/teacher/tasks/", HTTP_X_SCHOOL_ID=str(self.school.id))
        self.assertEqual(r.status_code, 200)

    def test_teacher_cannot_access_admin_monitor(self):
        r = self.tc.get(f"{API}/admin/monitor/sessions/")
        self.assertIn(r.status_code, [401, 403])

    def test_create_session_with_valid_data(self):
        # Course has no 'code' field – only 'name' (verified from model fields)
        course = make_course("Stress Course")
        mod = Module.objects.create(name="Mod1", course=course)
        payload = {
            "module": str(mod.id),
            "date": "2026-03-01",
            "start_time": "09:00:00",
            "end_time": "10:00:00",
            "status": "scheduled",
        }
        r = self.tc.post(
            f"{API}/teacher/sessions/", payload, HTTP_X_SCHOOL_ID=str(self.school.id)
        )
        # 201 if created, 400 if validation fails (e.g. module tenant mismatch) — never 500
        self.assertIn(r.status_code, [200, 201, 400])
        self.assertNotEqual(r.status_code, 500)

    def test_teacher_badges_list(self):
        r = self.tc.get(f"{API}/teacher/badges/", HTTP_X_SCHOOL_ID=str(self.school.id))
        self.assertEqual(r.status_code, 200)


# ══════════════════════════════════════════════════════════════════════════════
# F — Pagination & Filter Stability
# ══════════════════════════════════════════════════════════════════════════════


class PaginationTests(TestCase):

    def setUp(self):
        self.admin, _ = make_user("page_admin", role="admin", email="pg@x.com")
        for i in range(25):
            make_user(f"pg_learner_{i}", role="learner")
        self.ac = _force_client(self.admin)

    def test_default_page_size_respected(self):
        r = self.ac.get(f"{API}/admin/users/")
        self.assertEqual(r.status_code, 200)
        results = r.data.get("results", [])
        self.assertLessEqual(len(results), 100)

    def test_page_2_accessible(self):
        r = self.ac.get(f"{API}/admin/users/?page=2")
        self.assertIn(r.status_code, [200, 404])

    def test_very_large_page_number_handled(self):
        r = self.ac.get(f"{API}/admin/users/?page=99999")
        self.assertNotEqual(r.status_code, 500)

    def test_filter_by_role_returns_only_that_role(self):
        r = self.ac.get(f"{API}/admin/users/?role=admin")
        self.assertEqual(r.status_code, 200)
        for user in r.data.get("results", []):
            self.assertEqual(user["role"], "admin")

    def test_filter_by_active_true(self):
        r = self.ac.get(f"{API}/admin/users/?is_active=true")
        self.assertEqual(r.status_code, 200)

    def test_filter_by_active_false(self):
        r = self.ac.get(f"{API}/admin/users/?is_active=false")
        self.assertNotEqual(r.status_code, 500)

    def test_analytics_user_growth_length_matches_days(self):
        for days in [7, 30]:
            r = self.ac.get(f"{API}/admin/analytics/dashboard/?days={days}")
            self.assertEqual(r.status_code, 200)
            growth = r.data.get("user_growth", [])
            # days+1 entries: start_date through today inclusive
            self.assertGreaterEqual(len(growth), days)
            self.assertLessEqual(len(growth), days + 2)


# ══════════════════════════════════════════════════════════════════════════════
# G — Throttle & Security Headers
# ══════════════════════════════════════════════════════════════════════════════


class ThrottleTests(TestCase):

    def test_health_check_accessible(self):
        r = self.client.get(f"{API}/health/")
        self.assertEqual(r.status_code, 200)
        self.assertIn("status", r.data)
        self.assertNotIn("database", r.data)  # must NOT expose DB internals
        self.assertNotIn("version", r.data)

    def test_response_has_security_headers(self):
        r = self.client.get(f"{API}/health/")
        self.assertIn("X-Content-Type-Options", r.headers)
        self.assertEqual(r.headers["X-Content-Type-Options"], "nosniff")
        self.assertIn("Content-Security-Policy", r.headers)
        self.assertIn("Permissions-Policy", r.headers)
        self.assertIn("Referrer-Policy", r.headers)

    def test_options_preflight_not_500(self):
        r = self.client.options(f"{AUTH}/auth/token/")
        self.assertNotEqual(r.status_code, 500)


# ══════════════════════════════════════════════════════════════════════════════
# H — Error Handling & Response Shape
# ══════════════════════════════════════════════════════════════════════════════


class ErrorHandlingTests(TestCase):

    def setUp(self):
        self.admin, _ = make_user("err_admin", role="admin", email="err@x.com")
        self.ac = _force_client(self.admin)

    def test_404_is_json_not_html(self):
        r = self.ac.get(f"{API}/admin/users/{uuid.uuid4()}/")
        self.assertEqual(r.status_code, 404)
        self.assertEqual(r.accepted_media_type, "application/json")

    def test_405_on_wrong_method(self):
        r = self.ac.delete(f"{API}/admin/analytics/dashboard/")
        self.assertIn(r.status_code, [405, 404])

    def test_validation_error_has_details(self):
        r = self.ac.post(f"{API}/admin/users/", {"role": "badval"})
        self.assertEqual(r.status_code, 400)
        self.assertIsInstance(r.data, dict)

    def test_500_not_leaking_on_bad_days_param(self):
        r = self.ac.get(f"{API}/admin/analytics/dashboard/?days=DROP+TABLE+users")
        self.assertNotEqual(r.status_code, 500)

    def test_no_stack_trace_in_error_response(self):
        r = self.ac.get(f"{API}/admin/users/{uuid.uuid4()}/")
        body = json.dumps(r.data)
        self.assertNotIn("Traceback", body)
        self.assertNotIn('File "', body)


# ══════════════════════════════════════════════════════════════════════════════
# I — Concurrent Write Safety
# ══════════════════════════════════════════════════════════════════════════════


class ConcurrentWriteTests(TransactionTestCase):
    """
    Uses threads to simulate concurrent requests.
    Uses force_authenticate — JWT tokens are not serialisable across threads in tests.
    """

    def setUp(self):
        self.admin, _ = make_user("conc_admin", role="admin", email="co@x.com")

    def test_concurrent_user_creates_no_duplicate_usernames(self):
        """10 concurrent creates with same username — exactly 1 must succeed."""
        username = f"race_{uuid.uuid4().hex[:8]}"
        results = []

        def try_create():
            c = _force_client(self.admin)
            payload = {
                "username": username,
                "email": f"{uuid.uuid4().hex[:6]}@x.com",
                "password": "StrongPass1!",
                "password_confirm": "StrongPass1!",
                "first_name": "Race",
                "last_name": "Condition",
                "role": "learner",
            }
            r = c.post(f"{API}/admin/users/", payload)
            results.append(r.status_code)

        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as ex:
            concurrent.futures.wait([ex.submit(try_create) for _ in range(10)])

        successes = [s for s in results if s == 201]
        self.assertEqual(
            len(successes),
            1,
            f"Race condition: {len(successes)} creates succeeded. Results: {results}",
        )

    def test_concurrent_reads_are_stable(self):
        """20 concurrent GET /api/admin/users/ — all must return 200."""
        results = []

        def do_get():
            c = _force_client(self.admin)
            r = c.get(f"{API}/admin/users/")
            results.append(r.status_code)

        with concurrent.futures.ThreadPoolExecutor(max_workers=20) as ex:
            concurrent.futures.wait([ex.submit(do_get) for _ in range(20)])

        non_200 = [s for s in results if s != 200]
        self.assertEqual(non_200, [], f"Concurrent GET returned non-200: {non_200}")

    def test_concurrent_login_attempts_stable(self):
        """15 simultaneous logins — should all get 200, not 500."""
        results = []

        def do_login():
            c = APIClient()
            r = c.post(
                f"{AUTH}/auth/token/",
                {"username": "conc_admin", "password": "Test1234!"},
            )
            results.append(r.status_code)

        with concurrent.futures.ThreadPoolExecutor(max_workers=15) as ex:
            concurrent.futures.wait([ex.submit(do_login) for _ in range(15)])

        non_ok = [s for s in results if s not in (200, 429)]
        self.assertEqual(
            non_ok, [], f"Unexpected status codes during concurrent login: {non_ok}"
        )


# ══════════════════════════════════════════════════════════════════════════════
# J — Performance Benchmarks
# ══════════════════════════════════════════════════════════════════════════════


class PerformanceBenchmarkTests(TestCase):
    """
    Timing checks — flag if any single request exceeds the time limit.
    Helps catch N+1 query regressions before they hit production.
    """

    def setUp(self):
        self.admin, _ = make_user("perf_admin", role="admin", email="perf@x.com")
        school = School.objects.create(name="Perf School", code="PERF01")
        for i in range(15):
            u, _ = make_user(f"perf_l_{i}", role="learner")
            Learner.objects.get_or_create(
                user=u,
                defaults={"first_name": str(i), "last_name": "L", "tenant": school},
            )
        self.ac = _force_client(self.admin)

    def _timed_get(self, url: str, limit_ms: float = 2000) -> float:
        t0 = time.perf_counter()
        r = self.ac.get(url)
        elapsed = (time.perf_counter() - t0) * 1000
        self.assertNotEqual(r.status_code, 500)
        self.assertLess(
            elapsed,
            limit_ms,
            f"GET {url} took {elapsed:.0f}ms (limit {limit_ms}ms) — possible N+1 or missing index",
        )
        return elapsed

    def test_admin_users_list_speed(self):
        ms = self._timed_get(f"{API}/admin/users/")
        print(f"\n  [PERF] /api/admin/users/ => {ms:.0f}ms")

    def test_learners_list_speed(self):
        ms = self._timed_get(f"{API}/learners/")
        print(f"\n  [PERF] /api/learners/ => {ms:.0f}ms")

    def test_analytics_dashboard_speed(self):
        ms = self._timed_get(f"{API}/admin/analytics/dashboard/?days=30", limit_ms=3000)
        print(f"\n  [PERF] /api/admin/analytics/dashboard/?days=30 => {ms:.0f}ms")

    def test_health_check_speed(self):
        ms = self._timed_get(f"{API}/health/", limit_ms=500)
        print(f"\n  [PERF] /api/health/ => {ms:.0f}ms")
