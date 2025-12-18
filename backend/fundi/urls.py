from django.contrib import admin
from django.http import JsonResponse
from django.urls import path, include


def health(_request):
    """Simple health probe endpoint."""
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", health),
    # Users app (authentication, registration, profile)
    path("", include("apps.users.urls")),
    # API
    path("api/", include("apps.api.urls")),
]
