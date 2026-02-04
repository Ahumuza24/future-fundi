import logging

logger = logging.getLogger(__name__)


class SecurityHeadersMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Security headers (in addition to Django's built-ins)
        response["X-Content-Type-Options"] = "nosniff"
        response["X-XSS-Protection"] = "1; mode=block"
        response["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # CSP could vary, but a strict default is good
        # response["Content-Security-Policy"] = "default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self' 'unsafe-inline';"

        return response
