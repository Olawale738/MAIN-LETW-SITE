"""
Kids Ministry registration API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from typing import List, Optional

from database import get_db
from models.kids_ministry import KidsMinistryRegistration, KidsRegistrationStatus
from models.user import User
from schemas.kids_ministry import (
    KidsMinistryRegistrationCreate,
    KidsMinistryRegistrationResponse,
    KidsMinistryRegistrationUpdate,
)
from utils.dependencies import get_admin_user

router = APIRouter(prefix="/api/kids-ministry", tags=["kids-ministry"])


# ============================================================================
# PUBLIC ENDPOINTS
# ============================================================================

@router.post("/register", response_model=KidsMinistryRegistrationResponse)
async def register_child(
    data: KidsMinistryRegistrationCreate,
    db: AsyncSession = Depends(get_db),
):
    """Register a child for kids ministry (public, no auth required)"""
    registration = KidsMinistryRegistration(
        child_name=data.child_name,
        child_age=data.child_age,
        age_group=data.age_group,
        parent_name=data.parent_name,
        parent_email=data.parent_email,
        parent_phone=data.parent_phone,
        special_needs=data.special_needs,
    )
    db.add(registration)
    await db.commit()
    await db.refresh(registration)
    return registration


# ============================================================================
# ADMIN ENDPOINTS
# ============================================================================

@router.get("/registrations", response_model=List[KidsMinistryRegistrationResponse])
async def get_all_registrations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
    status_filter: Optional[str] = None,
):
    """Get all kids ministry registrations (admin only)"""
    query = select(KidsMinistryRegistration).order_by(KidsMinistryRegistration.created_at.desc())
    if status_filter:
        query = query.where(KidsMinistryRegistration.status == status_filter)
    result = await db.execute(query)
    return result.scalars().all()


@router.put("/registrations/{registration_id}", response_model=KidsMinistryRegistrationResponse)
async def update_registration(
    registration_id: str,
    data: KidsMinistryRegistrationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    """Update a registration status (admin only)"""
    result = await db.execute(
        select(KidsMinistryRegistration).where(KidsMinistryRegistration.id == registration_id)
    )
    registration = result.scalar_one_or_none()
    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")

    if data.status is not None:
        registration.status = data.status

    await db.commit()
    await db.refresh(registration)
    return registration


@router.delete("/registrations/{registration_id}")
async def delete_registration(
    registration_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    """Delete a registration (admin only)"""
    result = await db.execute(
        select(KidsMinistryRegistration).where(KidsMinistryRegistration.id == registration_id)
    )
    registration = result.scalar_one_or_none()
    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")

    await db.delete(registration)
    await db.commit()
    return {"message": "Registration deleted", "success": True}
