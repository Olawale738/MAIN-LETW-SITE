"""
Volunteer rota API — admin schedules who serves which Sunday; assigned
volunteers get a best-effort notification email.
"""

from datetime import date, datetime
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database import get_db
from models.volunteer_rota import RotaTeam, RotaAssignment
from models.user import User
from utils.dependencies import get_admin_user

router = APIRouter(prefix="/api/rota", tags=["Volunteer Rota"])


def _team(t: RotaTeam) -> dict[str, Any]:
    return {"id": t.id, "name": t.name, "description": t.description,
            "is_active": t.is_active, "sort_order": t.sort_order}


def _assignment(a: RotaAssignment) -> dict[str, Any]:
    return {"id": a.id, "team_id": a.team_id, "service_date": a.service_date,
            "member_name": a.member_name, "member_email": a.member_email,
            "role_note": a.role_note, "status": a.status, "created_at": a.created_at}


# ── Teams (admin CRUD; public read for future member-facing views) ─────────

@router.get("/teams")
async def list_teams(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(RotaTeam).where(RotaTeam.is_active == True)  # noqa: E712
                           .order_by(RotaTeam.sort_order, RotaTeam.name))
    return [_team(t) for t in res.scalars().all()]


class TeamIn(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0


@router.post("/teams", status_code=201)
async def create_team(body: TeamIn, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    t = RotaTeam(**body.model_dump())
    db.add(t)
    await db.commit()
    await db.refresh(t)
    return _team(t)


@router.put("/teams/{team_id}")
async def update_team(team_id: str, body: TeamIn, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    t = (await db.execute(select(RotaTeam).where(RotaTeam.id == team_id))).scalar_one_or_none()
    if not t:
        raise HTTPException(404, "Team not found")
    for k, v in body.model_dump().items():
        setattr(t, k, v)
    await db.commit()
    await db.refresh(t)
    return _team(t)


@router.delete("/teams/{team_id}")
async def delete_team(team_id: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    t = (await db.execute(select(RotaTeam).where(RotaTeam.id == team_id))).scalar_one_or_none()
    if not t:
        return {"deleted": 0}
    from sqlalchemy import delete as sql_delete
    await db.execute(sql_delete(RotaAssignment).where(RotaAssignment.team_id == team_id))
    await db.delete(t)
    await db.commit()
    return {"deleted": 1}


# ── Assignments ─────────────────────────────────────────────────────────────

@router.get("/assignments")
async def list_assignments(
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    team_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    q = select(RotaAssignment).order_by(RotaAssignment.service_date, RotaAssignment.member_name)
    if from_date:
        q = q.where(RotaAssignment.service_date >= from_date)
    if to_date:
        q = q.where(RotaAssignment.service_date <= to_date)
    if team_id:
        q = q.where(RotaAssignment.team_id == team_id)
    res = await db.execute(q.limit(1000))
    return [_assignment(a) for a in res.scalars().all()]


class AssignmentIn(BaseModel):
    team_id: str
    service_date: date
    member_name: str
    member_email: Optional[EmailStr] = None
    role_note: Optional[str] = None


@router.post("/assignments", status_code=201)
async def create_assignment(body: AssignmentIn, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    team = (await db.execute(select(RotaTeam).where(RotaTeam.id == body.team_id))).scalar_one_or_none()
    if not team:
        raise HTTPException(404, "Team not found")
    a = RotaAssignment(**body.model_dump())
    db.add(a)
    await db.commit()
    await db.refresh(a)

    # Best-effort heads-up to the volunteer.
    if a.member_email:
        try:
            from services.email_service import send_email, _render_admin_template_body
            date_str = a.service_date.strftime("%A %d %B %Y")
            role_line = f"Role: {a.role_note}\n" if a.role_note else ""
            body_txt = (
                f"Hi {a.member_name},\n\n"
                f"You are scheduled to serve with the {team.name} team.\n\n"
                f"Service date: {date_str}\n{role_line}\n"
                f"If you cannot make it, please reply to this email as early as "
                f"possible so a coordinator can arrange cover.\n\n"
                f"Thank you for serving — it matters.\n"
                f"Light Encounter Tabernacle Worldwide"
            )
            await send_email(a.member_email, f"You're serving on {date_str} — {team.name}",
                             _render_admin_template_body(body_txt, name=a.member_name))
        except Exception as e:
            print(f"[rota] volunteer email failed: {type(e).__name__}: {e}", flush=True)

    return _assignment(a)


class AssignmentUpdate(BaseModel):
    status: Optional[str] = None       # assigned | confirmed | declined
    role_note: Optional[str] = None
    member_name: Optional[str] = None
    member_email: Optional[EmailStr] = None
    service_date: Optional[date] = None


@router.put("/assignments/{aid}")
async def update_assignment(aid: str, body: AssignmentUpdate, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    a = (await db.execute(select(RotaAssignment).where(RotaAssignment.id == aid))).scalar_one_or_none()
    if not a:
        raise HTTPException(404, "Assignment not found")
    if body.status and body.status not in {"assigned", "confirmed", "declined"}:
        raise HTTPException(400, "Bad status")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(a, k, v)
    await db.commit()
    await db.refresh(a)
    return _assignment(a)


@router.delete("/assignments/{aid}")
async def delete_assignment(aid: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    a = (await db.execute(select(RotaAssignment).where(RotaAssignment.id == aid))).scalar_one_or_none()
    if not a:
        return {"deleted": 0}
    await db.delete(a)
    await db.commit()
    return {"deleted": 1}
