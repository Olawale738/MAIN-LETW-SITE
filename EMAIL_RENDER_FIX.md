# Email Not Working on Render - Solutions

## Problem

Email works locally but fails on Render with:
```
SMTPConnectTimeoutError: Timed out connecting to mail.letw.org on port 587
```

## Root Cause

**Render's free tier blocks outbound SMTP connections** on common ports (25, 587) to prevent spam. This is a security measure used by most cloud providers.

## Solutions (In Order of Recommendation)

### Solution 1: Try Port 465 (SSL) Instead of 587 (TLS) ⭐ RECOMMENDED

Port 465 is sometimes allowed when 587 is blocked.

**Steps:**
1. Go to Render Dashboard → Your Backend Service → Environment
2. Update `SMTP_PORT` from `587` to `465`
3. Click "Save Changes"
4. Manual Deploy → Clear build cache & deploy

**Test after deployment:**
- Register a new user
- Check logs for success message

---

### Solution 2: Use a Transactional Email Service (BEST for Production) 🚀

Free cloud providers often block SMTP. Use a dedicated email service instead:

#### Option A: SendGrid (Recommended - Free Tier: 100 emails/day)

1. **Sign up:** https://sendgrid.com/
2. **Create API Key:**
   - Go to Settings → API Keys
   - Create API Key with "Mail Send" permission
   - Copy the API key

3. **Update Render Environment Variables:**
   ```
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASSWORD=<your-sendgrid-api-key>
   EMAIL_FROM_ADDRESS=noreply@letw.org
   EMAIL_ENABLED=true
   ```

4. **Verify Sender Identity:**
   - Go to SendGrid → Settings → Sender Authentication
   - Verify your email domain or single sender email

#### Option B: Mailgun (Free Tier: 5,000 emails/month)

1. **Sign up:** https://www.mailgun.com/
2. **Get SMTP Credentials:**
   - Go to Sending → Domain Settings → SMTP Credentials
   - Copy hostname, username, and password

3. **Update Render Environment Variables:**
   ```
   SMTP_HOST=smtp.mailgun.org
   SMTP_PORT=587
   SMTP_USER=<your-mailgun-username>
   SMTP_PASSWORD=<your-mailgun-password>
   EMAIL_FROM_ADDRESS=noreply@letw.org
   EMAIL_ENABLED=true
   ```

#### Option C: AWS SES (Very Cheap - $0.10 per 1,000 emails)

1. **Sign up:** https://aws.amazon.com/ses/
2. **Verify your domain**
3. **Create SMTP credentials**
4. **Update Render Environment Variables**

---

### Solution 3: Upgrade Render Plan (Paid)

Render's paid plans ($7/month+) may allow outbound SMTP connections.

**Not recommended** - Better to use a dedicated email service.

---

### Solution 4: Disable Email Temporarily (Quick Fix)

If you need the app working NOW and can add email later:

**Update Render Environment Variable:**
```
EMAIL_ENABLED=false
```

**Effect:**
- Users can still register
- Emails will be logged to console instead of sent
- You can enable email later when you set up a proper service

---

## Testing Email Configuration

### Test Locally First

```bash
cd backend
source venv/bin/activate
python test_email.py your-email@example.com
```

### Test on Render

1. Go to Render Dashboard → Your Service → Shell
2. Run:
   ```bash
   python test_email.py your-email@example.com
   ```

---

## Recommended Solution for Your Case

Since you have `mail.letw.org` from cPanel:

### Option 1: Try Port 465 First (5 minutes)
- Quick to test
- Might work if Render allows port 465

### Option 2: Use SendGrid (15 minutes)
- Free tier is generous (100 emails/day)
- Very reliable
- Easy to set up
- Professional solution

### Option 3: Keep cPanel Email for Other Uses
- Use cPanel email for personal/business emails
- Use SendGrid/Mailgun for application emails
- This is actually the best practice!

---

## Why This Happens

Cloud providers block SMTP to prevent:
- Spam
- Abuse
- Compromised servers sending mass emails

**This is normal and expected behavior.**

---

## Next Steps

1. **Try Port 465** (update SMTP_PORT to 465 on Render)
2. **If that fails, sign up for SendGrid** (free, 5 minutes)
3. **Update Render environment variables**
4. **Redeploy and test**

---

## Status

⏳ **PENDING** - Waiting for you to choose a solution and test.

