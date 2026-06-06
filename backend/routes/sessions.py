"""
Session management API routes
Handles session tracking, device trust, and security events
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, desc
from datetime import datetime, timedelta
from typing import List, Optional
from models.session import UserSession, SecurityEvent, DeviceTrust, SessionStatus, DeviceType
from models.user import User
from database import get_db
from pydantic import BaseModel
import json

router = APIRouter(prefix="/api/sessions", tags=["sessions"])

# Models
class SessionResponse(BaseModel):
    id: str
    device_type: str
    device_name: Optional[str]
    browser: Optional[str]
    os: Optional[str]
    ip_address: Optional[str]
    location: Optional[str]
    status: str
    last_activity: str
    created_at: str
    is_trusted: bool
    mfa_verified: bool

    class Config:
        from_attributes = True


class SecurityEventResponse(BaseModel):
    id: str
    event_type: str
    severity: str
    message: str
    ip_address: Optional[str]
    location: Optional[str]
    is_suspicious: bool
    created_at: str

    class Config:
        from_attributes = True


class DeviceTrustResponse(BaseModel):
    id: str
    device_name: str
    device_type: str
    browser: Optional[str]
    os: Optional[str]
    is_trusted: bool
    last_used: str
    trust_expires_at: str

    class Config:
        from_attributes = True


# Helper
async def get_current_user(db: Session = Depends(get_db), token: str = Query(None)):
    """Get current user from token"""
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return None


@router.get("/", response_model=List[SessionResponse])
async def get_user_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all active sessions for current user"""
    sessions = db.execute(
        select(UserSession)
        .where(
            and_(
                UserSession.user_id == current_user.id,
                UserSession.status.in_([SessionStatus.ACTIVE.value, SessionStatus.IDLE.value]),
            )
        )
        .order_by(desc(UserSession.last_activity))
    ).scalars().all()

    return [
        SessionResponse(
            **{k: v for k, v in s.__dict__.items() if k != '_sa_instance_state'},
            last_activity=s.last_activity.isoformat(),
            created_at=s.created_at.isoformat(),
        )
        for s in sessions
    ]


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get session details"""
    session = db.execute(
        select(UserSession).where(UserSession.id == session_id)
    ).scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    return SessionResponse(
        **{k: v for k, v in session.__dict__.items() if k != '_sa_instance_state'},
        last_activity=session.last_activity.isoformat(),
        created_at=session.created_at.isoformat(),
    )


@router.post("/{session_id}/revoke")
async def revoke_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Revoke a session"""
    session = db.execute(
        select(UserSession).where(UserSession.id == session_id)
    ).scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    session.status = SessionStatus.REVOKED.value
    db.commit()

    # Log security event
    event = SecurityEvent(
        user_id=current_user.id,
        session_id=session_id,
        event_type="session_revoked",
        severity="info",
        message=f"Session on {session.device_name or 'Unknown Device'} was revoked",
    )
    db.add(event)
    db.commit()

    return {"status": "revoked"}


@router.post("/revoke-all")
async def revoke_all_sessions(
    keep_current: bool = Query(True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Revoke all sessions (optionally keeping current)"""
    sessions = db.execute(
        select(UserSession).where(UserSession.user_id == current_user.id)
    ).scalars().all()

    revoked_count = 0
    for session in sessions:
        if keep_current and session.status == SessionStatus.ACTIVE.value:
            # Skip active session (current)
            continue

        session.status = SessionStatus.REVOKED.value
        revoked_count += 1

    db.commit()

    # Log security event
    event = SecurityEvent(
        user_id=current_user.id,
        event_type="all_sessions_revoked",
        severity="warning",
        message=f"All sessions revoked ({revoked_count} sessions)",
    )
    db.add(event)
    db.commit()

    return {"revoked_count": revoked_count}


@router.get("/security/events", response_model=List[SecurityEventResponse])
async def get_security_events(
    limit: int = Query(50, ge=1, le=100),
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get security events for current user"""
    start_date = datetime.utcnow() - timedelta(days=days)

    events = db.execute(
        select(SecurityEvent)
        .where(
            and_(
                SecurityEvent.user_id == current_user.id,
                SecurityEvent.created_at >= start_date,
            )
        )
        .order_by(desc(SecurityEvent.created_at))
        .limit(limit)
    ).scalars().all()

    return [
        SecurityEventResponse(
            **{k: v for k, v in e.__dict__.items() if k != '_sa_instance_state'},
            created_at=e.created_at.isoformat(),
        )
        for e in events
    ]


@router.post("/security/events")
async def log_security_event(
    event_type: str,
    severity: str,
    message: str,
    ip_address: Optional[str] = None,
    location: Optional[str] = None,
    is_suspicious: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Log a security event"""
    event = SecurityEvent(
        user_id=current_user.id,
        event_type=event_type,
        severity=severity,
        message=message,
        ip_address=ip_address,
        location=location,
        is_suspicious=is_suspicious,
    )

    db.add(event)
    db.commit()

    return {"id": event.id}


@router.get("/devices/trusted", response_model=List[DeviceTrustResponse])
async def get_trusted_devices(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get trusted devices for current user"""
    devices = db.execute(
        select(DeviceTrust)
        .where(
            and_(
                DeviceTrust.user_id == current_user.id,
                DeviceTrust.is_trusted == True,
            )
        )
        .order_by(desc(DeviceTrust.last_used))
    ).scalars().all()

    return [
        DeviceTrustResponse(
            **{k: v for k, v in d.__dict__.items() if k != '_sa_instance_state'},
            last_used=d.last_used.isoformat(),
            trust_expires_at=d.trust_expires_at.isoformat(),
        )
        for d in devices
    ]


@router.post("/devices/trust")
async def trust_device(
    device_fingerprint: str,
    device_name: str,
    device_type: str,
    browser: Optional[str] = None,
    os: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a device as trusted"""
    # Check if device already trusted
    existing = db.execute(
        select(DeviceTrust).where(
            and_(
                DeviceTrust.user_id == current_user.id,
                DeviceTrust.device_fingerprint == device_fingerprint,
            )
        )
    ).scalar_one_or_none()

    if existing:
        existing.is_trusted = True
        existing.last_used = datetime.utcnow()
        existing.trust_expires_at = datetime.utcnow() + timedelta(days=90)
    else:
        trust = DeviceTrust(
            user_id=current_user.id,
            device_fingerprint=device_fingerprint,
            device_name=device_name,
            device_type=device_type,
            browser=browser,
            os=os,
        )
        db.add(trust)

    db.commit()

    return {"status": "trusted"}


@router.delete("/devices/{device_id}/trust")
async def revoke_device_trust(
    device_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Revoke device trust"""
    device = db.execute(
        select(DeviceTrust).where(DeviceTrust.id == device_id)
    ).scalar_one_or_none()

    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    if device.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    device.is_trusted = False
    db.commit()

    return {"status": "untrusted"}
