"""
Small Groups / House Fellowships API — public discovery + admin management.
"""

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, desc, or_, func
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.user import User
from models.small_group import SmallGroup, SmallGroupInterest
from utils.dependencies import get_admin_user
from utils.rate_limit import rate_limit


router = APIRouter(prefix="/api/small-groups", tags=["Small Groups"])


AUDIENCES = ["any", "newcomers", "young_adults", "couples", "families", "seniors", "men", "women", "students"]


class GroupIn(BaseModel):
    name: str
    description: Optional[str] = None
    topics: Optional[str] = None
    audience: str = "any"
    day_of_week: int = 0
    time_text: str = "6:00 PM"
    cadence: str = "weekly"
    location_label: str = "See group leader for address"
    city: Optional[str] = None
    country: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    leader_name: str = "LETW Leader"
    leader_contact: Optional[str] = None
    capacity: int = 12
    is_online: bool = False
    cover_image_url: Optional[str] = None


def _g(g: SmallGroup) -> dict:
    return {
        "id": g.id, "name": g.name, "description": g.description,
        "topics": g.topics, "audience": g.audience,
        "day_of_week": g.day_of_week, "time_text": g.time_text, "cadence": g.cadence,
        "location_label": g.location_label, "city": g.city, "country": g.country,
        "lat": g.lat, "lng": g.lng,
        "leader_name": g.leader_name, "leader_contact": g.leader_contact,
        "capacity": g.capacity, "current_size": g.current_size,
        "is_active": g.is_active, "is_online": g.is_online,
        "cover_image_url": g.cover_image_url, "created_at": g.created_at,
    }


# ─── Public discovery ────────────────────────────────────────────────────────

@router.get("")
async def list_public(
    audience: Optional[str] = None, day: Optional[int] = None,
    city: Optional[str] = None, q: Optional[str] = None,
    online: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(SmallGroup).where(SmallGroup.is_active == True).order_by(desc(SmallGroup.created_at))
    if audience and audience != "any":
        query = query.where(SmallGroup.audience == audience)
    if day is not None:
        query = query.where(SmallGroup.day_of_week == day)
    if city:
        like = f"%{city}%"
        query = query.where(SmallGroup.city.ilike(like))
    if online is not None:
        query = query.where(SmallGroup.is_online == online)
    if q and q.strip():
        like = f"%{q.strip()}%"
        query = query.where(or_(SmallGroup.name.ilike(like), SmallGroup.description.ilike(like), SmallGroup.topics.ilike(like)))
    res = await db.execute(query.limit(500))
    return [_g(g) for g in res.scalars().all()]


@router.get("/cities")
async def list_cities(db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(SmallGroup.city, func.count(SmallGroup.id))
        .where(SmallGroup.is_active == True).where(SmallGroup.city.isnot(None))
        .group_by(SmallGroup.city).order_by(SmallGroup.city)
    )
    return {"cities": [{"name": row[0], "count": row[1]} for row in res.all()]}


class InterestIn(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    note: Optional[str] = None


@router.post("/{gid}/interest", status_code=201)
async def express_interest(
    gid: str, body: InterestIn,
    db: AsyncSession = Depends(get_db),
    _rl=Depends(rate_limit(5, 600, "small-group-interest")),
):
    res = await db.execute(select(SmallGroup).where(SmallGroup.id == gid))
    g = res.scalar_one_or_none()
    if not g or not g.is_active:
        raise HTTPException(404, "Group not found")
    i = SmallGroupInterest(
        group_id=gid, requester_name=body.name, requester_email=body.email,
        requester_phone=body.phone, note=body.note, status="pending",
    )
    db.add(i)
    await db.commit()
    return {"ok": True, "message": f"{g.leader_name} will reach out within a few days."}


# ─── Admin ───────────────────────────────────────────────────────────────────

@router.get("/admin/all")
async def admin_list(db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(SmallGroup).order_by(desc(SmallGroup.created_at)))
    return [_g(g) for g in res.scalars().all()]


@router.post("/admin", status_code=201)
async def admin_create(body: GroupIn, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    if body.audience not in AUDIENCES:
        raise HTTPException(400, f"audience must be one of {AUDIENCES}")
    g = SmallGroup(**body.model_dump())
    db.add(g); await db.commit(); await db.refresh(g)
    return _g(g)


@router.put("/admin/{gid}")
async def admin_update(gid: str, body: GroupIn, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(SmallGroup).where(SmallGroup.id == gid))
    g = res.scalar_one_or_none()
    if not g:
        raise HTTPException(404, "Not found")
    for k, v in body.model_dump().items():
        setattr(g, k, v)
    await db.commit(); await db.refresh(g)
    return _g(g)


@router.delete("/admin/{gid}")
async def admin_delete(gid: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(SmallGroup).where(SmallGroup.id == gid))
    g = res.scalar_one_or_none()
    if not g:
        return {"deleted": 0}
    await db.delete(g); await db.commit()
    return {"deleted": 1}


@router.get("/admin/interests")
async def admin_interests(status: Optional[str] = None, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    q = select(SmallGroupInterest).order_by(desc(SmallGroupInterest.created_at))
    if status: q = q.where(SmallGroupInterest.status == status)
    res = await db.execute(q.limit(500))
    return [{
        "id": i.id, "group_id": i.group_id, "requester_name": i.requester_name,
        "requester_email": i.requester_email, "requester_phone": i.requester_phone,
        "note": i.note, "status": i.status, "created_at": i.created_at,
    } for i in res.scalars().all()]


@router.put("/admin/interests/{iid}")
async def admin_update_interest(iid: str, status: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(SmallGroupInterest).where(SmallGroupInterest.id == iid))
    i = res.scalar_one_or_none()
    if not i:
        raise HTTPException(404, "Not found")
    if status not in ("pending", "contacted", "accepted", "declined"):
        raise HTTPException(400, "Invalid status")
    i.status = status
    await db.commit()
    return {"ok": True, "status": i.status}
