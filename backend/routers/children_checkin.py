"""
Children's ministry check-in/check-out API.

Admin/coordinator-only. The kiosk UI on the frontend calls these.
"""

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, desc, or_
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.user import User
from models.children_checkin import ChildProfile, CheckIn
from utils.dependencies import get_admin_user


router = APIRouter(prefix="/api/children-checkin", tags=["Children Check-in"])

AGE_GROUPS = ["nursery", "toddler", "kids", "preteen"]


class ChildIn(BaseModel):
    full_name: str
    age_group: str = "kids"
    guardian_name: str
    guardian_phone: str
    birthdate: Optional[datetime] = None
    allergies: Optional[str] = None
    medical_notes: Optional[str] = None


def _c(c: ChildProfile) -> dict:
    return {
        "id": c.id, "full_name": c.full_name, "birthdate": c.birthdate,
        "age_group": c.age_group, "guardian_name": c.guardian_name,
        "guardian_phone": c.guardian_phone, "allergies": c.allergies,
        "medical_notes": c.medical_notes, "is_active": c.is_active,
        "created_at": c.created_at,
    }


# ─── Children CRUD ───────────────────────────────────────────────────────────

@router.get("/children")
async def list_children(q: Optional[str] = None, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    query = select(ChildProfile).where(ChildProfile.is_active == True).order_by(ChildProfile.full_name)
    if q and q.strip():
        like = f"%{q.strip()}%"
        query = query.where(or_(ChildProfile.full_name.ilike(like), ChildProfile.guardian_name.ilike(like)))
    res = await db.execute(query.limit(500))
    return [_c(c) for c in res.scalars().all()]


@router.post("/children", status_code=201)
async def add_child(body: ChildIn, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    if body.age_group not in AGE_GROUPS:
        raise HTTPException(400, f"age_group must be one of {AGE_GROUPS}")
    c = ChildProfile(**body.model_dump())
    db.add(c); await db.commit(); await db.refresh(c)
    return _c(c)


@router.delete("/children/{cid}")
async def remove_child(cid: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(ChildProfile).where(ChildProfile.id == cid))
    c = res.scalar_one_or_none()
    if not c:
        return {"deleted": 0}
    c.is_active = False
    await db.commit()
    return {"deleted": 1}


# ─── Check-in/out ────────────────────────────────────────────────────────────

@router.post("/checkin/{cid}", status_code=201)
async def checkin(cid: str, location: str = "kids_wing", db: AsyncSession = Depends(get_db), admin: User = Depends(get_admin_user)):
    res = await db.execute(select(ChildProfile).where(ChildProfile.id == cid))
    c = res.scalar_one_or_none()
    if not c or not c.is_active:
        raise HTTPException(404, "Child not on roster")

    # Already checked in (no checkout)?
    res2 = await db.execute(
        select(CheckIn).where(CheckIn.child_id == cid).where(CheckIn.checked_out_at.is_(None))
        .order_by(desc(CheckIn.checked_in_at)).limit(1)
    )
    open_ci = res2.scalar_one_or_none()
    if open_ci:
        return {"ok": True, "id": open_ci.id, "security_code": open_ci.security_code, "already_open": True}

    ci = CheckIn(child_id=cid, location=location, checked_in_by=admin.id)
    db.add(ci); await db.commit(); await db.refresh(ci)
    return {"ok": True, "id": ci.id, "security_code": ci.security_code, "child_name": c.full_name}


class CheckoutIn(BaseModel):
    security_code: str


@router.post("/checkout/{cid}")
async def checkout(cid: str, body: CheckoutIn, db: AsyncSession = Depends(get_db), admin: User = Depends(get_admin_user)):
    res = await db.execute(
        select(CheckIn).where(CheckIn.child_id == cid).where(CheckIn.checked_out_at.is_(None))
        .order_by(desc(CheckIn.checked_in_at)).limit(1)
    )
    ci = res.scalar_one_or_none()
    if not ci:
        raise HTTPException(404, "Child is not currently checked in")
    if (ci.security_code or "") != (body.security_code or ""):
        raise HTTPException(403, "Wrong security code. Please ask the guardian to verify.")
    ci.checked_out_at = datetime.utcnow()
    ci.checked_out_by = admin.id
    await db.commit()
    return {"ok": True, "checked_out_at": ci.checked_out_at}


@router.get("/active")
async def active_checkins(db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(
        select(CheckIn, ChildProfile)
        .join(ChildProfile, CheckIn.child_id == ChildProfile.id)
        .where(CheckIn.checked_out_at.is_(None))
        .order_by(desc(CheckIn.checked_in_at)).limit(500)
    )
    out = []
    for ci, c in res.all():
        out.append({
            "checkin_id": ci.id, "child_id": c.id, "child_name": c.full_name,
            "age_group": c.age_group, "guardian_name": c.guardian_name,
            "guardian_phone": c.guardian_phone, "allergies": c.allergies,
            "security_code": ci.security_code, "checked_in_at": ci.checked_in_at,
            "location": ci.location,
        })
    return out
