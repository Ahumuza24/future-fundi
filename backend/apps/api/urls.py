from django.urls import include, path
from .gate_views import (
    AdminOverrideCreateView,
    AdminOverrideListView,
    GateCheckView,
    GrowthProfileView,
    ModuleProgressDetailView,
)
from .cms_views import (
    LearningTaskCMSViewSet,
    LessonCMSViewSet,
    ModuleCMSViewSet,
    PathwayCMSViewSet,
    ProgramCMSViewSet,
    TrackCMSViewSet,
    UnitCMSViewSet,
)
from rest_framework import routers

from .admin_monitor_views import (
    AdminAttendanceMonitorViewSet,
    AdminSessionMonitorViewSet,
    AdminTaskMonitorViewSet,
)
from .admin_views import (
    AdminAnalyticsView,
    AdminAnalyticsViewSet,
    AdminTenantViewSet,
    AdminUserViewSet,
)
from .child_views import ChildViewSet, ParentDashboardViewSet
from .program_manager_views import ProgramManagerDashboardViewSet
from .course_views import (
    AchievementViewSet,
    ActivityViewSet,
    CareerViewSet,
    CourseLevelViewSet,
    CourseViewSet,
    LearnerEnrollmentViewSet,
    LearnerProgressViewSet,
    ModuleViewSet,
)
from .pathway_learning_views import PathwayLearningViewSet
from .school_views import (
    SchoolDashboardViewSet,
    SchoolPathwayViewSet,
    SchoolPodClassViewSet,
    SchoolStudentViewSet,
    SchoolTeacherViewSet,
)
from .student_views import LearnerDashboardViewSet, StudentDashboardViewSet
from .teacher_views import (
    BadgeManagementViewSet,
    CredentialManagementViewSet,
    QuickArtifactViewSet,
    StudentManagementViewSet,
    TeacherDashboardViewSet,
    TeacherSessionViewSet,
    TeacherTaskViewSet,
)
from .views import (
    ArtifactViewSet,
    DashboardKpisView,
    LearnerViewSet,
    health_check,
)

router = routers.DefaultRouter()
router.register(r"learners", LearnerViewSet, basename="learners")
router.register(r"artifacts", ArtifactViewSet, basename="artifacts")
router.register(
    r"children", ChildViewSet, basename="children"
)  # Parent's children management
router.register(
    r"student", StudentDashboardViewSet, basename="student"
)  # Student dashboard
router.register(
    r"pathway-learning", PathwayLearningViewSet, basename="pathway-learning"
)  # Pathway learning interface

# School Admin endpoints
router.register(
    r"school/dashboard", SchoolDashboardViewSet, basename="school-dashboard"
)
router.register(r"school/students", SchoolStudentViewSet, basename="school-students")
router.register(r"school/teachers", SchoolTeacherViewSet, basename="school-teachers")
router.register(r"school/pathways", SchoolPathwayViewSet, basename="school-pathways")
router.register(r"school/classes", SchoolPodClassViewSet, basename="school-classes")

# Teacher endpoints
router.register(r"teacher/sessions", TeacherSessionViewSet, basename="teacher-sessions")
router.register(
    r"teacher/quick-artifacts", QuickArtifactViewSet, basename="teacher-quick-artifacts"
)
router.register(r"teacher/badges", BadgeManagementViewSet, basename="teacher-badges")
router.register(
    r"teacher/students", StudentManagementViewSet, basename="teacher-students"
)
router.register(
    r"teacher/credentials", CredentialManagementViewSet, basename="teacher-credentials"
)
router.register(r"teacher/tasks", TeacherTaskViewSet, basename="teacher-tasks")
router.register(r"teacher/dashboard", TeacherDashboardViewSet, basename="teacher-dashboard")
router.register(r"learner/dashboard", LearnerDashboardViewSet, basename="learner-dashboard")
router.register(r"parent/dashboard", ParentDashboardViewSet, basename="parent-dashboard")
router.register(r"program-manager/dashboard", ProgramManagerDashboardViewSet, basename="pm-dashboard")

# Admin endpoints
router.register(r"admin/users", AdminUserViewSet, basename="admin-users")
router.register(r"admin/tenants", AdminTenantViewSet, basename="admin-tenants")
router.register(r"admin/schools", AdminTenantViewSet, basename="admin-schools")
router.register(r"admin/analytics", AdminAnalyticsViewSet, basename="admin-analytics")
# Admin monitoring
router.register(
    r"admin/monitor/sessions",
    AdminSessionMonitorViewSet,
    basename="admin-monitor-sessions",
)
router.register(
    r"admin/monitor/tasks", AdminTaskMonitorViewSet, basename="admin-monitor-tasks"
)
router.register(
    r"admin/monitor/attendance",
    AdminAttendanceMonitorViewSet,
    basename="admin-monitor-attendance",
)

# CMS endpoints (Curriculum Designer portal — Phase 4)
router.register(r"cms/pathways", PathwayCMSViewSet, basename="cms-pathways")
router.register(r"cms/tracks", TrackCMSViewSet, basename="cms-tracks")
router.register(r"cms/programs", ProgramCMSViewSet, basename="cms-programs")
router.register(r"cms/modules", ModuleCMSViewSet, basename="cms-modules")
router.register(r"cms/units", UnitCMSViewSet, basename="cms-units")
router.register(r"cms/lessons", LessonCMSViewSet, basename="cms-lessons")
router.register(r"cms/tasks", LearningTaskCMSViewSet, basename="cms-tasks")

# Course & Progress endpoints
router.register(r"courses", CourseViewSet, basename="courses")
router.register(r"course-levels", CourseLevelViewSet, basename="course-levels")
router.register(r"modules", ModuleViewSet, basename="modules")
router.register(r"careers", CareerViewSet, basename="careers")
router.register(r"enrollments", LearnerEnrollmentViewSet, basename="enrollments")
router.register(r"progress", LearnerProgressViewSet, basename="progress")
router.register(r"achievements", AchievementViewSet, basename="achievements")
router.register(r"activities", ActivityViewSet, basename="activities")

urlpatterns = [
    # Custom endpoints that need specific routing
    path(
        "admin/analytics/overview/",
        AdminAnalyticsView.as_view(),
        name="admin-analytics-overview",
    ),
    # Router URLs
    path("", include(router.urls)),
    # Other custom views
    path("dashboard/kpis/", DashboardKpisView.as_view(), name="dashboard-kpis"),
    path("health/", health_check, name="health-check"),
    # Gate engine (Phase 3)
    path("gate/check/", GateCheckView.as_view(), name="gate-check"),
    path("gate/override/", AdminOverrideCreateView.as_view(), name="gate-override-create"),
    path("gate/overrides/", AdminOverrideListView.as_view(), name="gate-override-list"),
    path("gate/growth-profile/", GrowthProfileView.as_view(), name="gate-growth-profile"),
    path("gate/module-progress/<uuid:pk>/", ModuleProgressDetailView.as_view(), name="gate-module-progress"),
]
