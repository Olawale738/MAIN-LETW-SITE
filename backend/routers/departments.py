"""
Department management API.
Covers Choir, Youth, and Children departments.

Access rules:
  - ADMIN            → full access to all departments
  - CHOIRMASTER      → full access to choir
  - YOUTH_LEADER     → full access to youth
  - CHILDREN_COORD   → full access to children
  - USER (member)    → read-only for their own department(s)
  - Role assignment  → ADMIN only
"""

from datetime import date as date_type
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, field_validator
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, and_

from database import get_db
from models.user import User, UserRole
from models.department import (
    DepartmentMember, DepartmentAnnouncement,
    DepartmentActivity, AttendanceRecord, DepartmentMessage,
    DepartmentType, ActivityType,
)
from models.notification import Notification, NotificationType
from utils.dependencies import get_current_active_user, get_admin_user

router = APIRouter(prefix="/api/departments", tags=["Departments"])
admin_router = APIRouter(prefix="/api/admin", tags=["Admin"])

# ─── Role → Department mapping ────────────────────────────────────────────────

ROLE_DEPT: dict[UserRole, DepartmentType] = {
    UserRole.CHOIRMASTER:          DepartmentType.CHOIR,
    UserRole.YOUTH_LEADER:         DepartmentType.YOUTH,
    UserRole.CHILDREN_COORDINATOR: DepartmentType.CHILDREN,
}

LEADER_ROLES = {UserRole.CHOIRMASTER, UserRole.YOUTH_LEADER, UserRole.CHILDREN_COORDINATOR}


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _parse_dept(dept: str) -> DepartmentType:
    try:
        return DepartmentType(dept.lower())
    except ValueError:
        raise HTTPException(status_code=404, detail=f"Department '{dept}' not found. Valid: choir, youth, children, media, hospitality, ushering, security.")


async def _require_leader(dept: DepartmentType, user: User, db: AsyncSession | None = None) -> None:
    """Raise 403 unless the user is Admin, the role-based leader of this dept,
    or an admin-assigned coordinator (active DepartmentMember with is_coordinator)."""
    if user.role == UserRole.ADMIN:
        return
    if ROLE_DEPT.get(user.role) == dept:
        return
    if db is not None:
        result = await db.execute(
            select(DepartmentMember).where(and_(
                DepartmentMember.user_id == user.id,
                DepartmentMember.department == dept,
                DepartmentMember.is_active == True,
                DepartmentMember.is_coordinator == True,
            ))
        )
        if result.scalar_one_or_none():
            return
    raise HTTPException(status_code=403, detail="Access denied for this department.")


async def _require_member_or_leader(dept: DepartmentType, user: User, db: AsyncSession) -> None:
    """Raise 403 unless the user is a member/leader/admin of this dept."""
    if user.role == UserRole.ADMIN or ROLE_DEPT.get(user.role) == dept:
        return
    result = await db.execute(
        select(DepartmentMember).where(
            and_(DepartmentMember.user_id == user.id,
                 DepartmentMember.department == dept,
                 DepartmentMember.is_active == True)
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="You are not a member of this department.")


# ─── Schemas ─────────────────────────────────────────────────────────────────

class MemberOut(BaseModel):
    id: str
    user_id: str
    name: str
    email: str
    role_label: Optional[str]
    is_active: bool
    is_coordinator: bool = False
    notes: Optional[str]
    extra_info: Optional[dict]
    joined_at: str

    class Config:
        from_attributes = True


class AddMemberRequest(BaseModel):
    email: str
    role_label: Optional[str] = None
    notes: Optional[str] = None
    extra_info: Optional[dict] = None


class UpdateMemberRequest(BaseModel):
    role_label: Optional[str] = None
    is_active: Optional[bool] = None
    is_coordinator: Optional[bool] = None
    notes: Optional[str] = None
    extra_info: Optional[dict] = None


class AnnouncementOut(BaseModel):
    id: str
    department: str
    title: str
    body: str
    author_name: Optional[str]
    is_urgent: bool
    is_pinned: bool
    created_at: str

    class Config:
        from_attributes = True


class CreateAnnouncementRequest(BaseModel):
    title: str
    body: str
    is_urgent: bool = False
    is_pinned: bool = False

    @field_validator("title", "body")
    @classmethod
    def not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Field cannot be blank")
        return v.strip()


class ActivityOut(BaseModel):
    id: str
    department: str
    title: str
    description: Optional[str]
    activity_type: str
    activity_date: Optional[str]
    activity_time: Optional[str]
    venue: Optional[str]
    creator_name: Optional[str]
    created_at: str

    class Config:
        from_attributes = True


class CreateActivityRequest(BaseModel):
    title: str
    description: Optional[str] = None
    activity_type: str = "meeting"
    activity_date: Optional[str] = None   # YYYY-MM-DD
    activity_time: Optional[str] = None   # HH:MM
    venue: Optional[str] = None

    @field_validator("title")
    @classmethod
    def not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Title cannot be blank")
        return v.strip()


class AttendanceOut(BaseModel):
    id: str
    user_id: str
    member_name: str
    session_label: str
    session_date: str
    present: bool
    notes: Optional[str]

    class Config:
        from_attributes = True


class AttendanceEntry(BaseModel):
    user_id: str
    present: bool
    notes: Optional[str] = None


class BulkAttendanceRequest(BaseModel):
    session_label: str
    session_date: str   # YYYY-MM-DD
    entries: List[AttendanceEntry]


class AssignRoleRequest(BaseModel):
    user_id: str
    role: str  # choirmaster | youth_leader | children_coordinator

    @field_validator("role")
    @classmethod
    def valid_role(cls, v: str) -> str:
        allowed = {"choirmaster", "youth_leader", "children_coordinator"}
        if v not in allowed:
            raise ValueError(f"role must be one of {allowed}")
        return v


class RevokeRoleRequest(BaseModel):
    user_id: str


# ─── Department Stats ─────────────────────────────────────────────────────────

@router.get("/{dept}/stats")
async def get_dept_stats(
    dept: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    d = _parse_dept(dept)
    await _require_leader(d, current_user, db)

    members_result = await db.execute(
        select(DepartmentMember).where(
            and_(DepartmentMember.department == d, DepartmentMember.is_active == True)
        )
    )
    members = members_result.scalars().all()

    ann_result = await db.execute(
        select(DepartmentAnnouncement).where(DepartmentAnnouncement.department == d)
    )
    activities_result = await db.execute(
        select(DepartmentActivity).where(DepartmentActivity.department == d)
    )

    return {
        "total_members": len(members),
        "total_announcements": len(ann_result.scalars().all()),
        "total_activities": len(activities_result.scalars().all()),
    }


# ─── Members ─────────────────────────────────────────────────────────────────

@router.get("/{dept}/members", response_model=List[MemberOut])
async def list_members(
    dept: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    d = _parse_dept(dept)
    await _require_leader(d, current_user, db)

    result = await db.execute(
        select(DepartmentMember)
        .where(DepartmentMember.department == d)
        .order_by(DepartmentMember.joined_at.asc())
    )
    rows = result.scalars().all()
    return [
        MemberOut(
            id=r.id,
            user_id=r.user_id,
            name=r.user.name,
            email=r.user.email,
            role_label=r.role_label,
            is_active=r.is_active,
            is_coordinator=r.is_coordinator,
            notes=r.notes,
            extra_info=r.extra_info,
            joined_at=r.joined_at.isoformat(),
        )
        for r in rows
    ]


@router.post("/{dept}/members", status_code=201)
async def add_member(
    dept: str,
    body: AddMemberRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    d = _parse_dept(dept)
    await _require_leader(d, current_user, db)

    # Find target user by email
    result = await db.execute(select(User).where(User.email == body.email.lower().strip()))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="No registered user found with that email address.")

    # Check for existing membership
    existing = await db.execute(
        select(DepartmentMember).where(
            and_(DepartmentMember.user_id == target.id, DepartmentMember.department == d)
        )
    )
    dm = existing.scalar_one_or_none()
    if dm:
        if dm.is_active:
            raise HTTPException(status_code=409, detail="This user is already a member of this department.")
        # Re-activate
        dm.is_active = True
        dm.role_label = body.role_label or dm.role_label
        dm.notes = body.notes or dm.notes
        await db.commit()
        return {"message": f"{target.name} re-added to {dept} department."}

    db.add(DepartmentMember(
        user_id=target.id,
        department=d,
        role_label=body.role_label,
        notes=body.notes,
        extra_info=body.extra_info,
    ))
    await db.commit()
    return {"message": f"{target.name} added to {dept} department."}


@router.patch("/{dept}/members/{user_id}")
async def update_member(
    dept: str,
    user_id: str,
    body: UpdateMemberRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    d = _parse_dept(dept)
    await _require_leader(d, current_user, db)

    result = await db.execute(
        select(DepartmentMember).where(
            and_(DepartmentMember.user_id == user_id, DepartmentMember.department == d)
        )
    )
    dm = result.scalar_one_or_none()
    if not dm:
        raise HTTPException(status_code=404, detail="Member not found in this department.")

    if body.role_label is not None:
        dm.role_label = body.role_label
    if body.is_active is not None:
        dm.is_active = body.is_active
    if body.is_coordinator is not None:
        # Only an Admin may appoint/remove a department coordinator
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Only an admin can assign a coordinator.")
        dm.is_coordinator = body.is_coordinator
        if body.is_coordinator:
            dm.is_active = True  # a coordinator must be active
            if not dm.role_label:
                dm.role_label = "Coordinator"
    if body.notes is not None:
        dm.notes = body.notes
    if body.extra_info is not None:
        dm.extra_info = body.extra_info

    await db.commit()
    return {"message": "Member updated."}


@router.delete("/{dept}/members/{user_id}")
async def remove_member(
    dept: str,
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    d = _parse_dept(dept)
    await _require_leader(d, current_user, db)

    result = await db.execute(
        select(DepartmentMember).where(
            and_(DepartmentMember.user_id == user_id, DepartmentMember.department == d)
        )
    )
    dm = result.scalar_one_or_none()
    if not dm:
        raise HTTPException(status_code=404, detail="Member not found.")

    dm.is_active = False   # soft-delete
    await db.commit()
    return {"message": "Member removed from department."}


# ─── Announcements ───────────────────────────────────────────────────────────

@router.get("/{dept}/announcements", response_model=List[AnnouncementOut])
async def list_announcements(
    dept: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    d = _parse_dept(dept)
    await _require_member_or_leader(d, current_user, db)

    result = await db.execute(
        select(DepartmentAnnouncement)
        .where(DepartmentAnnouncement.department == d)
        .order_by(DepartmentAnnouncement.is_pinned.desc(), DepartmentAnnouncement.created_at.desc())
    )
    rows = result.scalars().all()
    return [
        AnnouncementOut(
            id=r.id,
            department=r.department.value,
            title=r.title,
            body=r.body,
            author_name=r.author.name if r.author else None,
            is_urgent=r.is_urgent,
            is_pinned=r.is_pinned,
            created_at=r.created_at.isoformat(),
        )
        for r in rows
    ]


@router.post("/{dept}/announcements", status_code=201)
async def create_announcement(
    dept: str,
    body: CreateAnnouncementRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    d = _parse_dept(dept)
    await _require_leader(d, current_user, db)

    db.add(DepartmentAnnouncement(
        department=d,
        title=body.title,
        body=body.body,
        author_id=current_user.id,
        is_urgent=body.is_urgent,
        is_pinned=body.is_pinned,
    ))
    await db.commit()
    return {"message": "Announcement posted."}


@router.delete("/{dept}/announcements/{ann_id}")
async def delete_announcement(
    dept: str,
    ann_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    d = _parse_dept(dept)
    await _require_leader(d, current_user, db)

    await db.execute(
        delete(DepartmentAnnouncement).where(
            and_(DepartmentAnnouncement.id == ann_id, DepartmentAnnouncement.department == d)
        )
    )
    await db.commit()
    return {"message": "Announcement deleted."}


# ─── Activities ───────────────────────────────────────────────────────────────

@router.get("/{dept}/activities", response_model=List[ActivityOut])
async def list_activities(
    dept: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    d = _parse_dept(dept)
    await _require_member_or_leader(d, current_user, db)

    result = await db.execute(
        select(DepartmentActivity)
        .where(DepartmentActivity.department == d)
        .order_by(DepartmentActivity.activity_date.asc().nullslast(), DepartmentActivity.created_at.desc())
    )
    rows = result.scalars().all()
    return [
        ActivityOut(
            id=r.id,
            department=r.department.value,
            title=r.title,
            description=r.description,
            activity_type=r.activity_type.value,
            activity_date=r.activity_date.isoformat() if r.activity_date else None,
            activity_time=r.activity_time,
            venue=r.venue,
            creator_name=r.creator.name if r.creator else None,
            created_at=r.created_at.isoformat(),
        )
        for r in rows
    ]


@router.post("/{dept}/activities", status_code=201)
async def create_activity(
    dept: str,
    body: CreateActivityRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    d = _parse_dept(dept)
    await _require_leader(d, current_user, db)

    act_date = None
    if body.activity_date:
        try:
            act_date = date_type.fromisoformat(body.activity_date)
        except ValueError:
            raise HTTPException(status_code=422, detail="Invalid date format. Use YYYY-MM-DD.")

    try:
        act_type = ActivityType(body.activity_type)
    except ValueError:
        act_type = ActivityType.MEETING

    db.add(DepartmentActivity(
        department=d,
        title=body.title,
        description=body.description,
        activity_type=act_type,
        activity_date=act_date,
        activity_time=body.activity_time,
        venue=body.venue,
        created_by=current_user.id,
    ))
    await db.commit()
    return {"message": "Activity created."}


@router.delete("/{dept}/activities/{act_id}")
async def delete_activity(
    dept: str,
    act_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    d = _parse_dept(dept)
    await _require_leader(d, current_user, db)

    await db.execute(
        delete(DepartmentActivity).where(
            and_(DepartmentActivity.id == act_id, DepartmentActivity.department == d)
        )
    )
    await db.commit()
    return {"message": "Activity deleted."}


# ─── Attendance ───────────────────────────────────────────────────────────────

@router.get("/{dept}/attendance")
async def list_attendance(
    dept: str,
    session_label: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    d = _parse_dept(dept)
    await _require_leader(d, current_user, db)

    q = select(AttendanceRecord).where(AttendanceRecord.department == d)
    if session_label:
        q = q.where(AttendanceRecord.session_label == session_label)
    q = q.order_by(AttendanceRecord.session_date.desc(), AttendanceRecord.created_at.asc())

    result = await db.execute(q)
    rows = result.scalars().all()
    return [
        AttendanceOut(
            id=r.id,
            user_id=r.user_id,
            member_name=r.member.name,
            session_label=r.session_label,
            session_date=r.session_date.isoformat(),
            present=r.present,
            notes=r.notes,
        )
        for r in rows
    ]


@router.get("/{dept}/attendance/me")
async def my_attendance(
    dept: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    d = _parse_dept(dept)
    await _require_member_or_leader(d, current_user, db)

    result = await db.execute(
        select(AttendanceRecord).where(
            and_(AttendanceRecord.user_id == current_user.id, AttendanceRecord.department == d)
        ).order_by(AttendanceRecord.session_date.desc())
    )
    rows = result.scalars().all()
    return [
        {
            "session_label": r.session_label,
            "session_date": r.session_date.isoformat(),
            "present": r.present,
            "notes": r.notes,
        }
        for r in rows
    ]


@router.post("/{dept}/attendance/session", status_code=201)
async def record_session_attendance(
    dept: str,
    body: BulkAttendanceRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    d = _parse_dept(dept)
    await _require_leader(d, current_user, db)

    try:
        sess_date = date_type.fromisoformat(body.session_date)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid date. Use YYYY-MM-DD.")

    for entry in body.entries:
        # Upsert: delete old record for same (user, dept, session) then insert fresh
        await db.execute(
            delete(AttendanceRecord).where(
                and_(
                    AttendanceRecord.user_id == entry.user_id,
                    AttendanceRecord.department == d,
                    AttendanceRecord.session_label == body.session_label,
                )
            )
        )
        db.add(AttendanceRecord(
            user_id=entry.user_id,
            department=d,
            session_label=body.session_label,
            session_date=sess_date,
            present=entry.present,
            notes=entry.notes,
            recorded_by=current_user.id,
        ))

    await db.commit()
    return {"message": f"Attendance recorded for {len(body.entries)} member(s)."}


# ─── My memberships ───────────────────────────────────────────────────────────

@router.get("/me")
async def my_memberships(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(
        select(DepartmentMember).where(
            and_(DepartmentMember.user_id == current_user.id, DepartmentMember.is_active == True)
        )
    )
    rows = result.scalars().all()
    return [
        {
            "department": r.department.value,
            "role_label": r.role_label,
            "joined_at": r.joined_at.isoformat(),
        }
        for r in rows
    ]


# ─── Admin: Role assignment ───────────────────────────────────────────────────

@admin_router.get("/users")
async def admin_list_users(
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    q = select(User).order_by(User.name.asc())
    result = await db.execute(q)
    users = result.scalars().all()
    items = [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role.value,
            "status": u.status.value,
            "created_at": u.created_at.isoformat(),
        }
        for u in users
        if not search or search.lower() in u.name.lower() or search.lower() in u.email.lower()
    ]
    return items


@admin_router.get("/department-members")
async def admin_all_department_members(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    """All department memberships across every department, with user info and
    status — powers the admin Volunteer Directory so it reflects exactly what
    volunteers see on their dashboard."""
    result = await db.execute(
        select(DepartmentMember, User)
        .join(User, User.id == DepartmentMember.user_id)
        .order_by(DepartmentMember.department, User.name.asc())
    )
    rows = result.all()
    return [
        {
            "id": dm.id,
            "user_id": dm.user_id,
            "name": u.name,
            "email": u.email,
            "department": dm.department.value,
            "role_label": dm.role_label,
            "is_active": dm.is_active,
            "is_coordinator": getattr(dm, "is_coordinator", False),
            "joined_at": dm.joined_at.isoformat() if dm.joined_at else None,
        }
        for dm, u in rows
    ]


@admin_router.get("/pending-dept-requests")
async def admin_pending_dept_requests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    """All pending (is_active=False) department join requests — the ones needing admin approval."""
    result = await db.execute(
        select(DepartmentMember, User)
        .join(User, User.id == DepartmentMember.user_id)
        .where(DepartmentMember.is_active == False)
        .order_by(DepartmentMember.joined_at.desc())
    )
    rows = result.all()
    return [
        {
            "id": dm.id,
            "user_id": dm.user_id,
            "name": u.name,
            "email": u.email,
            "department": dm.department.value,
            "is_coordinator": getattr(dm, "is_coordinator", False),
            "joined_at": dm.joined_at.isoformat() if dm.joined_at else None,
        }
        for dm, u in rows
    ]


class ApproveDeptMemberBody(BaseModel):
    notify: bool = True


@admin_router.post("/dept-members/{dept}/{user_id}/approve")
async def admin_approve_dept_member(
    dept: str,
    user_id: str,
    body: ApproveDeptMemberBody = ApproveDeptMemberBody(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    """Approve a pending dept join request and notify the member."""
    d = _parse_dept(dept)
    result = await db.execute(
        select(DepartmentMember).where(
            and_(DepartmentMember.user_id == user_id, DepartmentMember.department == d)
        )
    )
    dm = result.scalar_one_or_none()
    if not dm:
        raise HTTPException(status_code=404, detail="Membership not found.")
    dm.is_active = True
    if body.notify:
        dept_label = d.value.replace("_", " ").title()
        db.add(Notification(
            user_id=user_id,
            title=f"✅ Welcome to {dept_label}!",
            message=(
                f"Your request to join the {dept_label} department has been approved by an admin. "
                f"Open your volunteer dashboard to access the team area."
            ),
            type=NotificationType.SERVICE_APPROVED,
            reference_id=dm.id,
        ))
    await db.commit()
    return {"message": "Member approved.", "status": "approved"}


@admin_router.post("/dept-members/{dept}/{user_id}/reject")
async def admin_reject_dept_member(
    dept: str,
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    """Reject (remove) a pending dept join request and notify the member."""
    d = _parse_dept(dept)
    result = await db.execute(
        select(DepartmentMember).where(
            and_(DepartmentMember.user_id == user_id, DepartmentMember.department == d)
        )
    )
    dm = result.scalar_one_or_none()
    if not dm:
        raise HTTPException(status_code=404, detail="Membership not found.")
    await db.delete(dm)
    dept_label = d.value.replace("_", " ").title()
    db.add(Notification(
        user_id=user_id,
        title=f"Update on your {dept_label} request",
        message=(
            f"Your request to join the {dept_label} department was not approved at this time. "
            f"Please contact an admin if you have questions."
        ),
        type=NotificationType.GENERAL,
        reference_id=user_id,
    ))
    await db.commit()
    return {"message": "Request rejected.", "status": "rejected"}


class AssignCoordinatorBody(BaseModel):
    open_dm: bool = True   # whether to auto-open an admin → coordinator DM thread


@admin_router.post("/dept-members/{dept}/{user_id}/assign-coordinator")
async def admin_assign_dept_coordinator(
    dept: str,
    user_id: str,
    body: AssignCoordinatorBody = AssignCoordinatorBody(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    """
    Promote a dept member to coordinator:
    - Sets is_coordinator=True, is_active=True
    - Sends the member a notification
    - Optionally creates a DM conversation between admin and coordinator
    """
    d = _parse_dept(dept)
    result = await db.execute(
        select(DepartmentMember).where(
            and_(DepartmentMember.user_id == user_id, DepartmentMember.department == d)
        )
    )
    dm = result.scalar_one_or_none()
    if not dm:
        raise HTTPException(status_code=404, detail="Membership not found.")

    dm.is_coordinator = True
    dm.is_active = True
    if not dm.role_label:
        dm.role_label = "Coordinator"

    dept_label = d.value.replace("_", " ").title()
    db.add(Notification(
        user_id=user_id,
        title=f"🎖️ You're now a {dept_label} Coordinator!",
        message=(
            f"Admin has appointed you as the {dept_label} department coordinator. "
            f"You can now approve new members, manage activities, and communicate "
            f"with your team directly from the {dept_label} dashboard."
        ),
        type=NotificationType.SERVICE_APPROVED,
        reference_id=dm.id,
    ))

    conv_id = None
    if body.open_dm:
        # Open a dedicated admin→coordinator conversation so they can communicate
        from models.message import Conversation, ConversationStatus
        from datetime import datetime
        coord_user = await db.execute(select(User).where(User.id == user_id))
        coord = coord_user.scalar_one_or_none()
        if coord:
            intro = (
                f"Hi {coord.name}! Congratulations on being appointed as the "
                f"{dept_label} Coordinator. This is your direct line to me "
                f"(the admin) — use it to flag anything that needs my attention, "
                f"ask questions, or share updates about the {dept_label} team. "
                f"God bless your service! 🙏"
            )
            from models.message import Message as DMsg
            conv = Conversation(
                user_id=coord.id,
                admin_id=current_user.id,
                subject=f"{dept_label} Coordinator — Direct Line",
                status=ConversationStatus.OPEN,
                last_message_preview=intro[:200],
                last_message_at=datetime.utcnow(),
                unread_for_user=1,
                unread_for_admin=0,
            )
            db.add(conv)
            await db.flush()
            db.add(DMsg(conversation_id=conv.id, sender_id=current_user.id, body=intro))
            conv_id = conv.id

    await db.commit()
    return {
        "message": f"{dm.role_label} assigned.",
        "status": "coordinator",
        "conversation_id": conv_id,
    }


@admin_router.get("/leaders")
async def admin_list_leaders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    result = await db.execute(select(User).where(User.role.in_(list(LEADER_ROLES))))
    leaders = result.scalars().all()
    return [
        {"id": u.id, "name": u.name, "email": u.email, "role": u.role.value}
        for u in leaders
    ]


# ─── Self-join ────────────────────────────────────────────────────────────────

@router.post("/{dept}/join")
async def join_department(
    dept: str,
    pending: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Join a department.

    - pending=False (default): join immediately as an active member. Used for
      open ministries (e.g. choir) where access is granted on request.
    - pending=True: create an INACTIVE membership that an admin/coordinator must
      approve before the member gains dashboard access. Used for the volunteer
      departments (media, hospitality, ushering, security).
    """
    d = _parse_dept(dept)

    existing = await db.execute(
        select(DepartmentMember).where(
            and_(DepartmentMember.user_id == current_user.id, DepartmentMember.department == d)
        )
    )
    dm = existing.scalar_one_or_none()

    if dm:
        if dm.is_active:
            return {"message": "You are already a member of this department.", "status": "already_member"}
        if pending:
            # Leave as pending — still awaiting approval
            return {"message": "Your request is awaiting admin approval.", "status": "pending"}
        dm.is_active = True
        await db.commit()
        return {"message": "Your membership has been reactivated!", "status": "reactivated"}

    db.add(DepartmentMember(user_id=current_user.id, department=d, is_active=not pending))
    await db.flush()   # persist member row before notifications

    if pending:
        # Notify every admin about the new pending join request
        admins_result = await db.execute(select(User).where(User.role == UserRole.ADMIN))
        dept_label = d.value.replace("_", " ").title()
        for admin in admins_result.scalars().all():
            db.add(Notification(
                user_id=admin.id,
                title=f"New {dept_label} join request",
                message=(
                    f"{current_user.name} has requested to join the {dept_label} department "
                    f"and is awaiting your approval."
                ),
                type=NotificationType.GENERAL,
                reference_id=current_user.id,
            ))

    await db.commit()
    if pending:
        return {"message": "Request submitted — awaiting admin approval.", "status": "pending"}
    return {"message": f"You have successfully joined the {dept} ministry!", "status": "joined"}


@router.get("/{dept}/membership/me")
async def my_membership_status(
    dept: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Check whether the current user is a member of a given department."""
    d = _parse_dept(dept)
    result = await db.execute(
        select(DepartmentMember).where(
            and_(DepartmentMember.user_id == current_user.id, DepartmentMember.department == d)
        )
    )
    dm = result.scalar_one_or_none()
    if not dm:
        return {"is_member": False, "is_active": False, "is_coordinator": False, "role_label": None, "joined_at": None}
    return {
        "is_member": True,
        "is_active": dm.is_active,
        "is_coordinator": dm.is_coordinator,
        "role_label": dm.role_label,
        "joined_at": dm.joined_at.isoformat(),
    }


# ─── Group Chat ───────────────────────────────────────────────────────────────

class SendMessageRequest(BaseModel):
    content: str

    @field_validator("content")
    @classmethod
    def not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Message cannot be blank")
        return v.strip()


@router.get("/{dept}/chat")
async def get_chat_messages(
    dept: str,
    limit: int = 60,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Return the latest messages for this department's group chat."""
    d = _parse_dept(dept)
    result = await db.execute(
        select(DepartmentMessage)
        .where(DepartmentMessage.department == d)
        .order_by(DepartmentMessage.created_at.desc())
        .limit(limit)
    )
    rows = list(reversed(result.scalars().all()))
    return [
        {
            "id": r.id,
            "user_id": r.user_id,
            "sender_name": r.sender.name,
            "content": r.content,
            "created_at": r.created_at.isoformat(),
            "is_mine": r.user_id == current_user.id,
        }
        for r in rows
    ]


@router.delete("/{dept}/chat/{msg_id}")
async def delete_dept_chat_message(
    dept: str,
    msg_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Admin or department coordinator: hard-delete a department chat message."""
    d = _parse_dept(dept)
    await _require_leader(d, current_user, db)

    result = await db.execute(
        select(DepartmentMessage).where(
            and_(DepartmentMessage.id == msg_id, DepartmentMessage.department == d)
        )
    )
    msg = result.scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found.")

    await db.delete(msg)
    await db.commit()
    return {"message": "Message deleted."}


@router.post("/{dept}/chat", status_code=201)
async def send_chat_message(
    dept: str,
    body: SendMessageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Send a message to the department group chat."""
    d = _parse_dept(dept)
    msg = DepartmentMessage(department=d, user_id=current_user.id, content=body.content)
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return {
        "id": msg.id,
        "user_id": msg.user_id,
        "sender_name": current_user.name,
        "content": msg.content,
        "created_at": msg.created_at.isoformat(),
        "is_mine": True,
    }


@router.post("/{dept}/members/{user_id}/open-dm")
async def open_coordinator_dm(
    dept: str,
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Coordinator or admin opens a direct-message thread with a department member.
    - Requires coordinator or admin access for this department.
    - If a conversation already exists between these two users, returns it.
    - If not, creates a new one with a welcome intro message from the coordinator.
    """
    from sqlalchemy import or_
    from datetime import datetime

    d = _parse_dept(dept)
    await _require_leader(d, current_user, db)  # coordinator or admin only

    if current_user.id == user_id:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="You cannot message yourself.")

    # Make sure the target user exists
    target_result = await db.execute(select(User).where(User.id == user_id))
    target = target_result.scalar_one_or_none()
    if not target:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="User not found.")

    # Check for existing conversation between these two users (either orientation)
    from models.message import Conversation, ConversationStatus, Message as DMsg
    existing_result = await db.execute(
        select(Conversation).where(
            or_(
                and_(Conversation.user_id == user_id, Conversation.admin_id == current_user.id),
                and_(Conversation.user_id == current_user.id, Conversation.admin_id == user_id),
            )
        )
    )
    conv = existing_result.scalars().first()
    already_existed = conv is not None

    if not conv:
        dept_label = d.value.replace("_", " ").title()
        role_word = "coordinator" if current_user.role != UserRole.ADMIN else "admin"
        intro = (
            f"Hi {target.name}! I'm {current_user.name}, the {dept_label} {role_word}. "
            f"This is your direct line — feel free to message me here with any questions, "
            f"updates, or anything related to our {dept_label} activities. "
            f"Looking forward to serving together! 🙏"
        )
        now = datetime.utcnow()
        conv = Conversation(
            user_id=user_id,           # volunteer is the "user" side
            admin_id=current_user.id,  # coordinator is the "admin" slot
            subject=f"{dept_label} — Coordinator Chat",
            status=ConversationStatus.OPEN,
            last_message_preview=intro[:200],
            last_message_at=now,
            unread_for_user=1,
            unread_for_admin=0,
        )
        db.add(conv)
        await db.flush()
        db.add(DMsg(conversation_id=conv.id, sender_id=current_user.id, body=intro))

        # Notify the volunteer
        db.add(Notification(
            user_id=user_id,
            title=f"💬 Message from {current_user.name}",
            message=(
                f"Your {dept_label} coordinator has sent you a message. "
                f"Open your messages to read and reply."
            ),
            type=NotificationType.GENERAL,
            reference_id=conv.id,
        ))
        await db.commit()

    return {
        "conversation_id": conv.id,
        "already_existed": already_existed,
    }


@admin_router.post("/role/assign")
async def assign_role(
    body: AssignRoleRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    result = await db.execute(select(User).where(User.id == body.user_id))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")
    if target.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot change your own role here.")

    target.role = UserRole(body.role)
    await db.commit()
    return {"message": f"{target.name} has been assigned the role: {body.role}"}


@admin_router.post("/role/revoke")
async def revoke_role(
    body: RevokeRoleRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    result = await db.execute(select(User).where(User.id == body.user_id))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")
    if target.role not in LEADER_ROLES:
        raise HTTPException(status_code=400, detail="This user does not hold a leadership role.")

    target.role = UserRole.USER
    await db.commit()
    return {"message": f"{target.name}'s leadership role has been revoked."}
