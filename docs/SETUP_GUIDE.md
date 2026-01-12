# Future Fundi Dashboard - Complete Setup Guide

This guide will help you set up the Future Fundi Dashboard from scratch, including both backend and frontend.

## 📋 Prerequisites

- **Python 3.10+** (for Django backend)
- **Node.js 18+** (for React frontend)
- **PostgreSQL 14+** (optional, SQLite works for development)
- **Redis** (optional, LocMem cache works for development)
- **Git** (for version control)

## 🚀 Quick Start (Development)

### 1. Clone Repository

```bash
git clone <repository-url>
cd future-fundi
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Edit .env for development (use SQLite and LocMem cache)
# Set: USE_SQLITE=true, USE_REDIS=false

# Run migrations
python manage.py makemigrations users
python manage.py makemigrations core
python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Load seed data (optional)
python seed.py

# Start development server
python manage.py runserver
```

Backend will be available at: `http://localhost:8000`

### 3. Frontend Setup

```bash
# Open new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env to point to backend
# VITE_API_URL=http://localhost:8000

# Start development server
npm run dev
```

Frontend will be available at: `http://localhost:5173`

## 🔧 Detailed Configuration

### Backend Environment Variables

Create `backend/.env`:

```bash
# Django Core
DJANGO_SECRET_KEY=your-secret-key-here-change-in-production
DJANGO_DEBUG=true
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

# Database - SQLite (Development)
USE_SQLITE=true

# Database - PostgreSQL (Production)
USE_SQLITE=false
POSTGRES_DB=fundi
POSTGRES_USER=fundi
POSTGRES_PASSWORD=your-secure-password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Cache - LocMem (Development)
USE_REDIS=false

# Cache - Redis (Production)
USE_REDIS=true
REDIS_URL=redis://localhost:6379/1

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# API
API_PAGE_SIZE=20

# Security (Production only)
SECURE_SSL_REDIRECT=false
```

### Frontend Environment Variables

Create `frontend/.env`:

```bash
VITE_API_URL=http://localhost:8000
```

## 🗄️ Database Setup

### Option 1: SQLite (Development)

SQLite is automatically configured when `USE_SQLITE=true`. No additional setup needed.

### Option 2: PostgreSQL (Production)

```bash
# Install PostgreSQL
# On macOS:
brew install postgresql
brew services start postgresql

# On Ubuntu:
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql

# Create database and user
sudo -u postgres psql
CREATE DATABASE fundi;
CREATE USER fundi WITH PASSWORD 'your-password';
ALTER ROLE fundi SET client_encoding TO 'utf8';
ALTER ROLE fundi SET default_transaction_isolation TO 'read committed';
ALTER ROLE fundi SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE fundi TO fundi;
\q

# Update .env
USE_SQLITE=false
POSTGRES_DB=fundi
POSTGRES_USER=fundi
POSTGRES_PASSWORD=your-password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

## 🔐 Authentication Setup

### Create Test Users

```bash
# Activate backend virtual environment
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Run Django shell
python manage.py shell
```

```python
from apps.users.models import User
from apps.core.models import School, Learner

# Create test school
school = School.objects.create(
    name="Test School",
    code="TEST001"
)

# Create learner user
learner_user = User.objects.create_user(
    username="student1",
    email="student@test.com",
    password="password123",
    first_name="John",
    last_name="Doe",
    role="learner",
    tenant=school
)

# Create learner profile
Learner.objects.create(
    user=learner_user,
    tenant=school,
    first_name="John",
    last_name="Doe"
)

# Create teacher user
User.objects.create_user(
    username="teacher1",
    email="teacher@test.com",
    password="password123",
    first_name="Jane",
    last_name="Smith",
    role="teacher",
    tenant=school
)

# Create leader user
User.objects.create_user(
    username="leader1",
    email="leader@test.com",
    password="password123",
    first_name="Bob",
    last_name="Johnson",
    role="leader",
    tenant=school
)

print("Test users created successfully!")
```

### Test Login Credentials

After creating test users, you can login with:

- **Student**: username: `student1`, password: `password123`
- **Teacher**: username: `teacher1`, password: `password123`
- **Leader**: username: `leader1`, password: `password123`
- **Admin**: username: `admin`, password: (your superuser password)

## 🧪 Testing the Setup

### 1. Test Backend API

```bash
# Health check
curl http://localhost:8000/health/

# Login
curl -X POST http://localhost:8000/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "student1", "password": "password123"}'

# Get profile (use token from login response)
curl http://localhost:8000/user/profile/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 2. Test Frontend

1. Open browser to `http://localhost:5173`
2. Click "Sign in"
3. Login with test credentials
4. Verify you're redirected to the appropriate dashboard based on role

### 3. Test Role-Based Redirects

- Login as **student1** → Should redirect to `/student`
- Login as **teacher1** → Should redirect to `/teacher`
- Login as **leader1** → Should redirect to `/leader`

## 📱 Accessing Different Dashboards

### Student Dashboard (`/student`)
- Growth Tree visualization
- Portfolio of artifacts
- Pathway score and gate
- Next moves recommendations

### Teacher Dashboard (`/teacher`)
- Class roster
- Artifact submission form
- Assessment entry
- Class reports

### Parent Portal (`/parent`)
- Child selector
- Weekly artifact feed
- Portfolio view
- Pathway tracking

### Leader Dashboard (`/leader`)
- KPI tiles
- Trend charts
- School impact brief
- Equity filters

## 🐛 Troubleshooting

### Backend Issues

**Issue**: `ModuleNotFoundError: No module named 'apps'`
```bash
# Ensure you're in the backend directory
cd backend
# Activate virtual environment
source venv/bin/activate
```

**Issue**: `django.db.utils.OperationalError: no such table`
```bash
# Run migrations
python manage.py migrate
```

**Issue**: `AUTH_USER_MODEL refers to model 'users.User' that has not been installed`
```bash
# Ensure apps.users is in INSTALLED_APPS before apps.core
# Check backend/fundi/settings.py
```

### Frontend Issues

**Issue**: `Cannot find module '@/lib/store'`
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**Issue**: CORS errors in browser console
```bash
# Check backend .env has correct CORS_ALLOWED_ORIGINS
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

**Issue**: 401 Unauthorized errors
```bash
# Clear browser localStorage
# Open browser console and run:
localStorage.clear()
# Then login again
```

## 🚢 Production Deployment

### Backend (Django)

```bash
# Update .env for production
DJANGO_DEBUG=false
SECURE_SSL_REDIRECT=true
USE_SQLITE=false
USE_REDIS=true

# Collect static files
python manage.py collectstatic --noinput

# Run with Gunicorn
gunicorn fundi.wsgi:application --bind 0.0.0.0:8000
```

### Frontend (React)

```bash
# Build for production
npm run build

# Deploy dist/ folder to:
# - Vercel (recommended)
# - Netlify
# - AWS S3 + CloudFront
# - Any static hosting service
```

## 📚 Additional Resources

- **Backend README**: `backend/README.md`
- **Migration Guide**: `backend/MIGRATION_GUIDE.md`
- **Implementation Guide**: `fundi_implementation.md`
- **Tasks Tracker**: `TASKS.md`

## 🎯 Next Steps

1. ✅ Complete setup following this guide
2. ✅ Create test users with different roles
3. ✅ Test authentication and role-based routing
4. ✅ Explore each dashboard
5. ✅ Review API documentation
6. ✅ Start implementing features from TASKS.md

## 🤝 Getting Help

If you encounter issues:
1. Check this guide's troubleshooting section
2. Review backend/README.md
3. Check TASKS.md for known issues
4. Review Django and DRF documentation

---

**Happy coding! 🚀**
