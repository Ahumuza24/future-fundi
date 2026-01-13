from django.urls import path, include
from rest_framework import routers

from .views import (
    LearnerViewSet,
    ArtifactViewSet,
    DashboardKpisView,
)
from .child_views import ChildViewSet

router = routers.DefaultRouter()
router.register(r"learners", LearnerViewSet, basename="learners")
router.register(r"artifacts", ArtifactViewSet, basename="artifacts")
router.register(r"children", ChildViewSet, basename="children")  # Parent's children management

urlpatterns = [
    path("", include(router.urls)),
    path("dashboard/kpis/", DashboardKpisView.as_view(), name="dashboard-kpis"),
]
