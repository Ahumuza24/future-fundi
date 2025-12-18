from __future__ import annotations

from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import (
    UserSerializer,
    RegisterSerializer,
    CustomTokenObtainPairSerializer,
)


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom JWT token view that includes user data in response."""
    serializer_class = CustomTokenObtainPairSerializer


class UserProfileView(APIView):
    """Get or update current user profile."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Get current user profile with role and tenant info."""
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        """Update user profile (limited fields)."""
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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
        
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": user_serializer.data,
            "detail": "User registered successfully"
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    """Logout endpoint - blacklist the refresh token."""
    try:
        refresh_token = request.data.get("refresh")
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"detail": "Successfully logged out"}, status=status.HTTP_200_OK)
        return Response({"detail": "Refresh token required"}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def dashboard_redirect_view(request):
    """Return the appropriate dashboard URL based on user role."""
    return Response({
        "dashboard_url": request.user.get_dashboard_url(),
        "role": request.user.role
    })
