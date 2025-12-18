from django.urls import path, include
from rest_framework import routers

from .views import (
    LearnerViewSet,
    ArtifactViewSet,
    DashboardKpisView,
)

router = routers.DefaultRouter()
router.register(r"learners", LearnerViewSet, basename="learners")
router.register(r"artifacts", ArtifactViewSet, basename="artifacts")

urlpatterns = [
    path("", include(router.urls)),
    path("dashboard/kpis/", DashboardKpisView.as_view(), name="dashboard-kpis"),
]

