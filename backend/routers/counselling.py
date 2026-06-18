"""
Counselling Booking API.

- Admin sets weekly availability per pastor.
- Public derives bookable slots from availability for the next N days.
- Public POST to book.
- Admin confirms / cancels / reviews.
"""

from datetime import datetime, date, time, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from utils.rate_limit import rate_limit
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.counselling import CounsellingAvailability, CounsellingBooking
from models.user import User
from utils.dependencies import get_admin_user


router = APIRouter(prefix="/api/counselling", tags=["Counselling"])


class AvailabilityIn(BaseModel):
    pastor_id: str
    day_of_week: int   # 0=Mon ... 6=Sun
    start_time: time
    end_time: time
    slot_minutes: int = 30
    is_active: bool = True


class AvailabilityOut(AvailabilityIn):
    id: str


@router.get("/availability", response_model=List[AvailabilityOut])
async def list_availability(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(CounsellingAvailability).where(CounsellingAvailability.is_active == True))
    return res.scalars().all()


@router.post("/availability", response_model=AvailabilityOut, status_code=201)
async def add_availability(body: AvailabilityIn, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    a = CounsellingAvailability(**body.model_dump())
    db.add(a)
    await db.commit()
    await db.refresh(a)
    return a


@router.put("/availability/{aid}", response_model=AvailabilityOut)
async def update_availability(aid: str, body: AvailabilityIn, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(CounsellingAvailability).where(CounsellingAvailability.id == aid))
    a = res.scalar_one_or_none()
    if not a:
        raise HTTPException(404, "Not found")
    for k, v in body.model_dump().items():
        setattr(a, k, v)
    await db.commit()
    await db.refresh(a)
    return a


@router.delete("/availability/{aid}")
async def delete_availability(aid: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(CounsellingAvailability).where(CounsellingAvailability.id == aid))
    a = res.scalar_one_or_none()
    if not a:
        return {"deleted": 0}
    await db.delete(a)
    await db.commit()
    return {"deleted": 1}


@router.get("/slots")
async def available_slots(days: int = 14, db: AsyncSession = Depends(get_db)):
    """Return upcoming bookable slots (next `days` days), excluding already-booked."""
    res = await db.execute(select(CounsellingAvailability).where(CounsellingAvailability.is_active == True))
    avails = list(res.scalars().all())

    res2 = await db.execute(select(CounsellingBooking).where(
        CounsellingBooking.scheduled_at >= datetime.utcnow(),
        CounsellingBooking.status.in_(["pending", "confirmed"]),
    ))
    booked = {(b.pastor_id, b.scheduled_at.replace(second=0, microsecond=0)) for b in res2.scalars().all()}

    today = date.today()
    slots = []
    for offset in range(days):
        d = today + timedelta(days=offset)
        weekday = d.weekday()  # 0=Mon..6=Sun
        for a in avails:
            if a.day_of_week != weekday:
                continue
            cursor = datetime.combine(d, a.start_time)
            end = datetime.combine(d, a.end_time)
            while cursor + timedelta(minutes=a.slot_minutes) <= end:
                if cursor > datetime.utcnow() and (a.pastor_id, cursor.replace(second=0, microsecond=0)) not in booked:
                    slots.append({
                        "pastor_id": a.pastor_id,
                        "starts_at": cursor.isoformat(),
                        "duration_minutes": a.slot_minutes,
                    })
                cursor += timedelta(minutes=a.slot_minutes)
    return slots


class BookingIn(BaseModel):
    pastor_id: Optional[str] = None
    user_name: str
    user_email: EmailStr
    user_phone: Optional[str] = None
    scheduled_at: datetime
    duration_minutes: int = 30
    topic: str = ""
    notes: Optional[str] = None


class BookingOut(BaseModel):
    id: str
    pastor_id: Optional[str]
    user_name: str
    user_email: str
    user_phone: Optional[str]
    scheduled_at: datetime
    duration_minutes: int
    topic: str
    notes: Optional[str]
    status: str
    pastor_notes: Optional[str]
    created_at: datetime


@router.post("/bookings", response_model=BookingOut, status_code=201)
async def create_booking(
    body: BookingIn,
    db: AsyncSession = Depends(get_db),
    _rl=Depends(rate_limit(5, 600, "counselling")),
):
    b = CounsellingBooking(**body.model_dump())
    db.add(b)
    await db.commit()
    await db.refresh(b)
    return b


@router.get("/bookings", response_model=List[BookingOut])
async def list_bookings(
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    q = select(CounsellingBooking).order_by(CounsellingBooking.scheduled_at.desc())
    if status:
        q = q.where(CounsellingBooking.status == status)
    res = await db.execute(q)
    return res.scalars().all()


class BookingUpdate(BaseModel):
    status: Optional[str] = None
    pastor_notes: Optional[str] = None


@router.put("/bookings/{bid}", response_model=BookingOut)
async def update_booking(bid: str, body: BookingUpdate, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(CounsellingBooking).where(CounsellingBooking.id == bid))
    b = res.scalar_one_or_none()
    if not b:
        raise HTTPException(404, "Not found")
    if body.status is not None:
        b.status = body.status
    if body.pastor_notes is not None:
        b.pastor_notes = body.pastor_notes
    await db.commit()
    await db.refresh(b)
    return b


@router.delete("/bookings/{bid}")
async def delete_booking(bid: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(CounsellingBooking).where(CounsellingBooking.id == bid))
    b = res.scalar_one_or_none()
    if not b:
        return {"deleted": 0}
    await db.delete(b)
    await db.commit()
    return {"deleted": 1}
