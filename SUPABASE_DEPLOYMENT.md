# 🚀 Deploying with Supabase Database

You're using **Supabase** for PostgreSQL instead of Render's database. This is a great choice! Here's how to configure it properly.

---

## ✅ **What Changed**

I've updated `backend/database.py` to include **SSL support** which is required for Supabase external connections.

---

## 🔧 **Render Environment Variables**

### **DATABASE_URL Format**

Your Supabase connection string should be:

```bash
DATABASE_URL=postgresql+asyncpg://postgres:YOUR_PASSWORD@db.rtsnvbdwtnbqwwxrfpsc.supabase.co:5432/postgres?sslmode=require
```

**Important Notes:**
- ✅ Must include `+asyncpg` after `postgresql`
- ✅ Must include `?sslmode=require` at the end (critical for Supabase)
- ✅ Use your actual Supabase password (not `letwsupabase` if that's a placeholder)

**The code will auto-add `?sslmode=require` if you forget it, but it's better to include it explicitly.**

---

## 📋 **Complete Render Environment Variables**

Set these in your Render backend service:

```bash
# Database (Supabase) - IMPORTANT: Include ?sslmode=require at the end
DATABASE_URL=postgresql+asyncpg://postgres:YOUR_SUPABASE_PASSWORD@db.rtsnvbdwtnbqwwxrfpsc.supabase.co:5432/postgres?sslmode=require

# JWT Secret (generate with: python -c "import secrets; print(secrets.token_urlsafe(32))")
JWT_SECRET=your-generated-secret-here

# Application
DEBUG=False
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Email (optional - configure later)
EMAIL_ENABLED=False
EMAIL_FROM_NAME=Light Encounter Tabernacle
EMAIL_FROM_ADDRESS=noreply@letw.org

# Frontend URL (add after Vercel deployment)
FRONTEND_URL=https://your-app.vercel.app
```

---

## 🔐 **Getting Your Supabase Connection String**

If you need to find your Supabase connection details:

1. Go to your **Supabase Dashboard**: https://app.supabase.com
2. Select your project
3. Click **Settings** (gear icon) → **Database**
4. Scroll to **Connection String** section
5. Select **URI** tab
6. Copy the connection string
7. **Replace `[YOUR-PASSWORD]`** with your actual database password
8. **Add `+asyncpg`** after `postgresql`

Example transformation:
```bash
# From Supabase (original):
postgresql://postgres:[YOUR-PASSWORD]@db.rtsnvbdwtnbqwwxrfpsc.supabase.co:5432/postgres

# For Render (modified - add +asyncpg AND ?sslmode=require):
postgresql+asyncpg://postgres:YOUR_ACTUAL_PASSWORD@db.rtsnvbdwtnbqwwxrfpsc.supabase.co:5432/postgres?sslmode=require
```

---

## ✅ **Advantages of Using Supabase**

- ✅ **Free tier**: 500MB database, unlimited API requests
- ✅ **No 90-day limit** (unlike Render's free PostgreSQL)
- ✅ **Built-in backups** on free tier
- ✅ **Dashboard UI** for database management
- ✅ **Auto-scaling** included
- ✅ **Global CDN** for better performance

---

## 🔄 **Next Steps**

1. **Commit the changes** to `backend/database.py`:
   ```bash
   git add backend/database.py
   git commit -m "Add SSL support for Supabase database connection"
   git push
   ```

2. **Update Render Environment Variables**:
   - Go to Render Dashboard → Your Backend Service
   - Click **Environment** tab
   - Update `DATABASE_URL` with your Supabase connection string
   - Make sure it has `+asyncpg` in it
   - Click **Save Changes**

3. **Wait for Redeploy**:
   - Render will automatically redeploy
   - Check the logs to verify connection success

4. **Test the Connection**:
   ```bash
   # Should return: {"status": "ok"}
   curl https://your-backend.onrender.com/health
   ```

---

## 🐛 **Troubleshooting**

### **Still getting connection errors?**

**Check 1: Password is correct**
- Verify your Supabase database password
- Reset it in Supabase Dashboard → Settings → Database if needed

**Check 2: Connection string format**
```bash
# ✅ Correct:
postgresql+asyncpg://postgres:password@db.xxx.supabase.co:5432/postgres?sslmode=require

# ❌ Wrong (missing +asyncpg):
postgresql://postgres:password@db.xxx.supabase.co:5432/postgres

# ❌ Wrong (missing ?sslmode=require):
postgresql+asyncpg://postgres:password@db.xxx.supabase.co:5432/postgres
```

**Check 3: Supabase project is active**
- Go to Supabase Dashboard
- Verify project status is "Active"
- Check if you've exceeded free tier limits

**Check 4: IP allowlist (if configured)**
- Supabase free tier allows all IPs by default
- If you've restricted IPs, you need to allow Render's IPs

---

## 💰 **Cost Comparison**

### **Supabase Free Tier:**
- Database: 500MB (free forever)
- Bandwidth: 5GB/month
- No time limit

### **Render + Supabase:**
- Render Backend: Free (with sleep) or $7/mo
- Supabase Database: Free
- Vercel Frontend: Free
- **Total: $0-7/mo** (vs $14/mo with Render PostgreSQL)

---

## 📊 **Database Management**

With Supabase, you get extra features:

1. **Table Editor**: Visual interface to view/edit data
2. **SQL Editor**: Run queries directly in browser
3. **Database Backups**: Automatic daily backups
4. **Logs**: View database logs and slow queries
5. **Extensions**: Enable PostgreSQL extensions easily

Access these at: https://app.supabase.com → Your Project → Database

---

## 🎉 **You're All Set!**

Your backend is now configured to work with Supabase. After pushing the changes and updating the environment variable on Render, your deployment should succeed!

**Next**: Continue with the Vercel frontend deployment from `DEPLOYMENT_GUIDE.md`

