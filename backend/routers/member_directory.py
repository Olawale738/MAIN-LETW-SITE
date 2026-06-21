"""
Member directory + safe messaging.

All directory and messaging endpoints require a signed-in user. Profiles can
be hidden, messages can be disabled, and recipients can report messages →
admin review.
"""

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, desc, or_, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.user import User
from models.member_directory import DirectoryProfile, DirectoryMessage
from utils.dependencies import get_admin_user, get_current_active_user
from utils.rate_limit import rate_limit


router = APIRouter(prefix="/api/directory", tags=["Member Directory"])


class ProfileIn(BaseModel):
    display_name: str
    city: Optional[str] = None
    country: Optional[str] = None
    bio: Optional[str] = None
    gifts: Optional[str] = None
    languages: Optional[str] = None
    photo_url: Optional[str] = None
    is_public: bool = True
    allow_messages: bool = True
    is_prayer_partner: bool = False


def _p(p: DirectoryProfile) -> dict:
    return {
        "id": p.id, "user_id": p.user_id, "display_name": p.display_name,
        "city": p.city, "country": p.country, "bio": p.bio,
        "gifts": p.gifts, "languages": p.languages, "photo_url": p.photo_url,
        "is_public": p.is_public, "allow_messages": p.allow_messages,
        "is_prayer_partner": p.is_prayer_partner,
        "created_at": p.created_at, "updated_at": p.updated_at,
    }


# ─── Profile (own) ───────────────────────────────────────────────────────────

@router.get("/me")
async def get_mine(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_active_user)):
    res = await db.execute(select(DirectoryProfile).where(DirectoryProfile.user_id == user.id))
    p = res.scalar_one_or_none()
    return _p(p) if p else None


@router.put("/me")
async def upsert_mine(body: ProfileIn, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_active_user)):
    res = await db.execute(select(DirectoryProfile).where(DirectoryProfile.user_id == user.id))
    p = res.scalar_one_or_none()
    if p:
        for k, v in body.model_dump().items():
            setattr(p, k, v)
    else:
        p = DirectoryProfile(user_id=user.id, **body.model_dump())
        db.add(p)
    await db.commit(); await db.refresh(p)
    return _p(p)


@router.delete("/me")
async def remove_mine(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_active_user)):
    res = await db.execute(select(DirectoryProfile).where(DirectoryProfile.user_id == user.id))
    p = res.scalar_one_or_none()
    if p:
        await db.delete(p); await db.commit()
    return {"ok": True}


# ─── Public discovery (signed-in only) ───────────────────────────────────────

@router.get("/search")
async def search(
    q: Optional[str] = None, city: Optional[str] = None, prayer_partner: Optional[bool] = None,
    db: AsyncSession = Depends(get_db), _: User = Depends(get_current_active_user),
):
    query = (select(DirectoryProfile).where(DirectoryProfile.is_public == True)
             .order_by(DirectoryProfile.display_name).limit(200))
    if q and q.strip():
        like = f"%{q.strip()}%"
        query = query.where(or_(
            DirectoryProfile.display_name.ilike(like),
            DirectoryProfile.bio.ilike(like),
            DirectoryProfile.gifts.ilike(like),
            DirectoryProfile.city.ilike(like),
        ))
    if city:
        query = query.where(DirectoryProfile.city.ilike(f"%{city}%"))
    if prayer_partner:
        query = query.where(DirectoryProfile.is_prayer_partner == True)
    res = await db.execute(query)
    return [_p(p) for p in res.scalars().all()]


# ─── Messaging (signed-in only) ──────────────────────────────────────────────

class MessageIn(BaseModel):
    recipient_user_id: str
    body: str


@router.post("/messages", status_code=201)
async def send_message(
    body: MessageIn,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
    _rl=Depends(rate_limit(30, 300, "directory-message")),
):
    text = (body.body or "").strip()
    if not text or len(text) > 2000:
        raise HTTPException(400, "Message must be 1-2000 chars")
    if body.recipient_user_id == user.id:
        raise HTTPException(400, "Cannot message yourself")
    # Recipient must have a public profile that allows messages
    res = await db.execute(select(DirectoryProfile).where(DirectoryProfile.user_id == body.recipient_user_id))
    rp = res.scalar_one_or_none()
    if not rp or not rp.is_public or not rp.allow_messages:
        raise HTTPException(403, "Recipient is not accepting messages")
    m = DirectoryMessage(sender_user_id=user.id, recipient_user_id=body.recipient_user_id, body=text)
    db.add(m); await db.commit(); await db.refresh(m)
    return {"ok": True, "id": m.id}


@router.get("/inbox")
async def inbox(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_active_user)):
    res = await db.execute(
        select(DirectoryMessage).where(DirectoryMessage.recipient_user_id == user.id)
        .where(DirectoryMessage.is_hidden == False)
        .order_by(desc(DirectoryMessage.created_at)).limit(500)
    )
    return [{
        "id": m.id, "sender_user_id": m.sender_user_id, "body": m.body,
        "is_read": m.is_read, "is_reported": m.is_reported, "created_at": m.created_at,
    } for m in res.scalars().all()]


@router.put("/messages/{mid}/read")
async def mark_read(mid: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_active_user)):
    res = await db.execute(select(DirectoryMessage).where(DirectoryMessage.id == mid))
    m = res.scalar_one_or_none()
    if not m or m.recipient_user_id != user.id:
        raise HTTPException(404, "Not found")
    m.is_read = True
    await db.commit()
    return {"ok": True}


@router.put("/messages/{mid}/report")
async def report_message(mid: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_active_user)):
    res = await db.execute(select(DirectoryMessage).where(DirectoryMessage.id == mid))
    m = res.scalar_one_or_none()
    if not m or m.recipient_user_id != user.id:
        raise HTTPException(404, "Not found")
    m.is_reported = True
    await db.commit()
    return {"ok": True}


# ─── Admin moderation ────────────────────────────────────────────────────────

@router.get("/admin/reports")
async def admin_reports(db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(
        select(DirectoryMessage).where(DirectoryMessage.is_reported == True).where(DirectoryMessage.is_hidden == False)
        .order_by(desc(DirectoryMessage.created_at)).limit(500)
    )
    return [{
        "id": m.id, "sender_user_id": m.sender_user_id, "recipient_user_id": m.recipient_user_id,
        "body": m.body, "created_at": m.created_at,
    } for m in res.scalars().all()]


@router.delete("/admin/messages/{mid}")
async def admin_hide(mid: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(DirectoryMessage).where(DirectoryMessage.id == mid))
    m = res.scalar_one_or_none()
    if not m: return {"ok": True}
    m.is_hidden = True
    await db.commit()
    return {"ok": True}
