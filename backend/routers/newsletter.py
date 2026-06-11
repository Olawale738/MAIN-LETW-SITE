"""
Newsletter API
- Public: subscribe + unsubscribe (one-click via token)
- Admin:  list subscribers, broadcast a "general update" to all of them
"""
import asyncio
import logging
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select, func as sql_func
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.newsletter import NewsletterSubscriber, NewsletterBroadcast
from models.user import User
from services.email_service import send_email
from utils.dependencies import get_admin_user
from config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/newsletter", tags=["Newsletter"])


# ─── Schemas ─────────────────────────────────────────────────────────────────

class SubscribeIn(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    source: Optional[str] = "homepage"


class SubscriberOut(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    is_active: bool
    source: Optional[str] = None
    subscribed_at: datetime


class BroadcastIn(BaseModel):
    subject: str = Field(..., min_length=2, max_length=300)
    body_html: str = Field(..., min_length=2)


class BroadcastOut(BaseModel):
    id: str
    subject: str
    recipients_count: int
    success_count: int
    failure_count: int
    created_at: datetime


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _wrap_with_branded_template(subject: str, body_html: str, unsubscribe_url: str) -> str:
    """Wrap an admin-typed body in a branded HTML shell with header + unsubscribe footer."""
    safe_body = body_html  # Admins write trusted HTML in the editor
    return f"""<!doctype html>
<html><body style="margin:0;padding:0;background:#f7f6fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#140152;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f7f6fb;">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(20,1,82,0.06);">
        <tr><td style="background:linear-gradient(135deg,#140152,#1a0270);padding:28px 32px;text-align:center;">
          <h1 style="margin:0;color:#f5bb00;font-size:14px;letter-spacing:.25em;font-weight:800;text-transform:uppercase;">Light Encounter Tabernacle</h1>
          <h2 style="margin:8px 0 0;color:#ffffff;font-size:24px;font-weight:900;line-height:1.2;">{subject}</h2>
        </td></tr>
        <tr><td style="padding:32px;color:#3a3a52;font-size:16px;line-height:1.65;">{safe_body}</td></tr>
        <tr><td style="background:#fafafd;padding:20px 32px;border-top:1px solid #eee;text-align:center;color:#7a7a90;font-size:12px;line-height:1.6;">
          <p style="margin:0 0 8px;">You are receiving this because you subscribed to LETW updates.</p>
          <p style="margin:0;"><a href="{unsubscribe_url}" style="color:#140152;text-decoration:underline;">Unsubscribe</a> &middot; &copy; {datetime.utcnow().year} Light Encounter Tabernacle</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>"""


# ─── Public endpoints ────────────────────────────────────────────────────────

@router.post("/subscribe", status_code=201)
async def subscribe(body: SubscribeIn, db: AsyncSession = Depends(get_db)):
    """Subscribe an email to the newsletter (idempotent)."""
    email = body.email.lower().strip()
    res = await db.execute(
        select(NewsletterSubscriber).where(NewsletterSubscriber.email == email)
    )
    existing = res.scalar_one_or_none()
    if existing:
        if not existing.is_active:
            existing.is_active = True
            existing.unsubscribed_at = None
            await db.commit()
        return {"message": "You're subscribed. Thanks for staying connected!"}

    sub = NewsletterSubscriber(
        email=email,
        name=body.name,
        source=body.source or "homepage",
    )
    db.add(sub)
    await db.commit()
    return {"message": "You're subscribed. Thanks for staying connected!"}


@router.get("/unsubscribe/{token}")
async def unsubscribe(token: str, db: AsyncSession = Depends(get_db)):
    """One-click unsubscribe — link is embedded in every broadcast."""
    res = await db.execute(
        select(NewsletterSubscriber).where(NewsletterSubscriber.unsubscribe_token == token)
    )
    sub = res.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="Invalid unsubscribe link.")
    if sub.is_active:
        sub.is_active = False
        sub.unsubscribed_at = datetime.utcnow()
        await db.commit()
    return {"message": f"{sub.email} has been unsubscribed. We'll miss you."}


# ─── Admin endpoints ─────────────────────────────────────────────────────────

@router.get("/subscribers", response_model=List[SubscriberOut])
async def list_subscribers(
    active_only: bool = True,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    q = select(NewsletterSubscriber).order_by(NewsletterSubscriber.subscribed_at.desc())
    if active_only:
        q = q.where(NewsletterSubscriber.is_active == True)
    res = await db.execute(q)
    return res.scalars().all()


@router.get("/subscribers/count")
async def subscriber_count(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    res = await db.execute(
        select(sql_func.count(NewsletterSubscriber.id)).where(NewsletterSubscriber.is_active == True)
    )
    return {"active_subscribers": res.scalar() or 0}


@router.delete("/subscribers/{subscriber_id}")
async def delete_subscriber(
    subscriber_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    res = await db.execute(
        select(NewsletterSubscriber).where(NewsletterSubscriber.id == subscriber_id)
    )
    sub = res.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscriber not found")
    await db.delete(sub)
    await db.commit()
    return {"message": "Subscriber removed"}


@router.post("/broadcast", response_model=BroadcastOut, status_code=201)
async def broadcast(
    body: BroadcastIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    """Send a general update to every active subscriber."""
    res = await db.execute(
        select(NewsletterSubscriber).where(NewsletterSubscriber.is_active == True)
    )
    subs: List[NewsletterSubscriber] = list(res.scalars().all())
    if not subs:
        raise HTTPException(status_code=400, detail="No active subscribers to send to.")

    # Build the base URL (frontend) for unsubscribe links.
    base = (settings.FRONTEND_URL or "https://letw.org").rstrip("/")

    # Send concurrently, but bounded so we don't hammer the provider.
    sem = asyncio.Semaphore(8)

    async def _send_one(sub: NewsletterSubscriber) -> bool:
        async with sem:
            unsubscribe_url = f"{base}/newsletter/unsubscribe/{sub.unsubscribe_token}"
            html = _wrap_with_branded_template(body.subject, body.body_html, unsubscribe_url)
            try:
                return await send_email(sub.email, body.subject, html)
            except Exception as e:
                logger.exception("Newsletter send failed for %s: %s", sub.email, e)
                return False

    results = await asyncio.gather(*[_send_one(s) for s in subs])
    success = sum(1 for r in results if r)
    failure = len(results) - success

    record = NewsletterBroadcast(
        subject=body.subject,
        body_html=body.body_html,
        sent_by=current_user.id,
        recipients_count=len(subs),
        success_count=success,
        failure_count=failure,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)

    return BroadcastOut(
        id=record.id,
        subject=record.subject,
        recipients_count=record.recipients_count,
        success_count=record.success_count,
        failure_count=record.failure_count,
        created_at=record.created_at,
    )


@router.get("/broadcasts", response_model=List[BroadcastOut])
async def list_broadcasts(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    res = await db.execute(
        select(NewsletterBroadcast).order_by(NewsletterBroadcast.created_at.desc())
    )
    return res.scalars().all()
