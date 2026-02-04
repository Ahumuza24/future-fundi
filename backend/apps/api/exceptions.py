from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    """
    Custom exception handler for standardized error responses.
    Format:
    {
        "error": {
            "code": "error_code",
            "message": "Human readable message",
            "details": { field_errors } or null
        }
    }
    """
    # Call REST framework's default exception handler first,
    # to get the standard error response.
    response = exception_handler(exc, context)

    if response is not None:
        # Standardize the response structure
        data = response.data

        error_payload = {
            "code": "error",
            "message": "An error occurred",
            "details": None,
        }

        if isinstance(data, dict):
            if "detail" in data:
                error_payload["message"] = data["detail"]
                error_payload["code"] = getattr(exc, "default_code", "error")
                # If there are other fields besides detail, put them in details
                details = {k: v for k, v in data.items() if k != "detail"}
                if details:
                    error_payload["details"] = details
            else:
                # Likely validation errors (field-specific)
                error_payload["code"] = "validation_error"
                error_payload["message"] = "Validation failed"
                error_payload["details"] = data
        elif isinstance(data, list):
            error_payload["code"] = "validation_error"
            error_payload["message"] = "Validation failed"
            error_payload["details"] = data

        response.data = {"error": error_payload}

    return response
