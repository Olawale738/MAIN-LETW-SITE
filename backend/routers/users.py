"""
User API endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from database import get_db
from models.user import User
from schemas.auth import UserResponse, UpdateServicesRequest, UpdateProfileRequest
from utils.dependencies import get_current_active_user

router = APIRouter()

AVAILABLE_SERVICES = [
    "Bible study",
    "Prayer meeting",
    "Evangelism",
    "Choir",
    "Skill Development",
    "Theology school",
    "Leadership Training",
    "Career Guidance"
]


@router.get("/services", response_model=list[str])
async def get_available_services():
    """
    Get list of available church services to join.
    """
    return AVAILABLE_SERVICES


@router.put("/me/services", response_model=UserResponse)
async def update_user_services(
    request: UpdateServicesRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update the current user's selected services.
    Validates that selected services are in the available list.
    """
    # specific validation to check if all services are valid
    invalid_services = [s for s in request.services if s not in AVAILABLE_SERVICES]
    if invalid_services:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid services selected: {', '.join(invalid_services)}"
        )
    
    current_user.services = list(request.services) # Create a new list copy to ensure change detection
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(current_user, "services")
    
    await db.commit()
    await db.refresh(current_user)
    
    return UserResponse.model_validate(current_user)

@router.get("/me", response_model=UserResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get current user profile (alternative to /auth/me).
    """
    return UserResponse.model_validate(current_user)


@router.put("/me", response_model=UserResponse)
async def update_my_profile(
    request: UpdateProfileRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update current user profile.
    """
    current_user.name = request.name.strip()
    
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(current_user, "name")
    
    await db.commit()
    await db.refresh(current_user)
    
    return UserResponse.model_validate(current_user)

