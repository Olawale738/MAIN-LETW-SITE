# Resend Email Setup Guide 📧

## Why Resend?

✅ **Free tier:** 3,000 emails/month (vs SendGrid's 100/day)  
✅ **No credit card required** for free tier  
✅ **No port blocking issues** - uses HTTPS API  
✅ **Better deliverability** than self-hosted SMTP  
✅ **Works with lytehosting** and any hosting provider  
✅ **Modern, developer-friendly** API  

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Sign Up for Resend

1. Go to: https://resend.com/
2. Click **"Start Building"** or **"Sign Up"**
3. Sign up with your email
4. Verify your email address

### Step 2: Get Your API Key

1. Once logged in, go to **API Keys** in the sidebar
2. Click **"Create API Key"**
3. Name it: `Light Encounter Tabernacle`
4. Select permissions: **"Sending access"**
5. Click **"Add"**
6. **Copy the API key** (starts with `re_...`)
   - ⚠️ **IMPORTANT:** Save it now! You won't see it again.

### Step 3: Update Environment Variables

#### **Local Development (.env file)**

Add to your `backend/.env` file:

```bash
# Email Settings - Resend API
EMAIL_ENABLED=True
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM_NAME=Light Encounter Tabernacle
EMAIL_FROM_ADDRESS=onboarding@resend.dev
```

**Note:** For testing, use `onboarding@resend.dev` as the sender. Once you verify your domain, you can use `noreply@letw.org`.

#### **Render Production**

1. Go to: https://dashboard.render.com
2. Select your backend service
3. Go to **Environment** tab
4. Add/Update these variables:
   ```
   EMAIL_ENABLED=true
   RESEND_API_KEY=re_your_api_key_here
   EMAIL_FROM_NAME=Light Encounter Tabernacle
   EMAIL_FROM_ADDRESS=onboarding@resend.dev
   ```
5. Click **"Save Changes"**
6. **Manual Deploy** → **"Clear build cache & deploy"**

---

## 🌐 Verify Your Domain (Optional - For Production)

To send emails from `noreply@letw.org` instead of `onboarding@resend.dev`:

### Step 1: Add Domain in Resend

1. Go to **Domains** in Resend dashboard
2. Click **"Add Domain"**
3. Enter: `letw.org`
4. Click **"Add"**

### Step 2: Add DNS Records in lytehosting cPanel

Resend will show you DNS records to add. Go to your lytehosting cPanel:

1. Log in to cPanel
2. Go to **Zone Editor** or **DNS Zone Editor**
3. Select your domain: `letw.org`
4. Add the DNS records shown by Resend:
   - **SPF Record** (TXT)
   - **DKIM Record** (TXT)
   - **DMARC Record** (TXT)

### Step 3: Verify Domain

1. Wait 5-10 minutes for DNS propagation
2. Go back to Resend dashboard
3. Click **"Verify"** next to your domain
4. Once verified, update `EMAIL_FROM_ADDRESS`:
   ```bash
   EMAIL_FROM_ADDRESS=noreply@letw.org
   ```

---

## 🧪 Testing

### Test Locally

```bash
cd backend
source venv/bin/activate
pip install resend
python test_email.py your-email@example.com
```

### Test on Render

1. Go to Render Dashboard → Your Service → Shell
2. Run:
   ```bash
   python test_email.py your-email@example.com
   ```

---

## 📊 Monitor Email Delivery

1. Go to Resend dashboard
2. Click **"Logs"** in the sidebar
3. See all sent emails, delivery status, and any errors

---

## 🔄 How It Works

The email service now automatically detects which provider to use:

1. **If `RESEND_API_KEY` is set** → Uses Resend API ✅
2. **If not** → Falls back to SMTP (your lytehosting mail server)

This means:
- ✅ No code changes needed to switch providers
- ✅ Works locally and on Render
- ✅ No port blocking issues
- ✅ Better deliverability

---

## 💰 Pricing

| Plan | Price | Emails/Month |
|------|-------|--------------|
| **Free** | $0 | 3,000 |
| **Pro** | $20 | 50,000 |
| **Enterprise** | Custom | Unlimited |

**For your church app, the free tier is more than enough!**

---

## ✅ Next Steps

1. ✅ Sign up for Resend
2. ✅ Get API key
3. ✅ Update environment variables (local + Render)
4. ✅ Install resend package: `pip install resend`
5. ✅ Deploy to Render
6. ✅ Test email sending
7. ⏳ (Optional) Verify domain for custom sender address

---

## 🆘 Troubleshooting

### "Module 'resend' not found"
```bash
pip install resend
```

### "API key is invalid"
- Make sure you copied the full API key (starts with `re_`)
- Check for extra spaces in the environment variable

### "Email not received"
- Check Resend dashboard → Logs
- Check spam folder
- Verify email address is correct

---

## 📚 Resources

- Resend Dashboard: https://resend.com/
- Resend Docs: https://resend.com/docs
- Python SDK: https://github.com/resend/resend-python

---

**Status:** ⏳ Ready to implement - follow steps above

