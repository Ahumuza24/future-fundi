# Future Fundi Backend

Django REST Framework backend for the Future Fundi Dashboard.

## 🏗️ Architecture

- **Framework**: Django 6.0 + Django REST Framework
- **Database**: PostgreSQL (with SQLite fallback for development)
- **Cache**: Redis (with LocMem fallback)
- **Authentication**: JWT (Simple JWT)
- **School Scoping**: Explicit school-based queryset filtering (`tenant_id` legacy field)

## 📁 Project Structure

```
backend/
├── apps/
│   ├── users/          # User management & authentication
│   │   ├── models.py   # Custom User model with RBAC
│   │   ├── views.py    # Auth endpoints (login, register, logout)
│   │   ├── serializers.py  # User serializers & JWT customization
│   │   └── urls.py     # Auth routes
│   ├── core/           # Core business models
│   │   ├── models.py   # School, Learner, Artifact, etc.
│   │   ├── roles.py    # Central role constants/enums
│   │   ├── scope.py    # School scoping helpers
│   │   ├── managers.py # Explicit school-scoping manager helpers
│   │   ├── middleware.py  # SchoolContextMiddleware
│   │   └── services/   # Business logic (pathway scoring)
│   └── api/            # API endpoints
│       ├── views.py    # ViewSets for learners, artifacts, dashboard
│       ├── serializers.py  # DRF serializers
│       ├── permissions.py  # Role-based permissions
│       └── urls.py     # API routes
├── fundi/              # Django project settings
│   ├── settings.py     # Configuration
│   ├── urls.py         # Root URL config
│   └── wsgi.py
├── manage.py
└── requirements.txt
```

## 🚀 Setup Instructions

### 1. Prerequisites

- Python 3.11+
- PostgreSQL 14+ (optional, SQLite works for development)
- Redis (optional, LocMem cache works for development)

### 2. Environment Setup

Create a `.env` file in the `backend/` directory:

```bash
# Django
DJANGO_SECRET_KEY=your-secret-key-here
DJANGO_DEBUG=true
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

# Database (PostgreSQL)
USE_SQLITE=false
USE_READ_REPLICA=false
POSTGRES_DB=fundi
POSTGRES_USER=fundi
POSTGRES_PASSWORD=your-password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Cache (Redis)
USE_REDIS=false
REDIS_URL=redis://localhost:6379/1

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# API
API_PAGE_SIZE=20
```

For development with SQLite and LocMem cache:
```bash
USE_SQLITE=true
USE_REDIS=false
```

### 3. Install Dependencies

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Database Setup

```bash
# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# (Optional) Load seed data
python seed.py
```

### 5. Run Development Server

```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000`

## 🔐 Authentication & Authorization

### User Roles

The system supports 7 core user roles:

1. **learner** - Students using the platform
2. **teacher** - L1/L2 teachers who capture artifacts and assessments
3. **parent** - Parents/guardians viewing their child's progress
4. **program_manager** - Cross-program analytics and impact reporting
5. **school** - School admin account
6. **admin** - Platform administrators with global access
7. **curriculum_designer** - Curriculum CMS and content management

### Authentication Flow

1. **Register**: `POST /auth/register/`
   ```json
   {
     "username": "john_doe",
     "email": "john@example.com",
     "password": "securepass123",
     "password_confirm": "securepass123",
     "first_name": "John",
     "last_name": "Doe",
     "role": "learner",
     "school_code": "SCH001"
   }
   ```
   Returns: JWT tokens + user data

2. **Login**: `POST /auth/token/`
   ```json
   {
     "username": "john_doe",
     "password": "securepass123"
   }
   ```
   Returns: JWT tokens + user data

3. **Refresh Token**: `POST /auth/token/refresh/`
   ```json
   {
     "refresh": "your-refresh-token"
   }
   ```

4. **Logout**: `POST /auth/logout/`
   ```json
   {
     "refresh": "your-refresh-token"
   }
   ```

### Role-Based Access Control

Each endpoint has role-based permissions:

- **Learners**: Can only view/edit their own profile and artifacts
- **Teachers**: Can view learners in their school, create artifacts
- **Parents**: Can view their child's profile and artifacts
- **School admins**: Full access to school data and school dashboards
- **Program managers**: Cross-program analytics and recognition reporting
- **Admins**: Global access (or school-scoped if assigned to one school)

## 📡 API Endpoints

### Authentication
- `POST /auth/token/` - Login (obtain JWT)
- `POST /auth/token/refresh/` - Refresh access token
- `POST /auth/register/` - User registration
- `POST /auth/logout/` - Logout (blacklist token)
- `GET /user/profile/` - Get current user profile
- `PATCH /user/profile/` - Update user profile
- `GET /user/dashboard/` - Get dashboard URL for user role

### Learners
- `GET /api/learners/` - List learners (filtered by role)
- `GET /api/learners/{id}/` - Get learner details
- `GET /api/learners/{id}/tree/` - Get growth tree
- `GET /api/learners/{id}/pathway/` - Get pathway score
- `GET /api/learners/{id}/artifacts/` - Get learner artifacts
- `GET /api/learners/{id}/portfolio-pdf/` - Generate PDF portfolio

### Artifacts
- `GET /api/artifacts/` - List artifacts
- `POST /api/artifacts/` - Create artifact
- `GET /api/artifacts/{id}/` - Get artifact details
- `POST /api/artifacts/{id}/upload-media/` - Upload media

### Dashboard
- `GET /api/dashboard/kpis/` - Get KPI metrics (teachers/program managers only)

## 🧪 Testing

```bash
# Run tests
python manage.py test

# Run with coverage
coverage run --source='.' manage.py test
coverage report
```

## 🔧 School Scoping

The backend uses explicit school scoping in each queryset/action.

- Database field name remains `tenant` for backward compatibility.
- In practice, `tenant == school`.
- New code should use school-oriented naming and helpers (`apps/core/scope.py`).

## 📊 Pathway Score Engine

The pathway scoring system calculates a 0-100 score based on:

```python
score = 0.4 * interest + 0.3 * skill + 0.2 * enjoyment + 0.1 * demand
```

**Gate Determination**:
- **GREEN**: score ≥ 70 AND skill ≥ 60 AND positive mood
- **AMBER**: score ≥ 50
- **RED**: else

**Recommendations** (priority order):
1. **BRIDGE**: If gate is Amber/Red
2. **SHOWCASE**: If 2+ artifacts and communication ≥ 60
3. **EXPLORE**: If breadth ≤ 2 and enjoyment ≥ 60
4. **DEEPEN**: If interest ≥ 70 and skill ≥ 70

## 🔒 Security Features

- JWT authentication with token blacklisting
- Rate limiting (60/min burst, 1000/hour sustained)
- CORS configuration
- HTTPS enforcement in production
- Secure password hashing
- School-scoped authorization boundaries

## 📦 Deployment

### Production Settings

Update `.env` for production:
```bash
DJANGO_DEBUG=false
SECURE_SSL_REDIRECT=true
USE_SQLITE=false
USE_REDIS=true
```

### Database Migrations

```bash
python manage.py migrate --database=default
```

### Collect Static Files

```bash
python manage.py collectstatic --noinput
```

### Run with Gunicorn

```bash
gunicorn fundi.wsgi:application --bind 0.0.0.0:8000
```

## 🐛 Troubleshooting

### Migration Issues

If you encounter migration conflicts after creating the users app:

```bash
# Delete existing migrations
rm -rf apps/core/migrations/00*.py
rm -rf apps/users/migrations/00*.py

# Recreate migrations
python manage.py makemigrations users
python manage.py makemigrations core
python manage.py migrate
```

### Token Blacklist

If token blacklist isn't working:
```bash
python manage.py migrate token_blacklist
```

## 📚 Additional Resources

- [Django REST Framework Docs](https://www.django-rest-framework.org/)
- [Simple JWT Docs](https://django-rest-framework-simplejwt.readthedocs.io/)
- [Django Multi-Tenancy Guide](https://books.agiliq.com/projects/django-multi-tenant/en/latest/)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Submit a pull request

## 📝 License

Proprietary - Future Fundi Dashboard
