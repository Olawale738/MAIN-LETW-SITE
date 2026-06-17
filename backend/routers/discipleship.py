"""
Discipleship Pathway API — public stage list + per-user progress.
"""

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.discipleship import DiscipleshipStage, DiscipleshipProgress
from models.user import User
from utils.dependencies import get_admin_user, get_current_active_user


router = APIRouter(prefix="/api/discipleship", tags=["Discipleship"])


class StageIn(BaseModel):
    key: str
    title: str
    description: str = ""
    icon: str = "Sparkles"
    cta_label: Optional[str] = None
    cta_href: Optional[str] = None
    sort_order: int = 0
    is_active: bool = True


class StageOut(StageIn):
    id: str


@router.get("/stages", response_model=List[StageOut])
async def list_stages(db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(DiscipleshipStage).where(DiscipleshipStage.is_active == True).order_by(DiscipleshipStage.sort_order)
    )
    return res.scalars().all()


@router.get("/admin/stages", response_model=List[StageOut])
async def admin_list_stages(db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(DiscipleshipStage).order_by(DiscipleshipStage.sort_order))
    return res.scalars().all()


@router.post("/admin/stages", response_model=StageOut, status_code=201)
async def create_stage(body: StageIn, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    s = DiscipleshipStage(**body.model_dump())
    db.add(s)
    await db.commit()
    await db.refresh(s)
    return s


@router.put("/admin/stages/{stage_id}", response_model=StageOut)
async def update_stage(stage_id: str, body: StageIn, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(DiscipleshipStage).where(DiscipleshipStage.id == stage_id))
    s = res.scalar_one_or_none()
    if not s:
        raise HTTPException(status_code=404, detail="Stage not found")
    for k, v in body.model_dump().items():
        setattr(s, k, v)
    await db.commit()
    await db.refresh(s)
    return s


@router.delete("/admin/stages/{stage_id}")
async def delete_stage(stage_id: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(DiscipleshipStage).where(DiscipleshipStage.id == stage_id))
    s = res.scalar_one_or_none()
    if not s:
        raise HTTPException(status_code=404, detail="Stage not found")
    await db.delete(s)
    await db.commit()
    return {"deleted": 1}


@router.get("/progress")
async def my_progress(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    res = await db.execute(select(DiscipleshipProgress).where(DiscipleshipProgress.user_id == user.id))
    rows = res.scalars().all()
    return [{"stage_id": r.stage_id, "completed_at": r.completed_at, "note": r.note} for r in rows]


class CompleteIn(BaseModel):
    stage_id: str
    note: Optional[str] = None


@router.post("/progress")
async def mark_complete(
    body: CompleteIn,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    res = await db.execute(select(DiscipleshipProgress).where(
        DiscipleshipProgress.user_id == user.id, DiscipleshipProgress.stage_id == body.stage_id
    ))
    existing = res.scalar_one_or_none()
    if existing:
        return {"status": "already_completed", "completed_at": existing.completed_at}
    db.add(DiscipleshipProgress(user_id=user.id, stage_id=body.stage_id, note=body.note))
    await db.commit()
    return {"status": "completed"}


@router.delete("/progress/{stage_id}")
async def unmark_complete(
    stage_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    res = await db.execute(select(DiscipleshipProgress).where(
        DiscipleshipProgress.user_id == user.id, DiscipleshipProgress.stage_id == stage_id
    ))
    p = res.scalar_one_or_none()
    if not p:
        return {"status": "not_found"}
    await db.delete(p)
    await db.commit()
    return {"status": "removed"}
