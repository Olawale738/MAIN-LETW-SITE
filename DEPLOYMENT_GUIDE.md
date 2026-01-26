# 🚀 Deployment Guide: Vercel + Render

Complete step-by-step guide to deploy Light Encounter Tabernacle application.

---

## 📋 Prerequisites

- GitHub account with your repository
- Vercel account (free): https://vercel.com/signup
- Render account (free): https://render.com/register

---

## 🔧 Part 1: Deploy Backend to Render

### Step 1: Create Render Account & Connect GitHub

1. Go to https://render.com/register
2. Sign up with GitHub (recommended)
3. Authorize Render to access your repositories

### Step 2: Create PostgreSQL Database

1. From Render Dashboard, click **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name**: `letw-db`
   - **Database**: `letw_db`
   - **User**: `letw_user`
   - **Region**: Choose closest to your users (e.g., Oregon, Frankfurt)
   - **Plan**: **Free** (for testing) or **Starter** ($7/mo for production)
3. Click **"Create Database"**
4. **IMPORTANT**: Copy the **Internal Database URL** (starts with `postgresql://`)
   - Save this - you'll need it in Step 4

### Step 3: Create Web Service for Backend

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `letw-backend`
   - **Region**: Same as database
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `backend`
   - **Runtime**: **Python 3**
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: **Free** (for testing) or **Starter** ($7/mo)

### Step 4: Add Environment Variables

In the **Environment** section, add these variables:

```bash
# Database (use Internal Database URL from Step 2)
DATABASE_URL=postgresql+asyncpg://letw_user:PASSWORD@HOST/letw_db

# JWT Secret (generate a random string - see below)
JWT_SECRET=your-super-secret-random-string-here

# Application Settings
DEBUG=False
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Email Settings (optional - set later)
EMAIL_ENABLED=False
EMAIL_FROM_NAME=Light Encounter Tabernacle
EMAIL_FROM_ADDRESS=noreply@letw.org

# Frontend URL (add after deploying to Vercel)
FRONTEND_URL=https://your-app.vercel.app
```

**Generate JWT_SECRET**:
```bash
# Run this in your terminal to generate a secure secret:
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Step 5: Deploy Backend

1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. Once deployed, you'll get a URL like: `https://letw-backend.onrender.com`
4. **Test it**: Visit `https://letw-backend.onrender.com/health`
   - Should return: `{"status": "ok"}`

### Step 6: Run Database Migrations

1. In Render Dashboard, go to your **letw-backend** service
2. Click **"Shell"** tab
3. Run these commands one by one:

```bash
# Verify database connection
python -c "from database import engine; import asyncio; asyncio.run(engine.connect())"

# The tables are auto-created on first startup via init_db()
# But you can manually verify:
python -c "from database import init_db; import asyncio; asyncio.run(init_db())"
```

4. Create an admin user (optional):
```bash
python create_admin.py
```

---

## 🎨 Part 2: Deploy Frontend to Vercel

### Step 1: Create Vercel Account

1. Go to https://vercel.com/signup
2. Sign up with GitHub
3. Authorize Vercel to access your repositories

### Step 2: Import Project

1. Click **"Add New..."** → **"Project"**
2. Select your repository: `Light-Encounter-Tabernacle-`
3. Configure:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (auto-filled)
   - **Output Directory**: `.next` (auto-filled)

### Step 3: Add Environment Variables

Click **"Environment Variables"** and add:

```bash
NEXT_PUBLIC_API_URL=https://letw-backend.onrender.com/api
```

**IMPORTANT**: Replace `letw-backend.onrender.com` with your actual Render backend URL from Part 1, Step 5.

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait 2-5 minutes for build
3. You'll get a URL like: `https://light-encounter-tabernacle.vercel.app`

### Step 5: Update Backend FRONTEND_URL

1. Go back to **Render Dashboard**
2. Open your **letw-backend** service
3. Go to **Environment** tab
4. Update `FRONTEND_URL` to your Vercel URL:
   ```
   FRONTEND_URL=https://light-encounter-tabernacle.vercel.app
   ```
5. Click **"Save Changes"** (this will redeploy the backend)

---

## ✅ Part 3: Verify Deployment

### Test Backend:
```bash
# Health check
curl https://letw-backend.onrender.com/health

# API root
curl https://letw-backend.onrender.com/
```

### Test Frontend:
1. Visit your Vercel URL
2. Try registering a new account
3. Check if API calls work (open browser DevTools → Network tab)

---

## 🔒 Part 4: Post-Deployment Setup

### 1. Configure Custom Domain (Optional)

**For Vercel (Frontend)**:
1. Go to Project Settings → Domains
2. Add your domain (e.g., `www.letw.org`)
3. Follow DNS configuration instructions

**For Render (Backend)**:
1. Go to Service Settings → Custom Domain
2. Add subdomain (e.g., `api.letw.org`)
3. Update `NEXT_PUBLIC_API_URL` in Vercel

### 2. Enable Email (Optional)

Update these in Render environment variables:
```bash
EMAIL_ENABLED=True
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password  # Use App Password for Gmail
```

### 3. Set Up Monitoring

**Render**:
- Built-in metrics available in dashboard
- Set up alerts for downtime

**Vercel**:
- Analytics available in dashboard
- Enable Web Vitals monitoring

---

## 🐛 Troubleshooting

### Backend Issues:

**"Application failed to respond"**:
- Check Render logs: Dashboard → Logs tab
- Verify `DATABASE_URL` is correct
- Ensure all environment variables are set

**Database connection errors**:
- Use **Internal Database URL** (not External)
- Format: `postgresql+asyncpg://user:pass@host/db`

**CORS errors**:
- Verify `FRONTEND_URL` matches your Vercel URL exactly
- Check backend logs for CORS-related errors

### Frontend Issues:

**API calls failing**:
- Check `NEXT_PUBLIC_API_URL` is correct
- Must include `/api` at the end
- Open DevTools → Console for errors

**Build failures**:
- Check Vercel build logs
- Ensure all dependencies are in `package.json`

---

## 💰 Cost Breakdown

### Free Tier (Testing):
- **Render Backend**: Free (sleeps after 15 min inactivity)
- **Render PostgreSQL**: Free (90-day limit, then $7/mo)
- **Vercel Frontend**: Free (hobby projects)
- **Total**: $0/mo (first 90 days), then $7/mo

### Production Tier:
- **Render Backend**: Starter ($7/mo) - no sleep
- **Render PostgreSQL**: Starter ($7/mo) - persistent
- **Vercel Frontend**: Free (or Pro $20/mo for team features)
- **Total**: $14-34/mo

---

## 📝 Important Notes

1. **Free tier limitations**:
   - Backend sleeps after 15 min inactivity (30-60s cold start)
   - Database limited to 90 days on free tier
   - Consider upgrading for production use

2. **File uploads**:
   - Render's free tier has ephemeral storage
   - Files uploaded will be lost on redeploy
   - For production, use S3/Cloudinary for media storage

3. **Database backups**:
   - Free tier: No automatic backups
   - Paid tier: Daily backups included

---

## 🎉 You're Done!

Your application is now live:
- **Frontend**: https://your-app.vercel.app
- **Backend**: https://letw-backend.onrender.com
- **Database**: Managed PostgreSQL on Render

Need help? Check the logs in both Render and Vercel dashboards!

