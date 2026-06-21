"""
Church locations API — public list + admin CRUD.
"""

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, desc, func
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.user import User
from models.church_location import ChurchLocation, KINDS
from utils.dependencies import get_admin_user


router = APIRouter(prefix="/api/church-locations", tags=["Church Locations"])


class LocationIn(BaseModel):
    name: str
    kind: str = "branch"
    continent: str
    country_code: str
    country_name: str
    city: Optional[str] = None
    address: Optional[str] = None
    blurb: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    website: Optional[str] = None
    map_x: Optional[int] = None
    map_y: Optional[int] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    photo_url: Optional[str] = None
    sort_order: int = 0
    is_active: bool = True


def _l(l: ChurchLocation) -> dict:
    return {
        "id": l.id, "name": l.name, "kind": l.kind,
        "continent": l.continent, "country_code": l.country_code, "country_name": l.country_name,
        "city": l.city, "address": l.address, "blurb": l.blurb,
        "contact_name": l.contact_name, "contact_email": l.contact_email,
        "contact_phone": l.contact_phone, "website": l.website,
        "map_x": l.map_x, "map_y": l.map_y, "lat": l.lat, "lng": l.lng,
        "photo_url": l.photo_url, "sort_order": l.sort_order, "is_active": l.is_active,
        "created_at": l.created_at,
    }


# ─── Public ──────────────────────────────────────────────────────────────────

@router.get("")
async def list_public(db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(ChurchLocation).where(ChurchLocation.is_active == True)
        .order_by(ChurchLocation.sort_order, ChurchLocation.continent, ChurchLocation.country_name, ChurchLocation.city)
    )
    return [_l(l) for l in res.scalars().all()]


@router.get("/stats")
async def stats(db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(ChurchLocation.kind, func.count(ChurchLocation.id))
        .where(ChurchLocation.is_active == True).group_by(ChurchLocation.kind)
    )
    counts = {row[0]: row[1] for row in res.all()}
    res2 = await db.execute(
        select(func.count(func.distinct(ChurchLocation.country_code)))
        .where(ChurchLocation.is_active == True)
    )
    countries = res2.scalar() or 0
    res3 = await db.execute(
        select(func.count(func.distinct(ChurchLocation.continent)))
        .where(ChurchLocation.is_active == True)
    )
    continents = res3.scalar() or 0
    return {
        "counts": {k: counts.get(k, 0) for k in KINDS},
        "total": sum(counts.values()),
        "countries": countries,
        "continents": continents,
    }


# ─── Admin ───────────────────────────────────────────────────────────────────

@router.get("/admin/all")
async def admin_list(db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(ChurchLocation).order_by(ChurchLocation.continent, ChurchLocation.country_name, ChurchLocation.city))
    return [_l(l) for l in res.scalars().all()]


@router.post("/admin", status_code=201)
async def admin_create(body: LocationIn, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    if body.kind not in KINDS:
        raise HTTPException(400, f"kind must be one of {list(KINDS)}")
    l = ChurchLocation(**body.model_dump())
    l.country_code = (body.country_code or "").upper()
    db.add(l); await db.commit(); await db.refresh(l)
    return _l(l)


@router.put("/admin/{lid}")
async def admin_update(lid: str, body: LocationIn, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(ChurchLocation).where(ChurchLocation.id == lid))
    l = res.scalar_one_or_none()
    if not l:
        raise HTTPException(404, "Not found")
    if body.kind not in KINDS:
        raise HTTPException(400, f"kind must be one of {list(KINDS)}")
    for k, v in body.model_dump().items():
        setattr(l, k, v)
    l.country_code = (body.country_code or "").upper()
    await db.commit(); await db.refresh(l)
    return _l(l)


@router.delete("/admin/{lid}")
async def admin_delete(lid: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(ChurchLocation).where(ChurchLocation.id == lid))
    l = res.scalar_one_or_none()
    if not l:
        return {"deleted": 0}
    await db.delete(l); await db.commit()
    return {"deleted": 1}
