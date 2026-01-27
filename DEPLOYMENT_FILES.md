# 📁 Deployment Files Overview

This document explains all the deployment-related files created for your project.

---

## 📄 Main Deployment Guides

### `DEPLOYMENT_GUIDE.md` ⭐
**Complete step-by-step deployment guide**
- Detailed instructions for Render (backend + database)
- Detailed instructions for Vercel (frontend)
- Environment variable setup
- Post-deployment configuration
- Troubleshooting section
- Cost breakdown

**Use this for**: First-time deployment or detailed reference

---

### `QUICK_DEPLOY.md` ⚡
**Quick reference checklist**
- Condensed deployment steps
- Environment variables at a glance
- Quick troubleshooting tips
- Post-deploy checklist

**Use this for**: Quick reference during deployment

---

## 🔧 Configuration Files

### `backend/render.yaml`
**Render Blueprint configuration**
- Defines backend web service
- Defines PostgreSQL database
- Pre-configured environment variables
- Build and start commands

**Use this for**: One-click deployment on Render (optional)

---

### `backend/runtime.txt`
**Python version specification**
- Tells Render which Python version to use
- Currently set to Python 3.11.9

**Use this for**: Ensuring correct Python version on Render

---

### `frontend/.env.example`
**Frontend environment variables template**
- Shows required environment variables
- Includes examples for local and production

**Use this for**: Reference when setting up Vercel environment variables

---

## 🛠️ Helper Scripts

### `scripts/generate_jwt_secret.py`
**Generate secure JWT secret**
```bash
python scripts/generate_jwt_secret.py
```
- Creates a cryptographically secure random string
- Use output for `JWT_SECRET` environment variable

**Use this for**: Generating production JWT secret

---

### `scripts/test_deployment.sh`
**Test your deployment**
```bash
./scripts/test_deployment.sh https://your-backend.onrender.com https://your-frontend.vercel.app
```
- Tests backend health endpoint
- Tests frontend accessibility
- Checks CORS configuration
- Provides quick diagnostics

**Use this for**: Verifying deployment after going live

---

## 📊 Visual Diagrams

Two Mermaid diagrams were created to help visualize:

1. **Deployment Architecture**
   - Shows how components connect
   - User → Vercel → Render → Database flow
   - External services integration

2. **Deployment Workflow**
   - Step-by-step deployment process
   - Decision points and troubleshooting paths
   - Complete deployment flow

---

## 🚀 Quick Start

1. **Read** `DEPLOYMENT_GUIDE.md` first
2. **Keep** `QUICK_DEPLOY.md` open as reference
3. **Generate** JWT secret: `python scripts/generate_jwt_secret.py`
4. **Deploy** following the guide
5. **Test** with: `./scripts/test_deployment.sh <backend-url> <frontend-url>`

---

## 📝 Important Notes

### Environment Variables Priority

**Backend (Render)**:
1. `DATABASE_URL` - Most critical, must be correct format
2. `JWT_SECRET` - Must be secure random string
3. `FRONTEND_URL` - Must match Vercel URL exactly
4. Other variables - Use defaults from guide

**Frontend (Vercel)**:
1. `NEXT_PUBLIC_API_URL` - Must point to Render backend + `/api`

### Common Mistakes to Avoid

❌ **Wrong DATABASE_URL format**
- ✅ Correct: `postgresql+asyncpg://user:pass@host/db`
- ❌ Wrong: `postgresql://user:pass@host/db` (missing `+asyncpg`)

❌ **Missing /api in frontend**
- ✅ Correct: `https://backend.onrender.com/api`
- ❌ Wrong: `https://backend.onrender.com`

❌ **FRONTEND_URL mismatch**
- ✅ Correct: Exact Vercel URL with https://
- ❌ Wrong: Different URL or missing protocol

---

## 🆘 Getting Help

If you encounter issues:

1. **Check logs first**
   - Render: Dashboard → Service → Logs tab
   - Vercel: Dashboard → Deployments → Build Logs

2. **Verify environment variables**
   - Render: Dashboard → Service → Environment tab
   - Vercel: Dashboard → Settings → Environment Variables

3. **Test endpoints**
   - Backend health: `https://your-backend.onrender.com/health`
   - Backend API: `https://your-backend.onrender.com/`
   - Frontend: `https://your-frontend.vercel.app`

4. **Check browser console**
   - Open DevTools (F12)
   - Look for CORS errors
   - Check Network tab for failed requests

---

## 🎯 Next Steps After Deployment

1. ✅ Create admin user (in Render Shell)
2. ✅ Test all major features
3. ✅ Set up custom domain (optional)
4. ✅ Enable email (optional)
5. ✅ Set up monitoring/alerts
6. ✅ Plan for file storage (S3/Cloudinary for production)
7. ✅ Consider upgrading from free tier for production use

---

## 💰 Cost Reminder

**Free Tier** (Testing):
- Backend sleeps after 15 min inactivity
- Database limited to 90 days
- Total: $0/mo initially, then $7/mo

**Production Tier**:
- Backend: $7/mo (no sleep)
- Database: $7/mo (persistent + backups)
- Total: $14/mo

---

Good luck with your deployment! 🚀

