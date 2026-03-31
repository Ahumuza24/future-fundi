import logging

logger = logging.getLogger(__name__)

# React SPA CSP — allows inline styles (required by shadcn/Tailwind) and Google Fonts
_CSP = (
    "default-src 'self'; "
    "script-src 'self' 'unsafe-inline'; "  # Vite bundles need this
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
    "font-src 'self' https://fonts.gstatic.com data:; "
    "img-src 'self' data: blob: https: http://localhost:8000 http://localhost:5173; "
    "connect-src 'self'; "
    "frame-ancestors 'none'; "
    "base-uri 'self'; "
    "form-action 'self';"
)

_PERMISSIONS_POLICY = (
    "camera=(), microphone=(), geolocation=(), "
    "payment=(), usb=(), interest-cohort=()"
)


class SecurityHeadersMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Security headers (in addition to Django's built-ins)
        response["X-Content-Type-Options"] = "nosniff"
        response["X-XSS-Protection"] = "1; mode=block"
        response["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response["Content-Security-Policy"] = _CSP
        response["Permissions-Policy"] = _PERMISSIONS_POLICY

        return response
