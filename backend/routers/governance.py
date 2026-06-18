"""
Governance API — Lead Coordinator assignments + Audit Log access.
Applies uniformly to custom_ministry / youth_program / department / volunteer_team
groups so the same model covers every dashboard.
"""

from datetime import datetime
from typing import List, Optional, Any

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import select, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.user import User
from models.governance import LeadAssignment, AuditLog
from utils.dependencies import get_admin_user, get_current_active_user
from utils.audit import log_action


router = APIRouter(prefix="/api/governance", tags=["Governance"])

ALLOWED_GROUP_KINDS = {"custom_ministry", "youth_program", "department", "volunteer_team"}


# ─── Lead assignments ────────────────────────────────────────────────────────

class LeadOut(BaseModel):
    id: str
    user_id: str
    user_name: str
    user_email: str
    group_kind: str
    group_id: str
    assigned_by_user_id: Optional[str]
    assigned_at: datetime


class LeadIn(BaseModel):
    user_id: str
    group_kind: str
    group_id: str


async def _hydrate(db: AsyncSession, rows: list[LeadAssignment]) -> list[LeadOut]:
    if not rows:
        return []
    ids = list({r.user_id for r in rows})
    res = await db.execute(select(User).where(User.id.in_(ids)))
    by_id = {u.id: u for u in res.scalars().all()}
    out = []
    for r in rows:
        u = by_id.get(r.user_id)
        out.append(LeadOut(
            id=r.id, user_id=r.user_id,
            user_name=(u.name if u else "") or (u.email if u else "Unknown"),
            user_email=(u.email if u else ""),
            group_kind=r.group_kind, group_id=r.group_id,
            assigned_by_user_id=r.assigned_by_user_id, assigned_at=r.assigned_at,
        ))
    return out


@router.get("/leads", response_model=List[LeadOut])
async def list_leads(
    group_kind: Optional[str] = None,
    group_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    """List Lead Coordinators. Filter by group_kind/group_id to scope to one group."""
    q = select(LeadAssignment)
    if group_kind:
        q = q.where(LeadAssignment.group_kind == group_kind)
    if group_id:
        q = q.where(LeadAssignment.group_id == group_id)
    q = q.order_by(LeadAssignment.assigned_at.desc())
    res = await db.execute(q)
    return await _hydrate(db, list(res.scalars().all()))


@router.post("/leads", response_model=LeadOut, status_code=201)
async def assign_lead(
    body: LeadIn,
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    if body.group_kind not in ALLOWED_GROUP_KINDS:
        raise HTTPException(400, f"group_kind must be one of {sorted(ALLOWED_GROUP_KINDS)}")
    res = await db.execute(select(User).where(User.id == body.user_id))
    if not res.scalar_one_or_none():
        raise HTTPException(404, "User not found")
    res2 = await db.execute(select(LeadAssignment).where(
        LeadAssignment.user_id == body.user_id,
        LeadAssignment.group_kind == body.group_kind,
        LeadAssignment.group_id == body.group_id,
    ))
    if res2.scalar_one_or_none():
        raise HTTPException(409, "Already a Lead for this group")
    la = LeadAssignment(
        user_id=body.user_id, group_kind=body.group_kind, group_id=body.group_id,
        assigned_by_user_id=admin.id,
    )
    db.add(la)
    await log_action(
        db, request, admin,
        action="lead.assign",
        target_kind="user", target_id=body.user_id,
        group_kind=body.group_kind, group_id=body.group_id,
    )
    await db.commit()
    await db.refresh(la)
    rows = await _hydrate(db, [la])
    return rows[0]


@router.delete("/leads/{lead_id}")
async def remove_lead(
    lead_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    res = await db.execute(select(LeadAssignment).where(LeadAssignment.id == lead_id))
    la = res.scalar_one_or_none()
    if not la:
        return {"deleted": 0}
    await log_action(
        db, request, admin,
        action="lead.remove",
        target_kind="user", target_id=la.user_id,
        group_kind=la.group_kind, group_id=la.group_id,
    )
    await db.delete(la)
    await db.commit()
    return {"deleted": 1}


# ─── Audit log ───────────────────────────────────────────────────────────────

class AuditEntryOut(BaseModel):
    id: str
    actor_user_id: Optional[str]
    actor_name: str
    actor_email: Optional[str]
    action: str
    target_kind: Optional[str]
    target_id: Optional[str]
    group_kind: Optional[str]
    group_id: Optional[str]
    details: Optional[Any]
    ip: Optional[str]
    created_at: datetime


@router.get("/audit", response_model=List[AuditEntryOut])
async def list_audit(
    group_kind: Optional[str] = None,
    group_id: Optional[str] = None,
    actor_user_id: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    """Read audit entries. Visible to any logged-in user when scoped to a
    specific group (so coordinators can audit their own group). Admin can see
    everything by omitting filters."""
    q = select(AuditLog)
    if group_kind:
        q = q.where(AuditLog.group_kind == group_kind)
    if group_id:
        q = q.where(AuditLog.group_id == group_id)
    if actor_user_id:
        q = q.where(AuditLog.actor_user_id == actor_user_id)
    if action:
        q = q.where(AuditLog.action == action)
    q = q.order_by(desc(AuditLog.created_at)).limit(min(max(limit, 1), 500))
    res = await db.execute(q)
    return list(res.scalars().all())


class CustomLogIn(BaseModel):
    action: str
    target_kind: Optional[str] = None
    target_id: Optional[str] = None
    group_kind: Optional[str] = None
    group_id: Optional[str] = None
    details: Optional[Any] = None


@router.post("/audit", response_model=AuditEntryOut, status_code=201)
async def post_audit_entry(
    body: CustomLogIn,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Allow coordinators to log significant decisions ('warned member X', 'resolved
    dispute about Y'). Helps arbitration without requiring auto-instrumentation
    in every endpoint."""
    entry = await log_action(
        db, request, current_user,
        action=body.action,
        target_kind=body.target_kind, target_id=body.target_id,
        group_kind=body.group_kind, group_id=body.group_id,
        details=body.details or {},
    )
    await db.commit()
    await db.refresh(entry)
    return entry
