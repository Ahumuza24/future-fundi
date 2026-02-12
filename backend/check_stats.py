import os
import sys
from pathlib import Path
from apps.core.models import School
from django.contrib.auth import get_user_model
import django

# Add backend to sys.path
backend_dir = Path(__file__).resolve().parent
sys.path.append(str(backend_dir))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fundi.settings')
django.setup()



User = get_user_model()

print(f"Total Users: {User.objects.count()}")
print(f"Active Users: {User.objects.filter(is_active=True).count()}")
print(f"Users with Last Login: {User.objects.filter(last_login__isnull=False).count()}")
print(f"School Count: {School.objects.count()}")

# Check recent user details
last_user = User.objects.order_by('date_joined').last()
if last_user:
    print(f"Last User: {last_user.username}")
    print(f"  Active: {last_user.is_active}")
    print(f"  Last Login: {last_user.last_login}")
    print(f"  Date Joined: {last_user.date_joined}")
