# Deployment Guide

This guide covers deploying Future Fundi to **Render** (backend) and **Vercel** (frontend).

---

## Overview

```
GitHub repo
  ├── /backend  →  Render Web Service (Python)
  └── /frontend →  Vercel (Static / SPA)
```

Both services are configured for auto-deploy on push to `main`.

---

## Backend — Render

### 1. Create a new Web Service on Render

- **Root Directory:** `backend`
- **Runtime:** Python 3
- **Build Command:**
  ```bash
  pip install -r requirements.txt && python manage.py collectstatic --no-input && python manage.py migrate
  ```
- **Start Command:**
  ```bash
  gunicorn fundi.wsgi:application --bind 0.0.0.0:$PORT
  ```

> Alternatively Render reads the `backend/Procfile` automatically:
> ```
> web: gunicorn fundi.wsgi:application
> ```

### 2. Set Environment Variables on Render

Go to **Environment** tab in your Render service and add:

```env
DJANGO_SECRET_KEY=<generate with: python -c "import secrets; print(secrets.token_urlsafe(50))">
DJANGO_DEBUG=false
DJANGO_ALLOWED_HOSTS=your-service-name.onrender.com
USE_SQLITE=false

# PostgreSQL — use Render's managed Postgres add-on
POSTGRES_DB=fundi
POSTGRES_USER=fundi_user
POSTGRES_PASSWORD=<from Render Postgres dashboard>
POSTGRES_HOST=<from Render Postgres dashboard>
POSTGRES_PORT=5432

# CORS — your Vercel frontend URL (no trailing slash)
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app

# CSRF
CSRF_TRUSTED_ORIGINS=https://your-service-name.onrender.com,https://your-app.vercel.app

# Security
SECURE_SSL_REDIRECT=true
```

### 3. Add a Render Postgres Database

1. Go to **New → PostgreSQL** in Render dashboard
2. Note the connection details
3. Set `POSTGRES_*` vars in your web service (step 2)

### 4. Verify the deployment

```
https://your-service-name.onrender.com/api/health/
```

Should return `{ "status": "ok" }`

---

## Frontend — Vercel

### 1. Import the repository into Vercel

- Go to [vercel.com/new](https://vercel.com/new) and import your GitHub repo
- **Root directory:** `frontend`
- **Framework:** Vite (auto-detected)
- **Build command:** `pnpm build`
- **Output directory:** `dist`
- **Install command:** `pnpm install`

### 2. Set Environment Variables on Vercel

In **Settings → Environment Variables**:

```env
VITE_API_URL=https://your-service-name.onrender.com/api
```

### 3. Configure SPA routing

The `frontend/vercel.json` already handles this:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

This ensures React Router handles all routes instead of Vercel returning 404s.

### 4. Verify the deployment

Visit your Vercel URL. You should see the Future Fundi landing page. Log in and confirm the dashboard loads data.

---

## Post-Deployment Checklist

- [ ] `https://<backend>/api/health/` returns `{ "status": "ok" }`
- [ ] Login works end-to-end
- [ ] Student dashboard loads pathway data
- [ ] Teacher can create a session
- [ ] Artifact upload works (check `MEDIA_ROOT` / storage config)
- [ ] Admin panel accessible at `https://<backend>/admin/`
- [ ] Check Render logs for any startup errors

---

## Environment Variables Reference

### Backend (full list)

| Variable | Required | Default | Notes |
|---|---|---|---|
| `DJANGO_SECRET_KEY` | ✅ | — | Generate a new one for each environment |
| `DJANGO_DEBUG` | ✅ | `false` | Always `false` in production |
| `DJANGO_ALLOWED_HOSTS` | ✅ | `localhost` | Comma-separated list |
| `USE_SQLITE` | ✅ | `false` | `true` for local dev only |
| `POSTGRES_DB` | prod | `fundi` | |
| `POSTGRES_USER` | prod | `fundi` | |
| `POSTGRES_PASSWORD` | prod | — | |
| `POSTGRES_HOST` | prod | `localhost` | |
| `POSTGRES_PORT` | prod | `5432` | |
| `USE_REDIS` | no | `false` | Set `true` + `REDIS_URL` for caching |
| `REDIS_URL` | no | — | e.g. `redis://localhost:6379/1` |
| `CORS_ALLOWED_ORIGINS` | ✅ | `http://localhost:5173` | Your frontend URL |
| `CSRF_TRUSTED_ORIGINS` | prod | — | Backend + frontend URLs |
| `SECURE_SSL_REDIRECT` | prod | `false` | Set `true` in production |

### Frontend

| Variable | Required | Notes |
|---|---|---|
| `VITE_API_URL` | ✅ | Points to `/api` path of backend |

---

## Updating the Production App

### Backend changes

```bash
git push origin main
# Render auto-deploys on push to main
# Migrations run automatically in the build command
```

### Frontend changes

```bash
git push origin main
# Vercel auto-deploys on push to main
```

### Manual migration (if needed)

From your local machine with production env vars set:
```bash
python manage.py migrate --settings=fundi.settings
```

Or via Render's **Shell** tab:
```bash
python manage.py migrate
```

---

## Rollback

### Backend

In Render → **Deployments** → find the previous successful deploy → **Rollback**

### Frontend

In Vercel → **Deployments** → find the previous deploy → **Promote to Production**

---

## Monitoring

- **Render Logs:** Render dashboard → Logs tab (live streaming)
- **API health:** `GET /api/health/` (set up a UptimeRobot check on this)
- **Django Admin:** `/admin/` — monitor users, sessions, artifacts

---

## Scaling Considerations

When you need to scale beyond a single Render instance:

1. **Enable Redis caching:** Set `USE_REDIS=true` and provision a Redis instance
2. **Enable read replica:** Set `USE_READ_REPLICA=true` and provision a Postgres read replica. The `PrimaryReplicaRouter` in `apps/core/db_router.py` will automatically route `SELECT` queries to the replica
3. **Static files:** Move to S3/Cloudflare R2 using `django-storages` (already installed)
4. **Media files:** Configure `boto3` + S3 for `MEDIA_ROOT` — credentials go in env vars
