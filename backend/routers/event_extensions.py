"""
Event Extensions API
Comprehensive event features: RSVPs, speakers, sessions, gallery,
comments, reviews, tickets, sponsors, volunteer positions, FAQ,
tags, reminders, updates, donations, polls, check-in.
"""

import logging
import re
import uuid
from datetime import datetime, date as date_type, timedelta
from typing import List, Optional

import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func as sql_func, delete

from database import get_db
from models.user import User
from models.event import Event
from models.event_extensions import (
    EventRsvp, EventSpeaker, EventSession, EventPhoto, EventComment,
    EventTicketTier, EventSponsor, EventVolunteerPosition,
    EventVolunteerSignup, EventFaq, EventTag, EventReminder,
    EventUpdate, EventDonation, EventPoll, EventPollVote, RsvpStatus,
)
from models.notification import Notification, NotificationType
from utils.dependencies import get_current_active_user, get_admin_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/events", tags=["Event Extensions"])


# ═══════════════════════════════════════════════════════════════════════════
# RSVP / REGISTRATION
# ═══════════════════════════════════════════════════════════════════════════

class RsvpCreate(BaseModel):
    status: str = "attending"
    plus_ones: int = 0
    notes: Optional[str] = None
    guest_name: Optional[str] = None
    guest_email: Optional[str] = None
    guest_phone: Optional[str] = None
    responses: Optional[dict] = None
    ticket_tier_id: Optional[str] = None


class RsvpResponse(BaseModel):
    id: str
    event_id: str
    user_id: Optional[str] = None
    user_name: Optional[str] = None
    guest_name: Optional[str] = None
    guest_email: Optional[str] = None
    status: str
    plus_ones: int
    payment_status: str
    checked_in: bool
    checked_in_at: Optional[datetime] = None
    qr_token: str
    created_at: datetime


@router.post("/{event_id}/rsvp", response_model=RsvpResponse, status_code=201)
async def create_rsvp(
    event_id: str, body: RsvpCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """RSVP to an event (members and guests)."""
    evt = await db.execute(select(Event).where(Event.id == event_id))
    event = evt.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Check existing
    existing = await db.execute(
        select(EventRsvp).where(and_(
            EventRsvp.event_id == event_id,
            EventRsvp.user_id == current_user.id,
        ))
    )
    rsvp = existing.scalar_one_or_none()
    if rsvp:
        # Update status
        rsvp.status = body.status
        rsvp.plus_ones = body.plus_ones
        rsvp.notes = body.notes
        if body.responses:
            rsvp.responses = body.responses
        await db.commit()
        await db.refresh(rsvp)
    else:
        # Check capacity
        if event.max_attendees:
            count_res = await db.execute(
                select(sql_func.count(EventRsvp.id)).where(and_(
                    EventRsvp.event_id == event_id,
                    EventRsvp.status == RsvpStatus.ATTENDING,
                ))
            )
            current_count = count_res.scalar() or 0
            if current_count + 1 + body.plus_ones > event.max_attendees:
                body.status = RsvpStatus.WAITLISTED

        rsvp = EventRsvp(
            event_id=event_id, user_id=current_user.id,
            status=body.status, plus_ones=body.plus_ones,
            notes=body.notes, responses=body.responses,
            ticket_tier_id=body.ticket_tier_id,
        )
        db.add(rsvp)

        # Update event counter
        if body.status == RsvpStatus.ATTENDING:
            event.registered_count = (event.registered_count or 0) + 1 + body.plus_ones
        await db.commit()
        await db.refresh(rsvp)

    return RsvpResponse(
        id=rsvp.id, event_id=rsvp.event_id, user_id=rsvp.user_id,
        user_name=current_user.name, guest_name=rsvp.guest_name,
        guest_email=rsvp.guest_email, status=rsvp.status,
        plus_ones=rsvp.plus_ones, payment_status=rsvp.payment_status,
        checked_in=rsvp.checked_in, checked_in_at=rsvp.checked_in_at,
        qr_token=rsvp.qr_token, created_at=rsvp.created_at,
    )


def _event_ics(event) -> tuple[str, str]:
    """Build the (ics_text, filename) for an event. Shared by the download
    endpoint and the RSVP confirmation email."""
    from services.email_service import _build_ics

    def _combine(d, hhmm, default_h, default_m):
        h, m = default_h, default_m
        if hhmm and ":" in str(hhmm):
            try:
                h, m = int(str(hhmm).split(":")[0]), int(str(hhmm).split(":")[1])
            except Exception:
                pass
        return datetime(d.year, d.month, d.day, h, m)

    start = _combine(event.event_date, event.start_time, 9, 0)
    end = _combine(event.event_date, event.end_time, start.hour + 1, start.minute)
    if end <= start:
        end = start + timedelta(hours=1)

    desc_parts = [event.description or ""]
    if event.location:
        desc_parts.append("Location: " + event.location)
    desc_parts.append("https://letw.org/events")
    ics = _build_ics(
        uid="letw-event-" + str(event.id) + "@letw.org",
        start=start, end=end,
        summary=event.title,
        description="\n\n".join(p for p in desc_parts if p),
        url="https://letw.org/events",
    )
    filename = (re.sub(r"[^a-zA-Z0-9]+", "-", event.title or "event").strip("-").lower() or "event") + ".ics"
    return ics, filename


class GuestRsvpIn(BaseModel):
    guest_name: str
    guest_email: str
    plus_ones: int = 0
    guest_phone: Optional[str] = None
    notes: Optional[str] = None


@router.post("/{event_id}/rsvp/guest", status_code=201)
async def create_guest_rsvp(event_id: str, body: GuestRsvpIn, db: AsyncSession = Depends(get_db)):
    """Public RSVP for visitors who aren't signed in — name + email only. Keyed
    by email per event so re-submitting updates rather than duplicates. Honours
    capacity by moving overflow to the waitlist."""
    event = (await db.execute(select(Event).where(Event.id == event_id))).scalar_one_or_none()
    if not event:
        raise HTTPException(404, "Event not found")

    email = body.guest_email.strip().lower()
    plus = max(0, int(body.plus_ones or 0))
    existing = (await db.execute(select(EventRsvp).where(and_(
        EventRsvp.event_id == event_id,
        sql_func.lower(EventRsvp.guest_email) == email,
    )))).scalar_one_or_none()

    status_val = RsvpStatus.ATTENDING
    if event.max_attendees:
        taken = (await db.execute(select(sql_func.coalesce(sql_func.sum(1 + EventRsvp.plus_ones), 0)).where(and_(
            EventRsvp.event_id == event_id,
            EventRsvp.status == RsvpStatus.ATTENDING,
            EventRsvp.id != (existing.id if existing else ""),
        )))).scalar() or 0
        if taken + 1 + plus > event.max_attendees:
            status_val = RsvpStatus.WAITLISTED

    if existing:
        existing.guest_name = body.guest_name
        existing.plus_ones = plus
        existing.guest_phone = body.guest_phone
        existing.notes = body.notes
        existing.status = status_val
        rsvp = existing
    else:
        rsvp = EventRsvp(
            event_id=event_id, user_id=None,
            guest_name=body.guest_name, guest_email=email, guest_phone=body.guest_phone,
            status=status_val, plus_ones=plus, notes=body.notes,
        )
        db.add(rsvp)
        if status_val == RsvpStatus.ATTENDING:
            event.registered_count = (event.registered_count or 0) + 1 + plus
    await db.commit()

    waitlisted = status_val == RsvpStatus.WAITLISTED

    # Confirmation email with the calendar invite attached (best-effort).
    try:
        from services.email_service import send_email_with_ics
        ics, filename = _event_ics(event)
        when = event.event_date.strftime("%A, %B %d, %Y")
        time_line = f" at {event.start_time}" if event.start_time else ""
        loc_line = f'<p style="margin:4px 0"><strong>Where:</strong> {event.location}</p>' if event.location else ""
        headline = ("You're on the waitlist" if waitlisted else "You're registered!")
        intro = ("This event is full, so you're on the waitlist — we'll email you if a spot opens up."
                 if waitlisted else "We've saved your spot. The calendar invite is attached — tap it to add this to your calendar.")
        html = (
            '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1f2937">'
            '<div style="background:#140152;color:#fff;padding:24px;border-radius:16px 16px 0 0">'
            f'<h2 style="margin:0;color:#f5bb00">{headline}</h2></div>'
            '<div style="border:1px solid #eee;border-top:none;padding:24px;border-radius:0 0 16px 16px">'
            f'<p>Hi {body.guest_name},</p><p>{intro}</p>'
            f'<h3 style="color:#140152;margin:16px 0 6px">{event.title}</h3>'
            f'<p style="margin:4px 0"><strong>When:</strong> {when}{time_line}</p>'
            f'{loc_line}'
            '<p style="margin-top:20px"><a href="https://letw.org/events" '
            'style="background:#140152;color:#fff;text-decoration:none;font-weight:bold;padding:11px 20px;border-radius:999px">View all events</a></p>'
            '<p style="font-size:12px;color:#6b7280;margin-top:18px">Light Encounter Tabernacle Worldwide</p>'
            '</div></div>'
        )
        await send_email_with_ics(email, f"RSVP confirmed — {event.title}", html, ics, filename)
    except Exception as e:
        print(f"[events] RSVP confirmation email failed: {type(e).__name__}: {e}", flush=True)

    return {
        "ok": True,
        "status": status_val.value if hasattr(status_val, "value") else status_val,
        "waitlisted": waitlisted,
        "message": ("This event is full — you're on the waitlist and we'll be in touch if a spot opens."
                    if waitlisted else "You're registered! See the 'Add to calendar' button to save the date."),
    }


@router.get("/{event_id}/calendar.ics")
async def event_calendar_ics(event_id: str, db: AsyncSession = Depends(get_db)):
    """Public 'Add to calendar' — returns the event as an .ics file that any
    calendar app can import. Reuses the marriage-prep calendar builder."""
    from fastapi.responses import Response
    event = (await db.execute(select(Event).where(Event.id == event_id))).scalar_one_or_none()
    if not event:
        raise HTTPException(404, "Event not found")
    ics, filename = _event_ics(event)
    return Response(
        content=ics, media_type="text/calendar",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{event_id}/rsvps", response_model=List[RsvpResponse])
async def list_rsvps(
    event_id: str, status_filter: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    """List all RSVPs (admin)."""
    q = select(EventRsvp, User).outerjoin(User, User.id == EventRsvp.user_id).where(
        EventRsvp.event_id == event_id
    )
    if status_filter:
        q = q.where(EventRsvp.status == status_filter)
    q = q.order_by(EventRsvp.created_at.desc())
    res = await db.execute(q)
    return [
        RsvpResponse(
            id=r.id, event_id=r.event_id, user_id=r.user_id,
            user_name=u.name if u else None, guest_name=r.guest_name,
            guest_email=r.guest_email, status=r.status,
            plus_ones=r.plus_ones, payment_status=r.payment_status,
            checked_in=r.checked_in, checked_in_at=r.checked_in_at,
            qr_token=r.qr_token, created_at=r.created_at,
        )
        for r, u in res.all()
    ]


@router.get("/{event_id}/rsvp/my")
async def get_my_rsvp(
    event_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Check my RSVP status for an event."""
    res = await db.execute(
        select(EventRsvp).where(and_(
            EventRsvp.event_id == event_id,
            EventRsvp.user_id == current_user.id,
        ))
    )
    rsvp = res.scalar_one_or_none()
    if not rsvp:
        return {"has_rsvp": False}
    return {
        "has_rsvp": True,
        "status": rsvp.status,
        "plus_ones": rsvp.plus_ones,
        "checked_in": rsvp.checked_in,
        "qr_token": rsvp.qr_token,
    }


@router.post("/rsvp/{rsvp_id}/check-in")
async def check_in_rsvp(
    rsvp_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    """Check in an attendee at the event (admin/staff)."""
    res = await db.execute(select(EventRsvp).where(EventRsvp.id == rsvp_id))
    rsvp = res.scalar_one_or_none()
    if not rsvp:
        raise HTTPException(status_code=404, detail="RSVP not found")
    rsvp.checked_in = True
    rsvp.checked_in_at = datetime.utcnow()
    await db.commit()
    return {"message": "Checked in"}


@router.post("/check-in-by-qr/{qr_token}")
async def check_in_by_qr(
    qr_token: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    """Scan QR code to check in attendee."""
    res = await db.execute(
        select(EventRsvp, User).outerjoin(User, User.id == EventRsvp.user_id)
        .where(EventRsvp.qr_token == qr_token)
    )
    row = res.first()
    if not row:
        raise HTTPException(status_code=404, detail="Invalid QR code")
    rsvp, user = row
    if rsvp.checked_in:
        return {
            "already_checked_in": True,
            "name": user.name if user else rsvp.guest_name,
            "checked_in_at": rsvp.checked_in_at,
        }
    rsvp.checked_in = True
    rsvp.checked_in_at = datetime.utcnow()
    await db.commit()
    return {
        "checked_in": True,
        "name": user.name if user else rsvp.guest_name,
        "plus_ones": rsvp.plus_ones,
    }


@router.delete("/{event_id}/rsvp")
async def cancel_my_rsvp(
    event_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Cancel my RSVP."""
    res = await db.execute(
        select(EventRsvp).where(and_(
            EventRsvp.event_id == event_id,
            EventRsvp.user_id == current_user.id,
        ))
    )
    rsvp = res.scalar_one_or_none()
    if not rsvp:
        raise HTTPException(status_code=404, detail="RSVP not found")

    evt = await db.execute(select(Event).where(Event.id == event_id))
    event = evt.scalar_one_or_none()
    if event and rsvp.status == RsvpStatus.ATTENDING:
        event.registered_count = max(0, (event.registered_count or 0) - 1 - rsvp.plus_ones)

    await db.delete(rsvp)
    await db.commit()
    return {"message": "RSVP cancelled"}


# ═══════════════════════════════════════════════════════════════════════════
# SPEAKERS
# ═══════════════════════════════════════════════════════════════════════════

class SpeakerCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    title: Optional[str] = None
    bio: Optional[str] = None
    photo_url: Optional[str] = None
    organization: Optional[str] = None
    twitter_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    website_url: Optional[str] = None
    is_keynote: bool = False
    sort_order: int = 0


@router.get("/{event_id}/speakers")
async def list_speakers(event_id: str, db: AsyncSession = Depends(get_db)):
    """List event speakers (public)."""
    res = await db.execute(
        select(EventSpeaker).where(EventSpeaker.event_id == event_id)
        .order_by(EventSpeaker.is_keynote.desc(), EventSpeaker.sort_order)
    )
    return res.scalars().all()


@router.post("/{event_id}/speakers", status_code=201)
async def add_speaker(
    event_id: str, body: SpeakerCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    """Add speaker (admin)."""
    s = EventSpeaker(event_id=event_id, **body.model_dump())
    db.add(s)
    await db.commit()
    await db.refresh(s)
    return s


@router.delete("/{event_id}/speakers/{speaker_id}")
async def delete_speaker(
    event_id: str, speaker_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    res = await db.execute(
        select(EventSpeaker).where(and_(
            EventSpeaker.id == speaker_id,
            EventSpeaker.event_id == event_id,
        ))
    )
    s = res.scalar_one_or_none()
    if not s:
        raise HTTPException(status_code=404, detail="Speaker not found")
    await db.delete(s)
    await db.commit()
    return {"message": "Speaker removed"}


# ═══════════════════════════════════════════════════════════════════════════
# SESSIONS / AGENDA
# ═══════════════════════════════════════════════════════════════════════════

class SessionCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    session_date: date_type
    start_time: str
    end_time: Optional[str] = None
    room: Optional[str] = None
    track: Optional[str] = None
    speaker_ids: Optional[dict] = None
    session_type: str = "talk"
    capacity: Optional[int] = None
    sort_order: int = 0


@router.get("/{event_id}/sessions")
async def list_sessions(event_id: str, db: AsyncSession = Depends(get_db)):
    """List event sessions/agenda."""
    res = await db.execute(
        select(EventSession).where(EventSession.event_id == event_id)
        .order_by(EventSession.session_date, EventSession.start_time)
    )
    return res.scalars().all()


@router.post("/{event_id}/sessions", status_code=201)
async def add_session(
    event_id: str, body: SessionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    s = EventSession(event_id=event_id, **body.model_dump())
    db.add(s)
    await db.commit()
    await db.refresh(s)
    return s


@router.delete("/{event_id}/sessions/{session_id}")
async def delete_session(
    event_id: str, session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    res = await db.execute(
        select(EventSession).where(and_(
            EventSession.id == session_id,
            EventSession.event_id == event_id,
        ))
    )
    s = res.scalar_one_or_none()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    await db.delete(s)
    await db.commit()
    return {"message": "Session removed"}


# ═══════════════════════════════════════════════════════════════════════════
# PHOTO GALLERY
# ═══════════════════════════════════════════════════════════════════════════

class PhotoCreate(BaseModel):
    image_url: str
    thumbnail_url: Optional[str] = None
    caption: Optional[str] = None
    photographer: Optional[str] = None
    phase: str = "promotional"
    is_cover: bool = False
    sort_order: int = 0


@router.get("/{event_id}/photos")
async def list_photos(
    event_id: str, phase: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """List event photos."""
    q = select(EventPhoto).where(EventPhoto.event_id == event_id)
    if phase:
        q = q.where(EventPhoto.phase == phase)
    q = q.order_by(EventPhoto.is_cover.desc(), EventPhoto.sort_order)
    res = await db.execute(q)
    return res.scalars().all()


@router.post("/{event_id}/photos", status_code=201)
async def add_photo(
    event_id: str, body: PhotoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Upload photo (members + admin)."""
    p = EventPhoto(
        event_id=event_id, uploaded_by=current_user.id, **body.model_dump()
    )
    db.add(p)
    await db.commit()
    await db.refresh(p)
    return p


@router.post("/{event_id}/photos/upload", status_code=201)
async def upload_photo_file(
    event_id: str,
    file: UploadFile = File(...),
    caption: Optional[str] = Form(None),
    phase: str = Form("promotional"),
    is_cover: bool = Form(False),
    sort_order: int = Form(0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Upload a photo file directly (multipart). Saves to uploads/event-photos/{event_id}/."""
    safe_name = (file.filename or "photo").replace("..", "_").replace("/", "_").replace("\\", "_")
    ext = os.path.splitext(safe_name)[1].lower() or ".jpg"
    fname = f"{uuid.uuid4().hex}{ext}"
    data = await file.read()
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(413, "File too large (max 10 MB)")

    from utils.storage import save_bytes
    rel_path = f"event-photos/{event_id}/{fname}"
    image_url = save_bytes(data, rel_path, file.content_type or "image/jpeg")
    p = EventPhoto(
        event_id=event_id, image_url=image_url, caption=caption,
        phase=phase, is_cover=is_cover, sort_order=sort_order,
        uploaded_by=current_user.id,
    )
    db.add(p)
    await db.commit()
    await db.refresh(p)
    return p


@router.delete("/{event_id}/photos/{photo_id}")
async def delete_photo(
    event_id: str, photo_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    res = await db.execute(
        select(EventPhoto).where(and_(
            EventPhoto.id == photo_id, EventPhoto.event_id == event_id,
        ))
    )
    p = res.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Photo not found")
    # Only uploader or admin can delete
    if p.uploaded_by != current_user.id and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    await db.delete(p)
    await db.commit()
    return {"message": "Photo removed"}


# ═══════════════════════════════════════════════════════════════════════════
# COMMENTS / Q&A
# ═══════════════════════════════════════════════════════════════════════════

class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)
    is_question: bool = False
    parent_id: Optional[str] = None


@router.get("/{event_id}/comments")
async def list_comments(
    event_id: str, questions_only: bool = False,
    db: AsyncSession = Depends(get_db),
):
    """List comments and questions."""
    q = select(EventComment, User).outerjoin(User, User.id == EventComment.user_id).where(
        and_(EventComment.event_id == event_id, EventComment.is_hidden == False)
    )
    if questions_only:
        q = q.where(EventComment.is_question == True)
    q = q.order_by(
        EventComment.is_pinned.desc(),
        EventComment.upvotes.desc(),
        EventComment.created_at.desc(),
    )
    res = await db.execute(q)
    return [
        {
            "id": c.id, "user_id": c.user_id, "author_name": c.author_name,
            "user_avatar": getattr(u, "avatar_url", None) if u else None,
            "content": c.content, "parent_id": c.parent_id,
            "is_question": c.is_question, "is_answered": c.is_answered,
            "upvotes": c.upvotes, "is_pinned": c.is_pinned,
            "created_at": c.created_at,
        }
        for c, u in res.all()
    ]


@router.post("/{event_id}/comments", status_code=201)
async def add_comment(
    event_id: str, body: CommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Post comment/question."""
    c = EventComment(
        event_id=event_id, user_id=current_user.id,
        author_name=current_user.name, **body.model_dump(),
    )
    db.add(c)
    await db.commit()
    await db.refresh(c)
    return c


@router.post("/comments/{comment_id}/upvote")
async def upvote_comment(
    comment_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    res = await db.execute(select(EventComment).where(EventComment.id == comment_id))
    c = res.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Comment not found")
    c.upvotes += 1
    await db.commit()
    return {"upvotes": c.upvotes}


@router.delete("/comments/{comment_id}")
async def delete_comment(
    comment_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete own comment or hide as admin."""
    res = await db.execute(select(EventComment).where(EventComment.id == comment_id))
    c = res.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Comment not found")
    if c.user_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    await db.delete(c)
    await db.commit()
    return {"message": "Comment removed"}


# ═══════════════════════════════════════════════════════════════════════════
# TICKET TIERS
# ═══════════════════════════════════════════════════════════════════════════

class TicketTierCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    description: Optional[str] = None
    price: float = Field(..., ge=0)
    currency: str = "USD"
    capacity: Optional[int] = None
    benefits: Optional[dict] = None
    sort_order: int = 0


@router.get("/{event_id}/tickets")
async def list_tickets(event_id: str, db: AsyncSession = Depends(get_db)):
    """List ticket tiers (public)."""
    res = await db.execute(
        select(EventTicketTier).where(and_(
            EventTicketTier.event_id == event_id,
            EventTicketTier.is_active == True,
        )).order_by(EventTicketTier.sort_order, EventTicketTier.price)
    )
    return res.scalars().all()


@router.post("/{event_id}/tickets", status_code=201)
async def add_ticket(
    event_id: str, body: TicketTierCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    t = EventTicketTier(event_id=event_id, **body.model_dump())
    db.add(t)
    await db.commit()
    await db.refresh(t)
    return t


# ═══════════════════════════════════════════════════════════════════════════
# SPONSORS
# ═══════════════════════════════════════════════════════════════════════════

class SponsorCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    logo_url: Optional[str] = None
    website_url: Optional[str] = None
    description: Optional[str] = None
    tier: str = "standard"
    sort_order: int = 0


@router.get("/{event_id}/sponsors")
async def list_sponsors(event_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(EventSponsor).where(EventSponsor.event_id == event_id)
        .order_by(EventSponsor.tier, EventSponsor.sort_order)
    )
    return res.scalars().all()


@router.post("/{event_id}/sponsors", status_code=201)
async def add_sponsor(
    event_id: str, body: SponsorCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    s = EventSponsor(event_id=event_id, **body.model_dump())
    db.add(s)
    await db.commit()
    await db.refresh(s)
    return s


# ═══════════════════════════════════════════════════════════════════════════
# VOLUNTEER POSITIONS
# ═══════════════════════════════════════════════════════════════════════════

class VolunteerPositionCreate(BaseModel):
    role_name: str = Field(..., min_length=2, max_length=200)
    description: Optional[str] = None
    slots_needed: int = 1
    shift_time: Optional[str] = None
    skills_required: Optional[str] = None


@router.get("/{event_id}/volunteer-positions")
async def list_volunteer_positions(event_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(EventVolunteerPosition).where(and_(
            EventVolunteerPosition.event_id == event_id,
            EventVolunteerPosition.is_active == True,
        ))
    )
    return res.scalars().all()


@router.post("/{event_id}/volunteer-positions", status_code=201)
async def add_volunteer_position(
    event_id: str, body: VolunteerPositionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    p = EventVolunteerPosition(event_id=event_id, **body.model_dump())
    db.add(p)
    await db.commit()
    await db.refresh(p)
    return p


@router.post("/volunteer-positions/{position_id}/signup", status_code=201)
async def signup_volunteer(
    position_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Sign up to volunteer."""
    existing = await db.execute(
        select(EventVolunteerSignup).where(and_(
            EventVolunteerSignup.position_id == position_id,
            EventVolunteerSignup.user_id == current_user.id,
        ))
    )
    if existing.scalar_one_or_none():
        return {"message": "Already signed up"}
    s = EventVolunteerSignup(position_id=position_id, user_id=current_user.id)
    db.add(s)
    # Update slots filled
    pos_res = await db.execute(
        select(EventVolunteerPosition).where(EventVolunteerPosition.id == position_id)
    )
    pos = pos_res.scalar_one_or_none()
    if pos:
        pos.slots_filled = (pos.slots_filled or 0) + 1
    await db.commit()
    return {"message": "Signed up"}


# ═══════════════════════════════════════════════════════════════════════════
# FAQ
# ═══════════════════════════════════════════════════════════════════════════

class FaqCreate(BaseModel):
    question: str
    answer: str
    sort_order: int = 0


@router.get("/{event_id}/faqs")
async def list_faqs(event_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(EventFaq).where(EventFaq.event_id == event_id)
        .order_by(EventFaq.sort_order)
    )
    return res.scalars().all()


@router.post("/{event_id}/faqs", status_code=201)
async def add_faq(
    event_id: str, body: FaqCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    f = EventFaq(event_id=event_id, **body.model_dump())
    db.add(f)
    await db.commit()
    await db.refresh(f)
    return f


# ═══════════════════════════════════════════════════════════════════════════
# TAGS
# ═══════════════════════════════════════════════════════════════════════════

@router.get("/{event_id}/tags")
async def list_tags(event_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(EventTag).where(EventTag.event_id == event_id)
    )
    return [t.tag for t in res.scalars().all()]


@router.post("/{event_id}/tags")
async def add_tag(
    event_id: str, tag: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    existing = await db.execute(
        select(EventTag).where(and_(
            EventTag.event_id == event_id, EventTag.tag == tag,
        ))
    )
    if existing.scalar_one_or_none():
        return {"message": "Tag exists"}
    t = EventTag(event_id=event_id, tag=tag)
    db.add(t)
    await db.commit()
    return {"message": "Tag added"}


@router.get("/search/by-tag/{tag}")
async def search_by_tag(tag: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(Event).join(EventTag, EventTag.event_id == Event.id)
        .where(EventTag.tag == tag).distinct()
    )
    return res.scalars().all()


# ═══════════════════════════════════════════════════════════════════════════
# REMINDERS
# ═══════════════════════════════════════════════════════════════════════════

@router.post("/{event_id}/remind-me")
async def set_reminder(
    event_id: str, hours_before: int = 24,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Set a reminder N hours before event."""
    evt_res = await db.execute(select(Event).where(Event.id == event_id))
    event = evt_res.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    # Calculate reminder time
    from datetime import datetime as dt
    event_dt = dt.combine(event.event_date, dt.min.time())
    if event.start_time:
        try:
            h, m = event.start_time.split(":")
            event_dt = event_dt.replace(hour=int(h), minute=int(m))
        except Exception:
            pass
    remind_at = event_dt - timedelta(hours=hours_before)

    r = EventReminder(
        event_id=event_id, user_id=current_user.id,
        remind_at=remind_at, method="notification",
    )
    db.add(r)
    await db.commit()
    return {"message": "Reminder set", "remind_at": remind_at}


# ═══════════════════════════════════════════════════════════════════════════
# EVENT UPDATES / ANNOUNCEMENTS
# ═══════════════════════════════════════════════════════════════════════════

class UpdateCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    content: str
    is_urgent: bool = False


@router.get("/{event_id}/updates")
async def list_updates(event_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(EventUpdate).where(EventUpdate.event_id == event_id)
        .order_by(EventUpdate.is_urgent.desc(), EventUpdate.created_at.desc())
    )
    return res.scalars().all()


@router.post("/{event_id}/updates", status_code=201)
async def post_update(
    event_id: str, body: UpdateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    """Post update and notify all attendees."""
    u = EventUpdate(
        event_id=event_id, posted_by=current_user.id, **body.model_dump()
    )
    db.add(u)

    # Notify all RSVP'd attendees
    rsvp_res = await db.execute(
        select(EventRsvp).where(and_(
            EventRsvp.event_id == event_id,
            EventRsvp.status == RsvpStatus.ATTENDING,
            EventRsvp.user_id.is_not(None),
        ))
    )
    for r in rsvp_res.scalars().all():
        if r.user_id:
            db.add(Notification(
                user_id=r.user_id,
                title=f"{'🚨 ' if body.is_urgent else ''}{body.title}",
                message=body.content[:200],
                type=NotificationType.GENERAL,
                reference_id=event_id,
            ))

    await db.commit()
    await db.refresh(u)
    return u


# ═══════════════════════════════════════════════════════════════════════════
# DONATIONS
# ═══════════════════════════════════════════════════════════════════════════

class DonationCreate(BaseModel):
    amount: float = Field(..., gt=0)
    currency: str = "USD"
    message: Optional[str] = None
    is_anonymous: bool = False
    donor_name: Optional[str] = None
    payment_method: Optional[str] = None
    transaction_id: Optional[str] = None


@router.post("/{event_id}/donations", status_code=201)
async def make_donation(
    event_id: str, body: DonationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    d = EventDonation(
        event_id=event_id, user_id=current_user.id,
        donor_name=body.donor_name or current_user.name,
        **{k: v for k, v in body.model_dump().items() if k != "donor_name"},
    )
    db.add(d)
    await db.commit()
    await db.refresh(d)
    return d


@router.get("/{event_id}/donations/total")
async def donation_total(event_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(sql_func.sum(EventDonation.amount), sql_func.count(EventDonation.id))
        .where(EventDonation.event_id == event_id)
    )
    total, count = res.one()
    return {"total_raised": float(total or 0), "donor_count": count or 0}


# ═══════════════════════════════════════════════════════════════════════════
# EVENT POLLS
# ═══════════════════════════════════════════════════════════════════════════

class EventPollCreate(BaseModel):
    question: str = Field(..., min_length=2)
    options: List[str] = Field(..., min_length=2)
    show_results_after_vote: bool = True


@router.get("/{event_id}/polls")
async def list_event_polls(event_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(EventPoll).where(and_(
            EventPoll.event_id == event_id,
            EventPoll.is_active == True,
        ))
    )
    polls = res.scalars().all()
    results = []
    for p in polls:
        vote_res = await db.execute(
            select(EventPollVote.option_index, sql_func.count(EventPollVote.id))
            .where(EventPollVote.poll_id == p.id)
            .group_by(EventPollVote.option_index)
        )
        counts = {i: c for i, c in vote_res.all()}
        total = sum(counts.values())
        options = p.options.get("options", [])
        results.append({
            "id": p.id, "question": p.question, "total_votes": total,
            "options": [
                {"index": i, "option": o, "votes": counts.get(i, 0),
                 "percentage": round(counts.get(i, 0) / total * 100, 1) if total else 0}
                for i, o in enumerate(options)
            ],
        })
    return results


@router.post("/{event_id}/polls", status_code=201)
async def create_event_poll(
    event_id: str, body: EventPollCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    p = EventPoll(
        event_id=event_id,
        question=body.question,
        options={"options": body.options},
        show_results_after_vote=body.show_results_after_vote,
    )
    db.add(p)
    await db.commit()
    await db.refresh(p)
    return p


@router.post("/polls/{poll_id}/vote")
async def vote_event_poll(
    poll_id: str, option_index: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    # Remove previous vote
    await db.execute(
        delete(EventPollVote).where(and_(
            EventPollVote.poll_id == poll_id,
            EventPollVote.user_id == current_user.id,
        ))
    )
    v = EventPollVote(
        poll_id=poll_id, user_id=current_user.id, option_index=option_index
    )
    db.add(v)
    await db.commit()
    return {"message": "Vote recorded"}


# ═══════════════════════════════════════════════════════════════════════════
# UNIFIED EVENT DETAILS (one-shot fetch of all extension data)
# ═══════════════════════════════════════════════════════════════════════════

@router.get("/{event_id}/full-details")
async def get_full_event_details(event_id: str, db: AsyncSession = Depends(get_db)):
    """Get all extension data for an event in one request."""
    async def count(model, *conditions):
        q = select(sql_func.count(model.id)).where(model.event_id == event_id)
        for c in conditions:
            q = q.where(c)
        r = await db.execute(q)
        return r.scalar() or 0

    return {
        "rsvps": await count(EventRsvp, EventRsvp.status == RsvpStatus.ATTENDING),
        "speakers": await count(EventSpeaker),
        "sessions": await count(EventSession),
        "photos": await count(EventPhoto),
        "comments": await count(EventComment, EventComment.is_hidden == False),
        "questions": await count(EventComment, EventComment.is_question == True),
        "tickets": await count(EventTicketTier, EventTicketTier.is_active == True),
        "sponsors": await count(EventSponsor),
        "volunteer_positions": await count(EventVolunteerPosition, EventVolunteerPosition.is_active == True),
        "faqs": await count(EventFaq),
        "updates": await count(EventUpdate),
        "polls": await count(EventPoll, EventPoll.is_active == True),
    }


# ═══════════════════════════════════════════════════════════════════════════
# CALENDAR EXPORT (.ics)
# ═══════════════════════════════════════════════════════════════════════════

@router.get("/{event_id}/calendar.ics")
async def export_ics(event_id: str, db: AsyncSession = Depends(get_db)):
    """Export event as .ics file for Google/Outlook/Apple Calendar."""
    from fastapi.responses import Response
    res = await db.execute(select(Event).where(Event.id == event_id))
    event = res.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Build .ics content
    dt_str = event.event_date.strftime("%Y%m%d")
    start_time = (event.start_time or "00:00").replace(":", "")
    end_time = (event.end_time or "23:59").replace(":", "")
    uid = f"{event.id}@letw.org"
    now = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")

    ics_content = f"""BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//LETW//Events//EN
METHOD:PUBLISH
BEGIN:VEVENT
UID:{uid}
DTSTAMP:{now}
DTSTART:{dt_str}T{start_time}00
DTEND:{dt_str}T{end_time}00
SUMMARY:{event.title}
DESCRIPTION:{(event.description or '').replace(chr(10), chr(92) + 'n')}
LOCATION:{event.location or ''}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR"""

    return Response(
        content=ics_content,
        media_type="text/calendar",
        headers={
            "Content-Disposition": f'attachment; filename="{event.title}.ics"'
        },
    )
