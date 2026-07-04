"""
Fasting calendar API.
Public: list published fasts, check in daily (logged-in or anonymous key).
Admin:  CRUD fasts + participation stats.
"""

import uuid
from datetime import datetime, date
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, func, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.fasting import Fast, FastCheckin
from models.user import User
from utils.dependencies import get_admin_user

router = APIRouter(prefix="/api/fasting", tags=["Fasting"])

KINDS = {"full", "daniel", "partial", "media"}


def _fast(f: Fast) -> dict[str, Any]:
    total_days = (f.end_date - f.start_date).days + 1
    today = date.today()
    current_day = None
    if f.start_date <= today <= f.end_date:
        current_day = (today - f.start_date).days + 1
    return {
        "id": f.id, "title": f.title, "description": f.description,
        "kind": f.kind, "start_date": f.start_date, "end_date": f.end_date,
        "scripture_focus": f.scripture_focus,
        "prayer_prompts": f.prayer_prompts or [],
        "is_published": f.is_published,
        "total_days": total_days,
        "current_day": current_day,           # None when not running
        "status": ("upcoming" if today < f.start_date
                   else "completed" if today > f.end_date
                   else "active"),
    }


# ── Public ──────────────────────────────────────────────────────────────────

@router.get("/")
async def list_fasts(db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(Fast).where(Fast.is_published == True)  # noqa: E712
        .order_by(desc(Fast.start_date)).limit(50)
    )
    return [_fast(f) for f in res.scalars().all()]


class CheckinIn(BaseModel):
    fast_id: str
    participant_key: str          # client-generated stable id (localStorage)
    display_name: Optional[str] = None
    note: Optional[str] = None


@router.post("/checkin", status_code=201)
async def check_in(body: CheckinIn, db: AsyncSession = Depends(get_db)):
    f = (await db.execute(select(Fast).where(Fast.id == body.fast_id))).scalar_one_or_none()
    if not f or not f.is_published:
        raise HTTPException(404, "Fast not found")
    today = date.today()
    if not (f.start_date <= today <= f.end_date):
        raise HTTPException(400, "This fast is not currently running.")
    day_number = (today - f.start_date).days + 1

    key = (body.participant_key or "").strip()[:64]
    if not key:
        raise HTTPException(400, "participant_key required")

    existing = (await db.execute(
        select(FastCheckin).where(and_(
            FastCheckin.fast_id == body.fast_id,
            FastCheckin.participant_key == key,
            FastCheckin.day_number == day_number,
        ))
    )).scalar_one_or_none()
    if existing:
        # Re-checking in the same day just updates the note.
        if body.note is not None:
            existing.note = body.note
        await db.commit()
        return {"ok": True, "day_number": day_number, "already": True}

    db.add(FastCheckin(
        fast_id=body.fast_id, participant_key=key,
        display_name=(body.display_name or "").strip()[:120] or None,
        day_number=day_number, note=body.note,
    ))
    await db.commit()
    return {"ok": True, "day_number": day_number, "already": False}


@router.get("/{fast_id}/my-checkins")
async def my_checkins(fast_id: str, participant_key: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(FastCheckin.day_number).where(and_(
            FastCheckin.fast_id == fast_id,
            FastCheckin.participant_key == participant_key,
        ))
    )
    return {"days": sorted(r[0] for r in res.all())}


@router.get("/{fast_id}/stats")
async def fast_stats(fast_id: str, db: AsyncSession = Depends(get_db)):
    """Public participation counter — how many saints are fasting together."""
    total = (await db.execute(
        select(func.count(func.distinct(FastCheckin.participant_key)))
        .where(FastCheckin.fast_id == fast_id)
    )).scalar() or 0
    today_count = (await db.execute(
        select(func.count(FastCheckin.id)).where(and_(
            FastCheckin.fast_id == fast_id,
            func.date(FastCheckin.created_at) == date.today(),
        ))
    )).scalar() or 0
    return {"participants": total, "checked_in_today": today_count}


# ── Admin ───────────────────────────────────────────────────────────────────

class FastIn(BaseModel):
    title: str
    description: Optional[str] = None
    kind: str = "full"
    start_date: date
    end_date: date
    scripture_focus: Optional[str] = None
    prayer_prompts: Optional[List[str]] = None
    is_published: bool = True


@router.get("/admin/all")
async def admin_list(db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(Fast).order_by(desc(Fast.start_date)).limit(200))
    return [_fast(f) for f in res.scalars().all()]


@router.post("/admin", status_code=201)
async def create_fast(body: FastIn, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    if body.kind not in KINDS:
        raise HTTPException(400, f"kind must be one of {sorted(KINDS)}")
    if body.end_date < body.start_date:
        raise HTTPException(400, "end_date must be on/after start_date")
    f = Fast(**body.model_dump())
    db.add(f)
    await db.commit()
    await db.refresh(f)
    return _fast(f)


@router.put("/admin/{fast_id}")
async def update_fast(fast_id: str, body: FastIn, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    f = (await db.execute(select(Fast).where(Fast.id == fast_id))).scalar_one_or_none()
    if not f:
        raise HTTPException(404, "Fast not found")
    if body.kind not in KINDS:
        raise HTTPException(400, f"kind must be one of {sorted(KINDS)}")
    for k, v in body.model_dump().items():
        setattr(f, k, v)
    await db.commit()
    await db.refresh(f)
    return _fast(f)


@router.delete("/admin/{fast_id}")
async def delete_fast(fast_id: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    f = (await db.execute(select(Fast).where(Fast.id == fast_id))).scalar_one_or_none()
    if not f:
        return {"deleted": 0}
    from sqlalchemy import delete as sql_delete
    await db.execute(sql_delete(FastCheckin).where(FastCheckin.fast_id == fast_id))
    await db.delete(f)
    await db.commit()
    return {"deleted": 1}
