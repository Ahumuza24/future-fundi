"""ASGI config for fundi project."""
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "fundi.settings")

application = get_asgi_application()

