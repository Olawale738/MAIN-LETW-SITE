"""
Moderator Management API.

A moderator is a non-admin user the admin has granted access to one or more
admin sections (scopes). Admins implicitly have every scope.

The SCOPES catalog below is the canonical A-Z list of admin areas. Each
existing admin endpoint can adopt `require_scope("…")` to honour these.
"""

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.user import User, UserRole
from models.moderator_grant import ModeratorGrant
from utils.dependencies import get_admin_user, get_current_active_user


router = APIRouter(prefix="/api/admin/moderators", tags=["Moderators"])


# ─── Scope catalog (A-Z) ─────────────────────────────────────────────────────
# Each entry: { key, label, group }. Order is what the admin UI renders.
SCOPES: list[dict] = [
    # Communication
    {"key": "announcements",      "label": "Announcements",         "group": "Communication"},
    {"key": "chat",               "label": "Messages / Live Chat",  "group": "Communication"},
    {"key": "newsletter",         "label": "Newsletter",            "group": "Communication"},
    {"key": "welcome_flow",       "label": "Welcome Flow",          "group": "Communication"},

    # Worship & Teaching
    {"key": "alter_sound",        "label": "Alter Sound",           "group": "Worship & Teaching"},
    {"key": "bible_study",        "label": "Bible Study",           "group": "Worship & Teaching"},
    {"key": "daily_verse",        "label": "Daily Verse",           "group": "Worship & Teaching"},
    {"key": "live_stream",        "label": "Live Stream",           "group": "Worship & Teaching"},
    {"key": "prayer",             "label": "Prayer Wall",           "group": "Worship & Teaching"},
    {"key": "sermons",            "label": "Sermons",               "group": "Worship & Teaching"},

    # Ministries
    {"key": "children",           "label": "Children Ministry",     "group": "Ministries"},
    {"key": "coordinators",       "label": "Department Coords",     "group": "Ministries"},
    {"key": "discipleship",       "label": "Discipleship Pathway",  "group": "Ministries"},
    {"key": "leadership",         "label": "Leadership Training",   "group": "Ministries"},
    {"key": "men",                "label": "Men's Ministry",        "group": "Ministries"},
    {"key": "ministries",         "label": "Custom Ministries",     "group": "Ministries"},
    {"key": "theology",           "label": "Theology School",       "group": "Ministries"},
    {"key": "volunteer_depts",    "label": "Volunteer Departments", "group": "Ministries"},
    {"key": "women",              "label": "Women's Ministry",      "group": "Ministries"},
    {"key": "youth",              "label": "Youth Ministry",        "group": "Ministries"},
    {"key": "youth_programs",     "label": "Youth Programs",        "group": "Ministries"},

    # People
    {"key": "approvals",          "label": "Pending Approvals",     "group": "People"},
    {"key": "counselling",        "label": "Counselling",           "group": "People"},
    {"key": "evangelism_signups", "label": "Evangelism Signups",    "group": "People"},
    {"key": "life_events",        "label": "Life Events",           "group": "People"},
    {"key": "nominations",        "label": "Nominations",           "group": "People"},
    {"key": "service_requests",   "label": "Service Requests",      "group": "People"},
    {"key": "volunteers",         "label": "Volunteers",            "group": "People"},

    # Events & Content
    {"key": "career",             "label": "Career Guidance",       "group": "Events & Content"},
    {"key": "events",             "label": "Events",                "group": "Events & Content"},
    {"key": "pages",              "label": "CMS Pages",             "group": "Events & Content"},
    {"key": "skills",             "label": "Skill Development",     "group": "Events & Content"},

    # Site
    {"key": "branding",           "label": "Branding (Logo+Favicon)", "group": "Site"},
    {"key": "giving_content",     "label": "Giving Page Content",   "group": "Site"},
    {"key": "statement_of_faith", "label": "Statement of Faith",    "group": "Site"},

    # Giving
    {"key": "donations",          "label": "Donations Log",         "group": "Giving"},
    {"key": "payments",           "label": "Payment Providers",     "group": "Giving"},
]
SCOPE_KEYS = {s["key"] for s in SCOPES}


# ─── Public scopes/me endpoints (any logged-in user) ─────────────────────────

@router.get("/scopes", tags=["Moderators"])
async def list_scopes(_: User = Depends(get_current_active_user)):
    """Return the scope catalog (no auth-sensitive data)."""
    return {"scopes": SCOPES}


@router.get("/me", tags=["Moderators"])
async def my_permissions(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Return what the *current* user can access. Used by the frontend
    sidebar to hide items the user has no grant for."""
    if current_user.role == UserRole.ADMIN:
        return {"role": "admin", "is_admin": True, "scopes": ["*"]}
    if current_user.role != UserRole.MODERATOR:
        return {"role": current_user.role.value, "is_admin": False, "scopes": []}
    res = await db.execute(select(ModeratorGrant).where(ModeratorGrant.user_id == current_user.id))
    return {
        "role": "moderator",
        "is_admin": False,
        "scopes": [g.scope for g in res.scalars().all()],
    }


# ─── Admin-only: list / promote / grant / revoke ─────────────────────────────

class ModeratorOut(BaseModel):
    user_id: str
    email: str
    name: str
    role: str
    scopes: List[str]


@router.get("/", response_model=List[ModeratorOut])
async def list_moderators(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    """Every user with role=MODERATOR (whether or not they have grants yet)."""
    res = await db.execute(select(User).where(User.role == UserRole.MODERATOR))
    mods = list(res.scalars().all())
    if not mods:
        return []
    res2 = await db.execute(select(ModeratorGrant).where(ModeratorGrant.user_id.in_([m.id for m in mods])))
    by_user: dict[str, list[str]] = {}
    for g in res2.scalars().all():
        by_user.setdefault(g.user_id, []).append(g.scope)
    return [
        ModeratorOut(
            user_id=m.id, email=m.email, name=m.name or m.email.split("@")[0],
            role=m.role.value, scopes=sorted(by_user.get(m.id, [])),
        )
        for m in mods
    ]


@router.get("/candidates")
async def list_candidates(
    q: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    """Search users you could promote to moderator. Excludes existing moderators and admins."""
    query = select(User).where(User.role.notin_([UserRole.ADMIN, UserRole.MODERATOR]))
    if q:
        like = f"%{q.lower()}%"
        from sqlalchemy import func, or_
        query = query.where(or_(func.lower(User.email).like(like), func.lower(User.name).like(like)))
    query = query.limit(20)
    res = await db.execute(query)
    return [{"id": u.id, "email": u.email, "name": u.name} for u in res.scalars().all()]


class PromoteIn(BaseModel):
    user_id: str
    scopes: List[str] = []


@router.post("/promote", response_model=ModeratorOut, status_code=201)
async def promote_to_moderator(
    body: PromoteIn,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    res = await db.execute(select(User).where(User.id == body.user_id))
    u = res.scalar_one_or_none()
    if not u:
        raise HTTPException(404, "User not found")
    if u.role == UserRole.ADMIN:
        raise HTTPException(400, "Admins already have every scope")
    u.role = UserRole.MODERATOR
    invalid = [s for s in body.scopes if s not in SCOPE_KEYS]
    if invalid:
        raise HTTPException(400, f"Unknown scope(s): {invalid}")
    for s in body.scopes:
        db.add(ModeratorGrant(user_id=u.id, scope=s, granted_by_user_id=admin.id))
    await db.commit()
    return ModeratorOut(
        user_id=u.id, email=u.email, name=u.name or u.email.split("@")[0],
        role=u.role.value, scopes=sorted(body.scopes),
    )


class GrantsIn(BaseModel):
    scopes: List[str]


@router.put("/{user_id}/grants", response_model=ModeratorOut)
async def set_grants(
    user_id: str,
    body: GrantsIn,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    """Replace ALL grants for the user with the provided set."""
    res = await db.execute(select(User).where(User.id == user_id))
    u = res.scalar_one_or_none()
    if not u:
        raise HTTPException(404, "User not found")
    if u.role != UserRole.MODERATOR:
        raise HTTPException(400, "User is not a moderator. Promote them first.")
    invalid = [s for s in body.scopes if s not in SCOPE_KEYS]
    if invalid:
        raise HTTPException(400, f"Unknown scope(s): {invalid}")
    # Wipe + re-add
    res2 = await db.execute(select(ModeratorGrant).where(ModeratorGrant.user_id == user_id))
    for g in res2.scalars().all():
        await db.delete(g)
    for s in body.scopes:
        db.add(ModeratorGrant(user_id=user_id, scope=s, granted_by_user_id=admin.id))
    await db.commit()
    return ModeratorOut(
        user_id=u.id, email=u.email, name=u.name or u.email.split("@")[0],
        role=u.role.value, scopes=sorted(body.scopes),
    )


@router.delete("/{user_id}")
async def demote_moderator(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    """Revoke all grants AND demote back to regular user."""
    res = await db.execute(select(User).where(User.id == user_id))
    u = res.scalar_one_or_none()
    if not u:
        return {"deleted": 0}
    if u.role == UserRole.ADMIN:
        raise HTTPException(400, "Cannot demote an admin via this endpoint")
    u.role = UserRole.USER
    res2 = await db.execute(select(ModeratorGrant).where(ModeratorGrant.user_id == user_id))
    for g in res2.scalars().all():
        await db.delete(g)
    await db.commit()
    return {"demoted": user_id}
