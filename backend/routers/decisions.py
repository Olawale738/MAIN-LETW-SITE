"""
Kingdom Outcomes API — track salvations, baptisms, healings, etc.
Public counters (totals + recent) so the church dashboard becomes visible
proof of God at work.
"""

from datetime import datetime, date, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.user import User
from models.decision import Decision
from utils.dependencies import get_admin_user, get_current_active_user


router = APIRouter(prefix="/api/decisions", tags=["Kingdom Outcomes"])

VALID_KINDS = {
    "salvation", "baptism", "healing", "marriage_restored", "prodigal_returned",
    "deliverance", "rededication", "dedication", "calling", "other",
}


class DecisionIn(BaseModel):
    kind: str
    person_name: str = "Anonymous"
    person_email: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None
    testimony: Optional[str] = None
    decided_on: Optional[date] = None
    is_public: bool = True


class DecisionOut(BaseModel):
    id: str
    kind: str
    person_name: str
    location: Optional[str]
    testimony: Optional[str]
    decided_on: date
    is_verified: bool
    is_public: bool
    created_at: datetime


# ─── Public counters (homepage / dashboard widgets) ──────────────────────────

@router.get("/counts")
async def counts(year: Optional[int] = None, db: AsyncSession = Depends(get_db)):
    """Aggregate counts by kind. Optional year filter."""
    q = select(Decision.kind, func.count(Decision.id)).where(Decision.is_public == True)
    if year:
        from datetime import date as date_cls
        q = q.where(Decision.decided_on >= date_cls(year, 1, 1)).where(Decision.decided_on < date_cls(year + 1, 1, 1))
    q = q.group_by(Decision.kind)
    res = await db.execute(q)
    by_kind = {row[0]: row[1] for row in res.all()}
    return {
        "year": year or "all_time",
        "total": sum(by_kind.values()),
        "by_kind": {k: by_kind.get(k, 0) for k in VALID_KINDS},
    }


@router.get("/recent", response_model=List[DecisionOut])
async def recent_decisions(
    limit: int = 12,
    kind: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Recent public decisions for the live counter feed."""
    q = select(Decision).where(Decision.is_public == True).order_by(desc(Decision.created_at)).limit(min(max(limit, 1), 100))
    if kind:
        q = q.where(Decision.kind == kind)
    res = await db.execute(q)
    return res.scalars().all()


# ─── Submission (any logged-in user can report their own decision) ───────────

@router.post("/", response_model=DecisionOut, status_code=201)
async def submit_decision(
    body: DecisionIn,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    if body.kind not in VALID_KINDS:
        raise HTTPException(400, f"kind must be one of {sorted(VALID_KINDS)}")
    d = Decision(
        kind=body.kind,
        person_name=body.person_name or user.name or "Anonymous",
        person_email=body.person_email or user.email,
        location=body.location,
        notes=body.notes,
        testimony=body.testimony,
        decided_on=body.decided_on or date.today(),
        submitted_by_user_id=user.id,
        is_public=body.is_public,
    )
    db.add(d)
    await db.commit()
    await db.refresh(d)
    return d


# ─── Admin moderation ────────────────────────────────────────────────────────

@router.get("/admin/all", response_model=List[DecisionOut])
async def admin_list(
    status: Optional[str] = None,
    kind: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    q = select(Decision).order_by(desc(Decision.created_at))
    if status == "unverified":
        q = q.where(Decision.is_verified == False)
    elif status == "verified":
        q = q.where(Decision.is_verified == True)
    if kind:
        q = q.where(Decision.kind == kind)
    res = await db.execute(q.limit(500))
    return res.scalars().all()


@router.put("/admin/{did}", response_model=DecisionOut)
async def admin_update(
    did: str,
    body: DecisionIn,
    is_verified: bool = False,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    res = await db.execute(select(Decision).where(Decision.id == did))
    d = res.scalar_one_or_none()
    if not d:
        raise HTTPException(404, "Not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(d, k, v)
    d.is_verified = is_verified
    await db.commit()
    await db.refresh(d)
    return d


@router.delete("/admin/{did}")
async def admin_delete(did: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(Decision).where(Decision.id == did))
    d = res.scalar_one_or_none()
    if not d:
        return {"deleted": 0}
    await db.delete(d)
    await db.commit()
    return {"deleted": 1}


@router.post("/admin/bulk", status_code=201)
async def admin_bulk_create(
    items: List[DecisionIn],
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    """Bulk-create decisions — useful for entering Sunday service counts in one go."""
    created = 0
    for body in items:
        if body.kind not in VALID_KINDS:
            continue
        d = Decision(
            kind=body.kind,
            person_name=body.person_name or "Anonymous",
            person_email=body.person_email,
            location=body.location,
            notes=body.notes,
            testimony=body.testimony,
            decided_on=body.decided_on or date.today(),
            submitted_by_user_id=admin.id,
            is_public=body.is_public,
            is_verified=True,
        )
        db.add(d)
        created += 1
    await db.commit()
    return {"created": created}
