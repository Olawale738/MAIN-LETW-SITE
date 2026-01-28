"""
Email service for sending verification and notification emails.
Supports console logging for development, SMTP, and Resend API for production.
"""

import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from config import settings

# Try to import resend, but don't fail if not installed
try:
    import resend
    RESEND_AVAILABLE = True
except ImportError:
    RESEND_AVAILABLE = False


async def send_email(to_email: str, subject: str, html_content: str) -> bool:
    """
    Send an email to the specified address.
    In development mode (EMAIL_ENABLED=False), logs to console instead.

    Supports multiple email providers:
    - Resend API (if RESEND_API_KEY is set)
    - SMTP (traditional email servers)

    Returns True if email was sent/logged successfully.
    """
    if not settings.EMAIL_ENABLED:
        # Development mode: log to console
        print("\n" + "=" * 60)
        print("📧 EMAIL (Development Mode - Not Actually Sent)")
        print("=" * 60)
        print(f"TO: {to_email}")
        print(f"SUBJECT: {subject}")
        print("-" * 60)
        print(html_content)
        print("=" * 60 + "\n")
        return True

    # Check if Resend API key is configured
    resend_api_key = getattr(settings, 'RESEND_API_KEY', None)

    if resend_api_key and RESEND_AVAILABLE:
        # Use Resend API
        return await send_email_resend(to_email, subject, html_content, resend_api_key)
    else:
        # Fall back to SMTP
        return await send_email_smtp(to_email, subject, html_content)


async def send_email_resend(to_email: str, subject: str, html_content: str, api_key: str) -> bool:
    """
    Send email using Resend API.
    """
    try:
        resend.api_key = api_key

        params = {
            "from": f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM_ADDRESS}>",
            "to": [to_email],
            "subject": subject,
            "html": html_content,
        }

        email = resend.Emails.send(params)
        print(f"✅ Email sent successfully via Resend to {to_email} (ID: {email.get('id', 'unknown')})")
        return True
    except Exception as e:
        print(f"❌ Failed to send email via Resend to {to_email}: {e}")
        import traceback
        traceback.print_exc()
        return False


async def send_email_smtp(to_email: str, subject: str, html_content: str) -> bool:
    """
    Send email using traditional SMTP.
    """
    try:
        message = MIMEMultipart("alternative")
        message["From"] = f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM_ADDRESS}>"
        message["To"] = to_email
        message["Subject"] = subject

        html_part = MIMEText(html_content, "html")
        message.attach(html_part)

        # Determine SSL/TLS based on port
        # Port 465 uses SSL, Port 587 uses STARTTLS
        use_tls = settings.SMTP_PORT == 465
        start_tls = settings.SMTP_PORT == 587

        # Try with increased timeout for slow connections
        await aiosmtplib.send(
            message,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            use_tls=use_tls,
            start_tls=start_tls,
            timeout=30  # Increase timeout to 30 seconds
        )

        print(f"✅ Email sent successfully to {to_email}")
        return True
    except aiosmtplib.errors.SMTPConnectTimeoutError as e:
        print(f"❌ SMTP Connection Timeout: {e}")
        print(f"⚠️  This usually means:")
        print(f"   1. Render is blocking outbound SMTP connections on port {settings.SMTP_PORT}")
        print(f"   2. Your SMTP server ({settings.SMTP_HOST}) is not reachable from Render")
        print(f"   3. Firewall rules are blocking the connection")
        print(f"💡 Suggestion: Try using port 465 (SSL) instead of 587 (TLS)")
        print(f"💡 Or use a service like SendGrid, Mailgun, or AWS SES for production")
        return False
    except Exception as e:
        print(f"❌ Failed to send email to {to_email}: {e}")
        import traceback
        traceback.print_exc()
        return False


async def send_verification_email(to_email: str, name: str, token: str) -> bool:
    """
    Send email verification link to new user.
    """
    verification_url = f"{settings.FRONTEND_URL}/auth/setup-password?token={token}"
    
    subject = f"Welcome to Light Encounter Tabernacle, {name}! 🌟"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: linear-gradient(135deg, #140152 0%, #1d0175 100%); padding: 40px; border-radius: 20px 20px 0 0; text-align: center;">
                <h1 style="color: #f5bb00; margin: 0; font-size: 28px;">Welcome HOME, {name}! 🌟</h1>
            </div>
            
            <div style="background: white; padding: 40px; border-radius: 0 0 20px 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
                <p style="color: #333; font-size: 16px; line-height: 1.6;">
                    Grace and Peace be multiplied unto you!
                </p>
                
                <p style="color: #333; font-size: 16px; line-height: 1.6;">
                    We are absolutely thrilled to welcome you to the <strong>Light Encounter Tabernacle</strong> family! 
                    You haven't just joined a platform; you've connected with a destiny-moulding community where God's presence changes everything.
                </p>
                
                <p style="color: #333; font-size: 16px; line-height: 1.6;">
                    <strong>Here is what awaits you:</strong>
                </p>
                
                <ul style="color: #333; font-size: 16px; line-height: 2;">
                    <li>🚀 <strong>Career & Skills:</strong> Unlock your potential with our mentorship tracks.</li>
                    <li>🔥 <strong>Spiritual Growth:</strong> Dive deep into our discipleship and theology resources.</li>
                    <li>🤝 <strong>Community:</strong> You are never alone. We are here to walk with you.</li>
                </ul>
                
                <div style="text-align: center; margin: 40px 0;">
                    <a href="{verification_url}" 
                       style="display: inline-block; background: #f5bb00; color: #140152; text-decoration: none; 
                              padding: 16px 40px; border-radius: 50px; font-weight: bold; font-size: 16px;
                              box-shadow: 0 4px 20px rgba(245, 187, 0, 0.4);">
                        Complete Your Registration →
                    </a>
                </div>
                
                <p style="color: #666; font-size: 14px; text-align: center;">
                    This link will expire in 24 hours.
                </p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                
                <p style="color: #999; font-size: 12px; text-align: center;">
                    If you didn't create an account, please ignore this email.
                </p>
                
                <p style="color: #140152; font-size: 14px; text-align: center; font-weight: bold;">
                    With Love,<br>
                    The LETW Team
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return await send_email(to_email, subject, html_content)


async def send_password_reset_email(to_email: str, name: str, token: str) -> bool:
    """
    Send password reset link to user.
    """
    reset_url = f"{settings.FRONTEND_URL}/auth/reset-password?token={token}"
    
    subject = "Reset Your Password - Light Encounter Tabernacle"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: linear-gradient(135deg, #140152 0%, #1d0175 100%); padding: 40px; border-radius: 20px 20px 0 0; text-align: center;">
                <h1 style="color: #f5bb00; margin: 0; font-size: 28px;">Password Reset Request</h1>
            </div>
            
            <div style="background: white; padding: 40px; border-radius: 0 0 20px 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
                <p style="color: #333; font-size: 16px; line-height: 1.6;">
                    Hi {name},
                </p>
                
                <p style="color: #333; font-size: 16px; line-height: 1.6;">
                    We received a request to reset your password. Click the button below to create a new password:
                </p>
                
                <div style="text-align: center; margin: 40px 0;">
                    <a href="{reset_url}" 
                       style="display: inline-block; background: #f5bb00; color: #140152; text-decoration: none; 
                              padding: 16px 40px; border-radius: 50px; font-weight: bold; font-size: 16px;
                              box-shadow: 0 4px 20px rgba(245, 187, 0, 0.4);">
                        Reset Password →
                    </a>
                </div>
                
                <p style="color: #666; font-size: 14px; text-align: center;">
                    This link will expire in 1 hour.
                </p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                
                <p style="color: #999; font-size: 12px; text-align: center;">
                    If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return await send_email(to_email, subject, html_content)


async def send_service_approved_email(to_email: str, name: str, services: list[str]) -> bool:
    """
    Send email notification when admin approves service request(s).
    """
    services_list = "".join([f"<li style='margin-bottom: 8px;'>✅ {service}</li>" for service in services])
    
    subject = "Good News! Your Service Request Has Been Approved 🎉"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: linear-gradient(135deg, #140152 0%, #1d0175 100%); padding: 40px; border-radius: 20px 20px 0 0; text-align: center;">
                <h1 style="color: #f5bb00; margin: 0; font-size: 28px;">You're In! 🎉</h1>
            </div>
            
            <div style="background: white; padding: 40px; border-radius: 0 0 20px 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
                <p style="color: #333; font-size: 16px; line-height: 1.6;">
                    Dear {name},
                </p>
                
                <p style="color: #333; font-size: 16px; line-height: 1.6;">
                    Great news! Your request to join the following service(s) has been <strong style="color: #22c55e;">approved</strong>:
                </p>
                
                <ul style="color: #333; font-size: 16px; line-height: 2; background: #f8fafc; padding: 20px 30px; border-radius: 12px; list-style: none;">
                    {services_list}
                </ul>
                
                <p style="color: #333; font-size: 16px; line-height: 1.6;">
                    You can now access these services from your dashboard. We're excited to have you involved in these areas of ministry!
                </p>
                
                <div style="text-align: center; margin: 40px 0;">
                    <a href="{settings.FRONTEND_URL}/dashboard" 
                       style="display: inline-block; background: #f5bb00; color: #140152; text-decoration: none; 
                              padding: 16px 40px; border-radius: 50px; font-weight: bold; font-size: 16px;
                              box-shadow: 0 4px 20px rgba(245, 187, 0, 0.4);">
                        Go to My Dashboard →
                    </a>
                </div>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                
                <p style="color: #140152; font-size: 14px; text-align: center; font-weight: bold;">
                    With Love,<br>
                    The LETW Team
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return await send_email(to_email, subject, html_content)


async def send_announcement_email(
    to_email: str, 
    name: str, 
    service_name: str, 
    title: str, 
    content: str
) -> bool:
    """
    Send email notification for a new service announcement.
    """
    subject = f"📢 New Announcement: {title}"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: linear-gradient(135deg, #140152 0%, #1d0175 100%); padding: 40px; border-radius: 20px 20px 0 0; text-align: center;">
                <h1 style="color: #f5bb00; margin: 0; font-size: 28px;">📢 New Announcement</h1>
                <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">{service_name}</p>
            </div>
            
            <div style="background: white; padding: 40px; border-radius: 0 0 20px 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
                <p style="color: #333; font-size: 16px; line-height: 1.6;">
                    Dear {name},
                </p>
                
                <p style="color: #333; font-size: 16px; line-height: 1.6;">
                    There's a new announcement for <strong>{service_name}</strong> that requires your attention:
                </p>
                
                <div style="background: #f8fafc; padding: 24px; border-radius: 12px; border-left: 4px solid #f5bb00; margin: 24px 0;">
                    <h2 style="color: #140152; margin: 0 0 12px 0; font-size: 20px;">{title}</h2>
                    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0; white-space: pre-wrap;">{content}</p>
                </div>
                
                <div style="text-align: center; margin: 40px 0;">
                    <a href="{settings.FRONTEND_URL}/dashboard" 
                       style="display: inline-block; background: #f5bb00; color: #140152; text-decoration: none; 
                              padding: 16px 40px; border-radius: 50px; font-weight: bold; font-size: 16px;
                              box-shadow: 0 4px 20px rgba(245, 187, 0, 0.4);">
                        Go to My Dashboard →
                    </a>
                </div>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                
                <p style="color: #140152; font-size: 14px; text-align: center; font-weight: bold;">
                    With Love,<br>
                    The LETW Team
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return await send_email(to_email, subject, html_content)



async def send_new_request_notification_email(
    to_email: str,
    admin_name: str,
    user_name: str,
    user_email: str,
    services: list[str],
    message: str | None = None
) -> bool:
    """
    Send email notification to admin about new service request(s).
    """
    services_list = "".join([f"<li style='margin-bottom: 8px;'>📝 {service}</li>" for service in services])
    
    subject = f"New Service Request from {user_name}"
    
    message_section = ""
    if message:
        message_section = f"""
        <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border-left: 4px solid #f5bb00; margin: 20px 0;">
            <p style="color: #64748b; font-size: 14px; margin: 0 0 8px 0;">User Message:</p>
            <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0; white-space: pre-wrap; font-style: italic;">"{message}"</p>
        </div>
        """
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: linear-gradient(135deg, #140152 0%, #1d0175 100%); padding: 40px; border-radius: 20px 20px 0 0; text-align: center;">
                <h1 style="color: #f5bb00; margin: 0; font-size: 24px;">New Service Request 📋</h1>
            </div>
            
            <div style="background: white; padding: 40px; border-radius: 0 0 20px 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
                <p style="color: #333; font-size: 16px; line-height: 1.6;">
                    Hello {admin_name},
                </p>
                
                <p style="color: #333; font-size: 16px; line-height: 1.6;">
                    <strong>{user_name}</strong> ({user_email}) has requested to join the following service(s):
                </p>
                
                <ul style="color: #333; font-size: 16px; line-height: 2; background: #f8fafc; padding: 20px 30px; border-radius: 12px; list-style: none;">
                    {services_list}
                </ul>
                
                {message_section}
                
                <div style="text-align: center; margin: 40px 0;">
                    <a href="{settings.FRONTEND_URL}/admin/service-requests" 
                       style="display: inline-block; background: #140152; color: #ffffff; text-decoration: none; 
                              padding: 16px 40px; border-radius: 50px; font-weight: bold; font-size: 16px;
                              box-shadow: 0 4px 20px rgba(20, 1, 82, 0.3);">
                        Review Requests →
                    </a>
                </div>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                
                <p style="color: #64748b; font-size: 14px; text-align: center;">
                    Light Encounter Tabernacle Admin System
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return await send_email(to_email, subject, html_content)
