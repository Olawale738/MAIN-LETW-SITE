"""
Sanctuary / hall booking router.

  - GET    /api/sanctuary/rooms                 — public list (only active)
  - POST   /api/sanctuary/rooms                 — admin: create
  - PUT    /api/sanctuary/rooms/{room_id}       — admin: update
  - DELETE /api/sanctuary/rooms/{room_id}       — admin: delete
  - GET    /api/sanctuary/availability?room_id  — public: bookings windows
  - POST   /api/sanctuary/bookings              — public: request a booking
  - GET    /api/sanctuary/admin/bookings        — admin: list all
  - PUT    /api/sanctuary/admin/bookings/{id}   — admin: approve / decline / annotate
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.user import User
from models.sanctuary import SanctuaryRoom, SanctuaryBooking
from utils.dependencies import get_admin_user

router = APIRouter(prefix="/api/sanctuary", tags=["Sanctuary"])


# ── Public room list ───────────────────────────────────────────────────────

@router.get("/rooms")
async def list_rooms_public(db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(SanctuaryRoom).where(SanctuaryRoom.is_active == True).order_by(SanctuaryRoom.sort_order, SanctuaryRoom.name)  # noqa: E712
    )
    return [_room(r) for r in res.scalars().all()]


# ── Public availability for a room ─────────────────────────────────────────

@router.get("/availability")
async def room_availability(room_id: str, db: AsyncSession = Depends(get_db)):
    """Approved future bookings for the room — used by the public form to
    grey out already-taken windows."""
    now = datetime.utcnow()
    res = await db.execute(
        select(SanctuaryBooking)
        .where(SanctuaryBooking.room_id == room_id)
        .where(SanctuaryBooking.status == "approved")
        .where(SanctuaryBooking.ends_at >= now)
        .order_by(SanctuaryBooking.starts_at)
    )
    return [{
        "id": b.id,
        "starts_at": b.starts_at.isoformat(),
        "ends_at":   b.ends_at.isoformat(),
        "purpose":   b.purpose,
    } for b in res.scalars().all()]


# ── Public booking request ─────────────────────────────────────────────────

class BookingIn(BaseModel):
    room_id:       str
    purpose:       str
    contact_name:  str
    contact_email: EmailStr
    contact_phone: Optional[str] = None
    starts_at:     datetime
    ends_at:       datetime
    attendees:     int = 0
    note:          Optional[str] = None


@router.post("/bookings", status_code=201)
async def request_booking(body: BookingIn, db: AsyncSession = Depends(get_db)):
    # Sanity check the window.
    if body.ends_at <= body.starts_at:
        raise HTTPException(400, "End time must be after start time.")
    # Make sure the room exists + is active.
    room = (await db.execute(select(SanctuaryRoom).where(SanctuaryRoom.id == body.room_id))).scalar_one_or_none()
    if not room or not room.is_active:
        raise HTTPException(404, "Room not available for booking.")

    # Hard reject if it overlaps an existing approved booking.
    clash = (await db.execute(
        select(SanctuaryBooking)
        .where(SanctuaryBooking.room_id == body.room_id)
        .where(SanctuaryBooking.status == "approved")
        .where(and_(SanctuaryBooking.starts_at < body.ends_at, SanctuaryBooking.ends_at > body.starts_at))
        .limit(1)
    )).scalar_one_or_none()
    if clash:
        raise HTTPException(409, "That window overlaps an existing approved booking — pick a different time.")

    b = SanctuaryBooking(**body.model_dump())
    db.add(b)
    await db.commit()
    await db.refresh(b)

    # Best-effort notification loop — never let email hiccups poison the request.
    # Reference is short + shareable so a coordinator can quote it on the phone.
    reference = b.id.split("-")[0].upper()
    try:
        from services.email_service import (
            send_sanctuary_booking_received,
            send_sanctuary_booking_admin_notice,
            _admin_notify_email,
        )
        # To the requester — "we got it, here's what happens next".
        await send_sanctuary_booking_received(
            to_email=b.contact_email, name=b.contact_name,
            room_name=room.name, purpose=b.purpose,
            starts_at=b.starts_at, ends_at=b.ends_at,
            reference=reference,
        )
        # To the church inbox — "someone please act on this".
        admin_email = await _admin_notify_email()
        await send_sanctuary_booking_admin_notice(
            admin_email=admin_email,
            requester_name=b.contact_name, requester_email=b.contact_email,
            room_name=room.name, purpose=b.purpose,
            starts_at=b.starts_at, ends_at=b.ends_at,
            reference=reference,
        )
    except Exception as e:
        print(f"[sanctuary] booking-received emails failed: {type(e).__name__}: {e}", flush=True)

    return _booking(b)


# ── Admin: rooms CRUD ──────────────────────────────────────────────────────

class RoomIn(BaseModel):
    name:        str
    description: Optional[str] = None
    capacity:    int = 0
    location:    Optional[str] = None
    image_url:   Optional[str] = None
    equipment:   Optional[list[str]] = None
    rate_note:   Optional[str] = None
    is_active:   bool = True
    sort_order:  int = 0


@router.post("/rooms", status_code=201)
async def create_room(body: RoomIn, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    r = SanctuaryRoom(**body.model_dump())
    db.add(r)
    await db.commit()
    await db.refresh(r)
    return _room(r)


@router.put("/rooms/{room_id}")
async def update_room(room_id: str, body: RoomIn, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    r = (await db.execute(select(SanctuaryRoom).where(SanctuaryRoom.id == room_id))).scalar_one_or_none()
    if not r:
        raise HTTPException(404, "Room not found")
    for k, v in body.model_dump().items():
        setattr(r, k, v)
    await db.commit()
    await db.refresh(r)
    return _room(r)


@router.delete("/rooms/{room_id}")
async def delete_room(room_id: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    r = (await db.execute(select(SanctuaryRoom).where(SanctuaryRoom.id == room_id))).scalar_one_or_none()
    if r:
        await db.delete(r)
        await db.commit()
    return {"deleted": 1 if r else 0}


# ── Admin: bookings ────────────────────────────────────────────────────────

@router.get("/admin/bookings")
async def list_bookings_admin(
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    q = select(SanctuaryBooking).order_by(desc(SanctuaryBooking.starts_at))
    if status:
        q = q.where(SanctuaryBooking.status == status)
    res = await db.execute(q.limit(500))
    return [_booking(b) for b in res.scalars().all()]


class BookingUpdate(BaseModel):
    status:     Optional[str] = None   # approved|declined|cancelled
    admin_note: Optional[str] = None


@router.put("/admin/bookings/{booking_id}")
async def update_booking(
    booking_id: str,
    body: BookingUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    b = (await db.execute(select(SanctuaryBooking).where(SanctuaryBooking.id == booking_id))).scalar_one_or_none()
    if not b:
        raise HTTPException(404, "Booking not found")
    if body.status:
        if body.status not in {"requested", "approved", "declined", "cancelled"}:
            raise HTTPException(400, "Bad status")
        # Re-check overlap on approval.
        if body.status == "approved":
            clash = (await db.execute(
                select(SanctuaryBooking)
                .where(SanctuaryBooking.room_id == b.room_id)
                .where(SanctuaryBooking.status == "approved")
                .where(SanctuaryBooking.id != b.id)
                .where(and_(SanctuaryBooking.starts_at < b.ends_at, SanctuaryBooking.ends_at > b.starts_at))
                .limit(1)
            )).scalar_one_or_none()
            if clash:
                raise HTTPException(409, "Another approved booking overlaps this window.")
        b.status = body.status
    if body.admin_note is not None:
        b.admin_note = body.admin_note
    await db.commit()
    await db.refresh(b)

    # If the status flipped to approved or declined, notify the requester.
    # We only email on those two — 'cancelled' / 'requested' bounces don't.
    if body.status in {"approved", "declined"} and b.contact_email:
        try:
            from services.email_service import send_sanctuary_booking_decision
            # Room might have been renamed since the request; look it up fresh.
            room = (await db.execute(select(SanctuaryRoom).where(SanctuaryRoom.id == b.room_id))).scalar_one_or_none()
            await send_sanctuary_booking_decision(
                to_email=b.contact_email, name=b.contact_name,
                room_name=(room.name if room else "the room"), purpose=b.purpose,
                starts_at=b.starts_at, ends_at=b.ends_at,
                decision=body.status, admin_note=b.admin_note,
            )
        except Exception as e:
            print(f"[sanctuary] decision email failed: {type(e).__name__}: {e}", flush=True)

    return _booking(b)


# ── Helpers ────────────────────────────────────────────────────────────────

def _room(r: SanctuaryRoom) -> dict[str, Any]:
    return {
        "id": r.id, "name": r.name, "description": r.description,
        "capacity": r.capacity, "location": r.location, "image_url": r.image_url,
        "equipment": r.equipment or [], "rate_note": r.rate_note,
        "is_active": r.is_active, "sort_order": r.sort_order,
    }


# ── Hall-booking permission letter (QR-verified) ───────────────────────────

def _public_base() -> str:
    from config import settings
    base = (settings.FRONTEND_URL or "").rstrip("/")
    if not base or "localhost" in base or "127.0.0.1" in base:
        return "https://letw.org"
    return base


def _permit_signature(b: SanctuaryBooking) -> str:
    """HMAC-SHA256 over the booking's immutable facts, keyed with the server
    secret. Server can re-verify; nobody can forge without the key."""
    import hmac as _hmac, hashlib as _hashlib
    from config import settings as _settings
    payload = f"letw-hall-permit|{b.id}|{b.room_id}|{b.purpose}|{b.starts_at.isoformat()}|{b.ends_at.isoformat()}"
    return _hmac.new(_settings.JWT_SECRET.encode(), payload.encode(), _hashlib.sha256).hexdigest()


def _fingerprint(sig: str) -> str:
    s = sig[:12].upper()
    return f"{s[0:4]}-{s[4:8]}-{s[8:12]}"


def _short_sig(sig: str) -> str:
    return sig[:16]


async def _sanctuary_settings(db: AsyncSession) -> dict:
    """Admin-set secretary name + signature image (and letterhead bits) from the
    'sanctuary-page' ministry-content key. Empty dict if unset."""
    try:
        from models.ministry_content import MinistryContent
        row = (await db.execute(select(MinistryContent).where(MinistryContent.key == "sanctuary-page"))).scalar_one_or_none()
        return dict(row.content) if row and isinstance(row.content, dict) else {}
    except Exception:
        return {}


@router.get("/bookings/{booking_id}/letter")
async def booking_permission_letter(booking_id: str, db: AsyncSession = Depends(get_db)):
    """Public capability-link data for the printable permission letter. Only
    issued for approved bookings (the UUID is the access credential)."""
    b = (await db.execute(select(SanctuaryBooking).where(SanctuaryBooking.id == booking_id))).scalar_one_or_none()
    if not b:
        raise HTTPException(404, "Booking not found")
    if b.status != "approved":
        raise HTTPException(404, "No permission letter — this booking isn't approved.")
    room = (await db.execute(select(SanctuaryRoom).where(SanctuaryRoom.id == b.room_id))).scalar_one_or_none()
    cfg = await _sanctuary_settings(db)
    sig = _permit_signature(b)
    return {
        "id": b.id,
        "reference": "LETW-HALL-" + b.id.split("-")[0].upper(),
        "room_name": room.name if room else "Hall",
        "room_location": room.location if room else None,
        "purpose": b.purpose,
        "contact_name": b.contact_name,
        "attendees": b.attendees,
        "starts_at": b.starts_at.isoformat(),
        "ends_at": b.ends_at.isoformat(),
        "admin_note": b.admin_note,
        "issued_at": b.created_at.isoformat(),
        # Admin-editable letterhead bits
        "secretary_name": cfg.get("secretary_name") or "Church Secretary",
        "secretary_title": cfg.get("secretary_title") or "Church Secretary",
        "secretary_signature_image": cfg.get("secretary_signature_image") or "",
        "watermark_image": cfg.get("watermark_image") or "/logo.png",
        "letter_intro": cfg.get("letter_intro") or "",
        # Verification
        "fingerprint": _fingerprint(sig),
        "verify_url": f"{_public_base()}/verify/booking/{b.id}?sig={_short_sig(sig)}",
    }


@router.get("/bookings/{booking_id}/letter/qr.svg")
async def booking_letter_qr(booking_id: str, db: AsyncSession = Depends(get_db)):
    from fastapi.responses import Response
    b = (await db.execute(select(SanctuaryBooking).where(SanctuaryBooking.id == booking_id))).scalar_one_or_none()
    if not b or b.status != "approved":
        raise HTTPException(404, "No permission letter issued")
    verify_url = f"{_public_base()}/verify/booking/{b.id}?sig={_short_sig(_permit_signature(b))}"
    try:
        import qrcode
        from routers.marriage_prep import _qr_to_svg
        qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, border=0)
        qr.add_data(verify_url)
        qr.make(fit=True)
        svg = _qr_to_svg(qr.get_matrix(), box_size=8, border=2)
        return Response(content=svg, media_type="image/svg+xml",
                        headers={"Cache-Control": "public, max-age=86400", "Access-Control-Allow-Origin": "*"})
    except ImportError:
        raise HTTPException(503, "QR generator not installed on the server yet.")


@router.get("/verify/{booking_id}")
async def verify_permission_letter(booking_id: str, sig: str = "", db: AsyncSession = Depends(get_db)):
    """Public verification the QR lands on. Recomputes the HMAC and compares in
    constant time — a forged, tampered, or since-cancelled permit fails."""
    import hmac as _hmac
    b = (await db.execute(select(SanctuaryBooking).where(SanctuaryBooking.id == booking_id))).scalar_one_or_none()
    if not b or b.status != "approved":
        return {"valid": False, "reason": "No approved booking matches this code."}
    room = (await db.execute(select(SanctuaryRoom).where(SanctuaryRoom.id == b.room_id))).scalar_one_or_none()
    expected = _permit_signature(b)
    sig = (sig or "").strip().lower()
    ok = False
    if len(sig) == len(expected):
        ok = _hmac.compare_digest(expected, sig)
    elif 16 <= len(sig) < len(expected):
        ok = _hmac.compare_digest(expected[:len(sig)], sig)
    if not ok:
        return {"valid": False, "reason": "Signature does not match — this letter may have been altered or forged."}
    return {
        "valid": True,
        "reference": "LETW-HALL-" + b.id.split("-")[0].upper(),
        "room_name": room.name if room else "Hall",
        "purpose": b.purpose,
        "contact_name": b.contact_name,
        "starts_at": b.starts_at.isoformat(),
        "ends_at": b.ends_at.isoformat(),
        "fingerprint": _fingerprint(expected),
        "issuer": "letw.org",
    }


def _booking(b: SanctuaryBooking) -> dict[str, Any]:
    return {
        "id": b.id, "room_id": b.room_id,
        "purpose": b.purpose, "contact_name": b.contact_name, "contact_email": b.contact_email,
        "contact_phone": b.contact_phone,
        "starts_at": b.starts_at.isoformat(), "ends_at": b.ends_at.isoformat(),
        "attendees": b.attendees, "note": b.note,
        "status": b.status, "admin_note": b.admin_note,
        "created_at": b.created_at.isoformat(),
    }
