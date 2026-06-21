"""
Welcome Flow API — admin CRUD for onboarding email steps + dispatch tick.

Dispatch model:
- A daily/hourly tick scans active users by signup date and sends any active
  WelcomeStep whose day_offset matches (user.created_at + day_offset == today)
  and which hasn't already been sent (WelcomeStepSent dedupe).
- For now we expose a manual /run-tick endpoint admins can hit (or wire to a cron).
"""

from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.welcome_flow import WelcomeStep, WelcomeStepSent
from models.user import User
from services.email_service import send_email
from utils.dependencies import get_admin_user


router = APIRouter(prefix="/api/welcome-flow", tags=["Welcome Flow"])


class StepIn(BaseModel):
    day_offset: int = Field(ge=0, le=365)
    subject: str
    body_html: str
    is_active: bool = True
    sort_order: int = 0


class StepOut(StepIn):
    id: str
    created_at: datetime
    updated_at: datetime


@router.get("/steps", response_model=List[StepOut])
async def list_steps(db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(WelcomeStep).order_by(WelcomeStep.day_offset, WelcomeStep.sort_order))
    return res.scalars().all()


@router.post("/steps", response_model=StepOut, status_code=201)
async def create_step(body: StepIn, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    step = WelcomeStep(**body.model_dump())
    db.add(step)
    await db.commit()
    await db.refresh(step)
    return step


@router.put("/steps/{step_id}", response_model=StepOut)
async def update_step(step_id: str, body: StepIn, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(WelcomeStep).where(WelcomeStep.id == step_id))
    step = res.scalar_one_or_none()
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")
    for k, v in body.model_dump().items():
        setattr(step, k, v)
    await db.commit()
    await db.refresh(step)
    return step


@router.delete("/steps/{step_id}")
async def delete_step(step_id: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(WelcomeStep).where(WelcomeStep.id == step_id))
    step = res.scalar_one_or_none()
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")
    await db.delete(step)
    await db.commit()
    return {"deleted": 1}


def _render(template: str, user: User) -> str:
    return (
        template
        .replace("{name}", (user.full_name or user.email.split("@")[0] or "friend"))
        .replace("{email}", user.email or "")
    )


async def _do_run_tick(db: AsyncSession) -> dict:
    """Send any due welcome step that hasn't been sent yet. Idempotent."""
    res = await db.execute(select(WelcomeStep).where(WelcomeStep.is_active == True))
    steps = list(res.scalars().all())
    if not steps:
        return {"sent": 0, "skipped_no_steps": True}

    res2 = await db.execute(select(User))
    users = list(res2.scalars().all())

    sent_count = 0
    now = datetime.utcnow()
    for u in users:
        if not u.created_at or not u.email:
            continue
        age_days = (now - u.created_at).days
        for step in steps:
            if step.day_offset > age_days:
                continue
            res3 = await db.execute(select(WelcomeStepSent).where(
                and_(WelcomeStepSent.user_id == u.id, WelcomeStepSent.step_id == step.id)
            ))
            if res3.scalar_one_or_none():
                continue
            try:
                await send_email(
                    to=u.email,
                    subject=_render(step.subject, u),
                    html_body=_render(step.body_html, u),
                )
                db.add(WelcomeStepSent(user_id=u.id, step_id=step.id, success=True))
                sent_count += 1
            except Exception as e:
                db.add(WelcomeStepSent(user_id=u.id, step_id=step.id, success=False, error=str(e)[:500]))
    await db.commit()
    return {"sent": sent_count}


@router.post("/run-tick")
async def run_tick(db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    return await _do_run_tick(db)


@router.api_route("/run-tick-cron", methods=["GET", "POST"])
async def run_tick_cron(token: str = "", db: AsyncSession = Depends(get_db)):
    """No-auth, token-gated trigger for external schedulers.

    Wire this to cron-job.org / GitHub Actions / Render cron:

        GET https://letw-backend.onrender.com/api/welcome-flow/run-tick-cron?token=YOUR_SECRET

    Set the `CRON_SECRET` env var on Render to the same value. Both GET
    and POST work so cron-job.org's default GET also fires the run.
    """
    import os
    expected = os.environ.get("CRON_SECRET", "").strip()
    if not expected:
        raise HTTPException(503, "CRON_SECRET not configured on the server.")
    if (token or "").strip() != expected:
        raise HTTPException(403, "Invalid token.")
    return await _do_run_tick(db)


@router.get("/sent-log")
async def sent_log(limit: int = 100, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(
        select(WelcomeStepSent).order_by(WelcomeStepSent.sent_at.desc()).limit(limit)
    )
    rows = res.scalars().all()
    return [{
        "id": r.id, "user_id": r.user_id, "step_id": r.step_id,
        "sent_at": r.sent_at, "success": r.success, "error": r.error,
    } for r in rows]
