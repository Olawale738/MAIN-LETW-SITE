"""
Conversion follow-up CRM.

Every altar-call response automatically enters this pipeline. Admin moves the
person forward through the 6 stages, leaves notes, reassigns shepherds, sends
the matching stage email at the right moment.
"""

from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, desc, func
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.user import User
from models.conversion_journey import ConversionJourney, STAGES
from utils.dependencies import get_admin_user


router = APIRouter(prefix="/api/conversion", tags=["Conversion CRM"])


class JourneyIn(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    source: str = "altar_call"
    source_ref: Optional[str] = None
    notes: Optional[str] = None


class JourneyPatch(BaseModel):
    stage: Optional[str] = None
    notes: Optional[str] = None
    assigned_to_user_id: Optional[str] = None
    is_active: Optional[bool] = None


def _to_dict(j: ConversionJourney) -> dict:
    return {
        "id": j.id, "name": j.name, "email": j.email, "phone": j.phone, "location": j.location,
        "source": j.source, "source_ref": j.source_ref,
        "stage": j.stage, "assigned_to_user_id": j.assigned_to_user_id,
        "notes": j.notes,
        "welcomed_at": j.welcomed_at, "called_at": j.called_at,
        "studying_at": j.studying_at, "baptism_at": j.baptism_at,
        "small_group_at": j.small_group_at, "member_at": j.member_at,
        "last_activity_at": j.last_activity_at, "is_active": j.is_active,
        "created_at": j.created_at,
    }


@router.get("/stages")
async def stages():
    return {"stages": list(STAGES)}


@router.get("/admin/all")
async def admin_list(stage: Optional[str] = None, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    q = select(ConversionJourney).order_by(desc(ConversionJourney.last_activity_at))
    if stage:
        q = q.where(ConversionJourney.stage == stage)
    res = await db.execute(q.limit(1000))
    return [_to_dict(j) for j in res.scalars().all()]


@router.get("/admin/funnel")
async def admin_funnel(db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    """Counts per stage so the dashboard can render a pipeline view."""
    res = await db.execute(
        select(ConversionJourney.stage, func.count(ConversionJourney.id))
        .where(ConversionJourney.is_active == True)
        .group_by(ConversionJourney.stage)
    )
    counts = {row[0]: row[1] for row in res.all()}
    return {"counts": {s: counts.get(s, 0) for s in STAGES}, "total_active": sum(counts.values())}


@router.post("/admin", status_code=201)
async def admin_create(body: JourneyIn, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    j = ConversionJourney(**body.model_dump())
    j.welcomed_at = datetime.utcnow()
    j.last_activity_at = datetime.utcnow()
    db.add(j); await db.commit(); await db.refresh(j)
    return _to_dict(j)


@router.put("/admin/{jid}")
async def admin_update(jid: str, body: JourneyPatch, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(ConversionJourney).where(ConversionJourney.id == jid))
    j = res.scalar_one_or_none()
    if not j:
        raise HTTPException(404, "Not found")
    if body.stage is not None:
        if body.stage not in STAGES:
            raise HTTPException(400, f"stage must be one of {list(STAGES)}")
        # Stamp the matching timestamp
        ts_field = {
            "welcomed": "welcomed_at", "called": "called_at", "studying": "studying_at",
            "baptism": "baptism_at", "small_group": "small_group_at", "member": "member_at",
        }.get(body.stage)
        if ts_field and getattr(j, ts_field, None) is None:
            setattr(j, ts_field, datetime.utcnow())
        j.stage = body.stage
    if body.notes is not None: j.notes = body.notes
    if body.assigned_to_user_id is not None: j.assigned_to_user_id = body.assigned_to_user_id
    if body.is_active is not None: j.is_active = body.is_active
    j.last_activity_at = datetime.utcnow()
    await db.commit(); await db.refresh(j)
    return _to_dict(j)


@router.delete("/admin/{jid}")
async def admin_delete(jid: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(ConversionJourney).where(ConversionJourney.id == jid))
    j = res.scalar_one_or_none()
    if not j:
        return {"deleted": 0}
    await db.delete(j); await db.commit()
    return {"deleted": 1}


@router.post("/admin/sweep-dormant")
async def sweep_dormant(db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    """Move anyone whose last_activity_at is older than 30 days into 'dormant'.

    Admins can run this manually (or wire to a daily cron) to keep the funnel
    honest.
    """
    cutoff = datetime.utcnow() - timedelta(days=30)
    res = await db.execute(
        select(ConversionJourney)
        .where(ConversionJourney.is_active == True)
        .where(ConversionJourney.stage != "member")
        .where(ConversionJourney.stage != "dormant")
        .where(ConversionJourney.last_activity_at < cutoff)
    )
    moved = 0
    for j in res.scalars().all():
        j.stage = "dormant"
        j.last_activity_at = datetime.utcnow()
        moved += 1
    await db.commit()
    return {"moved": moved}
