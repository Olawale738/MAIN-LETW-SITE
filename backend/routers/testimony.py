"""
Testimony management API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List, Optional
from database import get_db
from models.testimony import Testimony, TestimonyStatus
from models.user import User
from schemas.testimony import TestimonyCreate, TestimonyUpdate, TestimonyResponse
from utils.dependencies import get_admin_user

router = APIRouter(prefix="/api/testimonies", tags=["testimonies"])


# ============================================================================
# PUBLIC ENDPOINTS (no auth required)
# ============================================================================

@router.post("/", response_model=TestimonyResponse, status_code=status.HTTP_201_CREATED)
async def submit_testimony(
    testimony_data: TestimonyCreate,
    db: AsyncSession = Depends(get_db)
):
    """Submit a new testimony (public, no authentication required)"""
    testimony = Testimony(
        name=testimony_data.name,
        email=testimony_data.email,
        testimony_text=testimony_data.testimony_text,
        status=TestimonyStatus.PENDING
    )

    db.add(testimony)
    await db.commit()
    await db.refresh(testimony)

    return testimony


@router.get("/approved", response_model=List[TestimonyResponse])
async def get_approved_testimonies(
    db: AsyncSession = Depends(get_db)
):
    """Get all approved testimonies for the public page"""
    result = await db.execute(
        select(Testimony)
        .where(Testimony.status == TestimonyStatus.APPROVED)
        .order_by(Testimony.created_at.desc())
    )
    testimonies = result.scalars().all()
    return list(testimonies)


# ============================================================================
# ADMIN ENDPOINTS
# ============================================================================

@router.get("/admin", response_model=List[TestimonyResponse])
async def get_all_testimonies(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
    status_filter: Optional[str] = None
):
    """Get all testimonies with optional status filter (admin only)"""
    query = select(Testimony)

    if status_filter:
        query = query.where(Testimony.status == status_filter)

    query = query.order_by(Testimony.created_at.desc())

    result = await db.execute(query)
    testimonies = result.scalars().all()

    return list(testimonies)


@router.patch("/admin/{testimony_id}", response_model=TestimonyResponse)
async def update_testimony_status(
    testimony_id: str,
    testimony_data: TestimonyUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Update a testimony status - approve or reject (admin only)"""
    result = await db.execute(
        select(Testimony).where(Testimony.id == testimony_id)
    )
    testimony = result.scalar_one_or_none()

    if not testimony:
        raise HTTPException(status_code=404, detail="Testimony not found")

    update_data = testimony_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(testimony, key, value)

    await db.commit()
    await db.refresh(testimony)
    return testimony


@router.delete("/admin/{testimony_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_testimony(
    testimony_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Delete a testimony (admin only)"""
    result = await db.execute(
        select(Testimony).where(Testimony.id == testimony_id)
    )
    testimony = result.scalar_one_or_none()

    if not testimony:
        raise HTTPException(status_code=404, detail="Testimony not found")

    await db.execute(
        delete(Testimony).where(Testimony.id == testimony_id)
    )
    await db.commit()
