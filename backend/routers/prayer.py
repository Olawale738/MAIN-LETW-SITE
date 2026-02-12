"""
Prayer management API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update, delete
from sqlalchemy.orm import selectinload
from typing import List
from database import get_db
from models.prayer import (
    PrayerCategory, PrayerSchedule, PrayerStat, PrayerRequest,
    UserPrayer, PrayerPageSettings, PrayerRequestStatus
)
from models.user import User
from schemas.prayer import (
    PrayerCategoryCreate, PrayerCategoryUpdate, PrayerCategoryResponse,
    PrayerScheduleCreate, PrayerScheduleUpdate, PrayerScheduleResponse,
    PrayerStatCreate, PrayerStatUpdate, PrayerStatResponse,
    PrayerRequestCreate, PrayerRequestUpdate, PrayerRequestResponse,
    PrayerPageSettingsUpdate, PrayerPageSettingsResponse,
    PrayerPageData, AdminPrayerRequestResponse
)
from utils.dependencies import get_current_user, get_admin_user

router = APIRouter(prefix="/api/prayer", tags=["prayer"])


# ============================================================================
# USER ENDPOINTS
# ============================================================================

@router.get("/page-data", response_model=PrayerPageData)
async def get_prayer_page_data(db: AsyncSession = Depends(get_db)):
    """Get all data needed to render the prayer page"""

    # Get or create settings
    settings_result = await db.execute(select(PrayerPageSettings).limit(1))
    settings = settings_result.scalar_one_or_none()

    if not settings:
        # Create default settings
        settings = PrayerPageSettings()
        db.add(settings)
        await db.commit()
        await db.refresh(settings)

    # Get active categories
    categories_result = await db.execute(
        select(PrayerCategory)
        .where(PrayerCategory.is_active == True)
        .order_by(PrayerCategory.order_index)
    )
    categories = categories_result.scalars().all()

    # Get active schedules
    schedules_result = await db.execute(
        select(PrayerSchedule)
        .where(PrayerSchedule.is_active == True)
        .order_by(PrayerSchedule.order_index)
    )
    schedules = schedules_result.scalars().all()

    # Get active stats
    stats_result = await db.execute(
        select(PrayerStat)
        .where(PrayerStat.is_active == True)
        .order_by(PrayerStat.order_index)
    )
    stats = stats_result.scalars().all()

    return PrayerPageData(
        settings=settings,
        categories=list(categories),
        schedules=list(schedules),
        stats=list(stats)
    )


@router.get("/requests", response_model=List[PrayerRequestResponse])
async def get_prayer_requests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    status_filter: str = None
):
    """Get user's prayer requests"""
    query = select(PrayerRequest).where(PrayerRequest.user_id == current_user.id)

    if status_filter:
        query = query.where(PrayerRequest.status == status_filter)

    query = query.order_by(PrayerRequest.created_at.desc())

    result = await db.execute(query)
    requests = result.scalars().all()

    return list(requests)


@router.post("/requests", response_model=PrayerRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_prayer_request(
    request_data: PrayerRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new prayer request"""
    prayer_request = PrayerRequest(
        **request_data.model_dump(),
        user_id=current_user.id
    )

    db.add(prayer_request)
    await db.commit()
    await db.refresh(prayer_request)

    return prayer_request


@router.post("/requests/{request_id}/pray", status_code=status.HTTP_200_OK)
async def pray_for_request(
    request_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark that the current user prayed for a request"""

    # Check if request exists
    result = await db.execute(
        select(PrayerRequest).where(PrayerRequest.id == request_id)
    )
    prayer_request = result.scalar_one_or_none()

    if not prayer_request:
        raise HTTPException(status_code=404, detail="Prayer request not found")

    # Check if user already prayed for this request
    existing_prayer = await db.execute(
        select(UserPrayer).where(
            UserPrayer.user_id == current_user.id,
            UserPrayer.prayer_request_id == request_id
        )
    )

    if existing_prayer.scalar_one_or_none():
        return {"message": "You have already prayed for this request"}

    # Create prayer record
    user_prayer = UserPrayer(
        user_id=current_user.id,
        prayer_request_id=request_id
    )

    db.add(user_prayer)

    # Increment prayer count
    await db.execute(
        update(PrayerRequest)
        .where(PrayerRequest.id == request_id)
        .values(prayer_count=PrayerRequest.prayer_count + 1)
    )

    await db.commit()

    return {"message": "Prayer recorded successfully"}


# ============================================================================
# ADMIN ENDPOINTS - Prayer Categories
# ============================================================================

@router.get("/admin/categories", response_model=List[PrayerCategoryResponse])
async def get_all_categories(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Get all prayer categories (admin only)"""
    result = await db.execute(
        select(PrayerCategory).order_by(PrayerCategory.order_index)
    )
    categories = result.scalars().all()
    return list(categories)


@router.post("/admin/categories", response_model=PrayerCategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_data: PrayerCategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Create a new prayer category (admin only)"""
    category = PrayerCategory(**category_data.model_dump())
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category


@router.patch("/admin/categories/{category_id}", response_model=PrayerCategoryResponse)
async def update_category(
    category_id: str,
    category_data: PrayerCategoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Update a prayer category (admin only)"""
    result = await db.execute(
        select(PrayerCategory).where(PrayerCategory.id == category_id)
    )
    category = result.scalar_one_or_none()

    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    update_data = category_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(category, key, value)

    await db.commit()
    await db.refresh(category)
    return category


@router.delete("/admin/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Delete a prayer category (admin only)"""
    await db.execute(
        delete(PrayerCategory).where(PrayerCategory.id == category_id)
    )
    await db.commit()


# ============================================================================
# ADMIN ENDPOINTS - Prayer Schedules
# ============================================================================

@router.get("/admin/schedules", response_model=List[PrayerScheduleResponse])
async def get_all_schedules(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Get all prayer schedules (admin only)"""
    result = await db.execute(
        select(PrayerSchedule).order_by(PrayerSchedule.order_index)
    )
    schedules = result.scalars().all()
    return list(schedules)


@router.post("/admin/schedules", response_model=PrayerScheduleResponse, status_code=status.HTTP_201_CREATED)
async def create_schedule(
    schedule_data: PrayerScheduleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Create a new prayer schedule (admin only)"""
    schedule = PrayerSchedule(**schedule_data.model_dump())
    db.add(schedule)
    await db.commit()
    await db.refresh(schedule)
    return schedule


@router.patch("/admin/schedules/{schedule_id}", response_model=PrayerScheduleResponse)
async def update_schedule(
    schedule_id: str,
    schedule_data: PrayerScheduleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Update a prayer schedule (admin only)"""
    result = await db.execute(
        select(PrayerSchedule).where(PrayerSchedule.id == schedule_id)
    )
    schedule = result.scalar_one_or_none()

    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")

    update_data = schedule_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(schedule, key, value)

    await db.commit()
    await db.refresh(schedule)
    return schedule


@router.delete("/admin/schedules/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_schedule(
    schedule_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Delete a prayer schedule (admin only)"""
    await db.execute(
        delete(PrayerSchedule).where(PrayerSchedule.id == schedule_id)
    )
    await db.commit()



# ============================================================================
# ADMIN ENDPOINTS - Prayer Stats
# ============================================================================

@router.get("/admin/stats", response_model=List[PrayerStatResponse])
async def get_all_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Get all prayer stats (admin only)"""
    result = await db.execute(
        select(PrayerStat).order_by(PrayerStat.order_index)
    )
    stats = result.scalars().all()
    return list(stats)


@router.post("/admin/stats", response_model=PrayerStatResponse, status_code=status.HTTP_201_CREATED)
async def create_stat(
    stat_data: PrayerStatCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Create a new prayer stat (admin only)"""
    stat = PrayerStat(**stat_data.model_dump())
    db.add(stat)
    await db.commit()
    await db.refresh(stat)
    return stat


@router.patch("/admin/stats/{stat_id}", response_model=PrayerStatResponse)
async def update_stat(
    stat_id: str,
    stat_data: PrayerStatUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Update a prayer stat (admin only)"""
    result = await db.execute(
        select(PrayerStat).where(PrayerStat.id == stat_id)
    )
    stat = result.scalar_one_or_none()

    if not stat:
        raise HTTPException(status_code=404, detail="Stat not found")

    update_data = stat_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(stat, key, value)

    await db.commit()
    await db.refresh(stat)
    return stat


@router.delete("/admin/stats/{stat_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_stat(
    stat_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Delete a prayer stat (admin only)"""
    await db.execute(
        delete(PrayerStat).where(PrayerStat.id == stat_id)
    )
    await db.commit()


# ============================================================================
# ADMIN ENDPOINTS - Prayer Page Settings
# ============================================================================

@router.get("/admin/settings", response_model=PrayerPageSettingsResponse)
async def get_prayer_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Get prayer page settings (admin only)"""
    result = await db.execute(select(PrayerPageSettings).limit(1))
    settings = result.scalar_one_or_none()

    if not settings:
        # Create default settings
        settings = PrayerPageSettings()
        db.add(settings)
        await db.commit()
        await db.refresh(settings)

    return settings


@router.patch("/admin/settings", response_model=PrayerPageSettingsResponse)
async def update_prayer_settings(
    settings_data: PrayerPageSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Update prayer page settings (admin only)"""
    result = await db.execute(select(PrayerPageSettings).limit(1))
    settings = result.scalar_one_or_none()

    if not settings:
        # Create new settings
        settings = PrayerPageSettings(**settings_data.model_dump(exclude_unset=True))
        db.add(settings)
    else:
        # Update existing settings
        update_data = settings_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(settings, key, value)

    await db.commit()
    await db.refresh(settings)
    return settings


# ============================================================================
# ADMIN ENDPOINTS - Prayer Requests Management
# ============================================================================

@router.get("/admin/requests", response_model=List[AdminPrayerRequestResponse])
async def get_all_prayer_requests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
    status_filter: str = None
):
    """Get all prayer requests (admin only) - includes user details for non-anonymous requests"""
    query = select(PrayerRequest).options(selectinload(PrayerRequest.user))

    if status_filter:
        query = query.where(PrayerRequest.status == status_filter)

    query = query.order_by(PrayerRequest.created_at.desc())

    result = await db.execute(query)
    requests = result.scalars().all()

    # Strip user info from anonymous requests
    response = []
    for req in requests:
        req_dict = AdminPrayerRequestResponse.model_validate(req)
        if req.is_anonymous:
            req_dict.user = None
        response.append(req_dict)

    return response


@router.patch("/admin/requests/{request_id}", response_model=PrayerRequestResponse)
async def update_prayer_request_status(
    request_id: str,
    request_data: PrayerRequestUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Update a prayer request (admin only)"""
    result = await db.execute(
        select(PrayerRequest).where(PrayerRequest.id == request_id)
    )
    prayer_request = result.scalar_one_or_none()

    if not prayer_request:
        raise HTTPException(status_code=404, detail="Prayer request not found")

    update_data = request_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(prayer_request, key, value)

    await db.commit()
    await db.refresh(prayer_request)
    return prayer_request


