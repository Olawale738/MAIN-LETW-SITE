"""
Custom Ministries API
Allows admins to dynamically create new ministries (Women's, Men's, Marriage,
Singles, Seniors, etc.) with auto-generated front pages and dashboards.

Endpoints:
    Public:
        GET  /api/ministries                    - List all active ministries
        GET  /api/ministries/{slug}             - Get ministry details
        POST /api/ministries/{slug}/join        - Request to join (auth required)

    Member/Coordinator:
        GET  /api/ministries/{slug}/members     - List members
        GET  /api/ministries/{slug}/announcements - Get announcements
        POST /api/ministries/{slug}/announcements - Post announcement (coord)
        GET  /api/ministries/{slug}/messages    - Get chat messages
        POST /api/ministries/{slug}/messages    - Send chat message
        POST /api/ministries/{slug}/members/{user_id}/open-dm - 1:1 chat

    Coordinator/Admin:
        POST /api/ministries/{slug}/members/{user_id}/approve - Approve member
        POST /api/ministries/{slug}/members/{user_id}/reject  - Reject member
        POST /api/ministries/{slug}/members/{user_id}/coordinator - Make coord
        DELETE /api/ministries/{slug}/members/{user_id} - Remove member

    Admin Only:
        POST   /api/ministries           - Create new ministry
        PATCH  /api/ministries/{slug}    - Update ministry
        DELETE /api/ministries/{slug}    - Delete ministry
"""

import re
import logging
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, delete

from database import get_db
from models.user import User, UserRole
from models.custom_ministry import (
    CustomMinistry, CustomMinistryMember, CustomMinistryAnnouncement,
    CustomMinistryMessage, CustomMinistryLeader, CustomMinistryEvent,
    CustomMinistryEventRsvp, CustomMinistryResource,
    CustomMinistryTestimonial, CustomMinistryPrayerRequest,
    CustomMinistryActivity,
    MinistryMembershipStatus, MinistryEventType, MinistryResourceType,
)
from models.message import Conversation, ConversationStatus, Message
from models.notification import Notification, NotificationType
from utils.dependencies import get_current_active_user, get_admin_user
from datetime import date as date_type

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/ministries", tags=["Custom Ministries"])


# ─── Schemas ─────────────────────────────────────────────────────────────────

class MinistryCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    slug: Optional[str] = Field(None, max_length=100)
    tagline: Optional[str] = Field(None, max_length=300)
    description: Optional[str] = None
    hero_image_url: Optional[str] = None
    icon_url: Optional[str] = None
    color: str = Field("#140152", max_length=20)
    secondary_color: str = Field("#7c3aed", max_length=20)
    icon_name: str = Field("Users", max_length=50)
    emoji: Optional[str] = Field(None, max_length=10)
    accepts_members: bool = True
    meeting_schedule: Optional[str] = None
    location: Optional[str] = None
    features: Optional[dict] = None
    # Mission & Vision
    mission_statement: Optional[str] = None
    vision_statement: Optional[str] = None
    core_values: Optional[str] = None
    scripture_verse: Optional[str] = None
    scripture_reference: Optional[str] = None
    # Contact
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    whatsapp_number: Optional[str] = None
    whatsapp_group_link: Optional[str] = None
    # Social
    facebook_url: Optional[str] = None
    instagram_url: Optional[str] = None
    twitter_url: Optional[str] = None
    youtube_url: Optional[str] = None
    website_url: Optional[str] = None
    # Meeting
    meeting_day: Optional[str] = None
    meeting_time: Optional[str] = None
    online_meeting_link: Optional[str] = None
    # Audience
    category: Optional[str] = None
    target_audience: Optional[str] = None
    age_min: Optional[int] = None
    age_max: Optional[int] = None
    gender_filter: Optional[str] = None
    # Membership
    requires_approval: bool = True
    membership_fee: Optional[float] = None
    requires_baptism: bool = False
    requires_application: bool = False
    application_questions: Optional[dict] = None
    # Gallery
    gallery_images: Optional[dict] = None
    # Goals & FAQ
    goals: Optional[str] = None
    impact_stats: Optional[dict] = None
    faqs: Optional[dict] = None
    # Featured
    is_featured: bool = False
    show_on_homepage: bool = False


class MinistryUpdate(BaseModel):
    name: Optional[str] = None
    tagline: Optional[str] = None
    description: Optional[str] = None
    hero_image_url: Optional[str] = None
    icon_url: Optional[str] = None
    color: Optional[str] = None
    secondary_color: Optional[str] = None
    icon_name: Optional[str] = None
    emoji: Optional[str] = None
    is_active: Optional[bool] = None
    accepts_members: Optional[bool] = None
    meeting_schedule: Optional[str] = None
    location: Optional[str] = None
    features: Optional[dict] = None
    sort_order: Optional[int] = None
    mission_statement: Optional[str] = None
    vision_statement: Optional[str] = None
    core_values: Optional[str] = None
    scripture_verse: Optional[str] = None
    scripture_reference: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    whatsapp_number: Optional[str] = None
    whatsapp_group_link: Optional[str] = None
    facebook_url: Optional[str] = None
    instagram_url: Optional[str] = None
    twitter_url: Optional[str] = None
    youtube_url: Optional[str] = None
    website_url: Optional[str] = None
    meeting_day: Optional[str] = None
    meeting_time: Optional[str] = None
    online_meeting_link: Optional[str] = None
    category: Optional[str] = None
    target_audience: Optional[str] = None
    age_min: Optional[int] = None
    age_max: Optional[int] = None
    gender_filter: Optional[str] = None
    requires_approval: Optional[bool] = None
    membership_fee: Optional[float] = None
    requires_baptism: Optional[bool] = None
    requires_application: Optional[bool] = None
    application_questions: Optional[dict] = None
    gallery_images: Optional[dict] = None
    goals: Optional[str] = None
    impact_stats: Optional[dict] = None
    faqs: Optional[dict] = None
    is_featured: Optional[bool] = None
    show_on_homepage: Optional[bool] = None


class MinistryResponse(BaseModel):
    id: str
    slug: str
    name: str
    tagline: Optional[str] = None
    description: Optional[str] = None
    hero_image_url: Optional[str] = None
    icon_url: Optional[str] = None
    color: str
    secondary_color: str
    icon_name: str
    emoji: Optional[str] = None
    is_active: bool
    accepts_members: bool
    meeting_schedule: Optional[str] = None
    location: Optional[str] = None
    features: Optional[dict] = None
    sort_order: int
    member_count: int = 0
    created_at: datetime
    # Extended fields
    mission_statement: Optional[str] = None
    vision_statement: Optional[str] = None
    core_values: Optional[str] = None
    scripture_verse: Optional[str] = None
    scripture_reference: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    whatsapp_number: Optional[str] = None
    whatsapp_group_link: Optional[str] = None
    facebook_url: Optional[str] = None
    instagram_url: Optional[str] = None
    twitter_url: Optional[str] = None
    youtube_url: Optional[str] = None
    website_url: Optional[str] = None
    meeting_day: Optional[str] = None
    meeting_time: Optional[str] = None
    online_meeting_link: Optional[str] = None
    category: Optional[str] = None
    target_audience: Optional[str] = None
    age_min: Optional[int] = None
    age_max: Optional[int] = None
    gender_filter: Optional[str] = None
    requires_approval: bool = True
    membership_fee: Optional[float] = None
    requires_baptism: bool = False
    requires_application: bool = False
    application_questions: Optional[dict] = None
    gallery_images: Optional[dict] = None
    goals: Optional[str] = None
    impact_stats: Optional[dict] = None
    faqs: Optional[dict] = None
    is_featured: bool = False
    show_on_homepage: bool = False

    class Config:
        from_attributes = True


class JoinRequest(BaseModel):
    message: Optional[str] = Field(None, max_length=1000)


class MemberResponse(BaseModel):
    id: str
    user_id: str
    name: str
    email: str
    status: str
    is_coordinator: bool
    role_label: Optional[str]
    join_message: Optional[str]
    notes: Optional[str]
    requested_at: datetime
    approved_at: Optional[datetime]


class AnnouncementCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    body: str = Field(..., min_length=2)
    is_pinned: bool = False


class AnnouncementResponse(BaseModel):
    id: str
    title: str
    body: str
    author_name: Optional[str]
    is_pinned: bool
    created_at: datetime


class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=4000)


class MessageResponse(BaseModel):
    id: str
    sender_id: str
    sender_name: str
    content: str
    created_at: datetime
    is_mine: bool = False


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _slugify(text: str) -> str:
    """Convert text to URL-safe slug."""
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    text = re.sub(r"^-+|-+$", "", text)
    return text


async def _get_ministry_or_404(db: AsyncSession, slug: str) -> CustomMinistry:
    """Fetch a ministry by slug or raise 404."""
    res = await db.execute(
        select(CustomMinistry).where(CustomMinistry.slug == slug)
    )
    ministry = res.scalar_one_or_none()
    if not ministry:
        raise HTTPException(status_code=404, detail=f"Ministry '{slug}' not found")
    return ministry


async def _is_coordinator_or_admin(
    db: AsyncSession, ministry: CustomMinistry, user: User
) -> bool:
    """Check if user has coordinator or admin access to this ministry."""
    if user.role == UserRole.ADMIN:
        return True
    res = await db.execute(
        select(CustomMinistryMember).where(and_(
            CustomMinistryMember.ministry_id == ministry.id,
            CustomMinistryMember.user_id == user.id,
            CustomMinistryMember.is_coordinator == True,
            CustomMinistryMember.status == MinistryMembershipStatus.ACTIVE,
        ))
    )
    return res.scalar_one_or_none() is not None


async def _require_coordinator(
    db: AsyncSession, ministry: CustomMinistry, user: User
) -> None:
    if not await _is_coordinator_or_admin(db, ministry, user):
        raise HTTPException(
            status_code=403,
            detail="Only coordinators or admins can perform this action"
        )


async def _is_member(
    db: AsyncSession, ministry: CustomMinistry, user: User
) -> bool:
    """Check if user is an active member."""
    if user.role == UserRole.ADMIN:
        return True
    res = await db.execute(
        select(CustomMinistryMember).where(and_(
            CustomMinistryMember.ministry_id == ministry.id,
            CustomMinistryMember.user_id == user.id,
            CustomMinistryMember.status == MinistryMembershipStatus.ACTIVE,
        ))
    )
    return res.scalar_one_or_none() is not None


async def _member_count(db: AsyncSession, ministry_id: str) -> int:
    """Count active members in a ministry."""
    from sqlalchemy import func as sql_func
    res = await db.execute(
        select(sql_func.count(CustomMinistryMember.id)).where(and_(
            CustomMinistryMember.ministry_id == ministry_id,
            CustomMinistryMember.status == MinistryMembershipStatus.ACTIVE,
        ))
    )
    return res.scalar() or 0


# ─── Public Endpoints ────────────────────────────────────────────────────────

@router.get("", response_model=List[MinistryResponse])
async def list_ministries(
    include_inactive: bool = False,
    db: AsyncSession = Depends(get_db),
):
    """List all active ministries (public)."""
    q = select(CustomMinistry).order_by(
        CustomMinistry.sort_order, CustomMinistry.name
    )
    if not include_inactive:
        q = q.where(CustomMinistry.is_active == True)
    res = await db.execute(q)
    ministries = res.scalars().all()
    return [
        MinistryResponse(
            **{k: v for k, v in vars(m).items() if not k.startswith('_')},
            member_count=await _member_count(db, m.id),
        )
        for m in ministries
    ]


@router.get("/{slug}", response_model=MinistryResponse)
async def get_ministry(slug: str, db: AsyncSession = Depends(get_db)):
    """Get full ministry details by slug (public)."""
    ministry = await _get_ministry_or_404(db, slug)
    return MinistryResponse(
        **{k: v for k, v in vars(ministry).items() if not k.startswith('_')},
        member_count=await _member_count(db, ministry.id),
    )


# ─── Member Management ───────────────────────────────────────────────────────

@router.post("/{slug}/join", status_code=201)
async def join_ministry(
    slug: str,
    body: JoinRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Request to join a ministry. Creates pending membership."""
    ministry = await _get_ministry_or_404(db, slug)

    if not ministry.accepts_members:
        raise HTTPException(status_code=400, detail="This ministry is not accepting new members at this time")

    # Check if already a member
    existing_res = await db.execute(
        select(CustomMinistryMember).where(and_(
            CustomMinistryMember.ministry_id == ministry.id,
            CustomMinistryMember.user_id == current_user.id,
        ))
    )
    existing = existing_res.scalar_one_or_none()
    if existing:
        if existing.status == MinistryMembershipStatus.ACTIVE:
            return {"message": "You are already an active member.", "status": "active"}
        elif existing.status == MinistryMembershipStatus.PENDING:
            return {"message": "Your request is pending approval.", "status": "pending"}
        elif existing.status == MinistryMembershipStatus.REJECTED:
            # Re-apply: change to pending
            existing.status = MinistryMembershipStatus.PENDING
            existing.join_message = body.message
            existing.requested_at = datetime.utcnow()
            await db.commit()
            return {"message": "Your request has been resubmitted.", "status": "pending"}

    # Create new pending membership
    member = CustomMinistryMember(
        ministry_id=ministry.id,
        user_id=current_user.id,
        status=MinistryMembershipStatus.PENDING,
        join_message=body.message,
    )
    db.add(member)

    # Notify all coordinators
    coord_res = await db.execute(
        select(CustomMinistryMember).where(and_(
            CustomMinistryMember.ministry_id == ministry.id,
            CustomMinistryMember.is_coordinator == True,
            CustomMinistryMember.status == MinistryMembershipStatus.ACTIVE,
        ))
    )
    for coord in coord_res.scalars().all():
        db.add(Notification(
            user_id=coord.user_id,
            title=f"New member request: {ministry.name}",
            message=f"{current_user.name} requested to join {ministry.name}",
            type=NotificationType.GENERAL,
            reference_id=ministry.id,
        ))

    await db.commit()
    return {"message": f"Your request to join {ministry.name} has been submitted.", "status": "pending"}


@router.get("/{slug}/members", response_model=List[MemberResponse])
async def list_members(
    slug: str,
    status_filter: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List ministry members (coordinator/admin only for pending; members can see active)."""
    ministry = await _get_ministry_or_404(db, slug)

    # Anyone (members or coordinators) can see active members
    # Only coordinators/admins can see pending
    is_coord = await _is_coordinator_or_admin(db, ministry, current_user)
    is_mem = await _is_member(db, ministry, current_user)

    if not (is_coord or is_mem):
        raise HTTPException(status_code=403, detail="You must be a member to view this list")

    q = select(CustomMinistryMember, User).join(
        User, User.id == CustomMinistryMember.user_id
    ).where(CustomMinistryMember.ministry_id == ministry.id)

    if status_filter:
        q = q.where(CustomMinistryMember.status == status_filter)
    else:
        # Non-coordinators only see active
        if not is_coord:
            q = q.where(CustomMinistryMember.status == MinistryMembershipStatus.ACTIVE)

    q = q.order_by(CustomMinistryMember.requested_at.desc())
    res = await db.execute(q)
    rows = res.all()

    return [
        MemberResponse(
            id=m.id, user_id=u.id, name=u.name, email=u.email,
            status=m.status.value if hasattr(m.status, 'value') else str(m.status),
            is_coordinator=m.is_coordinator, role_label=m.role_label,
            join_message=m.join_message, notes=m.notes,
            requested_at=m.requested_at, approved_at=m.approved_at,
        )
        for m, u in rows
    ]


@router.post("/{slug}/members/{user_id}/approve")
async def approve_member(
    slug: str, user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Approve a pending member (coordinator/admin)."""
    ministry = await _get_ministry_or_404(db, slug)
    await _require_coordinator(db, ministry, current_user)

    res = await db.execute(
        select(CustomMinistryMember).where(and_(
            CustomMinistryMember.ministry_id == ministry.id,
            CustomMinistryMember.user_id == user_id,
        ))
    )
    member = res.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    member.status = MinistryMembershipStatus.ACTIVE
    member.approved_at = datetime.utcnow()
    member.approved_by = current_user.id

    # Notify the user
    db.add(Notification(
        user_id=user_id,
        title=f"Welcome to {ministry.name}!",
        message=f"Your membership in {ministry.name} has been approved. Welcome!",
        type=NotificationType.GENERAL,
        reference_id=ministry.id,
    ))

    await db.commit()
    return {"message": f"Member approved for {ministry.name}"}


@router.post("/{slug}/members/{user_id}/reject")
async def reject_member(
    slug: str, user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Reject a pending member."""
    ministry = await _get_ministry_or_404(db, slug)
    await _require_coordinator(db, ministry, current_user)

    res = await db.execute(
        select(CustomMinistryMember).where(and_(
            CustomMinistryMember.ministry_id == ministry.id,
            CustomMinistryMember.user_id == user_id,
        ))
    )
    member = res.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    member.status = MinistryMembershipStatus.REJECTED
    await db.commit()
    return {"message": "Member request rejected"}


@router.post("/{slug}/members/{user_id}/coordinator")
async def assign_coordinator(
    slug: str, user_id: str, make_coordinator: bool = True,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    """Make a member a coordinator (admin only)."""
    ministry = await _get_ministry_or_404(db, slug)

    res = await db.execute(
        select(CustomMinistryMember).where(and_(
            CustomMinistryMember.ministry_id == ministry.id,
            CustomMinistryMember.user_id == user_id,
        ))
    )
    member = res.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    if member.status != MinistryMembershipStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Member must be active to become coordinator")

    member.is_coordinator = make_coordinator
    if make_coordinator and not member.role_label:
        member.role_label = "Coordinator"
    await db.commit()

    action = "assigned as" if make_coordinator else "removed as"
    return {"message": f"User {action} coordinator for {ministry.name}"}


@router.delete("/{slug}/members/{user_id}")
async def remove_member(
    slug: str, user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Remove a member (coordinator/admin only, or member removing themselves)."""
    ministry = await _get_ministry_or_404(db, slug)
    is_coord = await _is_coordinator_or_admin(db, ministry, current_user)
    is_self = current_user.id == user_id

    if not (is_coord or is_self):
        raise HTTPException(status_code=403, detail="Not authorized")

    res = await db.execute(
        select(CustomMinistryMember).where(and_(
            CustomMinistryMember.ministry_id == ministry.id,
            CustomMinistryMember.user_id == user_id,
        ))
    )
    member = res.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    await db.delete(member)
    await db.commit()
    return {"message": "Member removed"}


# ─── Announcements ───────────────────────────────────────────────────────────

@router.get("/{slug}/announcements", response_model=List[AnnouncementResponse])
async def list_announcements(
    slug: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List ministry announcements (members and coordinators)."""
    ministry = await _get_ministry_or_404(db, slug)

    if not (await _is_member(db, ministry, current_user) or
            await _is_coordinator_or_admin(db, ministry, current_user)):
        raise HTTPException(status_code=403, detail="Members only")

    res = await db.execute(
        select(CustomMinistryAnnouncement, User).outerjoin(
            User, User.id == CustomMinistryAnnouncement.author_id
        ).where(CustomMinistryAnnouncement.ministry_id == ministry.id)
        .order_by(
            CustomMinistryAnnouncement.is_pinned.desc(),
            CustomMinistryAnnouncement.created_at.desc()
        )
    )
    rows = res.all()
    return [
        AnnouncementResponse(
            id=a.id, title=a.title, body=a.body,
            author_name=u.name if u else None,
            is_pinned=a.is_pinned, created_at=a.created_at,
        )
        for a, u in rows
    ]


@router.post("/{slug}/announcements", response_model=AnnouncementResponse, status_code=201)
async def create_announcement(
    slug: str, body: AnnouncementCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Post an announcement (coordinator/admin)."""
    ministry = await _get_ministry_or_404(db, slug)
    await _require_coordinator(db, ministry, current_user)

    a = CustomMinistryAnnouncement(
        ministry_id=ministry.id,
        title=body.title,
        body=body.body,
        author_id=current_user.id,
        is_pinned=body.is_pinned,
    )
    db.add(a)
    await db.commit()
    await db.refresh(a)
    return AnnouncementResponse(
        id=a.id, title=a.title, body=a.body,
        author_name=current_user.name,
        is_pinned=a.is_pinned, created_at=a.created_at,
    )


# ─── Chat Messages ───────────────────────────────────────────────────────────

@router.get("/{slug}/messages", response_model=List[MessageResponse])
async def list_messages(
    slug: str, limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get group chat messages."""
    ministry = await _get_ministry_or_404(db, slug)

    if not (await _is_member(db, ministry, current_user) or
            await _is_coordinator_or_admin(db, ministry, current_user)):
        raise HTTPException(status_code=403, detail="Members only")

    res = await db.execute(
        select(CustomMinistryMessage, User).join(
            User, User.id == CustomMinistryMessage.sender_id
        ).where(CustomMinistryMessage.ministry_id == ministry.id)
        .order_by(CustomMinistryMessage.created_at.asc())
        .limit(limit)
    )
    rows = res.all()
    return [
        MessageResponse(
            id=m.id, sender_id=m.sender_id, sender_name=u.name,
            content=m.content, created_at=m.created_at,
            is_mine=(m.sender_id == current_user.id),
        )
        for m, u in rows
    ]


@router.post("/{slug}/messages", response_model=MessageResponse, status_code=201)
async def send_message(
    slug: str, body: MessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Send a group chat message."""
    ministry = await _get_ministry_or_404(db, slug)

    if not (await _is_member(db, ministry, current_user) or
            await _is_coordinator_or_admin(db, ministry, current_user)):
        raise HTTPException(status_code=403, detail="Members only")

    m = CustomMinistryMessage(
        ministry_id=ministry.id,
        sender_id=current_user.id,
        content=body.content,
    )
    db.add(m)
    await db.commit()
    await db.refresh(m)

    return MessageResponse(
        id=m.id, sender_id=m.sender_id, sender_name=current_user.name,
        content=m.content, created_at=m.created_at, is_mine=True,
    )


# ─── Admin: CRUD ─────────────────────────────────────────────────────────────

@router.post("", response_model=MinistryResponse, status_code=201)
async def create_ministry(
    body: MinistryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    """Create a new ministry (admin only)."""
    # Generate slug from name if not provided
    slug = body.slug or _slugify(body.name)
    if not slug:
        raise HTTPException(status_code=400, detail="Invalid name; slug could not be generated")

    # Ensure unique
    existing = await db.execute(
        select(CustomMinistry).where(CustomMinistry.slug == slug)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"A ministry with slug '{slug}' already exists")

    # Use model_dump to grab all extended fields
    payload = body.model_dump(exclude={"slug"})
    payload["slug"] = slug
    payload["created_by"] = current_user.id

    ministry = CustomMinistry(**payload)
    db.add(ministry)
    await db.commit()
    await db.refresh(ministry)

    logger.info(f"Admin {current_user.name} created ministry: {ministry.name} ({ministry.slug})")
    return MinistryResponse(
        **{k: v for k, v in vars(ministry).items() if not k.startswith('_')},
        member_count=0,
    )


@router.patch("/{slug}", response_model=MinistryResponse)
async def update_ministry(
    slug: str, body: MinistryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    """Update a ministry (admin only)."""
    ministry = await _get_ministry_or_404(db, slug)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(ministry, field, value)
    await db.commit()
    await db.refresh(ministry)
    return MinistryResponse(
        **{k: v for k, v in vars(ministry).items() if not k.startswith('_')},
        member_count=await _member_count(db, ministry.id),
    )


@router.delete("/{slug}")
async def delete_ministry(
    slug: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    """Delete a ministry and all its data (admin only)."""
    ministry = await _get_ministry_or_404(db, slug)
    await db.delete(ministry)
    await db.commit()
    return {"message": f"Ministry '{slug}' deleted"}


# ═══════════════════════════════════════════════════════════════════════════
# LEADERSHIP TEAM
# ═══════════════════════════════════════════════════════════════════════════

class LeaderCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    role_type: str
    role_title: Optional[str] = None
    bio: Optional[str] = None
    photo_url: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    user_id: Optional[str] = None
    is_primary: bool = False
    sort_order: int = 0


class LeaderResponse(BaseModel):
    id: str
    name: str
    role_type: str
    role_title: Optional[str] = None
    bio: Optional[str] = None
    photo_url: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    is_primary: bool
    sort_order: int
    user_id: Optional[str] = None
    created_at: datetime


@router.get("/{slug}/leaders", response_model=List[LeaderResponse])
async def list_leaders(slug: str, db: AsyncSession = Depends(get_db)):
    """List leadership team (public)."""
    ministry = await _get_ministry_or_404(db, slug)
    res = await db.execute(
        select(CustomMinistryLeader)
        .where(CustomMinistryLeader.ministry_id == ministry.id)
        .order_by(CustomMinistryLeader.sort_order, CustomMinistryLeader.created_at)
    )
    return res.scalars().all()


@router.post("/{slug}/leaders", response_model=LeaderResponse, status_code=201)
async def add_leader(
    slug: str, body: LeaderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Add leader (coordinator/admin)."""
    ministry = await _get_ministry_or_404(db, slug)
    await _require_coordinator(db, ministry, current_user)
    leader = CustomMinistryLeader(ministry_id=ministry.id, **body.model_dump())
    db.add(leader)
    await db.commit()
    await db.refresh(leader)
    return leader


@router.delete("/{slug}/leaders/{leader_id}")
async def delete_leader(
    slug: str, leader_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Remove leader (coordinator/admin)."""
    ministry = await _get_ministry_or_404(db, slug)
    await _require_coordinator(db, ministry, current_user)
    res = await db.execute(
        select(CustomMinistryLeader).where(and_(
            CustomMinistryLeader.id == leader_id,
            CustomMinistryLeader.ministry_id == ministry.id,
        ))
    )
    leader = res.scalar_one_or_none()
    if not leader:
        raise HTTPException(status_code=404, detail="Leader not found")
    await db.delete(leader)
    await db.commit()
    return {"message": "Leader removed"}


# ═══════════════════════════════════════════════════════════════════════════
# EVENTS
# ═══════════════════════════════════════════════════════════════════════════

class EventCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    event_type: str = "meeting"
    event_date: date_type
    event_time: Optional[str] = None
    end_time: Optional[str] = None
    location: Optional[str] = None
    online_link: Optional[str] = None
    image_url: Optional[str] = None
    is_recurring: bool = False
    recurrence_pattern: Optional[str] = None
    max_attendees: Optional[int] = None
    requires_rsvp: bool = False
    is_public: bool = True


class EventResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    event_type: str
    event_date: date_type
    event_time: Optional[str] = None
    end_time: Optional[str] = None
    location: Optional[str] = None
    online_link: Optional[str] = None
    image_url: Optional[str] = None
    is_recurring: bool
    recurrence_pattern: Optional[str] = None
    max_attendees: Optional[int] = None
    requires_rsvp: bool
    is_public: bool
    is_cancelled: bool
    rsvp_count: int = 0
    created_at: datetime


@router.get("/{slug}/events", response_model=List[EventResponse])
async def list_events(
    slug: str, upcoming_only: bool = True,
    db: AsyncSession = Depends(get_db),
):
    """List events (public)."""
    ministry = await _get_ministry_or_404(db, slug)
    q = select(CustomMinistryEvent).where(
        CustomMinistryEvent.ministry_id == ministry.id
    )
    if upcoming_only:
        q = q.where(CustomMinistryEvent.event_date >= date_type.today())
    q = q.where(CustomMinistryEvent.is_public == True)
    q = q.order_by(CustomMinistryEvent.event_date.asc())
    res = await db.execute(q)
    events = res.scalars().all()

    from sqlalchemy import func as sql_func
    results = []
    for e in events:
        c = await db.execute(
            select(sql_func.count(CustomMinistryEventRsvp.id))
            .where(CustomMinistryEventRsvp.event_id == e.id)
        )
        results.append(EventResponse(
            **{k: v for k, v in vars(e).items() if not k.startswith('_')},
            rsvp_count=c.scalar() or 0,
        ))
    return results


@router.post("/{slug}/events", response_model=EventResponse, status_code=201)
async def create_event(
    slug: str, body: EventCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create event (coordinator/admin)."""
    ministry = await _get_ministry_or_404(db, slug)
    await _require_coordinator(db, ministry, current_user)
    event = CustomMinistryEvent(
        ministry_id=ministry.id, created_by=current_user.id, **body.model_dump()
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return EventResponse(
        **{k: v for k, v in vars(event).items() if not k.startswith('_')},
        rsvp_count=0,
    )


@router.post("/{slug}/events/{event_id}/rsvp")
async def rsvp_event(
    slug: str, event_id: str, status: str = "attending",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """RSVP to event."""
    ministry = await _get_ministry_or_404(db, slug)
    existing = await db.execute(
        select(CustomMinistryEventRsvp).where(and_(
            CustomMinistryEventRsvp.event_id == event_id,
            CustomMinistryEventRsvp.user_id == current_user.id,
        ))
    )
    rsvp = existing.scalar_one_or_none()
    if rsvp:
        rsvp.status = status
    else:
        db.add(CustomMinistryEventRsvp(
            event_id=event_id, user_id=current_user.id, status=status,
        ))
    await db.commit()
    return {"message": f"RSVP set to {status}"}


@router.delete("/{slug}/events/{event_id}")
async def delete_event(
    slug: str, event_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete event (coordinator/admin)."""
    ministry = await _get_ministry_or_404(db, slug)
    await _require_coordinator(db, ministry, current_user)
    res = await db.execute(
        select(CustomMinistryEvent).where(and_(
            CustomMinistryEvent.id == event_id,
            CustomMinistryEvent.ministry_id == ministry.id,
        ))
    )
    event = res.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    await db.delete(event)
    await db.commit()
    return {"message": "Event deleted"}


# ═══════════════════════════════════════════════════════════════════════════
# RESOURCES LIBRARY
# ═══════════════════════════════════════════════════════════════════════════

class ResourceCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    resource_type: str = "document"
    url: str
    file_size: Optional[int] = None
    category: Optional[str] = None
    thumbnail_url: Optional[str] = None
    is_featured: bool = False
    sort_order: int = 0


class ResourceResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    resource_type: str
    url: str
    file_size: Optional[int] = None
    category: Optional[str] = None
    thumbnail_url: Optional[str] = None
    download_count: int
    is_featured: bool
    sort_order: int
    created_at: datetime


@router.get("/{slug}/resources", response_model=List[ResourceResponse])
async def list_resources(slug: str, db: AsyncSession = Depends(get_db)):
    """List resources (public)."""
    ministry = await _get_ministry_or_404(db, slug)
    res = await db.execute(
        select(CustomMinistryResource)
        .where(CustomMinistryResource.ministry_id == ministry.id)
        .order_by(
            CustomMinistryResource.is_featured.desc(),
            CustomMinistryResource.sort_order,
            CustomMinistryResource.created_at.desc()
        )
    )
    return res.scalars().all()


@router.post("/{slug}/resources", response_model=ResourceResponse, status_code=201)
async def add_resource(
    slug: str, body: ResourceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Add resource (coordinator/admin)."""
    ministry = await _get_ministry_or_404(db, slug)
    await _require_coordinator(db, ministry, current_user)
    resource = CustomMinistryResource(
        ministry_id=ministry.id, uploaded_by=current_user.id, **body.model_dump()
    )
    db.add(resource)
    await db.commit()
    await db.refresh(resource)
    return resource


@router.delete("/{slug}/resources/{resource_id}")
async def delete_resource(
    slug: str, resource_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete resource."""
    ministry = await _get_ministry_or_404(db, slug)
    await _require_coordinator(db, ministry, current_user)
    res = await db.execute(
        select(CustomMinistryResource).where(and_(
            CustomMinistryResource.id == resource_id,
            CustomMinistryResource.ministry_id == ministry.id,
        ))
    )
    resource = res.scalar_one_or_none()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    await db.delete(resource)
    await db.commit()
    return {"message": "Resource deleted"}


# ═══════════════════════════════════════════════════════════════════════════
# TESTIMONIALS
# ═══════════════════════════════════════════════════════════════════════════

class TestimonialCreate(BaseModel):
    content: str = Field(..., min_length=10)
    author_role: Optional[str] = None
    rating: Optional[int] = Field(None, ge=1, le=5)
    photo_url: Optional[str] = None


class TestimonialResponse(BaseModel):
    id: str
    author_name: str
    author_role: Optional[str] = None
    photo_url: Optional[str] = None
    content: str
    rating: Optional[int] = None
    is_approved: bool
    is_featured: bool
    created_at: datetime


@router.get("/{slug}/testimonials", response_model=List[TestimonialResponse])
async def list_testimonials(
    slug: str, approved_only: bool = True,
    db: AsyncSession = Depends(get_db),
):
    """List testimonials."""
    ministry = await _get_ministry_or_404(db, slug)
    q = select(CustomMinistryTestimonial).where(
        CustomMinistryTestimonial.ministry_id == ministry.id
    )
    if approved_only:
        q = q.where(CustomMinistryTestimonial.is_approved == True)
    q = q.order_by(
        CustomMinistryTestimonial.is_featured.desc(),
        CustomMinistryTestimonial.created_at.desc()
    )
    res = await db.execute(q)
    return res.scalars().all()


@router.post("/{slug}/testimonials", response_model=TestimonialResponse, status_code=201)
async def add_testimonial(
    slug: str, body: TestimonialCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Submit testimonial."""
    ministry = await _get_ministry_or_404(db, slug)
    t = CustomMinistryTestimonial(
        ministry_id=ministry.id,
        user_id=current_user.id,
        author_name=current_user.name,
        content=body.content,
        author_role=body.author_role,
        rating=body.rating,
        photo_url=body.photo_url,
        is_approved=False,
    )
    db.add(t)
    await db.commit()
    await db.refresh(t)
    return t


@router.post("/{slug}/testimonials/{tid}/approve")
async def approve_testimonial(
    slug: str, tid: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Approve testimonial (coordinator/admin)."""
    ministry = await _get_ministry_or_404(db, slug)
    await _require_coordinator(db, ministry, current_user)
    res = await db.execute(
        select(CustomMinistryTestimonial).where(and_(
            CustomMinistryTestimonial.id == tid,
            CustomMinistryTestimonial.ministry_id == ministry.id,
        ))
    )
    t = res.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    t.is_approved = True
    await db.commit()
    return {"message": "Testimonial approved"}


# ═══════════════════════════════════════════════════════════════════════════
# PRAYER REQUESTS
# ═══════════════════════════════════════════════════════════════════════════

class PrayerRequestCreate(BaseModel):
    request: str = Field(..., min_length=10)
    is_anonymous: bool = False
    is_urgent: bool = False
    is_visible_to_public: bool = False


class PrayerRequestResponse(BaseModel):
    id: str
    author_name: str
    request: str
    is_anonymous: bool
    is_urgent: bool
    is_answered: bool
    answer_testimony: Optional[str] = None
    prayer_count: int
    created_at: datetime


@router.get("/{slug}/prayer-requests", response_model=List[PrayerRequestResponse])
async def list_prayer_requests(
    slug: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List prayer requests (members only)."""
    ministry = await _get_ministry_or_404(db, slug)
    if not (await _is_member(db, ministry, current_user) or
            await _is_coordinator_or_admin(db, ministry, current_user)):
        raise HTTPException(status_code=403, detail="Members only")

    res = await db.execute(
        select(CustomMinistryPrayerRequest)
        .where(CustomMinistryPrayerRequest.ministry_id == ministry.id)
        .order_by(
            CustomMinistryPrayerRequest.is_urgent.desc(),
            CustomMinistryPrayerRequest.created_at.desc()
        )
    )
    requests = res.scalars().all()
    return [
        PrayerRequestResponse(
            id=r.id,
            author_name="Anonymous" if r.is_anonymous else r.author_name,
            request=r.request,
            is_anonymous=r.is_anonymous,
            is_urgent=r.is_urgent,
            is_answered=r.is_answered,
            answer_testimony=r.answer_testimony,
            prayer_count=r.prayer_count,
            created_at=r.created_at,
        ) for r in requests
    ]


@router.post("/{slug}/prayer-requests", response_model=PrayerRequestResponse, status_code=201)
async def add_prayer_request(
    slug: str, body: PrayerRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Submit prayer request."""
    ministry = await _get_ministry_or_404(db, slug)
    pr = CustomMinistryPrayerRequest(
        ministry_id=ministry.id,
        user_id=current_user.id,
        author_name=current_user.name,
        request=body.request,
        is_anonymous=body.is_anonymous,
        is_urgent=body.is_urgent,
        is_visible_to_public=body.is_visible_to_public,
    )
    db.add(pr)
    await db.commit()
    await db.refresh(pr)
    return PrayerRequestResponse(
        id=pr.id,
        author_name="Anonymous" if pr.is_anonymous else pr.author_name,
        request=pr.request,
        is_anonymous=pr.is_anonymous,
        is_urgent=pr.is_urgent,
        is_answered=False,
        answer_testimony=None,
        prayer_count=0,
        created_at=pr.created_at,
    )


@router.post("/{slug}/prayer-requests/{pid}/pray")
async def increment_prayer_count(
    slug: str, pid: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Increment prayer count (I'm praying for this)."""
    ministry = await _get_ministry_or_404(db, slug)
    res = await db.execute(
        select(CustomMinistryPrayerRequest).where(and_(
            CustomMinistryPrayerRequest.id == pid,
            CustomMinistryPrayerRequest.ministry_id == ministry.id,
        ))
    )
    pr = res.scalar_one_or_none()
    if not pr:
        raise HTTPException(status_code=404, detail="Prayer request not found")
    pr.prayer_count += 1
    await db.commit()
    return {"prayer_count": pr.prayer_count}


# ═══════════════════════════════════════════════════════════════════════════
# ACTIVITY LOG
# ═══════════════════════════════════════════════════════════════════════════

class ActivityCreate(BaseModel):
    activity_type: str
    title: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    activity_date: date_type
    duration_hours: Optional[float] = None
    participants_count: Optional[int] = None
    lives_impacted: Optional[int] = None
    location: Optional[str] = None
    image_url: Optional[str] = None


class ActivityResponse(BaseModel):
    id: str
    activity_type: str
    title: str
    description: Optional[str] = None
    activity_date: date_type
    duration_hours: Optional[float] = None
    participants_count: Optional[int] = None
    lives_impacted: Optional[int] = None
    location: Optional[str] = None
    image_url: Optional[str] = None
    created_at: datetime


@router.get("/{slug}/activities", response_model=List[ActivityResponse])
async def list_activities(slug: str, db: AsyncSession = Depends(get_db)):
    """List activities (public)."""
    ministry = await _get_ministry_or_404(db, slug)
    res = await db.execute(
        select(CustomMinistryActivity)
        .where(CustomMinistryActivity.ministry_id == ministry.id)
        .order_by(CustomMinistryActivity.activity_date.desc())
    )
    return res.scalars().all()


@router.post("/{slug}/activities", response_model=ActivityResponse, status_code=201)
async def log_activity(
    slug: str, body: ActivityCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Log activity (coordinator/admin)."""
    ministry = await _get_ministry_or_404(db, slug)
    await _require_coordinator(db, ministry, current_user)
    activity = CustomMinistryActivity(
        ministry_id=ministry.id, user_id=current_user.id, **body.model_dump()
    )
    db.add(activity)
    await db.commit()
    await db.refresh(activity)
    return activity


# ═══════════════════════════════════════════════════════════════════════════
# STATS / DASHBOARD
# ═══════════════════════════════════════════════════════════════════════════

@router.get("/{slug}/stats")
async def get_stats(slug: str, db: AsyncSession = Depends(get_db)):
    """Get ministry statistics (public)."""
    from sqlalchemy import func as sql_func
    ministry = await _get_ministry_or_404(db, slug)

    async def count(model, *conditions):
        q = select(sql_func.count(model.id)).where(model.ministry_id == ministry.id)
        for c in conditions:
            q = q.where(c)
        r = await db.execute(q)
        return r.scalar() or 0

    return {
        "members": await count(CustomMinistryMember, CustomMinistryMember.status == MinistryMembershipStatus.ACTIVE),
        "pending_members": await count(CustomMinistryMember, CustomMinistryMember.status == MinistryMembershipStatus.PENDING),
        "events": await count(CustomMinistryEvent),
        "upcoming_events": await count(CustomMinistryEvent, CustomMinistryEvent.event_date >= date_type.today()),
        "resources": await count(CustomMinistryResource),
        "announcements": await count(CustomMinistryAnnouncement),
        "testimonials": await count(CustomMinistryTestimonial, CustomMinistryTestimonial.is_approved == True),
        "prayer_requests": await count(CustomMinistryPrayerRequest),
        "answered_prayers": await count(CustomMinistryPrayerRequest, CustomMinistryPrayerRequest.is_answered == True),
        "activities": await count(CustomMinistryActivity),
        "leaders": await count(CustomMinistryLeader),
    }
