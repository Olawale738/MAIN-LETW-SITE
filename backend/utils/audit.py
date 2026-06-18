"""
Audit logging helper.

Usage from a router:

    from utils.audit import log_action
    await log_action(
        db, request, current_user,
        action="member.promote_to_lead",
        group_kind="custom_ministry", group_id=ministry.id,
        target_kind="user", target_id=user.id,
        details={"from": "member", "to": "lead"},
    )

The helper DOES NOT commit; the caller commits with the rest of the transaction.
"""

from typing import Any, Optional
from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession

from models.governance import AuditLog
from models.user import User


async def log_action(
    db: AsyncSession,
    request: Optional[Request],
    actor: Optional[User],
    *,
    action: str,
    target_kind: Optional[str] = None,
    target_id: Optional[str] = None,
    group_kind: Optional[str] = None,
    group_id: Optional[str] = None,
    details: Optional[dict[str, Any]] = None,
) -> AuditLog:
    name = (getattr(actor, "name", None) or getattr(actor, "email", None) or "system") if actor else "system"
    email = getattr(actor, "email", None) if actor else None
    ip = None
    if request is not None:
        ip = request.headers.get("x-forwarded-for") or (request.client.host if request.client else None)
    entry = AuditLog(
        actor_user_id=getattr(actor, "id", None),
        actor_name=name,
        actor_email=email,
        action=action,
        target_kind=target_kind,
        target_id=str(target_id) if target_id is not None else None,
        group_kind=group_kind,
        group_id=str(group_id) if group_id is not None else None,
        details=details or {},
        ip=ip,
    )
    db.add(entry)
    return entry
