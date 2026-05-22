"""
Public prayer wall - lists prayer requests that members have marked
as public, and lets other members tap "I prayed for this" to increment
the prayer count and record their participation.
"""

from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from database import get_db
from models.user import User
from models.prayer import PrayerRequest, UserPrayer, PrayerRequestStatus
from schemas.profile import (
    PrayerWallResponse, PrayerWallItem, PrayerWallCreate,
)
from schemas.auth import MessageResponse
from utils.dependencies import get_current_active_user


router = APIRouter(prefix="/api/prayer-wall", tags=["Prayer Wall"])


def _serialize(p: PrayerRequest, viewer_id: str, has_prayed: bool) -> PrayerWallItem:
    if p.is_anonymous:
        author = "Anonymous"
    elif p.user is not None:
        author = p.user.name
    else:
        author = "Member"
    return PrayerWallItem(
        id=p.id,
        title=p.title,
        description=p.description,
        category=p.category,
        author_name=author,
        is_anonymous=p.is_anonymous,
        prayer_count=p.prayer_count,
        has_prayed=has_prayed,
        status=p.status.value if hasattr(p.status, "value") else str(p.status),
        created_at=p.created_at,
    )


@router.get("", response_model=PrayerWallResponse)
async def list_wall(
    limit: int = 20,
    offset: int = 0,
    category: str | None = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    q = (
        select(PrayerRequest)
        .where(PrayerRequest.is_public.is_(True))
        .where(PrayerRequest.status != PrayerRequestStatus.ARCHIVED)
        .options(selectinload(PrayerRequest.user))
        .order_by(PrayerRequest.created_at.desc())
    )
    if category:
        q = q.where(PrayerRequest.category == category)
    q = q.limit(limit).offset(offset)
    requests = (await db.execute(q)).scalars().all()

    # Which of these has the viewer already prayed for?
    request_ids = [r.id for r in requests]
    prayed_ids: set[str] = set()
    if request_ids:
        res = await db.execute(
            select(UserPrayer.prayer_request_id).where(
                UserPrayer.user_id == current_user.id,
                UserPrayer.prayer_request_id.in_(request_ids),
            )
        )
        prayed_ids = {row[0] for row in res.all()}

    total = (await db.execute(
        select(func.count(PrayerRequest.id))
        .where(PrayerRequest.is_public.is_(True))
        .where(PrayerRequest.status != PrayerRequestStatus.ARCHIVED)
    )).scalar() or 0

    items = [_serialize(r, current_user.id, r.id in prayed_ids) for r in requests]
    return PrayerWallResponse(requests=items, total=int(total))


@router.post("", response_model=PrayerWallItem, status_code=201)
async def create_request(
    payload: PrayerWallCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    pr = PrayerRequest(
        user_id=current_user.id,
        title=payload.title.strip(),
        description=payload.description.strip(),
        category=payload.category,
        is_anonymous=payload.is_anonymous,
        is_public=True,
    )
    db.add(pr)
    await db.commit()
    # Reload with user for serialization
    res = await db.execute(
        select(PrayerRequest)
        .where(PrayerRequest.id == pr.id)
        .options(selectinload(PrayerRequest.user))
    )
    pr = res.scalar_one()
    return _serialize(pr, current_user.id, has_prayed=False)


@router.post("/{request_id}/pray", response_model=PrayerWallItem)
async def pray_for(
    request_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(PrayerRequest)
        .where(PrayerRequest.id == request_id)
        .options(selectinload(PrayerRequest.user))
    )
    pr = res.scalar_one_or_none()
    if pr is None:
        raise HTTPException(status_code=404, detail="Prayer request not found")
    if not pr.is_public:
        raise HTTPException(status_code=403, detail="Not on the public wall")

    # Toggle: if user has prayed, do nothing (idempotent)
    res = await db.execute(
        select(UserPrayer).where(
            UserPrayer.user_id == current_user.id,
            UserPrayer.prayer_request_id == pr.id,
        )
    )
    existing = res.scalar_one_or_none()
    if existing is None:
        db.add(UserPrayer(user_id=current_user.id, prayer_request_id=pr.id))
        pr.prayer_count = (pr.prayer_count or 0) + 1
        await db.commit()
        await db.refresh(pr)

    return _serialize(pr, current_user.id, has_prayed=True)


@router.delete("/{request_id}", response_model=MessageResponse)
async def delete_my_request(
    request_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(PrayerRequest).where(PrayerRequest.id == request_id)
    )
    pr = res.scalar_one_or_none()
    if pr is None:
        raise HTTPException(status_code=404, detail="Not found")
    if pr.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your request")
    await db.delete(pr)
    await db.commit()
    return MessageResponse(message="Deleted")
