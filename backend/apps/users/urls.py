from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    CustomTokenObtainPairView,
    UserProfileView,
    register_view,
    logout_view,
    dashboard_redirect_view,
)

app_name = 'users'

urlpatterns = [
    # Authentication
    path('auth/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/register/', register_view, name='register'),
    path('auth/logout/', logout_view, name='logout'),
    
    # User profile
    path('user/profile/', UserProfileView.as_view(), name='user_profile'),
    path('user/dashboard/', dashboard_redirect_view, name='dashboard_redirect'),
]
