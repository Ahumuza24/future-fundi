from __future__ import annotations

import io
import uuid

from PIL import Image
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import (
    CustomTokenObtainPairSerializer,
    RegisterSerializer,
    UserSerializer,
)


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom JWT token view that includes user data in response."""

    serializer_class = CustomTokenObtainPairSerializer


class UserProfileView(APIView):
    """Get or update current user profile."""

    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request):
        """Get current user profile with role and tenant info."""
        serializer = UserSerializer(request.user, context={"request": request})
        return Response(serializer.data)

    def patch(self, request):
        """Update user profile (limited fields)."""
        serializer = UserSerializer(
            request.user, data=request.data, partial=True, context={"request": request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AvatarUploadView(APIView):
    """Upload or delete user avatar."""

    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        """Upload a new avatar image."""
        if "avatar" not in request.FILES:
            return Response(
                {"error": "No avatar file provided"}, status=status.HTTP_400_BAD_REQUEST
            )

        avatar_file = request.FILES["avatar"]

        # Validate file type
        allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
        if avatar_file.content_type not in allowed_types:
            return Response(
                {"error": "Invalid file type. Allowed: JPEG, PNG, GIF, WebP"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate file size (max 5MB)
        if avatar_file.size > 5 * 1024 * 1024:
            return Response(
                {"error": "File too large. Maximum size is 5MB"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # Process and resize image
            img = Image.open(avatar_file)

            # Convert to RGB if necessary
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")

            # Resize to max 400x400 while maintaining aspect ratio
            max_size = (400, 400)
            img.thumbnail(max_size, Image.Resampling.LANCZOS)

            # Create square crop (center crop)
            width, height = img.size
            min_dim = min(width, height)
            left = (width - min_dim) // 2
            top = (height - min_dim) // 2
            img = img.crop((left, top, left + min_dim, top + min_dim))

            # Save to bytes
            output = io.BytesIO()
            img.save(output, format="JPEG", quality=85)
            output.seek(0)

            # Delete old avatar if exists
            if request.user.avatar:
                request.user.avatar.delete(save=False)

            # Save new avatar
            from django.core.files.uploadedfile import InMemoryUploadedFile

            unique_name = f"{request.user.id}_{uuid.uuid4().hex}.jpg"

            request.user.avatar.save(
                unique_name,
                InMemoryUploadedFile(
                    output,
                    "ImageField",
                    unique_name,
                    "image/jpeg",
                    output.getbuffer().nbytes,
                    None,
                ),
                save=True,
            )

            serializer = UserSerializer(request.user, context={"request": request})
            return Response(
                {
                    "message": "Avatar uploaded successfully",
                    "avatar_url": serializer.data.get("avatar_url"),
                }
            )

        except Exception as e:
            return Response(
                {"error": f"Failed to process image: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def delete(self, request):
        """Remove user avatar."""
        if request.user.avatar:
            request.user.avatar.delete(save=True)
            return Response({"message": "Avatar removed successfully"})
        return Response({"message": "No avatar to remove"})


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def register_view(request):
    """User registration endpoint - creates user and returns JWT tokens."""
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()

        # Generate JWT tokens (auto-login)
        refresh = RefreshToken.for_user(user)

        # Add custom claims
        refresh["role"] = user.role
        refresh["tenant_id"] = str(user.tenant_id) if user.tenant_id else None

        # Get user data
        user_serializer = UserSerializer(user)

        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": user_serializer.data,
                "detail": "User registered successfully",
            },
            status=status.HTTP_201_CREATED,
        )

    # Note: exception handler will catch standard serializer errors if we raise,
    # but here we return manually. To standardize, we could rely on exception handler
    # or use standard error wrapper if we want to change structure.
    # For now, let's just return standardized success.
    # If invalid, serializer.errors is a dict.
    from apps.api.utils.responses import validation_error_response

    return validation_error_response(serializer.errors)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    """Logout endpoint - blacklist the refresh token."""
    try:
        refresh_token = request.data.get("refresh")
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(
                {"detail": "Successfully logged out"}, status=status.HTTP_200_OK
            )
        return Response(
            {"detail": "Refresh token required"}, status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def dashboard_redirect_view(request):
    """Return the appropriate dashboard URL based on user role."""
    return Response(
        {"dashboard_url": request.user.get_dashboard_url(), "role": request.user.role}
    )
