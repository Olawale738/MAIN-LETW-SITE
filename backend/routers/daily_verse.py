"""
Daily Verse API.

Public:  GET /api/daily-verse/today — today's verse (rotation by day-of-year)
Admin:   GET/POST/PUT/DELETE /api/daily-verse/*
"""

from datetime import datetime, date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.daily_verse import DailyVerse
from models.user import User
from utils.dependencies import get_admin_user


router = APIRouter(prefix="/api/daily-verse", tags=["Daily Verse"])


class VerseIn(BaseModel):
    reference: str
    text: str
    translation: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0


class VerseOut(VerseIn):
    id: str


@router.get("/today")
async def today_verse(db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(DailyVerse).where(DailyVerse.is_active == True).order_by(DailyVerse.sort_order, DailyVerse.created_at)
    )
    verses = list(res.scalars().all())
    if not verses:
        return None
    # Deterministic day-of-year rotation. Same verse for every visitor on the same day.
    doy = date.today().timetuple().tm_yday
    pick = verses[doy % len(verses)]
    return {
        "id": pick.id, "reference": pick.reference, "text": pick.text,
        "translation": pick.translation, "date": date.today().isoformat(),
    }


@router.get("/", response_model=List[VerseOut])
async def list_verses(db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(DailyVerse).order_by(DailyVerse.sort_order, DailyVerse.created_at))
    return res.scalars().all()


@router.post("/", response_model=VerseOut, status_code=201)
async def create_verse(body: VerseIn, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    v = DailyVerse(**body.model_dump())
    db.add(v)
    await db.commit()
    await db.refresh(v)
    return v


@router.put("/{vid}", response_model=VerseOut)
async def update_verse(vid: str, body: VerseIn, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(DailyVerse).where(DailyVerse.id == vid))
    v = res.scalar_one_or_none()
    if not v:
        raise HTTPException(404, "Not found")
    for k, val in body.model_dump().items():
        setattr(v, k, val)
    await db.commit()
    await db.refresh(v)
    return v


@router.post("/seed-kjv")
async def seed_kjv(
    force: bool = False,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    """Populate the rotation with 365 KJV verses (public domain).
    Skips by default if any verses already exist. Pass ?force=true to add anyway."""
    from data.kjv_daily_verses import KJV_VERSES
    res = await db.execute(select(DailyVerse))
    existing = list(res.scalars().all())
    if existing and not force:
        return {"added": 0, "skipped": len(KJV_VERSES), "total_now": len(existing), "reason": "verses already exist; pass force=true to add anyway"}
    existing_refs = {(v.reference, v.text) for v in existing}
    added = 0
    for idx, (ref, text) in enumerate(KJV_VERSES):
        if (ref, text) in existing_refs:
            continue
        db.add(DailyVerse(reference=ref, text=text, translation="KJV", is_active=True, sort_order=idx))
        added += 1
    await db.commit()
    res2 = await db.execute(select(DailyVerse))
    return {"added": added, "skipped": len(KJV_VERSES) - added, "total_now": len(list(res2.scalars().all()))}


@router.delete("/{vid}")
async def delete_verse(vid: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(DailyVerse).where(DailyVerse.id == vid))
    v = res.scalar_one_or_none()
    if not v:
        return {"deleted": 0}
    await db.delete(v)
    await db.commit()
    return {"deleted": 1}
