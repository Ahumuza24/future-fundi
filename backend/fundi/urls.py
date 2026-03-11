from django.conf import settings
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from django.views.static import serve
from django.urls import re_path

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



urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', serve, {
        'document_root': settings.MEDIA_ROOT,
    }),
]
