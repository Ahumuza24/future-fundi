from django.urls import path, include
from rest_framework import routers

from .views import (
    LearnerViewSet,
    ArtifactViewSet,
    DashboardKpisView,
)
from .child_views import ChildViewSet
from .teacher_views import TeacherSessionViewSet, QuickArtifactViewSet
from .course_views import (
    CourseViewSet,
    CourseLevelViewSet,
    LearnerEnrollmentViewSet,
    LearnerProgressViewSet,
    AchievementViewSet,
)

router = routers.DefaultRouter()
router.register(r"learners", LearnerViewSet, basename="learners")
router.register(r"artifacts", ArtifactViewSet, basename="artifacts")
router.register(r"children", ChildViewSet, basename="children")  # Parent's children management

# Teacher endpoints
router.register(r"teacher/sessions", TeacherSessionViewSet, basename="teacher-sessions")
router.register(r"teacher/quick-artifacts", QuickArtifactViewSet, basename="teacher-quick-artifacts")

# Course & Progress endpoints
router.register(r"courses", CourseViewSet, basename="courses")
router.register(r"course-levels", CourseLevelViewSet, basename="course-levels")
router.register(r"enrollments", LearnerEnrollmentViewSet, basename="enrollments")
router.register(r"progress", LearnerProgressViewSet, basename="progress")
router.register(r"achievements", AchievementViewSet, basename="achievements")

urlpatterns = [
    path("", include(router.urls)),
    path("dashboard/kpis/", DashboardKpisView.as_view(), name="dashboard-kpis"),
]

