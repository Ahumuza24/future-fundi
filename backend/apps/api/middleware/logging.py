import logging
import time

from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger("django.request")


class RequestLoggingMiddleware(MiddlewareMixin):
    """
    Middleware to log request details and execution time.
    """

    def process_request(self, request):
        request.start_time = time.time()
        # Log request basics
        meta = request.META
        logger.info(
            f"Incoming Request: {request.method} {request.path} from {meta.get('REMOTE_ADDR')}"
        )

    def process_response(self, request, response):
        if hasattr(request, "start_time"):
            duration = time.time() - request.start_time
            status_code = response.status_code

            # Log response summary
            log_msg = f"Response: {request.method} {request.path} {status_code} ({duration:.3f}s)"

            if status_code >= 500:
                logger.error(log_msg)
            elif status_code >= 400:
                logger.warning(log_msg)
            else:
                logger.info(log_msg)

        return response
