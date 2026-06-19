"""
Missionary Sponsorship Network API.
"""

import re
from datetime import datetime, date
from typing import List, Optional, Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, desc, func
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.user import User
from models.missionary import Missionary, MissionaryUpdate, MissionarySponsorship
from utils.dependencies import get_admin_user, get_current_active_user


router = APIRouter(prefix="/api/missionaries", tags=["Missionaries"])


def slugify(s: str) -> str:
    s = (s or "").lower().strip()
    s = re.sub(r"[^a-z0-9\-\s]", "", s)
    s = re.sub(r"\s+", "-", s)
    return re.sub(r"-+", "-", s).strip("-") or "missionary"


class MissionaryIn(BaseModel):
    slug: Optional[str] = None
    name: str
    family_size: int = 1
    country: str
    region: Optional[str] = None
    organisation: Optional[str] = None
    ministry_focus: str
    bio: Optional[str] = None
    photo_url: Optional[str] = None
    monthly_support_goal: float = 0
    currency: str = "USD"
    contact_email: Optional[str] = None
    sent_date: Optional[date] = None
    is_active: bool = True
    is_featured: bool = False
    prayer_points: Optional[Any] = None
    sort_order: int = 0


class MissionaryOut(BaseModel):
    id: str
    slug: str
    name: str
    family_size: int
    country: str
    region: Optional[str]
    organisation: Optional[str]
    ministry_focus: str
    bio: Optional[str]
    photo_url: Optional[str]
    monthly_support_goal: float
    currency: str
    is_featured: bool
    sent_date: Optional[date]
    prayer_points: Optional[Any]


@router.get("/", response_model=List[MissionaryOut])
async def list_missionaries(featured: Optional[bool] = None, db: AsyncSession = Depends(get_db)):
    q = select(Missionary).where(Missionary.is_active == True).order_by(Missionary.sort_order, Missionary.name)
    if featured is True:
        q = q.where(Missionary.is_featured == True)
    res = await db.execute(q)
    return [MissionaryOut(
        id=m.id, slug=m.slug, name=m.name, family_size=m.family_size,
        country=m.country, region=m.region, organisation=m.organisation,
        ministry_focus=m.ministry_focus, bio=m.bio, photo_url=m.photo_url,
        monthly_support_goal=float(m.monthly_support_goal), currency=m.currency,
        is_featured=m.is_featured, sent_date=m.sent_date, prayer_points=m.prayer_points,
    ) for m in res.scalars().all()]


@router.get("/by-slug/{slug}", response_model=MissionaryOut)
async def get_missionary(slug: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Missionary).where(Missionary.slug == slug, Missionary.is_active == True))
    m = res.scalar_one_or_none()
    if not m:
        raise HTTPException(404, "Missionary not found")
    return MissionaryOut(
        id=m.id, slug=m.slug, name=m.name, family_size=m.family_size,
        country=m.country, region=m.region, organisation=m.organisation,
        ministry_focus=m.ministry_focus, bio=m.bio, photo_url=m.photo_url,
        monthly_support_goal=float(m.monthly_support_goal), currency=m.currency,
        is_featured=m.is_featured, sent_date=m.sent_date, prayer_points=m.prayer_points,
    )


@router.get("/{slug}/updates")
async def list_updates(slug: str, limit: int = 10, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Missionary).where(Missionary.slug == slug))
    m = res.scalar_one_or_none()
    if not m:
        raise HTTPException(404, "Missionary not found")
    res2 = await db.execute(
        select(MissionaryUpdate).where(MissionaryUpdate.missionary_id == m.id).order_by(desc(MissionaryUpdate.published_at)).limit(min(max(limit, 1), 50))
    )
    return res2.scalars().all()


@router.get("/{slug}/support-stats")
async def support_stats(slug: str, db: AsyncSession = Depends(get_db)):
    """Public: how many supporters + monthly total raised."""
    res = await db.execute(select(Missionary).where(Missionary.slug == slug))
    m = res.scalar_one_or_none()
    if not m:
        raise HTTPException(404, "Missionary not found")
    res2 = await db.execute(
        select(func.count(MissionarySponsorship.id), func.coalesce(func.sum(MissionarySponsorship.monthly_amount), 0))
        .where(MissionarySponsorship.missionary_id == m.id, MissionarySponsorship.is_active == True)
    )
    row = res2.one()
    supporter_count, monthly_total = row[0], float(row[1])
    goal = float(m.monthly_support_goal)
    return {
        "supporter_count": supporter_count,
        "monthly_raised": monthly_total,
        "monthly_goal": goal,
        "percent": round((monthly_total / goal) * 100, 1) if goal > 0 else 0,
        "currency": m.currency,
    }


# ─── Sponsorship signups (public) ────────────────────────────────────────────

class SponsorshipIn(BaseModel):
    supporter_name: str
    supporter_email: EmailStr
    monthly_amount: float
    note: Optional[str] = None


@router.post("/{slug}/sponsor")
async def sponsor(
    slug: str,
    body: SponsorshipIn,
    db: AsyncSession = Depends(get_db),
):
    """Public commit — member pledges monthly support. Doesn't process payment;
    pairs with the existing payments system (set fund='Missions' + supporter routes
    monthly via Stripe portal once recurring donations land)."""
    res = await db.execute(select(Missionary).where(Missionary.slug == slug, Missionary.is_active == True))
    m = res.scalar_one_or_none()
    if not m:
        raise HTTPException(404, "Missionary not found")
    s = MissionarySponsorship(
        missionary_id=m.id,
        supporter_name=body.supporter_name,
        supporter_email=body.supporter_email,
        monthly_amount=body.monthly_amount,
        currency=m.currency,
        note=body.note,
    )
    db.add(s)
    await db.commit()
    await db.refresh(s)
    return {"ok": True, "id": s.id, "missionary": m.name, "monthly_amount": body.monthly_amount, "currency": m.currency}


# ─── Admin CRUD ──────────────────────────────────────────────────────────────

@router.post("/admin", response_model=MissionaryOut, status_code=201)
async def admin_create(body: MissionaryIn, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    slug = body.slug or slugify(body.name)
    res = await db.execute(select(Missionary).where(Missionary.slug == slug))
    if res.scalar_one_or_none():
        slug = f"{slug}-{int(datetime.utcnow().timestamp())}"
    data = body.model_dump()
    data["slug"] = slug
    m = Missionary(**data)
    db.add(m)
    await db.commit()
    await db.refresh(m)
    return MissionaryOut(
        id=m.id, slug=m.slug, name=m.name, family_size=m.family_size,
        country=m.country, region=m.region, organisation=m.organisation,
        ministry_focus=m.ministry_focus, bio=m.bio, photo_url=m.photo_url,
        monthly_support_goal=float(m.monthly_support_goal), currency=m.currency,
        is_featured=m.is_featured, sent_date=m.sent_date, prayer_points=m.prayer_points,
    )


@router.put("/admin/{mid}", response_model=MissionaryOut)
async def admin_update(mid: str, body: MissionaryIn, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(Missionary).where(Missionary.id == mid))
    m = res.scalar_one_or_none()
    if not m:
        raise HTTPException(404, "Not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        if k == "slug" and not v:
            continue
        setattr(m, k, v)
    await db.commit()
    await db.refresh(m)
    return MissionaryOut(
        id=m.id, slug=m.slug, name=m.name, family_size=m.family_size,
        country=m.country, region=m.region, organisation=m.organisation,
        ministry_focus=m.ministry_focus, bio=m.bio, photo_url=m.photo_url,
        monthly_support_goal=float(m.monthly_support_goal), currency=m.currency,
        is_featured=m.is_featured, sent_date=m.sent_date, prayer_points=m.prayer_points,
    )


@router.delete("/admin/{mid}")
async def admin_delete(mid: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(Missionary).where(Missionary.id == mid))
    m = res.scalar_one_or_none()
    if not m:
        return {"deleted": 0}
    await db.delete(m)
    await db.commit()
    return {"deleted": 1}


class UpdateIn(BaseModel):
    title: str
    body_html: str = ""
    hero_image_url: Optional[str] = None


@router.post("/admin/{mid}/updates", status_code=201)
async def admin_create_update(mid: str, body: UpdateIn, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(Missionary).where(Missionary.id == mid))
    if not res.scalar_one_or_none():
        raise HTTPException(404, "Missionary not found")
    u = MissionaryUpdate(missionary_id=mid, **body.model_dump())
    db.add(u)
    await db.commit()
    await db.refresh(u)
    return u


@router.get("/admin/{mid}/sponsorships")
async def admin_list_sponsorships(mid: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(MissionarySponsorship).where(MissionarySponsorship.missionary_id == mid).order_by(desc(MissionarySponsorship.created_at)))
    return res.scalars().all()
