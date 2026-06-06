"""
Audit trail API routes
Handles audit log queries and reporting
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, func, desc, or_
from datetime import datetime, timedelta
from typing import Optional, List
from models.audit import AuditLog, PermissionChange
from models.user import User
from database import get_db
from pydantic import BaseModel

router = APIRouter(prefix="/api/audit", tags=["audit"])

# Models
class AuditEntryResponse(BaseModel):
    id: str
    action: str
    resource_type: str
    resource_id: str
    user_id: str
    details: Optional[str]
    ip_address: Optional[str]
    timestamp: str

    class Config:
        from_attributes = True


class AuditTrailResponse(BaseModel):
    entries: List[AuditEntryResponse]
    total: int
    page: int
    limit: int


# Helper
async def get_current_user(db: Session = Depends(get_db), token: str = Query(None)):
    """Get current user from token"""
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return None


@router.get("/", response_model=AuditTrailResponse)
async def get_audit_trail(
    resource_type: Optional[str] = Query(None),
    resource_id: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    days: int = Query(30, ge=1, le=365),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get audit trail entries
    """
    # Build query
    start_date = datetime.utcnow() - timedelta(days=days)
    query = select(AuditLog).where(AuditLog.timestamp >= start_date)

    if resource_type:
        query = query.where(AuditLog.resource_type == resource_type)

    if resource_id:
        query = query.where(AuditLog.resource_id == resource_id)

    if user_id:
        query = query.where(AuditLog.user_id == user_id)

    if action:
        query = query.where(AuditLog.action == action)

    # Get total count
    total = db.execute(select(func.count(AuditLog.id)).where(query.whereclause)).scalar() or 0

    # Get paginated results
    entries = db.execute(
        query.order_by(desc(AuditLog.timestamp))
        .limit(limit)
        .offset(offset)
    ).scalars().all()

    return AuditTrailResponse(
        entries=[
            AuditEntryResponse(
                **{k: v for k, v in e.__dict__.items() if k != '_sa_instance_state'},
                timestamp=e.timestamp.isoformat(),
            )
            for e in entries
        ],
        total=total,
        page=offset // limit + 1,
        limit=limit,
    )


@router.get("/resource/{resource_type}/{resource_id}")
async def get_resource_audit_trail(
    resource_type: str,
    resource_id: str,
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get audit trail for a specific resource
    """
    entries = db.execute(
        select(AuditLog)
        .where(
            and_(
                AuditLog.resource_type == resource_type,
                AuditLog.resource_id == resource_id,
            )
        )
        .order_by(desc(AuditLog.timestamp))
        .limit(limit)
    ).scalars().all()

    return [
        AuditEntryResponse(
            **{k: v for k, v in e.__dict__.items() if k != '_sa_instance_state'},
            timestamp=e.timestamp.isoformat(),
        )
        for e in entries
    ]


@router.get("/user/{user_id}/actions")
async def get_user_audit_trail(
    user_id: str,
    days: int = Query(30, ge=1, le=365),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all actions taken by a user
    """
    start_date = datetime.utcnow() - timedelta(days=days)

    entries = db.execute(
        select(AuditLog)
        .where(
            and_(
                AuditLog.user_id == user_id,
                AuditLog.timestamp >= start_date,
            )
        )
        .order_by(desc(AuditLog.timestamp))
        .limit(limit)
    ).scalars().all()

    return [
        AuditEntryResponse(
            **{k: v for k, v in e.__dict__.items() if k != '_sa_instance_state'},
            timestamp=e.timestamp.isoformat(),
        )
        for e in entries
    ]


@router.get("/stats")
async def get_audit_stats(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get audit statistics
    """
    start_date = datetime.utcnow() - timedelta(days=days)
    this_week = datetime.utcnow() - timedelta(days=7)

    # Total actions
    total = db.execute(
        select(func.count(AuditLog.id)).where(AuditLog.timestamp >= start_date)
    ).scalar() or 0

    # This week
    week_count = db.execute(
        select(func.count(AuditLog.id)).where(AuditLog.timestamp >= this_week)
    ).scalar() or 0

    # Unique users
    unique_users = db.execute(
        select(func.count(func.distinct(AuditLog.user_id))).where(
            AuditLog.timestamp >= start_date
        )
    ).scalar() or 0

    # Unique resources
    unique_resources = db.execute(
        select(func.count(func.distinct(AuditLog.resource_id))).where(
            AuditLog.timestamp >= start_date
        )
    ).scalar() or 0

    return {
        "total_actions": total,
        "actions_this_week": week_count,
        "unique_users": unique_users,
        "unique_resources": unique_resources,
        "period_days": days,
    }


@router.get("/permission-changes")
async def get_permission_changes(
    user_id: Optional[str] = Query(None),
    days: int = Query(30, ge=1, le=365),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get permission change history
    """
    start_date = datetime.utcnow() - timedelta(days=days)
    query = select(PermissionChange).where(PermissionChange.timestamp >= start_date)

    if user_id:
        query = query.where(
            or_(
                PermissionChange.subject_user_id == user_id,
                PermissionChange.actor_user_id == user_id,
            )
        )

    changes = db.execute(
        query.order_by(desc(PermissionChange.timestamp)).limit(limit)
    ).scalars().all()

    return [
        {
            "id": c.id,
            "subject_user_id": c.subject_user_id,
            "actor_user_id": c.actor_user_id,
            "permission": c.permission,
            "action": c.action,  # grant, revoke
            "reason": c.reason,
            "timestamp": c.timestamp.isoformat(),
        }
        for c in changes
    ]


@router.post("/log")
async def log_action(
    action: str,
    resource_type: str,
    resource_id: str,
    details: Optional[str] = None,
    ip_address: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Log an audit entry
    Internal endpoint for creating audit logs
    """
    entry = AuditLog(
        user_id=current_user.id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details,
        ip_address=ip_address,
    )

    db.add(entry)
    db.commit()

    return {"id": entry.id}


@router.get("/search")
async def search_audit_logs(
    q: str = Query(..., min_length=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Search audit logs by action or details
    """
    entries = db.execute(
        select(AuditLog)
        .where(
            or_(
                AuditLog.action.ilike(f"%{q}%"),
                AuditLog.details.ilike(f"%{q}%"),
                AuditLog.resource_type.ilike(f"%{q}%"),
            )
        )
        .order_by(desc(AuditLog.timestamp))
        .limit(limit)
    ).scalars().all()

    return [
        AuditEntryResponse(
            **{k: v for k, v in e.__dict__.items() if k != '_sa_instance_state'},
            timestamp=e.timestamp.isoformat(),
        )
        for e in entries
    ]
