import re

from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers


def validate_phone_number(value):
    """
    Validate phone number format (simple regex for example).
    """
    if not re.match(r'^\+?1?\d{9,15}$', value):
        raise serializers.ValidationError("Invalid phone number format.")
    return value

def validate_password_strength(value):
    """
    Validate password strength.
    """
    if len(value) < 8:
        raise serializers.ValidationError("Password must be at least 8 characters long.")
    if not any(char.isdigit() for char in value):
        raise serializers.ValidationError("Password must contain at least one digit.")
    if not any(char.isupper() for char in value):
        raise serializers.ValidationError("Password must contain at least one uppercase letter.")
    return value

class CustomValidator:
    """
    Base class for custom validators.
    """
    def __call__(self, value):
        raise NotImplementedError("Validator must implement __call__")
