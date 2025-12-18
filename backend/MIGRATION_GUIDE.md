# Migration Guide: Users App Setup

This guide helps you migrate the existing database to use the new `users` app structure.

## Overview

We've restructured the backend to separate user management into a dedicated `apps/users/` Django app. This provides better organization and follows Django best practices.

## Changes Made

1. **User Model Moved**: From `apps.core.User` to `apps.users.User`
2. **AUTH_USER_MODEL Updated**: Now points to `users.User`
3. **Authentication Logic Separated**: All auth endpoints now in users app
4. **Enhanced RBAC**: User model has proper role choices and helper methods

## Migration Steps

### Option 1: Fresh Database (Recommended for Development)

If you're starting fresh or can reset your database:

```bash
# 1. Delete existing database
rm db.sqlite3  # or drop PostgreSQL database

# 2. Delete all migration files
rm -rf apps/core/migrations/00*.py
rm -rf apps/users/migrations/00*.py

# 3. Create fresh migrations
python manage.py makemigrations users
python manage.py makemigrations core
python manage.py makemigrations

# 4. Apply migrations
python manage.py migrate

# 5. Create superuser
python manage.py createsuperuser --username admin --email admin@example.com

# 6. (Optional) Load seed data
python seed.py
```

### Option 2: Migrate Existing Database

If you need to preserve existing data:

```bash
# 1. Backup your database first!
cp db.sqlite3 db.sqlite3.backup  # or pg_dump for PostgreSQL

# 2. Create a data migration to move users
python manage.py makemigrations --empty users --name migrate_users_from_core

# 3. Edit the migration file (apps/users/migrations/000X_migrate_users_from_core.py)
# Add the following:
```

```python
from django.db import migrations

def migrate_users(apps, schema_editor):
    # Get old and new User models
    OldUser = apps.get_model('core', 'User')
    NewUser = apps.get_model('users', 'User')
    
    # Copy all users
    for old_user in OldUser.objects.all():
        NewUser.objects.create(
            id=old_user.id,
            username=old_user.username,
            email=old_user.email,
            first_name=old_user.first_name,
            last_name=old_user.last_name,
            password=old_user.password,
            is_staff=old_user.is_staff,
            is_active=old_user.is_active,
            is_superuser=old_user.is_superuser,
            date_joined=old_user.date_joined,
            last_login=old_user.last_login,
            tenant_id=old_user.tenant_id,
            role=old_user.role,
        )

class Migration(migrations.Migration):
    dependencies = [
        ('users', '0001_initial'),
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(migrate_users),
    ]
```

```bash
# 4. Run migrations
python manage.py migrate

# 5. Update foreign keys in core models
python manage.py makemigrations core
python manage.py migrate core

# 6. Verify data
python manage.py shell
>>> from apps.users.models import User
>>> User.objects.count()  # Should match old count
>>> User.objects.first()  # Check data integrity
```

### Option 3: Using Django's Built-in Migration Tools

```bash
# 1. Create initial migrations for users app
python manage.py makemigrations users

# 2. Create a fake migration to mark core.User as migrated
python manage.py migrate --fake-initial

# 3. Update core models to reference users.User
python manage.py makemigrations core

# 4. Apply migrations
python manage.py migrate
```

## Verification Steps

After migration, verify everything works:

```bash
# 1. Check migrations are applied
python manage.py showmigrations

# 2. Test authentication
python manage.py shell
```

```python
from apps.users.models import User
from apps.core.models import School, Learner

# Create test school
school = School.objects.create(name="Test School", code="TEST001")

# Create test user
user = User.objects.create_user(
    username="testuser",
    email="test@example.com",
    password="testpass123",
    role="learner",
    tenant=school
)

# Create learner profile
learner = Learner.objects.create(
    user=user,
    tenant=school,
    first_name="Test",
    last_name="User"
)

# Verify relationships
print(user.learner_profile)  # Should return learner
print(learner.user)  # Should return user
```

## Troubleshooting

### Error: "No such table: users_user"

**Solution**: Run migrations in correct order:
```bash
python manage.py migrate users
python manage.py migrate core
python manage.py migrate
```

### Error: "Duplicate key value violates unique constraint"

**Solution**: You may have duplicate data. Clean up:
```bash
python manage.py shell
>>> from apps.users.models import User
>>> User.objects.filter(username='duplicate').delete()
```

### Error: "Cannot resolve keyword 'user' into field"

**Solution**: Clear cached migrations:
```bash
find . -path "*/migrations/*.pyc" -delete
find . -path "*/migrations/__pycache__" -delete
python manage.py makemigrations
python manage.py migrate
```

### Error: "AUTH_USER_MODEL refers to model 'users.User' that has not been installed"

**Solution**: Ensure `apps.users` is in INSTALLED_APPS before `apps.core`:
```python
INSTALLED_APPS = [
    # ...
    'apps.users',  # Must come before apps.core
    'apps.core',
    'apps.api',
]
```

## Testing Authentication

Test the new authentication endpoints:

```bash
# 1. Start server
python manage.py runserver

# 2. Test registration
curl -X POST http://localhost:8000/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "new@example.com",
    "password": "securepass123",
    "password_confirm": "securepass123",
    "first_name": "New",
    "last_name": "User",
    "role": "learner",
    "school_code": "TEST001"
  }'

# 3. Test login
curl -X POST http://localhost:8000/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "password": "securepass123"
  }'

# 4. Test profile (use token from login)
curl -X GET http://localhost:8000/user/profile/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Rollback Plan

If you need to rollback:

```bash
# 1. Restore database backup
cp db.sqlite3.backup db.sqlite3

# 2. Revert code changes
git checkout main  # or your previous branch

# 3. Run old migrations
python manage.py migrate
```

## Next Steps

After successful migration:

1. ✅ Update frontend to use new endpoints
2. ✅ Test all authentication flows
3. ✅ Test role-based access control
4. ✅ Update API documentation
5. ✅ Deploy to staging environment
6. ✅ Run integration tests

## Support

If you encounter issues not covered here, check:
- Django documentation: https://docs.djangoproject.com/en/5.0/topics/migrations/
- DRF documentation: https://www.django-rest-framework.org/
- Project README: `backend/README.md`
