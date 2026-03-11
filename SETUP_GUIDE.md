# Detailed Setup Guide

This guide covers everything you need to get the full Future Fundi stack running on a fresh machine, including optional PostgreSQL and Redis setup.

---

## Prerequisites

| Tool | Minimum Version | Notes |
|---|---|---|
| Python | 3.11 | `python --version` to check |
| pip | 23+ | Bundled with Python |
| Node.js | 20 LTS | `node --version` to check |
| pnpm | 9+ | Install: `npm i -g pnpm` |
| Git | 2.40+ | |

Optional (for production-like dev):
- PostgreSQL 15+
- Redis 7+

---

## 1. Clone the repository

```bash
git clone <repo-url> future-fundi
cd future-fundi
```

---

## 2. Backend Setup

### 2.1 Create and activate a virtual environment

```bash
cd backend

# Windows (PowerShell)
python -m venv venv
venv\Scripts\Activate.ps1

# macOS / Linux
python -m venv venv
source venv/bin/activate
```

You should see `(venv)` in your terminal prompt.

### 2.2 Install dependencies

```bash
pip install -r requirements.txt
```

### 2.3 Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and set at minimum:

```env
DJANGO_SECRET_KEY=any-long-random-string-here
DJANGO_DEBUG=true
USE_SQLITE=true
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

> ⚠️ **Never commit `.env` to version control.** It's already in `.gitignore`.

### 2.4 Run database migrations

```bash
python manage.py migrate
```

### 2.5 (Optional) Seed test data

```bash
python seed.py
```

This creates sample schools, users for each role, courses, modules, and enrollments so you can explore the app immediately.

### 2.6 Create a superuser (platform admin)

```bash
python manage.py createsuperuser
```

### 2.7 Start the development server

```bash
python manage.py runserver
```

API is available at **http://localhost:8000**
Django Admin at **http://localhost:8000/admin/**
API root at **http://localhost:8000/api/**

---

## 3. Frontend Setup

```bash
cd frontend    # from the repo root
pnpm install
```

### 3.1 Configure environment variables

```bash
cp .env.example .env.local
```

`.env.local`:
```env
VITE_API_URL=http://localhost:8000/api
```

### 3.2 Start the development server

```bash
pnpm dev
```

App is available at **http://localhost:5173**

---

## 4. Default Test Credentials

After running `seed.py`, the following accounts are available:

| Role | Email | Password |
|---|---|---|
| Admin | admin@futurefundi.com | admin123 |
| Teacher | teacher@futurefundi.com | teacher123 |
| Student | student@futurefundi.com | student123 |
| Parent | parent@futurefundi.com | parent123 |
| School Admin | school@futurefundi.com | school123 |

> Update `seed.py` if these credentials are different in your environment.

---

## 5. Optional: PostgreSQL Setup (Production-like)

### 5.1 Install PostgreSQL and create a database

```sql
CREATE DATABASE fundi;
CREATE USER fundi_user WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE fundi TO fundi_user;
```

### 5.2 Update `.env`

```env
USE_SQLITE=false
POSTGRES_DB=fundi
POSTGRES_USER=fundi_user
POSTGRES_PASSWORD=your-password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

### 5.3 Install the PostgreSQL driver (already in requirements.txt)

```bash
pip install psycopg2-binary
```

### 5.4 Run migrations

```bash
python manage.py migrate
```

---

## 6. Optional: Redis Setup

Redis is used for production caching. In development, Django's in-memory cache is used automatically.

### 6.1 Install Redis

- **Windows (WSL2):** `sudo apt install redis-server && redis-server`
- **macOS:** `brew install redis && brew services start redis`
- **Linux:** `sudo apt install redis-server`

### 6.2 Update `.env`

```env
USE_REDIS=true
REDIS_URL=redis://localhost:6379/1
```

---

## 7. Running Tests

### Backend

```bash
cd backend
python manage.py test
```

### Frontend (lint)

```bash
cd frontend
pnpm lint
```

---

## 8. Common Issues & Fixes

### `CORS` errors in the browser

Make sure `CORS_ALLOWED_ORIGINS` in `.env` includes exactly `http://localhost:5173` (no trailing slash).

### `401 Unauthorized` on all requests

- Check that the backend is running on port 8000
- Check that `VITE_API_URL` in `frontend/.env.local` points to `http://localhost:8000/api`
- Try logging out and back in to get fresh tokens

### `No such table` errors after pulling new code

New migrations have been added. Run:
```bash
python manage.py migrate
```

### `Media files not loading` (404 on artifact images)

In development, Django's `runserver` serves media automatically. Check that `MEDIA_ROOT` exists:
```bash
mkdir -p backend/media
```

### Port already in use

```bash
# Kill whatever is using port 8000
# Windows
netstat -ano | findstr :8000
taskkill /PID <pid> /F

# macOS/Linux
lsof -ti:8000 | xargs kill -9
```

---

## 9. VS Code Recommended Extensions

Install these for the best development experience:

```json
{
  "recommendations": [
    "ms-python.python",
    "ms-python.black-formatter",
    "charliermarsh.ruff",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "redhat.vscode-yaml"
  ]
}
```
