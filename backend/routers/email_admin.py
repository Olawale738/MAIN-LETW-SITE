"""
Email delivery diagnostics (admin).

Lets an admin confirm, from inside the app, whether outbound email is actually
configured and working in production — which provider is active and whether a
real test message goes out. Complements /admin/diagnostics (which checks the
frontend↔backend link).
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr

from config import settings
from models.user import User
from utils.dependencies import get_admin_user

router = APIRouter(prefix="/api/admin/email", tags=["Email"])


def _active_provider() -> str:
    if not settings.EMAIL_ENABLED:
        return "disabled"
    try:
        import resend  # noqa: F401
        has_resend = True
    except ImportError:
        has_resend = False
    if getattr(settings, "RESEND_API_KEY", "") and has_resend:
        return "resend"
    if getattr(settings, "SMTP_HOST", ""):
        return "smtp"
    return "unconfigured"


@router.get("/status")
async def email_status(_: User = Depends(get_admin_user)):
    """Read-only view of the email configuration — no message is sent."""
    provider = _active_provider()
    return {
        "email_enabled": bool(settings.EMAIL_ENABLED),
        "provider": provider,               # disabled | resend | smtp | unconfigured
        "from_name": getattr(settings, "EMAIL_FROM_NAME", ""),
        "from_address": getattr(settings, "EMAIL_FROM_ADDRESS", ""),
        "smtp_host": getattr(settings, "SMTP_HOST", "") or None,
        "resend_configured": bool(getattr(settings, "RESEND_API_KEY", "")),
    }


class EmailTestIn(BaseModel):
    to: EmailStr


@router.post("/test")
async def email_test(body: EmailTestIn, _: User = Depends(get_admin_user)):
    """Send a real test email so an admin can confirm delivery works end to end."""
    provider = _active_provider()
    subject = "LETW test email"
    html = (
        '<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto">'
        '<h2 style="color:#140152">Email is working ✅</h2>'
        '<p>This is a test message from the Light Encounter Tabernacle Worldwide admin. '
        'If you received it, outbound email delivery is configured correctly.</p>'
        f'<p style="color:#6b7280;font-size:13px">Provider: {provider}</p>'
        '</div>'
    )
    try:
        from services.email_service import send_email
        sent = await send_email(str(body.to), subject, html)
    except Exception as e:
        return {"sent": False, "provider": provider, "error": f"{type(e).__name__}: {e}"}
    return {
        "sent": bool(sent),
        "provider": provider,
        "note": ("Email is disabled (EMAIL_ENABLED=false) — the message was logged, not sent."
                 if provider == "disabled" else None),
    }
