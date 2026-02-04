from rest_framework import status
from rest_framework.response import Response


def success_response(data=None, message="Success", status_code=status.HTTP_200_OK):
    """
    Standardized success response.
    """
    payload = {
        "status": "success",
        "message": message,
        "data": data
    }
    return Response(payload, status=status_code)

def error_response(message="An error occurred", code="error", details=None, status_code=status.HTTP_400_BAD_REQUEST):
    """
    Standardized error response.
    """
    payload = {
        "error": {
            "code": code,
            "message": message,
            "details": details
        }
    }
    return Response(payload, status=status_code)

def validation_error_response(errors, message="Validation failed"):
    """
    Standardized validation error response.
    """
    return error_response(
        message=message,
        code="validation_error",
        details=errors,
        status_code=status.HTTP_400_BAD_REQUEST
    )
