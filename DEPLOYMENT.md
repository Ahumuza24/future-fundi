# Future Fundi - Deployment Guide

This guide covers deploying the Future Fundi platform to **Vercel** (frontend) and **Render** (backend).

---

## 🚀 Frontend Deployment (Vercel)

### Prerequisites

- GitHub account with the repository
- Vercel account (free tier available)

### Steps

1. **Push your code to GitHub** (if not already done)

   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Select the `frontend` folder as the root directory

3. **Configure Build Settings**
   - Framework Preset: `Vite`
   - Build Command: `pnpm run build`
   - Output Directory: `dist`
   - Install Command: `pnpm install`

4. **Set Environment Variables**
   In Vercel dashboard → Settings → Environment Variables:

   ```
   VITE_API_URL = https://your-backend-name.onrender.com
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at `https://your-project.vercel.app`

---

## 🖥️ Backend Deployment (Render)

### Prerequisites

- GitHub account with the repository
- Render account (free tier available)

### Steps

1. **Create a New Web Service**
   - Go to [render.com](https://render.com)
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Select the `backend` folder as the root directory

2. **Configure Service Settings**
   - **Name**: `fundi-api` (or your choice)
   - **Runtime**: `Python 3`
   - **Build Command**:
     ```bash
     pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate --noinput
     ```
   - **Start Command**:
     ```bash
     gunicorn fundi.wsgi:application --bind 0.0.0.0:$PORT
     ```

3. **Set Environment Variables**
   In Render dashboard → Environment:

   ```
   DJANGO_DEBUG = false
   DJANGO_SECRET_KEY = (click "Generate" for a secure key)
   DJANGO_ALLOWED_HOSTS = .onrender.com
   USE_SQLITE = true
   CORS_ALLOWED_ORIGINS = https://your-frontend.vercel.app
   SECURE_SSL_REDIRECT = true
   PYTHON_VERSION = 3.11.4
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait for build and deployment (may take 5-10 minutes)
   - Your API will be live at `https://your-service.onrender.com`

---

## 🔗 Connect Frontend to Backend

After both are deployed:

1. **Update Frontend Environment Variable**
   - Go to Vercel dashboard
   - Settings → Environment Variables
   - Update `VITE_API_URL` to your Render backend URL
   - Redeploy the frontend

2. **Update Backend CORS**
   - Go to Render dashboard
   - Environment → Edit `CORS_ALLOWED_ORIGINS`
   - Add your Vercel frontend URL
   - Service will auto-redeploy

---

## 📦 Database Options

### Option 1: SQLite (Demo/Simple)

- Set `USE_SQLITE=true`
- Good for demos, data resets on redeploy

### Option 2: PostgreSQL (Production)

1. Create a PostgreSQL database in Render
2. Set environment variables:
   ```
   USE_SQLITE = false
   POSTGRES_DB = your_db_name
   POSTGRES_USER = your_user
   POSTGRES_PASSWORD = your_password
   POSTGRES_HOST = your_host.render.com
   POSTGRES_PORT = 5432
   ```

---

## 🔐 Security Checklist

- [x] `DJANGO_DEBUG = false`
- [x] `DJANGO_SECRET_KEY` is unique and secret
- [x] `SECURE_SSL_REDIRECT = true`
- [x] `CORS_ALLOWED_ORIGINS` only includes your frontend
- [x] `DJANGO_ALLOWED_HOSTS` is restricted

---

## 🧪 Testing the Deployment

1. **Test Backend Health**

   ```
   curl https://your-api.onrender.com/api/health/
   ```

2. **Test Frontend**
   - Open `https://your-app.vercel.app`
   - Try logging in
   - Check browser console for errors

3. **Create Admin User** (if needed)
   - In Render dashboard, go to Shell
   - Run: `python manage.py createsuperuser`

---

## 🐛 Troubleshooting

### Frontend not connecting to backend

- Check `VITE_API_URL` is correct
- Ensure CORS includes your Vercel URL
- Check browser Network tab for errors

### Backend 500 errors

- Check Render logs for details
- Ensure all environment variables are set
- Run migrations if needed

### Static files not loading

- Ensure `collectstatic` ran during build
- Check whitenoise is configured

---

## 📞 Support

For issues, check:

- Vercel build logs
- Render logs
- Browser developer console
