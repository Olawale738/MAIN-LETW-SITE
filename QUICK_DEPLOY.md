# ⚡ Quick Deploy Checklist

Use this as a quick reference while deploying.

---

## 🎯 Deployment Order

1. ✅ **Backend + Database on Render** (do this first)
2. ✅ **Frontend on Vercel** (needs backend URL)
3. ✅ **Update backend with frontend URL**
4. ✅ **Test everything**

---

## 📋 Render Backend Setup

### Database Environment Variables to Copy:
```bash
# After creating PostgreSQL, copy the Internal Database URL
# Change postgresql:// to postgresql+asyncpg://
DATABASE_URL=postgresql+asyncpg://user:pass@host/db
```

### Backend Environment Variables:
```bash
DATABASE_URL=<from above>
JWT_SECRET=<run: python -c "import secrets; print(secrets.token_urlsafe(32))">
DEBUG=False
FRONTEND_URL=<add after Vercel deploy>
```

### Build & Start Commands:
```bash
Build: pip install -r requirements.txt
Start: uvicorn main:app --host 0.0.0.0 --port $PORT
Root Directory: backend
```

---

## 📋 Vercel Frontend Setup

### Environment Variables:
```bash
NEXT_PUBLIC_API_URL=https://YOUR-BACKEND.onrender.com/api
```

### Settings:
```bash
Framework: Next.js
Root Directory: frontend
Build Command: npm run build (auto)
Output Directory: .next (auto)
```

---

## 🔗 URLs to Save

After deployment, save these:

```
Frontend URL: https://_________________.vercel.app
Backend URL:  https://_________________.onrender.com
Database:     (managed by Render)
```

---

## ✅ Post-Deploy Checklist

- [ ] Backend health check works: `https://YOUR-BACKEND.onrender.com/health`
- [ ] Frontend loads: `https://YOUR-FRONTEND.vercel.app`
- [ ] Can register new user
- [ ] Can login
- [ ] API calls work (check DevTools Network tab)
- [ ] Updated `FRONTEND_URL` in Render backend
- [ ] Created admin user (optional): `python create_admin.py` in Render Shell

---

## 🐛 Quick Troubleshooting

**Backend won't start?**
→ Check Render logs, verify DATABASE_URL format

**Frontend can't reach backend?**
→ Check NEXT_PUBLIC_API_URL has `/api` at end

**CORS errors?**
→ Verify FRONTEND_URL in backend matches Vercel URL exactly

**Database connection failed?**
→ Use Internal Database URL, not External

---

## 💡 Pro Tips

1. **Free tier backend sleeps** - First request takes 30-60s
2. **Always use HTTPS** - Both platforms provide it automatically
3. **Check logs first** - Most issues are visible in logs
4. **Environment variables** - Must start with `NEXT_PUBLIC_` for frontend
5. **Redeploy** - Changing env vars auto-redeploys on Render

---

## 🔄 Redeployment

**Render**: Auto-deploys on git push to main branch
**Vercel**: Auto-deploys on git push to main branch

Manual redeploy:
- **Render**: Dashboard → Manual Deploy → Deploy latest commit
- **Vercel**: Dashboard → Deployments → Redeploy

---

## 📞 Support Links

- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- Render Status: https://status.render.com
- Vercel Status: https://www.vercel-status.com

