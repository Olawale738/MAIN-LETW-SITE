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
    return _booking(b)


# ── Helpers ────────────────────────────────────────────────────────────────

def _room(r: SanctuaryRoom) -> dict[str, Any]:
    return {
        "id": r.id, "name": r.name, "description": r.description,
        "capacity": r.capacity, "location": r.location, "image_url": r.image_url,
        "equipment": r.equipment or [], "rate_note": r.rate_note,
        "is_active": r.is_active, "sort_order": r.sort_order,
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
