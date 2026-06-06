"""
Bible Study API endpoints for reading plans and progress tracking
"""
import os
import uuid
from typing import List, Optional
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from database import get_db
from models.bible_study import (
    BibleReadingPlan, DailyReading, UserReadingProgress,
    UserDailyReading, BibleStudyResource, BibleStudyPageSettings,
    ReadingStatus, BibleStudyGroupMember, BibleStudyGroupMessage,
    BibleStudyGroupModerator
)
from schemas.bible_study import (
    BibleReadingPlanCreate, BibleReadingPlanUpdate, BibleReadingPlanResponse,
    DailyReadingCreate, DailyReadingUpdate, DailyReadingResponse,
    UserReadingProgressCreate, UserReadingProgressUpdate, UserReadingProgressResponse,
    UserDailyReadingCreate, UserDailyReadingUpdate, UserDailyReadingResponse,
    BibleStudyResourceCreate, BibleStudyResourceUpdate, BibleStudyResourceResponse,
    BibleStudyPageSettingsUpdate, BibleStudyPageSettingsResponse,
    BibleStudyPageData, BibleReadingPlanWithReadings, UserProgressWithDetails
)
from utils.dependencies import get_current_user, get_admin_user
from models.user import User

router = APIRouter(prefix="/api/bible-study", tags=["bible-study"])


# ============================================================================
# USER ENDPOINTS
# ============================================================================

@router.get("/page-data", response_model=BibleStudyPageData)
async def get_bible_study_page_data(db: AsyncSession = Depends(get_db)):
    """Get all data for the Bible Study page"""
    # Get or create settings
    result = await db.execute(select(BibleStudyPageSettings))
    settings = result.scalar_one_or_none()
    
    if not settings:
        settings = BibleStudyPageSettings()
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
    
    # Get featured plans
    featured_result = await db.execute(
        select(BibleReadingPlan)
        .where(BibleReadingPlan.is_featured == True, BibleReadingPlan.is_active == True)
        .order_by(BibleReadingPlan.order_index)
    )
    featured_plans = featured_result.scalars().all()
    
    # Get all active plans
    plans_result = await db.execute(
        select(BibleReadingPlan)
        .where(BibleReadingPlan.is_active == True)
        .order_by(BibleReadingPlan.order_index)
    )
    all_plans = plans_result.scalars().all()
    
    # Get featured resources
    resources_result = await db.execute(
        select(BibleStudyResource)
        .where(BibleStudyResource.is_featured == True, BibleStudyResource.is_active == True)
        .order_by(BibleStudyResource.order_index)
    )
    featured_resources = resources_result.scalars().all()
    
    return BibleStudyPageData(
        settings=settings,
        featured_plans=featured_plans,
        all_plans=all_plans,
        featured_resources=featured_resources
    )


@router.get("/plans/{plan_id}", response_model=BibleReadingPlanWithReadings)
async def get_plan_with_readings(
    plan_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get a reading plan with all its daily readings"""
    result = await db.execute(
        select(BibleReadingPlan)
        .options(selectinload(BibleReadingPlan.readings))
        .where(BibleReadingPlan.id == plan_id)
    )
    plan = result.scalar_one_or_none()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Reading plan not found")
    
    return plan


@router.post("/progress/start", response_model=UserReadingProgressResponse)
async def start_reading_plan(
    data: UserReadingProgressCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Start a new reading plan"""
    # Check if plan exists
    plan_result = await db.execute(select(BibleReadingPlan).where(BibleReadingPlan.id == data.plan_id))
    plan = plan_result.scalar_one_or_none()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Reading plan not found")
    
    # Check if user already has active progress for this plan
    existing_result = await db.execute(
        select(UserReadingProgress)
        .where(
            UserReadingProgress.user_id == current_user.id,
            UserReadingProgress.plan_id == data.plan_id,
            UserReadingProgress.is_active == True
        )
    )
    existing = existing_result.scalar_one_or_none()
    
    if existing:
        raise HTTPException(status_code=400, detail="You already have an active progress for this plan")
    
    # Create progress
    progress = UserReadingProgress(
        user_id=current_user.id,
        plan_id=data.plan_id,
        start_date=data.start_date
    )
    db.add(progress)
    await db.commit()
    await db.refresh(progress)
    
    # Create user daily reading entries for all readings in the plan
    readings_result = await db.execute(
        select(DailyReading).where(DailyReading.plan_id == data.plan_id)
    )
    readings = readings_result.scalars().all()
    
    for reading in readings:
        user_reading = UserDailyReading(
            progress_id=progress.id,
            daily_reading_id=reading.id,
            status=ReadingStatus.NOT_STARTED
        )
        db.add(user_reading)
    
    await db.commit()
    return progress


@router.get("/progress/my-progress", response_model=List[UserProgressWithDetails])
async def get_my_progress(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all reading progress for current user"""
    result = await db.execute(
        select(UserReadingProgress)
        .options(
            selectinload(UserReadingProgress.plan),
            selectinload(UserReadingProgress.daily_readings)
        )
        .where(UserReadingProgress.user_id == current_user.id)
        .order_by(UserReadingProgress.created_at.desc())
    )
    return result.scalars().all()


@router.put("/progress/{progress_id}/reading/{reading_id}", response_model=UserDailyReadingResponse)
async def update_daily_reading(
    progress_id: str,
    reading_id: str,
    data: UserDailyReadingUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a daily reading as completed or update notes"""
    # Verify progress belongs to user
    progress_result = await db.execute(
        select(UserReadingProgress)
        .where(
            UserReadingProgress.id == progress_id,
            UserReadingProgress.user_id == current_user.id
        )
    )
    progress = progress_result.scalar_one_or_none()

    if not progress:
        raise HTTPException(status_code=404, detail="Progress not found")

    # Get user daily reading
    reading_result = await db.execute(
        select(UserDailyReading)
        .where(
            UserDailyReading.progress_id == progress_id,
            UserDailyReading.daily_reading_id == reading_id
        )
    )
    user_reading = reading_result.scalar_one_or_none()

    if not user_reading:
        raise HTTPException(status_code=404, detail="Reading not found")

    # Update reading
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(user_reading, key, value)

    # If marking as completed, set completed_at
    if data.status == ReadingStatus.COMPLETED and not user_reading.completed_at:
        user_reading.completed_at = datetime.utcnow()

        # Update progress completed_days count
        completed_count = await db.execute(
            select(func.count(UserDailyReading.id))
            .where(
                UserDailyReading.progress_id == progress_id,
                UserDailyReading.status == ReadingStatus.COMPLETED
            )
        )
        progress.completed_days = completed_count.scalar()

    await db.commit()
    await db.refresh(user_reading)
    return user_reading


@router.get("/resources", response_model=List[BibleStudyResourceResponse])
async def get_resources(
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get all Bible study resources"""
    query = select(BibleStudyResource).where(BibleStudyResource.is_active == True)

    if category:
        query = query.where(BibleStudyResource.category == category)

    query = query.order_by(BibleStudyResource.order_index)
    result = await db.execute(query)
    return result.scalars().all()


# ============================================================================
# ADMIN ENDPOINTS - Reading Plans
# ============================================================================

@router.get("/admin/plans", response_model=List[BibleReadingPlanResponse])
async def get_all_plans_admin(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Get all reading plans (admin)"""
    result = await db.execute(
        select(BibleReadingPlan).order_by(BibleReadingPlan.order_index)
    )
    return result.scalars().all()


@router.post("/admin/plans", response_model=BibleReadingPlanResponse)
async def create_plan(
    plan_data: BibleReadingPlanCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Create a new reading plan"""
    plan = BibleReadingPlan(**plan_data.model_dump())
    db.add(plan)
    await db.commit()
    await db.refresh(plan)
    return plan


@router.put("/admin/plans/{plan_id}", response_model=BibleReadingPlanResponse)
async def update_plan(
    plan_id: str,
    plan_data: BibleReadingPlanUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Update a reading plan"""
    result = await db.execute(select(BibleReadingPlan).where(BibleReadingPlan.id == plan_id))
    plan = result.scalar_one_or_none()

    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    for key, value in plan_data.model_dump(exclude_unset=True).items():
        setattr(plan, key, value)

    await db.commit()
    await db.refresh(plan)
    return plan


@router.delete("/admin/plans/{plan_id}")
async def delete_plan(
    plan_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Delete a reading plan"""
    result = await db.execute(select(BibleReadingPlan).where(BibleReadingPlan.id == plan_id))
    plan = result.scalar_one_or_none()

    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    await db.delete(plan)
    await db.commit()
    return {"message": "Plan deleted successfully"}


# ============================================================================
# ADMIN ENDPOINTS - Daily Readings
# ============================================================================

@router.get("/admin/plans/{plan_id}/readings", response_model=List[DailyReadingResponse])
async def get_plan_readings(
    plan_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Get all readings for a plan"""
    result = await db.execute(
        select(DailyReading)
        .where(DailyReading.plan_id == plan_id)
        .order_by(DailyReading.day_number)
    )
    return result.scalars().all()


@router.post("/admin/readings", response_model=DailyReadingResponse)
async def create_reading(
    reading_data: DailyReadingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Create a new daily reading"""
    # Verify plan exists
    plan_result = await db.execute(select(BibleReadingPlan).where(BibleReadingPlan.id == reading_data.plan_id))
    if not plan_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Plan not found")

    reading = DailyReading(**reading_data.model_dump())
    db.add(reading)
    await db.commit()
    await db.refresh(reading)
    return reading


@router.put("/admin/readings/{reading_id}", response_model=DailyReadingResponse)
async def update_reading(
    reading_id: str,
    reading_data: DailyReadingUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Update a daily reading"""
    result = await db.execute(select(DailyReading).where(DailyReading.id == reading_id))
    reading = result.scalar_one_or_none()

    if not reading:
        raise HTTPException(status_code=404, detail="Reading not found")

    for key, value in reading_data.model_dump(exclude_unset=True).items():
        setattr(reading, key, value)

    await db.commit()
    await db.refresh(reading)
    return reading


@router.delete("/admin/readings/{reading_id}")
async def delete_reading(
    reading_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Delete a daily reading"""
    result = await db.execute(select(DailyReading).where(DailyReading.id == reading_id))
    reading = result.scalar_one_or_none()

    if not reading:
        raise HTTPException(status_code=404, detail="Reading not found")

    await db.delete(reading)
    await db.commit()
    return {"message": "Reading deleted successfully"}


# ============================================================================
# ADMIN ENDPOINTS - Resources
# ============================================================================

@router.get("/admin/resources", response_model=List[BibleStudyResourceResponse])
async def get_all_resources_admin(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Get all resources (admin)"""
    result = await db.execute(
        select(BibleStudyResource).order_by(BibleStudyResource.order_index)
    )
    return result.scalars().all()


@router.post("/admin/resources", response_model=BibleStudyResourceResponse)
async def create_resource(
    resource_data: BibleStudyResourceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Create a new resource"""
    resource = BibleStudyResource(**resource_data.model_dump())
    db.add(resource)
    await db.commit()
    await db.refresh(resource)
    return resource


@router.put("/admin/resources/{resource_id}", response_model=BibleStudyResourceResponse)
async def update_resource(
    resource_id: str,
    resource_data: BibleStudyResourceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Update a resource"""
    result = await db.execute(select(BibleStudyResource).where(BibleStudyResource.id == resource_id))
    resource = result.scalar_one_or_none()

    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    for key, value in resource_data.model_dump(exclude_unset=True).items():
        setattr(resource, key, value)

    await db.commit()
    await db.refresh(resource)
    return resource


@router.delete("/admin/resources/{resource_id}")
async def delete_resource(
    resource_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Delete a resource"""
    result = await db.execute(select(BibleStudyResource).where(BibleStudyResource.id == resource_id))
    resource = result.scalar_one_or_none()

    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    await db.delete(resource)
    await db.commit()
    return {"message": "Resource deleted successfully"}


# ============================================================================
# ADMIN ENDPOINTS - Page Settings
# ============================================================================

@router.get("/admin/settings", response_model=BibleStudyPageSettingsResponse)
async def get_page_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Get Bible Study page settings"""
    result = await db.execute(select(BibleStudyPageSettings))
    settings = result.scalar_one_or_none()

    if not settings:
        settings = BibleStudyPageSettings()
        db.add(settings)
        await db.commit()
        await db.refresh(settings)

    return settings


@router.put("/admin/settings", response_model=BibleStudyPageSettingsResponse)
async def update_page_settings(
    settings_data: BibleStudyPageSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Update Bible Study page settings"""
    result = await db.execute(select(BibleStudyPageSettings))
    settings = result.scalar_one_or_none()

    if not settings:
        settings = BibleStudyPageSettings()
        db.add(settings)

    for key, value in settings_data.model_dump(exclude_unset=True).items():
        setattr(settings, key, value)

    await db.commit()
    await db.refresh(settings)
    return settings


# ============================================================================
# ADMIN — Library Resource File Upload
# ============================================================================

RESOURCE_UPLOAD_DIR = "uploads/bible-resources"
ALLOWED_RESOURCE_TYPES = {
    "application/pdf": ("pdf", ".pdf"),
    "audio/mpeg": ("audio", ".mp3"),
    "audio/mp4": ("audio", ".m4a"),
    "audio/ogg": ("audio", ".ogg"),
    "audio/wav": ("audio", ".wav"),
    "video/mp4": ("video", ".mp4"),
    "video/webm": ("video", ".webm"),
}


@router.post("/admin/upload-resource")
async def upload_resource_file(
    file: UploadFile = File(...),
    title: str = Form(...),
    meta: str = Form(""),        # "24 pages" or "38 min"
    current_user: User = Depends(get_admin_user),
):
    """
    Upload a PDF, audio, or video file as a bible study library resource.
    Returns the URL to store in library_resources.
    """
    content_type = file.content_type or ""
    if content_type not in ALLOWED_RESOURCE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{content_type}'. Allowed: PDF, MP3, M4A, WAV, OGG, MP4, WebM."
        )
    resource_type, ext = ALLOWED_RESOURCE_TYPES[content_type]

    os.makedirs(RESOURCE_UPLOAD_DIR, exist_ok=True)
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(RESOURCE_UPLOAD_DIR, filename)

    data = await file.read()
    with open(filepath, "wb") as f:
        f.write(data)

    # Build public URL (served via /uploads static mount)
    url = f"/uploads/bible-resources/{filename}"

    return {
        "id": uuid.uuid4().hex,
        "title": title.strip(),
        "type": resource_type,
        "url": url,
        "meta": meta.strip(),
        "filename": filename,
    }


@router.delete("/admin/resource-file/{filename}")
async def delete_resource_file(
    filename: str,
    current_user: User = Depends(get_admin_user),
):
    """Delete an uploaded resource file from disk."""
    # Safety: only allow simple filenames (no path traversal)
    if "/" in filename or "\\" in filename or ".." in filename:
        raise HTTPException(status_code=400, detail="Invalid filename.")
    filepath = os.path.join(RESOURCE_UPLOAD_DIR, filename)
    if os.path.exists(filepath):
        os.remove(filepath)
    return {"message": "File deleted."}


# ============================================================================
# USER ENDPOINTS - 54-Week Reading Plan Progress
# ============================================================================

from models.bible_study import UserBibleWeekProgress  # noqa: E402


@router.get("/weekly-progress")
async def get_weekly_progress(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get the current user's progress for the hardcoded 54-week reading plan.
    Returns: { "registered": bool, "completed_weeks": { "1": true, "3": true, ... } }
    """
    result = await db.execute(
        select(UserBibleWeekProgress)
        .where(UserBibleWeekProgress.user_id == current_user.id)
    )
    rows = result.scalars().all()

    completed_weeks: dict = {}
    registered = False
    for row in rows:
        if row.registered:
            registered = True
        if row.week_number > 0:
            completed_weeks[str(row.week_number)] = row.completed

    return {"registered": registered, "completed_weeks": completed_weeks}


@router.post("/weekly-progress/register")
async def register_for_reading_plan(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Register the user for the 54-week reading plan.
    Uses week_number = 0 as a registration sentinel row.
    """
    existing_result = await db.execute(
        select(UserBibleWeekProgress)
        .where(
            UserBibleWeekProgress.user_id == current_user.id,
            UserBibleWeekProgress.week_number == 0
        )
    )
    existing = existing_result.scalar_one_or_none()

    if not existing:
        sentinel = UserBibleWeekProgress(
            user_id=current_user.id,
            week_number=0,
            completed=False,
            registered=True
        )
        db.add(sentinel)
        await db.commit()

    return {"registered": True, "message": "Registered for the 54-week reading plan"}


@router.put("/weekly-progress/week/{week_number}")
async def toggle_week_completion(
    week_number: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Toggle the completion status for a specific week (1-54).
    First touch = mark complete. Second touch = mark incomplete.
    """
    if week_number < 1 or week_number > 54:
        raise HTTPException(status_code=400, detail="Week number must be between 1 and 54")

    existing_result = await db.execute(
        select(UserBibleWeekProgress)
        .where(
            UserBibleWeekProgress.user_id == current_user.id,
            UserBibleWeekProgress.week_number == week_number
        )
    )
    existing = existing_result.scalar_one_or_none()

    if existing:
        existing.completed = not existing.completed
        existing.completed_at = datetime.utcnow() if existing.completed else None
    else:
        existing = UserBibleWeekProgress(
            user_id=current_user.id,
            week_number=week_number,
            completed=True,
            completed_at=datetime.utcnow(),
            registered=True
        )
        db.add(existing)

    await db.commit()
    await db.refresh(existing)

    return {"week_number": week_number, "completed": existing.completed}


# ============================================================================
# ADMIN ENDPOINTS - Week Reflections & Quarterly Themes
# ============================================================================

from models.bible_study import WeekReflection, QuarterlyTheme  # noqa: E402


# ─── Public: read reflections & themes (used by bible-reading page) ─────────

@router.get("/week-reflections")
async def get_all_week_reflections(db: AsyncSession = Depends(get_db)):
    """Public endpoint — returns all admin-authored week reflections."""
    result = await db.execute(select(WeekReflection).order_by(WeekReflection.week_number))
    return result.scalars().all()


@router.get("/quarterly-themes")
async def get_quarterly_themes(db: AsyncSession = Depends(get_db)):
    """Public endpoint — returns all 4 quarterly themes."""
    result = await db.execute(select(QuarterlyTheme).order_by(QuarterlyTheme.quarter_number))
    themes = result.scalars().all()
    return themes


@router.get("/settings", response_model=BibleStudyPageSettingsResponse)
async def get_public_page_settings(db: AsyncSession = Depends(get_db)):
    """Public endpoint — returns Bible Study page settings incl. admin-managed
    weekly topics, study groups, and session notes (read-only, no auth)."""
    result = await db.execute(select(BibleStudyPageSettings))
    settings = result.scalar_one_or_none()
    if not settings:
        settings = BibleStudyPageSettings()
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
    return settings


# ─── Study Group membership (any logged-in user can join/leave, no approval) ──



@router.get("/groups/my-groups")
async def my_study_groups(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the group_ids the current user has joined."""
    result = await db.execute(
        select(BibleStudyGroupMember.group_id).where(BibleStudyGroupMember.user_id == current_user.id)
    )
    return {"group_ids": [row[0] for row in result.all()]}


@router.post("/groups/{group_id}/join")
async def join_study_group(
    group_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Join a study group instantly — no re-registration, no admin approval."""
    existing = await db.execute(
        select(BibleStudyGroupMember).where(
            BibleStudyGroupMember.user_id == current_user.id,
            BibleStudyGroupMember.group_id == group_id,
        )
    )
    if existing.scalar_one_or_none():
        return {"status": "already_member", "group_id": group_id}
    db.add(BibleStudyGroupMember(user_id=current_user.id, group_id=group_id))
    await db.commit()
    return {"status": "joined", "group_id": group_id}


@router.delete("/groups/{group_id}/leave")
async def leave_study_group(
    group_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Leave a study group."""
    result = await db.execute(
        select(BibleStudyGroupMember).where(
            BibleStudyGroupMember.user_id == current_user.id,
            BibleStudyGroupMember.group_id == group_id,
        )
    )
    member = result.scalar_one_or_none()
    if member:
        await db.delete(member)
        await db.commit()
    return {"status": "left", "group_id": group_id}


@router.get("/groups/member-counts")
async def group_member_counts(db: AsyncSession = Depends(get_db)):
    """Public — actual join counts per group_id (added on top of the admin base size)."""
    result = await db.execute(
        select(BibleStudyGroupMember.group_id, func.count(BibleStudyGroupMember.id))
        .group_by(BibleStudyGroupMember.group_id)
    )
    return {"counts": {row[0]: row[1] for row in result.all()}}


# ─── Group Chat ──────────────────────────────────────────────────────────────

from sqlalchemy.orm import selectinload as _sli  # noqa: E402


async def _assert_group_member(group_id: str, user_id: str, db: AsyncSession) -> None:
    """Raise 403 if the user is not a member of the given group."""
    res = await db.execute(
        select(BibleStudyGroupMember).where(
            BibleStudyGroupMember.user_id == user_id,
            BibleStudyGroupMember.group_id == group_id,
        )
    )
    if not res.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="You must join this group before you can chat.")


@router.get("/groups/{group_id}/messages")
async def get_group_messages(
    group_id: str,
    limit: int = 80,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List the latest messages for a Bible Study group. Members only."""
    await _assert_group_member(group_id, current_user.id, db)
    res = await db.execute(
        select(BibleStudyGroupMessage)
        .where(BibleStudyGroupMessage.group_id == group_id)
        .options(_sli(BibleStudyGroupMessage.sender))
        .order_by(BibleStudyGroupMessage.created_at.asc())
        .limit(limit)
    )
    msgs = res.scalars().all()
    return [
        {
            "id": m.id,
            "group_id": m.group_id,
            "user_id": m.user_id,
            "sender_name": m.sender.name if m.sender else "Unknown",
            "content": m.content,
            "created_at": m.created_at.isoformat(),
            "is_mine": m.user_id == current_user.id,
        }
        for m in msgs
    ]


class GroupMessageIn(BaseModel):
    content: str


@router.post("/groups/{group_id}/messages", status_code=201)
async def send_group_message(
    group_id: str,
    body: GroupMessageIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send a message to a Bible Study group. Members only."""
    await _assert_group_member(group_id, current_user.id, db)
    if not body.content.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
    msg = BibleStudyGroupMessage(
        group_id=group_id,
        user_id=current_user.id,
        content=body.content.strip(),
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return {
        "id": msg.id,
        "group_id": msg.group_id,
        "user_id": msg.user_id,
        "sender_name": current_user.name,
        "content": msg.content,
        "created_at": msg.created_at.isoformat(),
        "is_mine": True,
    }


@router.delete("/groups/{group_id}/messages/{msg_id}")
async def delete_group_message(
    group_id: str,
    msg_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a group message. Sender, admin, or moderator with can_delete_others."""
    res = await db.execute(
        select(BibleStudyGroupMessage).where(
            BibleStudyGroupMessage.id == msg_id,
            BibleStudyGroupMessage.group_id == group_id,
        )
    )
    msg = res.scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found.")

    # Check permissions: sender, admin, or moderator with can_delete_others
    is_sender = msg.user_id == current_user.id
    is_admin = current_user.role.value == "admin"

    # Check if moderator with delete permission
    is_moderator_with_delete = False
    if not is_admin:
        res = await db.execute(
            select(BibleStudyGroupModerator).where(
                BibleStudyGroupModerator.group_id == group_id,
                BibleStudyGroupModerator.user_id == current_user.id,
            )
        )
        mod = res.scalar_one_or_none()
        if mod and mod.permissions.get("can_delete_others"):
            is_moderator_with_delete = True

    if not (is_sender or is_admin or is_moderator_with_delete):
        raise HTTPException(status_code=403, detail="Not allowed.")

    await db.delete(msg)
    await db.commit()
    return {"message": "Deleted."}


@router.put("/groups/{group_id}/messages/{msg_id}")
async def edit_group_message(
    group_id: str,
    msg_id: str,
    body: GroupMessageIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Edit a sent message. Sender only."""
    await _assert_group_member(group_id, current_user.id, db)
    res = await db.execute(
        select(BibleStudyGroupMessage).where(
            BibleStudyGroupMessage.id == msg_id,
            BibleStudyGroupMessage.group_id == group_id,
        )
    )
    msg = res.scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found.")
    if msg.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only edit your own messages.")
    if not body.content.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
    msg.content = body.content.strip()
    msg.edited_at = datetime.utcnow()
    await db.commit()
    await db.refresh(msg)
    return {
        "id": msg.id,
        "content": msg.content,
        "edited_at": msg.edited_at.isoformat(),
        "message": "Edited",
    }


@router.get("/groups/{group_id}/info")
async def get_group_info(
    group_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get group info: member count, member list. Members only."""
    await _assert_group_member(group_id, current_user.id, db)
    res = await db.execute(
        select(BibleStudyGroupMember)
        .where(BibleStudyGroupMember.group_id == group_id)
        .options(_sli(BibleStudyGroupMember.user_id))
    )
    members = res.scalars().all()
    # Fetch user details for each member
    user_ids = [m.user_id for m in members]
    if user_ids:
        res = await db.execute(select(User).where(User.id.in_(user_ids)))
        users = {u.id: u for u in res.scalars().all()}
    else:
        users = {}
    return {
        "group_id": group_id,
        "member_count": len(members),
        "members": [
            {
                "id": m.user_id,
                "name": users.get(m.user_id, type('obj', (object,), {'name': 'Unknown'})()).name,
                "joined_at": m.joined_at.isoformat(),
            }
            for m in sorted(members, key=lambda m: m.joined_at)
        ],
    }


@router.post("/groups/{group_id}/messages/search")
async def search_group_messages(
    group_id: str,
    body: GroupMessageIn,  # reuse for {query: str}
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Search messages in group by content. Members only."""
    await _assert_group_member(group_id, current_user.id, db)
    query = body.content.strip()
    if not query or len(query) < 2:
        raise HTTPException(status_code=400, detail="Search query must be at least 2 characters.")
    res = await db.execute(
        select(BibleStudyGroupMessage)
        .where(
            BibleStudyGroupMessage.group_id == group_id,
            BibleStudyGroupMessage.content.ilike(f"%{query}%"),
        )
        .options(_sli(BibleStudyGroupMessage.sender))
        .order_by(BibleStudyGroupMessage.created_at.desc())
        .limit(50)
    )
    msgs = res.scalars().all()
    return [
        {
            "id": m.id,
            "sender_name": m.sender.name if m.sender else "Unknown",
            "content": m.content,
            "created_at": m.created_at.isoformat(),
            "edited_at": m.edited_at.isoformat() if m.edited_at else None,
        }
        for m in msgs
    ]


# ─── Group Chat Moderators (Admin Control) ───────────────────────────────────

@router.get("/groups/{group_id}/moderators")
async def get_group_moderators(
    group_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List moderators for a group. Members only."""
    await _assert_group_member(group_id, current_user.id, db)
    res = await db.execute(
        select(BibleStudyGroupModerator)
        .where(BibleStudyGroupModerator.group_id == group_id)
        .options(_sli(BibleStudyGroupModerator.user))
        .order_by(BibleStudyGroupModerator.assigned_at.desc())
    )
    mods = res.scalars().all()
    return [
        {
            "id": m.id,
            "user_id": m.user_id,
            "user_name": m.user.name if m.user else "Unknown",
            "permissions": m.permissions,
            "assigned_at": m.assigned_at.isoformat(),
        }
        for m in mods
    ]


class AssignModeratorInput(BaseModel):
    user_id: str
    permissions: dict = {
        'can_pin': False,
        'can_delete_others': True,
        'can_mute': False,
        'can_edit_settings': False,
    }


@router.post("/groups/{group_id}/moderators")
async def assign_group_moderator(
    group_id: str,
    body: AssignModeratorInput,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    """Assign a user as moderator. Admin only."""
    # Verify user is a group member
    res = await db.execute(
        select(BibleStudyGroupMember).where(
            BibleStudyGroupMember.user_id == body.user_id,
            BibleStudyGroupMember.group_id == group_id,
        )
    )
    if not res.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User must be a group member first.")

    # Check if already a moderator
    res = await db.execute(
        select(BibleStudyGroupModerator).where(
            BibleStudyGroupModerator.user_id == body.user_id,
            BibleStudyGroupModerator.group_id == group_id,
        )
    )
    if res.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User is already a moderator.")

    mod = BibleStudyGroupModerator(
        group_id=group_id,
        user_id=body.user_id,
        permissions=body.permissions,
        assigned_by=current_user.id,
    )
    db.add(mod)
    await db.commit()
    return {"message": f"User assigned as moderator with permissions: {body.permissions}"}


@router.delete("/groups/{group_id}/moderators/{user_id}")
async def remove_group_moderator(
    group_id: str,
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    """Remove a moderator. Admin only."""
    res = await db.execute(
        select(BibleStudyGroupModerator).where(
            BibleStudyGroupModerator.user_id == user_id,
            BibleStudyGroupModerator.group_id == group_id,
        )
    )
    mod = res.scalar_one_or_none()
    if not mod:
        raise HTTPException(status_code=404, detail="Moderator not found.")
    await db.delete(mod)
    await db.commit()
    return {"message": "Moderator removed."}


class PermissionsInput(BaseModel):
    permissions: dict


@router.put("/groups/{group_id}/moderators/{user_id}/permissions")
async def update_moderator_permissions(
    group_id: str,
    user_id: str,
    body: PermissionsInput,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    """Update moderator permissions. Admin only."""
    res = await db.execute(
        select(BibleStudyGroupModerator).where(
            BibleStudyGroupModerator.user_id == user_id,
            BibleStudyGroupModerator.group_id == group_id,
        )
    )
    mod = res.scalar_one_or_none()
    if not mod:
        raise HTTPException(status_code=404, detail="Moderator not found.")
    mod.permissions = body.permissions
    await db.commit()
    return {"message": "Permissions updated.", "permissions": mod.permissions}


# ─── Admin: Week Reflections CRUD ────────────────────────────────────────────

class WeekReflectionInput(BaseModel):
    key_verse: str
    verse_ref: str
    reflection: str

@router.get("/admin/week-reflections")
async def admin_get_week_reflections(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Get all week reflections (admin)."""
    result = await db.execute(select(WeekReflection).order_by(WeekReflection.week_number))
    return result.scalars().all()


@router.put("/admin/week-reflections/{week_number}")
async def admin_upsert_week_reflection(
    week_number: int,
    data: WeekReflectionInput,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Create or update a week reflection (upsert by week_number)."""
    if week_number < 1 or week_number > 54:
        raise HTTPException(status_code=400, detail="Week number must be between 1 and 54")

    result = await db.execute(
        select(WeekReflection).where(WeekReflection.week_number == week_number)
    )
    existing = result.scalar_one_or_none()

    if existing:
        existing.key_verse = data.key_verse
        existing.verse_ref = data.verse_ref
        existing.reflection = data.reflection
    else:
        existing = WeekReflection(
            week_number=week_number,
            key_verse=data.key_verse,
            verse_ref=data.verse_ref,
            reflection=data.reflection,
        )
        db.add(existing)

    await db.commit()
    await db.refresh(existing)
    return existing


@router.delete("/admin/week-reflections/{week_number}")
async def admin_delete_week_reflection(
    week_number: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Delete a week reflection."""
    result = await db.execute(
        select(WeekReflection).where(WeekReflection.week_number == week_number)
    )
    existing = result.scalar_one_or_none()
    if not existing:
        raise HTTPException(status_code=404, detail="Week reflection not found")
    await db.delete(existing)
    await db.commit()
    return {"message": f"Week {week_number} reflection deleted"}


# ─── Admin: Quarterly Themes CRUD ────────────────────────────────────────────

class QuarterlyThemeInput(BaseModel):
    title: str
    theme: str
    scripture: str
    description: Optional[str] = None
    accent_color: str = "#f5bb00"
    week_start: int
    week_end: int

@router.get("/admin/quarterly-themes")
async def admin_get_quarterly_themes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Get all quarterly themes (admin)."""
    result = await db.execute(select(QuarterlyTheme).order_by(QuarterlyTheme.quarter_number))
    return result.scalars().all()


@router.put("/admin/quarterly-themes/{quarter_number}")
async def admin_upsert_quarterly_theme(
    quarter_number: int,
    data: QuarterlyThemeInput,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Create or update a quarterly theme (upsert by quarter_number)."""
    if quarter_number < 1 or quarter_number > 4:
        raise HTTPException(status_code=400, detail="Quarter number must be between 1 and 4")

    result = await db.execute(
        select(QuarterlyTheme).where(QuarterlyTheme.quarter_number == quarter_number)
    )
    existing = result.scalar_one_or_none()

    if existing:
        existing.title = data.title
        existing.theme = data.theme
        existing.scripture = data.scripture
        existing.description = data.description
        existing.accent_color = data.accent_color
        existing.week_start = data.week_start
        existing.week_end = data.week_end
    else:
        existing = QuarterlyTheme(
            quarter_number=quarter_number,
            title=data.title,
            theme=data.theme,
            scripture=data.scripture,
            description=data.description,
            accent_color=data.accent_color,
            week_start=data.week_start,
            week_end=data.week_end,
        )
        db.add(existing)

    await db.commit()
    await db.refresh(existing)
    return existing


@router.post("/admin/quarterly-themes/seed-defaults")
async def seed_default_quarterly_themes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Seed the default 4 quarterly themes if none exist."""
    result = await db.execute(select(QuarterlyTheme))
    if result.scalars().first():
        return {"message": "Themes already seeded"}

    defaults = [
        QuarterlyTheme(quarter_number=1, title="Foundations of Faith", theme="Creation, Call & Covenant",
                       scripture="In the beginning God created…", accent_color="#f5bb00",
                       week_start=1, week_end=13),
        QuarterlyTheme(quarter_number=2, title="Laws, Lessons & Liberation", theme="The Law & the Prophets",
                       scripture="Your word is a lamp to my feet", accent_color="#4ade80",
                       week_start=14, week_end=27),
        QuarterlyTheme(quarter_number=3, title="The Living Word", theme="Gospels, Acts & Letters",
                       scripture="The Word became flesh", accent_color="#60a5fa",
                       week_start=28, week_end=40),
        QuarterlyTheme(quarter_number=4, title="Faithful to the End", theme="Epistles & Revelation",
                       scripture="Be strong and courageous", accent_color="#f472b6",
                       week_start=41, week_end=54),
    ]
    for theme in defaults:
        db.add(theme)
    await db.commit()
    return {"message": "Default quarterly themes seeded successfully", "count": 4}


# ─── Group Member Management (moderators only) ──

@router.post("/groups/{group_id}/members/{user_id}")
async def add_member_to_group(
    group_id: str,
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Add a user to a group. Only moderators can do this.
    """
    # Check if current user is a moderator
    res = await db.execute(
        select(BibleStudyGroupModerator).where(
            and_(
                BibleStudyGroupModerator.group_id == group_id,
                BibleStudyGroupModerator.user_id == current_user.id,
            )
        )
    )
    if not res.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Only moderators can add members")

    # Check if user already in group
    res = await db.execute(
        select(BibleStudyGroupMember).where(
            and_(
                BibleStudyGroupMember.group_id == group_id,
                BibleStudyGroupMember.user_id == user_id,
            )
        )
    )
    if res.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User already in group")

    # Add member
    member = BibleStudyGroupMember(
        group_id=group_id,
        user_id=user_id,
        joined_at=datetime.utcnow(),
    )
    db.add(member)
    await db.commit()

    return {"message": f"Member added successfully"}


@router.delete("/groups/{group_id}/members/{user_id}")
async def remove_member_from_group(
    group_id: str,
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Remove a user from a group. Only moderators can do this (or users can remove themselves).
    """
    # Check if current user is a moderator or is removing themselves
    if current_user.id != user_id:
        res = await db.execute(
            select(BibleStudyGroupModerator).where(
                and_(
                    BibleStudyGroupModerator.group_id == group_id,
                    BibleStudyGroupModerator.user_id == current_user.id,
                )
            )
        )
        if not res.scalar_one_or_none():
            raise HTTPException(status_code=403, detail="Only moderators can remove members")

    # Find and delete member
    res = await db.execute(
        select(BibleStudyGroupMember).where(
            and_(
                BibleStudyGroupMember.group_id == group_id,
                BibleStudyGroupMember.user_id == user_id,
            )
        )
    )
    member = res.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found in group")

    await db.delete(member)
    await db.commit()

    return {"message": "Member removed successfully"}


@router.get("/groups/{group_id}/available-members")
async def get_available_members(
    group_id: str,
    q: str = Query("", min_length=0, max_length=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get list of users not yet in the group (for moderators to add).
    """
    # Check if current user is a moderator
    res = await db.execute(
        select(BibleStudyGroupModerator).where(
            and_(
                BibleStudyGroupModerator.group_id == group_id,
                BibleStudyGroupModerator.user_id == current_user.id,
            )
        )
    )
    if not res.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Only moderators can view available members")

    # Get current members
    res = await db.execute(
        select(BibleStudyGroupMember.user_id).where(
            BibleStudyGroupMember.group_id == group_id
        )
    )
    current_member_ids = set(r[0] for r in res.all())

    # Search users
    query = select(User).where(User.id.notin_(current_member_ids))
    if q:
        query = query.where(User.name.ilike(f"%{q}%"))
    query = query.limit(50)

    res = await db.execute(query)
    users = res.scalars().all()

    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
        }
        for u in users
    ]
