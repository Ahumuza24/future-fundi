# Future Fundi - Deployment Guide

This guide covers deploying the Future Fundi platform to **Vercel** (frontend) and **Render** (backend) with **PostgreSQL** database.

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
   - Root Directory: `frontend`

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

## 🗄️ PostgreSQL Database Setup (Render)

### Step 1: Create PostgreSQL Database

1. **Go to Render Dashboard**
   - Navigate to [render.com](https://render.com)
   - Click "New" → "PostgreSQL"

2. **Configure Database**
   - **Name**: `fundi-db` (or your choice)
   - **Database**: `fundi` (auto-generated)
   - **User**: `fundi` (auto-generated)
   - **Region**: Choose closest to your users
   - **Plan**: Free (or paid for production)

3. **Create Database**
   - Click "Create Database"
   - Wait for provisioning (1-2 minutes)

4. **Save Connection Details**
   After creation, you'll see:
   - **Internal Database URL**: Use this for Render services
   - **External Database URL**: Use this for local connections
   - **Hostname**: `dpg-xxxxx-a.oregon-postgres.render.com`
   - **Port**: `5432`
   - **Database**: `fundi_xxxx`
   - **Username**: `fundi_xxxx_user`
   - **Password**: (auto-generated, copy it!)

### Step 2: Install PostgreSQL Adapter

Add `psycopg2-binary` to your `requirements.txt`:

```bash
# In backend/requirements.txt
psycopg2-binary==2.9.9
```

Or if you prefer the compiled version (faster):

```bash
psycopg2==2.9.9
```

---

## 🖥️ Backend Deployment (Render)

### Prerequisites

- GitHub account with the repository
- Render account (free tier available)
- PostgreSQL database created (see above)

### Steps

1. **Create a New Web Service**
   - Go to [render.com](https://render.com)
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Select the `backend` folder as the root directory

2. **Configure Service Settings**
   - **Name**: `fundi-api` (or your choice)
   - **Runtime**: `Python 3`
   - **Region**: Same as your database
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Build Command**:
     ```bash
     pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate --noinput
     ```
   - **Start Command**:
     ```bash
     gunicorn fundi.wsgi:application --bind 0.0.0.0:$PORT --workers 2
     ```

3. **Set Environment Variables**
   In Render dashboard → Environment tab, add these variables:

   ### Required Variables

   ```bash
   # Django Settings
   DJANGO_DEBUG=false
   DJANGO_SECRET_KEY=<click "Generate" for a secure random key>
   DJANGO_ALLOWED_HOSTS=.onrender.com
   CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
   SECURE_SSL_REDIRECT=true

   # Database Configuration
   USE_SQLITE=false

   # PostgreSQL Connection (from your database)
   POSTGRES_DB=fundi_xxxx
   POSTGRES_USER=fundi_xxxx_user
   POSTGRES_PASSWORD=<your-database-password>
   POSTGRES_HOST=dpg-xxxxx-a.oregon-postgres.render.com
   POSTGRES_PORT=5432

   # Python Version
   PYTHON_VERSION=3.11.4
   ```

   ### Optional Variables (for advanced features)

   ```bash
   # Email Configuration (if using email features)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USE_TLS=true
   EMAIL_HOST_USER=your-email@gmail.com
   EMAIL_HOST_PASSWORD=your-app-password

   # AWS S3 (if using file uploads)
   AWS_ACCESS_KEY_ID=your-key
   AWS_SECRET_ACCESS_KEY=your-secret
   AWS_STORAGE_BUCKET_NAME=your-bucket
   AWS_S3_REGION_NAME=us-east-1
   ```

4. **Link Database to Web Service** (Recommended)
   - In your Web Service settings
   - Go to "Environment" tab
   - Click "Add Environment Group"
   - Select your PostgreSQL database
   - This auto-adds `DATABASE_URL` variable

5. **Deploy**
   - Click "Create Web Service" (or "Manual Deploy" if updating)
   - Wait for build and deployment (5-10 minutes first time)
   - Your API will be live at `https://your-service.onrender.com`

---

## 🔗 Connect Frontend to Backend

After both are deployed:

1. **Update Frontend Environment Variable**
   - Go to Vercel dashboard
   - Settings → Environment Variables
   - Update `VITE_API_URL` to your Render backend URL:
     ```
     VITE_API_URL=https://fundi-api.onrender.com
     ```
   - Click "Save"
   - Redeploy: Deployments → Click "..." → "Redeploy"

2. **Update Backend CORS**
   - Go to Render dashboard → Your web service
   - Environment → Edit `CORS_ALLOWED_ORIGINS`
   - Set to your Vercel URL:
     ```
     CORS_ALLOWED_ORIGINS=https://your-app.vercel.app
     ```
   - Service will auto-redeploy

---

## 🔧 Local Development with PostgreSQL (Optional)

If you want to use PostgreSQL locally instead of SQLite:

### Option 1: Use Render Database Externally

1. **Get External Connection URL**
   - Go to your Render PostgreSQL dashboard
   - Copy the "External Database URL"

2. **Set Local Environment Variables**
   Create `.env` file in `backend/`:

   ```bash
   USE_SQLITE=false
   POSTGRES_DB=fundi_xxxx
   POSTGRES_USER=fundi_xxxx_user
   POSTGRES_PASSWORD=<password>
   POSTGRES_HOST=dpg-xxxxx-a.oregon-postgres.render.com
   POSTGRES_PORT=5432
   ```

3. **Install psycopg2**

   ```bash
   pip install psycopg2-binary
   ```

4. **Run Migrations**
   ```bash
   python manage.py migrate
   ```

### Option 2: Local PostgreSQL Server

1. **Install PostgreSQL**
   - Windows: Download from [postgresql.org](https://www.postgresql.org/download/windows/)
   - Mac: `brew install postgresql`
   - Linux: `sudo apt-get install postgresql`

2. **Create Local Database**

   ```bash
   psql -U postgres
   CREATE DATABASE fundi;
   CREATE USER fundi WITH PASSWORD 'password';
   GRANT ALL PRIVILEGES ON DATABASE fundi TO fundi;
   \q
   ```

3. **Set Local Environment Variables**
   ```bash
   USE_SQLITE=false
   POSTGRES_DB=fundi
   POSTGRES_USER=fundi
   POSTGRES_PASSWORD=password
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   ```

### Keep SQLite for Local Development (Recommended)

Simply don't set `USE_SQLITE` or set it to `true`:

```bash
# .env file (or don't create one)
USE_SQLITE=true
```

This way:

- ✅ Local development uses SQLite (fast, simple)
- ✅ Production uses PostgreSQL (scalable, reliable)

---

## 🗄️ Database Migration Guide

### Migrating from SQLite to PostgreSQL

If you have data in SQLite that you want to move to PostgreSQL:

1. **Export Data from SQLite**

   ```bash
   python manage.py dumpdata --natural-foreign --natural-primary -e contenttypes -e auth.Permission > data.json
   ```

2. **Switch to PostgreSQL**
   Update environment variables to use PostgreSQL

3. **Run Migrations**

   ```bash
   python manage.py migrate
   ```

4. **Import Data**

   ```bash
   python manage.py loaddata data.json
   ```

5. **Create Superuser** (if needed)
   ```bash
   python manage.py createsuperuser
   ```

---

## 🔐 Security Checklist

### Django Settings

- [x] `DJANGO_DEBUG=false` in production
- [x] `DJANGO_SECRET_KEY` is unique and secret (use Render's "Generate" button)
- [x] `SECURE_SSL_REDIRECT=true` for HTTPS
- [x] `DJANGO_ALLOWED_HOSTS` is restricted (`.onrender.com`)

### CORS Configuration

- [x] `CORS_ALLOWED_ORIGINS` only includes your frontend URL
- [x] No wildcards (`*`) in CORS settings

### Database Security

- [x] Strong database password (auto-generated by Render)
- [x] Database not publicly accessible (use Internal URL)
- [x] Connection pooling enabled (`CONN_MAX_AGE=600`)

### Environment Variables

- [x] All secrets in environment variables (not in code)
- [x] `.env` file in `.gitignore`
- [x] No credentials committed to Git

---

## 🧪 Testing the Deployment

### 1. Test Database Connection

In Render Shell:

```bash
python manage.py dbshell
```

Should connect to PostgreSQL without errors.

### 2. Test Backend Health

```bash
curl https://your-api.onrender.com/api/health/
```

Should return `200 OK`.

### 3. Test Migrations

In Render Shell:

```bash
python manage.py showmigrations
```

All migrations should have `[X]` marks.

### 4. Create Admin User

In Render Shell:

```bash
python manage.py createsuperuser
```

### 5. Test Frontend

- Open `https://your-app.vercel.app`
- Try logging in with superuser
- Check browser console for errors
- Test creating/viewing data

---

## 🐛 Troubleshooting

### Database Connection Errors

**Error**: `could not connect to server`

**Solutions**:

- ✅ Check `POSTGRES_HOST` is correct
- ✅ Verify database is in same region as web service
- ✅ Use Internal Database URL for Render services
- ✅ Check database is running (Render dashboard)

**Error**: `password authentication failed`

**Solutions**:

- ✅ Verify `POSTGRES_PASSWORD` is correct
- ✅ Copy password exactly from database dashboard
- ✅ No extra spaces in environment variable

### Migration Errors

**Error**: `relation does not exist`

**Solutions**:

```bash
# In Render Shell
python manage.py migrate --run-syncdb
```

**Error**: `migrations not applied`

**Solutions**:

- ✅ Ensure migrations ran in build command
- ✅ Check build logs for errors
- ✅ Manually run: `python manage.py migrate`

### Frontend Not Connecting

**Error**: CORS errors in browser console

**Solutions**:

- ✅ Check `CORS_ALLOWED_ORIGINS` includes Vercel URL
- ✅ Include `https://` in URL
- ✅ No trailing slash in URL
- ✅ Redeploy backend after changing CORS

**Error**: `VITE_API_URL` not working

**Solutions**:

- ✅ Redeploy frontend after changing env vars
- ✅ Check env var name is exactly `VITE_API_URL`
- ✅ Include `https://` in URL

### Performance Issues

**Slow Database Queries**:

- ✅ Upgrade to paid PostgreSQL plan
- ✅ Add database indexes
- ✅ Enable connection pooling (already done)
- ✅ Use database in same region as web service

**Slow Cold Starts**:

- ✅ Upgrade to paid Render plan (no cold starts)
- ✅ Reduce number of dependencies
- ✅ Use gunicorn with multiple workers

---

## 📊 Monitoring

### Render Dashboard

- **Logs**: View real-time application logs
- **Metrics**: CPU, memory, request count
- **Events**: Deployments, restarts, errors

### Database Monitoring

- **Connections**: Monitor active connections
- **Storage**: Check disk usage
- **Performance**: Query performance insights (paid plans)

### Useful Commands (Render Shell)

```bash
# Check database size
python manage.py dbshell
SELECT pg_size_pretty(pg_database_size('fundi_xxxx'));

# List all tables
\dt

# Check migrations
python manage.py showmigrations

# Create backup
python manage.py dumpdata > backup.json
```

---

## 🔄 Continuous Deployment

### Auto-Deploy on Git Push

Render automatically deploys when you push to your main branch:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Render will:

1. Pull latest code
2. Run build command
3. Run migrations
4. Restart service

### Manual Deploy

In Render dashboard:

- Click "Manual Deploy" → "Deploy latest commit"

---

## 💰 Cost Optimization

### Free Tier Limits

**Render Free Tier**:

- ✅ 750 hours/month (enough for 1 service)
- ✅ Spins down after 15 min inactivity
- ✅ 90-second cold start time
- ✅ 512 MB RAM

**PostgreSQL Free Tier**:

- ✅ 1 GB storage
- ✅ Expires after 90 days (backup your data!)
- ✅ Limited connections

### Upgrade Recommendations

**For Production**:

- 💰 Render Starter ($7/month): No cold starts, more RAM
- 💰 PostgreSQL Starter ($7/month): 10 GB storage, no expiration
- 💰 Total: ~$14/month for reliable production

---

## 📞 Support Resources

### Documentation

- [Render Docs](https://render.com/docs)
- [Django Deployment](https://docs.djangoproject.com/en/stable/howto/deployment/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

### Logs to Check

1. **Render Build Logs**: Check for build errors
2. **Render Service Logs**: Check for runtime errors
3. **Vercel Build Logs**: Check for frontend build issues
4. **Browser Console**: Check for API/CORS errors

### Common Log Locations

- Render: Dashboard → Logs tab
- Vercel: Deployments → Click deployment → View logs
- Browser: F12 → Console tab

---

## ✅ Deployment Checklist

### Before Deploying

- [ ] All code committed and pushed to GitHub
- [ ] `requirements.txt` includes `psycopg2-binary`
- [ ] `gunicorn` in requirements.txt
- [ ] Environment variables documented
- [ ] Database migrations tested locally

### PostgreSQL Setup

- [ ] PostgreSQL database created on Render
- [ ] Database credentials saved securely
- [ ] Database in same region as web service

### Backend Deployment

- [ ] Web service created on Render
- [ ] Build command includes migrations
- [ ] All environment variables set
- [ ] `USE_SQLITE=false` for production
- [ ] PostgreSQL credentials configured
- [ ] Service deployed successfully

### Frontend Deployment

- [ ] Project deployed to Vercel
- [ ] `VITE_API_URL` points to Render backend
- [ ] Build completed successfully

### Post-Deployment

- [ ] Backend health check passes
- [ ] Frontend loads without errors
- [ ] CORS configured correctly
- [ ] Admin user created
- [ ] Test login works
- [ ] Database queries work

---

## 🎉 Success!

Your Future Fundi platform is now deployed with:

- ✅ Frontend on Vercel
- ✅ Backend on Render
- ✅ PostgreSQL database
- ✅ Automatic deployments
- ✅ Production-ready configuration

**Next Steps**:

1. Share your app URL with users
2. Monitor logs for errors
3. Set up regular database backups
4. Consider upgrading to paid plans for production

Happy deploying! 🚀
