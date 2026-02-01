from django.urls import include, path
from rest_framework import routers

from .child_views import ChildViewSet
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
from .student_views import StudentDashboardViewSet
from .teacher_views import QuickArtifactViewSet, TeacherSessionViewSet
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

# Teacher endpoints
router.register(r"teacher/sessions", TeacherSessionViewSet, basename="teacher-sessions")
router.register(
    r"teacher/quick-artifacts", QuickArtifactViewSet, basename="teacher-quick-artifacts"
)

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
    path("", include(router.urls)),
    path("dashboard/kpis/", DashboardKpisView.as_view(), name="dashboard-kpis"),
    path("health/", health_check, name="health-check"),
]
