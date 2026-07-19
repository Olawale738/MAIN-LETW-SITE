"""
Email service for sending verification and notification emails.
Supports console logging for development, SMTP, and Resend API for production.
"""

import aiosmtplib
import html
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

from sqlalchemy import select

from config import settings

logger = logging.getLogger(__name__)

# Try to import resend, but don't fail if not installed
try:
    import resend
    RESEND_AVAILABLE = True
except ImportError:
    RESEND_AVAILABLE = False


async def _get_admin_email_template(slot: str) -> Optional[dict]:
    """
    Fetch an admin-saved email template from the ministry-content table.

    `slot` is one of: welcome, password_reset, prayer_received, decision_followup
    (these match the keys in the /admin/site-content Email Templates tab).

    Returns None if nothing has been saved yet OR on any DB/lookup error — the
    callers fall back to the hardcoded HTML in that case so emails always send.
    """
    try:
        # Local imports to avoid a circular dependency at module load time.
        from database import AsyncSessionLocal
        from models.ministry_content import MinistryContent

        async with AsyncSessionLocal() as db:
            row = (await db.execute(
                select(MinistryContent).where(MinistryContent.key == "email-templates")
            )).scalar_one_or_none()
            if not row or not row.content:
                return None
            t = row.content.get(slot)
            if not isinstance(t, dict):
                return None
            subject = (t.get("subject") or "").strip()
            body = (t.get("body") or "").strip()
            if not subject or not body:
                return None
            return {"subject": subject, "body": body}
    except Exception as e:
        logger.warning("Failed to read admin email template '%s': %s", slot, e)
        return None


def _render_admin_template_body(body: str, **tokens) -> str:
    """
    Render an admin-managed plain-text template:
      - replace {placeholders} with provided tokens
      - HTML-escape user values to prevent injection
      - wrap in a minimal-but-branded HTML shell so the email still looks
        polished without requiring the admin to write HTML themselves.
    """
    rendered = body
    for k, v in tokens.items():
        rendered = rendered.replace("{" + k + "}", html.escape(str(v)))

    # Preserve line breaks; very lightweight conversion to HTML.
    paragraphs = "".join(
        f'<p style="color:#333;font-size:16px;line-height:1.6;margin:0 0 16px;">{line}</p>'
        for line in rendered.split("\n") if line.strip()
    )

    return f"""
    <!DOCTYPE html><html><head><meta charset="utf-8"></head>
    <body style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;margin:0;padding:0;background-color:#f5f5f5;">
      <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
        <div style="background:linear-gradient(135deg,#140152 0%,#1d0175 100%);padding:32px;border-radius:20px 20px 0 0;text-align:center;">
          <h1 style="color:#f5bb00;margin:0;font-size:24px;">Light Encounter Tabernacle</h1>
        </div>
        <div style="background:white;padding:36px;border-radius:0 0 20px 20px;box-shadow:0 10px 40px rgba(0,0,0,0.1);">
          {paragraphs}
        </div>
      </div>
    </body></html>
    """


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


def _build_ics(*, uid: str, start: "datetime_type", end: "datetime_type", summary: str,
               description: str, url: str = "") -> str:
    """Minimal RFC-5545 VEVENT as a floating-local-time calendar invite.

    Floating time (no Z / no TZID) is interpreted by calendar clients in the
    viewer's own local zone — which is what we want for a church scheduling a
    call with a local couple, without wrangling timezones."""
    def fmt(d):
        return d.strftime("%Y%m%dT%H%M%S")
    lines = [
        "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//LETW//Marriage Prep//EN",
        "CALSCALE:GREGORIAN", "METHOD:REQUEST", "BEGIN:VEVENT",
        f"UID:{uid}", f"DTSTAMP:{fmt(start)}", f"DTSTART:{fmt(start)}", f"DTEND:{fmt(end)}",
        f"SUMMARY:{summary}",
        "DESCRIPTION:" + description.replace("\n", "\\n"),
    ]
    if url:
        lines.append(f"URL:{url}")
    lines += ["END:VEVENT", "END:VCALENDAR"]
    return "\r\n".join(lines)


async def send_email_with_ics(to_email: str, subject: str, html_content: str,
                              ics_text: str, ics_filename: str = "invite.ics") -> bool:
    """Send an email that carries a calendar (.ics) attachment. Uses Resend when
    configured (base64 attachment), else SMTP with a MIME attachment, else logs.
    Best-effort: returns False on failure but never raises."""
    import base64
    if not settings.EMAIL_ENABLED:
        print("\n" + "=" * 60)
        print("📧 EMAIL+ICS (Development Mode - Not Actually Sent)")
        print(f"TO: {to_email}\nSUBJECT: {subject}")
        print("-" * 60 + f"\n{html_content}\n--- ICS ---\n{ics_text}")
        print("=" * 60 + "\n")
        return True
    resend_api_key = getattr(settings, "RESEND_API_KEY", None)
    try:
        if resend_api_key and RESEND_AVAILABLE:
            resend.api_key = resend_api_key
            resend.Emails.send({
                "from": f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM_ADDRESS}>",
                "to": [to_email], "subject": subject, "html": html_content,
                "attachments": [{
                    "filename": ics_filename,
                    "content": base64.b64encode(ics_text.encode("utf-8")).decode("ascii"),
                    "content_type": "text/calendar",
                }],
            })
            print(f"✅ Email+ICS sent via Resend to {to_email}")
            return True
        # SMTP fallback with attachment
        from email.mime.base import MIMEBase
        from email import encoders as _encoders
        message = MIMEMultipart("mixed")
        message["From"] = f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM_ADDRESS}>"
        message["To"] = to_email
        message["Subject"] = subject
        message.attach(MIMEText(html_content, "html"))
        part = MIMEBase("text", "calendar", method="REQUEST", name=ics_filename)
        part.set_payload(ics_text)
        _encoders.encode_base64(part)
        part.add_header("Content-Disposition", f'attachment; filename="{ics_filename}"')
        message.attach(part)
        use_tls = settings.SMTP_PORT == 465
        start_tls = settings.SMTP_PORT == 587
        await aiosmtplib.send(
            message, hostname=settings.SMTP_HOST, port=settings.SMTP_PORT,
            username=settings.SMTP_USER, password=settings.SMTP_PASSWORD,
            use_tls=use_tls, start_tls=start_tls, timeout=30,
        )
        print(f"✅ Email+ICS sent via SMTP to {to_email}")
        return True
    except Exception as e:
        print(f"❌ Failed to send email+ICS to {to_email}: {e}")
        return False


async def send_marriage_prep_session_email(
    *, to_email: str, partner_a: str, partner_b: str,
    when, note: str, join_url: str,
) -> bool:
    """Emails a couple a calendar invite for a pastor-scheduled session."""
    from datetime import timedelta
    from urllib.parse import quote as _q
    end = when + timedelta(hours=1)
    when_label = when.strftime("%A, %B %d, %Y at %I:%M %p")
    couple = html.escape(f"{partner_a} & {partner_b}")
    note = (note or "").strip()
    when_stamp = when.strftime("%Y%m%dT%H%M%S")
    end_stamp = end.strftime("%Y%m%dT%H%M%S")
    join_line = ("\n\nJoin: " + join_url) if join_url else ""
    gcal = (
        "https://www.google.com/calendar/render?action=TEMPLATE"
        "&text=" + _q("Marriage Prep session with your pastor")
        + "&dates=" + when_stamp + "/" + end_stamp
        + "&details=" + _q(note + join_line)
    )
    note_block = ("<p style=\"background:#fbf5e6;border:1px solid #f5bb00;border-radius:10px;padding:12px\">"
                  + html.escape(note) + "</p>") if note else ""
    body_html = f"""
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1f2937">
      <div style="background:#140152;color:#fff;padding:24px;border-radius:16px 16px 0 0">
        <h2 style="margin:0;color:#f5bb00">Your Marriage Prep session is scheduled</h2>
      </div>
      <div style="border:1px solid #eee;border-top:none;padding:24px;border-radius:0 0 16px 16px">
        <p>Dear {couple},</p>
        <p>Your pastor has scheduled a session with you:</p>
        <p style="font-size:18px;font-weight:bold;color:#140152">&#128197; {html.escape(when_label)}</p>
        {note_block}
        <p style="margin:24px 0">
          <a href="{join_url}" style="background:#140152;color:#fff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:999px">Join the video call</a>
        </p>
        <p style="font-size:13px;color:#6b7280">
          The calendar invite (.ics) is attached — open it to add this to your calendar,
          or <a href="{gcal}">add it to Google Calendar</a>.
        </p>
      </div>
    </div>
    """
    ics = _build_ics(
        uid="letw-mp-" + str(abs(hash((to_email, when_label)))) + "@letw.org",
        start=when, end=end,
        summary="Marriage Prep session with your pastor",
        description=(note or "Marriage Prep pastoral session.") + join_line,
        url=join_url,
    )
    return await send_email_with_ics(to_email, "Your Marriage Prep session is scheduled", body_html, ics, "marriage-prep-session.ics")


async def send_verification_email(to_email: str, name: str, token: str) -> bool:
    """
    Send email verification link to new user.
    Honours admin-managed override from ministry-content 'email-templates' key
    when present; otherwise sends the rich hardcoded template below.
    """
    verification_url = f"{settings.FRONTEND_URL}/auth/setup-password?token={token}"

    admin_tpl = await _get_admin_email_template("welcome")
    if admin_tpl:
        admin_subject = admin_tpl["subject"].replace("{name}", name)
        admin_html = _render_admin_template_body(
            admin_tpl["body"] + f"\n\nComplete your registration: {verification_url}",
            name=name,
        )
        return await send_email(to_email, admin_subject, admin_html)

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
    Honours admin-managed override from ministry-content 'email-templates' key
    when present; otherwise sends the rich hardcoded template below.
    """
    reset_url = f"{settings.FRONTEND_URL}/auth/reset-password?token={token}"

    admin_tpl = await _get_admin_email_template("password_reset")
    if admin_tpl:
        admin_subject = admin_tpl["subject"].replace("{name}", name)
        admin_body = admin_tpl["body"]
        # If admin used {reset_link} placeholder, render the actual URL inline;
        # otherwise append a fallback action line so the email is still usable.
        if "{reset_link}" not in admin_body:
            admin_body += f"\n\nReset link: {reset_url}"
        admin_html = _render_admin_template_body(admin_body, name=name, reset_link=reset_url)
        return await send_email(to_email, admin_subject, admin_html)

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


# ─────────────────────────────────────────────────────────────────────────────
# Prayer received + decision follow-up — both are 100% admin-template driven.
# If the admin hasn't saved a template yet, we send a minimal but acceptable
# default so we never silently drop the email.
# ─────────────────────────────────────────────────────────────────────────────

async def send_prayer_received_email(to_email: str, name: str) -> bool:
    """
    Confirmation sent to the submitter when a prayer request is received.
    Uses the admin-managed 'prayer_received' template from /admin/site-content
    -> Email Templates, falling back to a built-in default.
    """
    if not to_email:
        return False
    admin_tpl = await _get_admin_email_template("prayer_received")
    if admin_tpl:
        subject = admin_tpl["subject"].replace("{name}", name or "Friend")
        html_body = _render_admin_template_body(admin_tpl["body"], name=name or "Friend")
        return await send_email(to_email, subject, html_body)

    subject = "Your prayer request has been received"
    body = (
        f"Hi {name or 'Friend'},\n\n"
        f"Thank you for sharing your request. Our intercessors are praying for you.\n\n"
        f"Grace and peace,\n"
        f"Light Encounter Tabernacle Worldwide"
    )
    html_body = _render_admin_template_body(body, name=name or "Friend")
    return await send_email(to_email, subject, html_body)


async def send_decision_followup_email(to_email: str, name: str, decision_kind: str = "decision") -> bool:
    """
    Follow-up sent when a person records a salvation / rededication / baptism
    decision (e.g. via /live altar call or /admin/decisions).
    Uses the admin-managed 'decision_followup' template, falling back to a
    built-in default.
    """
    if not to_email:
        return False
    admin_tpl = await _get_admin_email_template("decision_followup")
    if admin_tpl:
        subject = (
            admin_tpl["subject"]
            .replace("{name}", name or "Friend")
            .replace("{decision_kind}", decision_kind)
        )
        body_with_tokens = admin_tpl["body"].replace("{decision_kind}", decision_kind)
        html_body = _render_admin_template_body(body_with_tokens, name=name or "Friend")
        return await send_email(to_email, subject, html_body)

    subject = "A next step in your walk with Christ"
    body = (
        f"Hi {name or 'Friend'},\n\n"
        f"Heaven rejoices over you. Here are some next steps in your new journey:\n\n"
        f"- Read John 3:16 today.\n"
        f"- Join a small group at {settings.FRONTEND_URL}/groups.\n"
        f"- Reach out — we are here.\n\n"
        f"Grace and peace,\n"
        f"Light Encounter Tabernacle Worldwide"
    )
    html_body = _render_admin_template_body(body, name=name or "Friend")
    return await send_email(to_email, subject, html_body)


# ─────────────────────────────────────────────────────────────────────────────
# Marriage-prep sign-off — congratulates the couple, links to their
# certificate + next-steps page, and hints at wedding-hall booking and
# pastor follow-up. Uses admin-managed template if present.
# ─────────────────────────────────────────────────────────────────────────────

async def send_marriage_prep_enrolled_email(
    to_email: str,
    partner_a: str,
    partner_b: str,
    portal_url: str,
    join_url: str = "",
) -> bool:
    """
    Welcome email at the moment of enrolment — carries the couple's portal
    link (their UUID capability link is the credential, so this email is how
    they find their way back to the course) and their private video-room link
    so they can join a call the pastor starts without opening the portal first.
    Honours the admin-editable 'marriage_prep_enrolled' template slot when saved.
    """
    if not to_email:
        return False
    couple_label = f"{partner_a} & {partner_b}"
    admin_tpl = await _get_admin_email_template("marriage_prep_enrolled")
    if admin_tpl:
        subj = admin_tpl["subject"].replace("{couple}", couple_label)
        body = (admin_tpl["body"]
                .replace("{couple}", couple_label)
                .replace("{partner_a}", partner_a).replace("{partner_b}", partner_b)
                .replace("{portal_link}", portal_url)
                .replace("{video_link}", join_url or portal_url))
        return await send_email(to_email, subj, _render_admin_template_body(body, couple=couple_label))

    video_block = (
        f"Your private video room (use it when your pastor invites you to a call):\n"
        f"{join_url}\n\n"
    ) if join_url else ""
    subject = f"Welcome to Marriage Prep, {couple_label}"
    body = (
        f"Dear {couple_label},\n\n"
        f"You're enrolled. Your guided course starts now — at your own pace, "
        f"together.\n\n"
        f"Your private course portal (bookmark this — it's your key):\n"
        f"{portal_url}\n\n"
        f"{video_block}"
        f"How it works:\n\n"
        f"1. Open the portal and read week one together — scripture, teaching, homework.\n"
        f"2. Write your shared reflections in the portal and mark the week complete.\n"
        f"3. Repeat weekly. Set aside 90 minutes — phones away, hearts open.\n"
        f"4. When you finish, your pastor reviews the journey and signs off.\n"
        f"5. The moment they do, your Certificate of Completion appears in the portal — "
        f"printable, QR-verified, and signed by letw.org.\n\n"
        f"We're praying for you both.\n"
        f"Light Encounter Tabernacle Worldwide"
    )
    return await send_email(to_email, subject, _render_admin_template_body(body, couple=couple_label))


async def send_marriage_prep_completion_email(
    to_email: str,
    partner_a_name: str,
    partner_b_name: str,
    couple_id: str,
    pastor_signature: str = "",
    pastor_note: str = "",
    wedding_date: str = "",
) -> bool:
    """
    Emails a completed couple with congratulations, a link to their
    certificate + next-steps page, and pointers to the sanctuary booking,
    contact-a-pastor form, and referral link. Best-effort — a mail failure
    never blocks sign-off.
    """
    if not to_email:
        return False

    couple_label = f"{partner_a_name} & {partner_b_name}".strip(" &")
    complete_url  = f"{settings.FRONTEND_URL}/marriage-prep/complete/{couple_id}"
    sanctuary_url = f"{settings.FRONTEND_URL}/sanctuary"
    contact_url   = f"{settings.FRONTEND_URL}/contact"

    admin_tpl = await _get_admin_email_template("marriage_prep_completion")
    if admin_tpl:
        subject = (
            admin_tpl["subject"]
            .replace("{couple}", couple_label)
            .replace("{partner_a}", partner_a_name or "")
            .replace("{partner_b}", partner_b_name or "")
            .replace("{pastor}", pastor_signature or "")
        )
        body = (
            admin_tpl["body"]
            .replace("{couple}", couple_label)
            .replace("{partner_a}", partner_a_name or "")
            .replace("{partner_b}", partner_b_name or "")
            .replace("{pastor}", pastor_signature or "")
            .replace("{pastor_note}", pastor_note or "")
            .replace("{wedding_date}", wedding_date or "")
            .replace("{certificate_link}", complete_url)
            .replace("{sanctuary_link}", sanctuary_url)
            .replace("{contact_link}", contact_url)
        )
        html_body = _render_admin_template_body(body, couple=couple_label)
        return await send_email(to_email, subject, html_body)

    # Built-in default — used when admin has NOT saved a custom template.
    subject = f"You did it, {couple_label} — Marriage Prep complete"
    wed_line = f"Wedding date on file: {wedding_date}\n" if wedding_date else ""
    note_line = f"\nYour pastor's note:\n\"{pastor_note}\"\n" if pastor_note else ""
    body = (
        f"Dear {couple_label},\n\n"
        f"Congratulations. You have completed all six weeks of Marriage Prep. "
        f"Your certificate and next steps are ready for you here:\n"
        f"{complete_url}\n\n"
        f"{wed_line}"
        f"{note_line}"
        f"\nNext steps we recommend:\n\n"
        f"1. Print or download your Certificate of Completion at the link above.\n"
        f"2. Book your wedding hall or reserve a rehearsal date at\n"
        f"   {sanctuary_url}\n"
        f"3. Schedule a final planning call with your pastor at\n"
        f"   {contact_url}\n"
        f"4. Keep the conversation going — the habits you built in these six weeks\n"
        f"   are muscles that grow when you use them.\n\n"
        f"With joy,\n"
        f"{pastor_signature or 'The Pastoral Team'}\n"
        f"Light Encounter Tabernacle Worldwide\n"
    )
    html_body = _render_admin_template_body(body, couple=couple_label)
    return await send_email(to_email, subject, html_body)


# ─────────────────────────────────────────────────────────────────────────────
# Admin-notify helper — used by sanctuary / life-events flows to page the
# right inbox when a member submits a booking or request. Reads the church
# email from ministry-content 'footer' (admin-editable at /admin/site-content
# → Footer tab) so the notification address can change without redeploying.
# Falls back to config.CONTACT_EMAIL and finally to a hardcoded default.
# ─────────────────────────────────────────────────────────────────────────────

async def _admin_notify_email() -> str:
    try:
        from database import AsyncSessionLocal
        from models.ministry_content import MinistryContent
        async with AsyncSessionLocal() as db:
            row = (await db.execute(
                select(MinistryContent).where(MinistryContent.key == "footer")
            )).scalar_one_or_none()
            if row and row.content:
                v = (row.content.get("email") or "").strip()
                if v:
                    return v
    except Exception as e:
        logger.warning("Failed to read admin notify email from footer key: %s", e)
    return getattr(settings, "CONTACT_EMAIL", None) or "info@letw.org"


# ─────────────────────────────────────────────────────────────────────────────
# Sanctuary / hall booking — three emails per booking
#   1. sanctuary_booking_received       (to requester,  on submit)
#   2. sanctuary_booking_admin_notice   (to admin,      on submit)
#   3. sanctuary_booking_decision       (to requester,  on approve/decline)
# ─────────────────────────────────────────────────────────────────────────────

def _fmt_range(starts, ends) -> str:
    try:
        s = starts.strftime("%A %d %b %Y · %H:%M") if hasattr(starts, "strftime") else str(starts)
        e = ends.strftime("%H:%M")               if hasattr(ends,   "strftime") else str(ends)
        return f"{s} — {e}"
    except Exception:
        return f"{starts} — {ends}"


async def send_sanctuary_booking_received(
    to_email: str, name: str, room_name: str, purpose: str,
    starts_at, ends_at, reference: str,
) -> bool:
    """Immediate confirmation to the requester on submission."""
    if not to_email:
        return False
    range_str = _fmt_range(starts_at, ends_at)
    admin_tpl = await _get_admin_email_template("sanctuary_booking_received")
    if admin_tpl:
        subj = (admin_tpl["subject"]
                .replace("{name}", name).replace("{room}", room_name)
                .replace("{purpose}", purpose).replace("{reference}", reference))
        body = (admin_tpl["body"]
                .replace("{room}", room_name).replace("{purpose}", purpose)
                .replace("{range}", range_str).replace("{reference}", reference))
        return await send_email(to_email, subj, _render_admin_template_body(body, name=name))

    subject = f"We received your booking request for {room_name}"
    body = (
        f"Hi {name or 'Friend'},\n\n"
        f"Thank you for requesting {room_name} for \"{purpose}\".\n\n"
        f"Requested window: {range_str}\n"
        f"Reference: {reference}\n\n"
        f"What happens next:\n\n"
        f"1. A coordinator reviews your request against the room's calendar.\n"
        f"2. You will receive an approval or decline email within 48 hours.\n"
        f"3. On approval you'll get arrival + setup notes for the space.\n\n"
        f"Questions? Just reply to this email — we're here.\n\n"
        f"Grace and peace,\n"
        f"Light Encounter Tabernacle Worldwide"
    )
    return await send_email(to_email, subject, _render_admin_template_body(body, name=name or "Friend"))


async def send_sanctuary_booking_admin_notice(
    admin_email: str, requester_name: str, requester_email: str,
    room_name: str, purpose: str, starts_at, ends_at,
    reference: str,
) -> bool:
    """Ping the church inbox so someone can act on the new request."""
    if not admin_email:
        return False
    range_str = _fmt_range(starts_at, ends_at)
    admin_tpl = await _get_admin_email_template("sanctuary_booking_admin_notice")
    if admin_tpl:
        subj = (admin_tpl["subject"]
                .replace("{room}", room_name).replace("{name}", requester_name)
                .replace("{purpose}", purpose))
        body = (admin_tpl["body"]
                .replace("{room}", room_name).replace("{name}", requester_name)
                .replace("{email}", requester_email).replace("{purpose}", purpose)
                .replace("{range}", range_str).replace("{reference}", reference))
        return await send_email(admin_email, subj, _render_admin_template_body(body))

    subject = f"[Booking] {room_name} — {requester_name} — {purpose}"
    body = (
        f"A new sanctuary booking is waiting for review.\n\n"
        f"Room:        {room_name}\n"
        f"Purpose:     {purpose}\n"
        f"Requester:   {requester_name} <{requester_email}>\n"
        f"Window:      {range_str}\n"
        f"Reference:   {reference}\n\n"
        f"Approve or decline at:\n"
        f"{settings.FRONTEND_URL}/admin/sanctuary\n"
    )
    return await send_email(admin_email, subject, _render_admin_template_body(body))


async def send_sanctuary_booking_decision(
    to_email: str, name: str, room_name: str, purpose: str,
    starts_at, ends_at, decision: str,   # 'approved' | 'declined'
    admin_note: str | None = None,
    letter_url: str = "",
) -> bool:
    """Ripple approval or decline back to the requester. On approval, includes
    the requester's official permission letter link."""
    if not to_email:
        return False
    range_str = _fmt_range(starts_at, ends_at)
    slot = f"sanctuary_booking_{decision}"
    admin_tpl = await _get_admin_email_template(slot)
    if admin_tpl:
        subj = (admin_tpl["subject"]
                .replace("{name}", name).replace("{room}", room_name)
                .replace("{purpose}", purpose))
        body = (admin_tpl["body"]
                .replace("{room}", room_name).replace("{purpose}", purpose)
                .replace("{range}", range_str)
                .replace("{letter_link}", letter_url or "")
                .replace("{admin_note}", admin_note or ""))
        return await send_email(to_email, subj, _render_admin_template_body(body, name=name))

    if decision == "approved":
        subject = f"Approved · {room_name} — {range_str}"
        note_block = f"\nNote from the coordinator:\n\n  {admin_note}\n" if admin_note else ""
        letter_block = (
            f"\nYour official permission letter (with QR verification and the church secretary's signature) is ready here:\n"
            f"  {letter_url}\n"
        ) if letter_url else ""
        body = (
            f"Hi {name or 'Friend'},\n\n"
            f"Good news — your booking is confirmed.\n\n"
            f"Room:     {room_name}\n"
            f"Purpose:  {purpose}\n"
            f"Window:   {range_str}\n"
            f"{note_block}"
            f"{letter_block}\n"
            f"What happens next:\n\n"
            f"1. Arrive 30 minutes early to greet the on-site team.\n"
            f"2. Bring valid ID and any decor / catering supplies you plan to use.\n"
            f"3. Present your permission letter (above) if asked at the gate.\n\n"
            f"Grace and peace,\n"
            f"Light Encounter Tabernacle Worldwide"
        )
    else:  # declined
        subject = f"About your booking request for {room_name}"
        note_block = f"\nReason from the coordinator:\n\n  {admin_note}\n" if admin_note else ""
        body = (
            f"Hi {name or 'Friend'},\n\n"
            f"We were not able to confirm {room_name} for the window you requested "
            f"({range_str}).\n"
            f"{note_block}\n"
            f"Next steps you can try:\n\n"
            f"1. Pick a different window and submit a fresh request at\n"
            f"   {settings.FRONTEND_URL}/sanctuary\n"
            f"2. Consider one of our other rooms with similar capacity.\n"
            f"3. If this is time-sensitive, reply and a coordinator will call you.\n\n"
            f"Grace and peace,\n"
            f"Light Encounter Tabernacle Worldwide"
        )
    return await send_email(to_email, subject, _render_admin_template_body(body, name=name or "Friend"))


# ─────────────────────────────────────────────────────────────────────────────
# Life events — wedding / baptism / dedication / funeral. Same 3-email shape.
# ─────────────────────────────────────────────────────────────────────────────

_LIFE_EVENT_LABELS = {
    "wedding":    "wedding",
    "baptism":    "baptism",
    "dedication": "child dedication",
    "funeral":    "memorial",
}


async def send_life_event_received(
    to_email: str, name: str, kind: str, preferred_date, reference: str,
) -> bool:
    if not to_email:
        return False
    kind_label = _LIFE_EVENT_LABELS.get(kind, kind)
    date_str = preferred_date.strftime("%A %d %B %Y") if hasattr(preferred_date, "strftime") else str(preferred_date)
    admin_tpl = await _get_admin_email_template("life_event_received")
    if admin_tpl:
        subj = admin_tpl["subject"].replace("{name}", name).replace("{kind}", kind_label)
        body = (admin_tpl["body"]
                .replace("{kind}", kind_label).replace("{date}", date_str)
                .replace("{reference}", reference))
        return await send_email(to_email, subj, _render_admin_template_body(body, name=name))

    subject = f"We received your {kind_label} request"
    body = (
        f"Hi {name or 'Friend'},\n\n"
        f"Thank you for asking us to serve your {kind_label}. "
        f"We consider this a great honour.\n\n"
        f"Preferred date: {date_str}\n"
        f"Reference:      {reference}\n\n"
        f"What happens next:\n\n"
        f"1. A pastor will reach out within 3 working days to introduce themselves.\n"
        f"2. You'll be invited to a 30-minute planning conversation — in person, on Zoom, or by phone.\n"
        f"3. Together we'll confirm the date, walk through the order of service, and answer any questions.\n\n"
        f"With joy,\n"
        f"Light Encounter Tabernacle Worldwide"
    )
    return await send_email(to_email, subject, _render_admin_template_body(body, name=name or "Friend"))


async def send_life_event_admin_notice(
    admin_email: str, requester_name: str, requester_email: str,
    kind: str, preferred_date, reference: str,
) -> bool:
    if not admin_email:
        return False
    kind_label = _LIFE_EVENT_LABELS.get(kind, kind)
    date_str = preferred_date.strftime("%A %d %B %Y") if hasattr(preferred_date, "strftime") else str(preferred_date)
    admin_tpl = await _get_admin_email_template("life_event_admin_notice")
    if admin_tpl:
        subj = admin_tpl["subject"].replace("{kind}", kind_label).replace("{name}", requester_name)
        body = (admin_tpl["body"]
                .replace("{kind}", kind_label).replace("{name}", requester_name)
                .replace("{email}", requester_email).replace("{date}", date_str)
                .replace("{reference}", reference))
        return await send_email(admin_email, subj, _render_admin_template_body(body))

    subject = f"[Life Event] {kind_label} — {requester_name}"
    body = (
        f"A new life event request needs pastoral review.\n\n"
        f"Kind:        {kind_label}\n"
        f"Requester:   {requester_name} <{requester_email}>\n"
        f"Preferred:   {date_str}\n"
        f"Reference:   {reference}\n\n"
        f"Review at:\n{settings.FRONTEND_URL}/admin/life-events\n"
    )
    return await send_email(admin_email, subject, _render_admin_template_body(body))


async def send_life_event_decision(
    to_email: str, name: str, kind: str,
    decision: str,   # 'approved' | 'declined'
    approved_date=None, admin_note: str | None = None,
) -> bool:
    if not to_email:
        return False
    kind_label = _LIFE_EVENT_LABELS.get(kind, kind)
    date_str = (approved_date.strftime("%A %d %B %Y")
                if approved_date and hasattr(approved_date, "strftime")
                else (str(approved_date) if approved_date else ""))
    slot = f"life_event_{decision}"
    admin_tpl = await _get_admin_email_template(slot)
    if admin_tpl:
        subj = admin_tpl["subject"].replace("{name}", name).replace("{kind}", kind_label)
        body = (admin_tpl["body"]
                .replace("{kind}", kind_label).replace("{date}", date_str)
                .replace("{admin_note}", admin_note or ""))
        return await send_email(to_email, subj, _render_admin_template_body(body, name=name))

    if decision == "approved":
        subject = f"Your {kind_label} is confirmed"
        note_block = f"\nNote from the pastor:\n\n  {admin_note}\n" if admin_note else ""
        body = (
            f"Hi {name or 'Friend'},\n\n"
            f"Wonderful — your {kind_label} is confirmed.\n\n"
            f"Confirmed date: {date_str or 'as previously discussed'}\n"
            f"{note_block}\n"
            f"What happens next:\n\n"
            f"1. Your pastor will call to arrange rehearsal / preparation session(s).\n"
            f"2. We'll send you an information pack covering order of service and expectations.\n"
            f"3. Save the date. We're praying for you.\n\n"
            f"With joy,\n"
            f"Light Encounter Tabernacle Worldwide"
        )
    else:
        subject = f"About your {kind_label} request"
        note_block = f"\nNote from the pastor:\n\n  {admin_note}\n" if admin_note else ""
        body = (
            f"Hi {name or 'Friend'},\n\n"
            f"We were not able to confirm your {kind_label} for the date requested.\n"
            f"{note_block}\n"
            f"Next steps:\n\n"
            f"1. Reply to this email with an alternative date and we'll try again.\n"
            f"2. Or submit a fresh request at\n"
            f"   {settings.FRONTEND_URL}/life-events\n\n"
            f"Grace and peace,\n"
            f"Light Encounter Tabernacle Worldwide"
        )
    return await send_email(to_email, subject, _render_admin_template_body(body, name=name or "Friend"))
