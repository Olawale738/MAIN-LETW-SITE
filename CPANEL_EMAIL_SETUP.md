# cPanel Email Setup for Render Deployment

This guide will help you set up SMTP email using your cPanel hosting account for the Light Encounter Tabernacle application deployed on Render.

---

## 📧 Step 1: Create Email Account in cPanel

1. **Log in to your cPanel** (provided by LyteHosting)
   - URL is usually: `https://yourdomain.com:2083` or `https://cpanel.lytehostng.com`

2. **Navigate to Email Accounts:**
   - Find and click **"Email Accounts"** in the Email section

3. **Create a New Email Account:**
   - Click **"Create"** button
   - **Email:** `noreply@yourdomain.com` (or `info@yourdomain.com`)
   - **Password:** Create a strong password (save this!)
   - **Storage Space:** 250 MB is sufficient
   - Click **"Create"**

4. **Save the credentials:**
   ```
   Email: noreply@yourdomain.com
   Password: [your-strong-password]
   ```

---

## 🔧 Step 2: Get SMTP Settings from cPanel

### **Option A: Automatic Configuration (Recommended)**

1. In cPanel, go to **Email Accounts**
2. Find your newly created email
3. Click **"Connect Devices"** or **"Configure Email Client"**
4. Look for **"Mail Client Manual Settings"** or **"Manual Settings"**

You should see something like:

```
Incoming Server (IMAP):
- Server: mail.yourdomain.com
- Port: 993
- Security: SSL/TLS

Outgoing Server (SMTP):
- Server: mail.yourdomain.com
- Port: 465 (SSL) or 587 (TLS)
- Security: SSL/TLS
- Authentication: Required
```

### **Option B: Common cPanel SMTP Settings**

If you can't find the automatic settings, use these common values:

```
SMTP Host: mail.yourdomain.com
SMTP Port: 587 (TLS) or 465 (SSL)
SMTP User: noreply@yourdomain.com
SMTP Password: [your-email-password]
Use TLS: Yes (for port 587)
Use SSL: Yes (for port 465)
```

**Note:** Replace `yourdomain.com` with your actual domain name.

---

## 🚀 Step 3: Update Render Environment Variables

1. **Go to Render Dashboard:**
   - Visit: https://dashboard.render.com
   - Select your **backend service**

2. **Navigate to Environment Tab:**
   - Click **"Environment"** in the left sidebar

3. **Add/Update these environment variables:**

   ```bash
   # SMTP Configuration
   SMTP_HOST=mail.yourdomain.com
   SMTP_PORT=587
   SMTP_USER=noreply@yourdomain.com
   SMTP_PASSWORD=your-email-password-here
   EMAIL_FROM_NAME=Light Encounter Tabernacle
   EMAIL_FROM_ADDRESS=noreply@yourdomain.com
   EMAIL_ENABLED=true
   ```

4. **Click "Save Changes"**
   - Render will automatically redeploy with the new settings

---

## ✅ Step 4: Test Email Functionality

### **Test 1: User Registration**

1. Go to your frontend URL
2. Try to register a new user
3. Check if verification email is sent

### **Test 2: Password Reset**

1. Click "Forgot Password"
2. Enter an email address
3. Check if reset email is received

### **Test 3: Check Render Logs**

```bash
# In Render Dashboard, check logs for:
✅ "Email sent successfully to user@example.com"
❌ "Failed to send email: [error message]"
```

---

## 🔍 Troubleshooting

### **Issue 1: Connection Refused / Timeout**

**Possible Causes:**
- Firewall blocking SMTP ports
- Wrong SMTP host/port

**Solutions:**
1. Try port 465 instead of 587:
   ```bash
   SMTP_PORT=465
   ```

2. Check if your hosting provider requires a specific SMTP server
3. Contact LyteHosting support for correct SMTP settings

---

### **Issue 2: Authentication Failed**

**Possible Causes:**
- Wrong email/password
- Email account not created properly

**Solutions:**
1. Verify email account exists in cPanel
2. Reset the email password in cPanel
3. Make sure you're using the **full email address** as SMTP_USER

---

### **Issue 3: SSL/TLS Errors**

**Error:** `SSL: CERTIFICATE_VERIFY_FAILED`

**Solution:** Update backend email configuration to handle SSL properly.

---

## 📋 Quick Reference

### **Environment Variables Checklist**

- [ ] `SMTP_HOST` - Your mail server (e.g., `mail.yourdomain.com`)
- [ ] `SMTP_PORT` - Usually `587` (TLS) or `465` (SSL)
- [ ] `SMTP_USER` - Full email address (e.g., `noreply@yourdomain.com`)
- [ ] `SMTP_PASSWORD` - Email account password
- [ ] `EMAIL_FROM_NAME` - Display name for emails
- [ ] `EMAIL_FROM_ADDRESS` - Same as SMTP_USER
- [ ] `EMAIL_ENABLED` - Set to `true`

---

## 🎯 Alternative: Use Gmail SMTP (If cPanel doesn't work)

If you have issues with cPanel SMTP, you can use Gmail as a temporary solution:

1. **Create a Gmail account** (or use existing)
2. **Enable 2-Factor Authentication**
3. **Create an App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Generate password for "Mail"

4. **Update Render environment variables:**
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-gmail@gmail.com
   SMTP_PASSWORD=your-app-password-here
   EMAIL_FROM_ADDRESS=your-gmail@gmail.com
   EMAIL_ENABLED=true
   ```

---

## 📞 Need Help?

**Contact LyteHosting Support:**
- Ask for: "SMTP settings for sending emails from my application"
- Provide: Your domain name
- Request: Mail server hostname, port, and SSL/TLS requirements

---

**Next Steps:**
1. Create email account in cPanel
2. Get SMTP settings
3. Update Render environment variables
4. Test email functionality
5. Monitor Render logs for any errors

