"""
Permission verification utilities
Provides centralized permission checking and role-based access control
"""

from enum import Enum
from typing import Optional, List
from fastapi import HTTPException, status
from models.user import User, UserRole
from models.department import DepartmentType, DepartmentMember


class Permission(str, Enum):
    """Permission types"""
    # User permissions
    VIEW_PROFILE = "view_profile"
    EDIT_PROFILE = "edit_profile"

    # Message permissions
    SEND_MESSAGE = "send_message"
    DELETE_OWN_MESSAGE = "delete_own_message"
    DELETE_ANY_MESSAGE = "delete_any_message"
    EDIT_OWN_MESSAGE = "edit_own_message"
    VIEW_MESSAGES = "view_messages"

    # Department permissions
    VIEW_DEPARTMENT = "view_department"
    MANAGE_MEMBERS = "manage_members"
    MANAGE_MODERATORS = "manage_moderators"
    CREATE_ANNOUNCEMENT = "create_announcement"
    DELETE_ANNOUNCEMENT = "delete_announcement"
    MANAGE_ACTIVITIES = "manage_activities"

    # Group permissions
    CREATE_GROUP = "create_group"
    EDIT_GROUP = "edit_group"
    DELETE_GROUP = "delete_group"
    MANAGE_GROUP_MEMBERS = "manage_group_members"
    MANAGE_GROUP_MODERATORS = "manage_group_moderators"

    # Admin permissions
    ADMIN_ACCESS = "admin_access"
    VIEW_AUDIT_LOG = "view_audit_log"
    MANAGE_USERS = "manage_users"
    MANAGE_ROLES = "manage_roles"


class PermissionChecker:
    """Centralized permission verification"""

    @staticmethod
    def require_admin(user: User) -> User:
        """Require user to be an admin"""
        if user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required"
            )
        return user

    @staticmethod
    def require_authenticated(user: Optional[User]) -> User:
        """Require user to be authenticated"""
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required"
            )
        return user

    @staticmethod
    def is_admin(user: Optional[User]) -> bool:
        """Check if user is an admin"""
        return user is not None and user.role == UserRole.ADMIN

    @staticmethod
    def is_coordinator(user: Optional[User], dept: DepartmentType, db) -> bool:
        """Check if user is a coordinator of the department"""
        if not user:
            return False

        if user.role == UserRole.ADMIN:
            return True

        # Check DepartmentMember with is_coordinator=True
        from sqlalchemy import select, and_
        result = db.execute(
            select(DepartmentMember).where(and_(
                DepartmentMember.user_id == user.id,
                DepartmentMember.department == dept,
                DepartmentMember.is_active == True,
                DepartmentMember.is_coordinator == True,
            ))
        ).scalar_one_or_none()

        return result is not None

    @staticmethod
    def is_department_member(user: Optional[User], dept: DepartmentType, db) -> bool:
        """Check if user is a member of the department"""
        if not user:
            return False

        if user.role == UserRole.ADMIN:
            return True

        # Check DepartmentMember
        from sqlalchemy import select
        result = db.execute(
            select(DepartmentMember).where(
                DepartmentMember.user_id == user.id,
                DepartmentMember.department == dept,
                DepartmentMember.is_active == True,
            )
        ).scalar_one_or_none()

        return result is not None

    @staticmethod
    def verify_message_permission(
        user: User,
        permission: Permission,
        message_sender_id: Optional[str] = None,
        message_group_id: Optional[str] = None,
        db = None
    ) -> bool:
        """Verify message-related permission"""
        # Admins can do anything
        if user.role == UserRole.ADMIN:
            return True

        if permission == Permission.DELETE_OWN_MESSAGE:
            return message_sender_id == user.id

        # For group messages, check if user is moderator
        if permission == Permission.DELETE_ANY_MESSAGE and message_group_id and db:
            from models.bible_study import BibleStudyGroupModerator
            from sqlalchemy import select
            result = db.execute(
                select(BibleStudyGroupModerator).where(
                    BibleStudyGroupModerator.group_id == message_group_id,
                    BibleStudyGroupModerator.user_id == user.id,
                )
            ).scalar_one_or_none()

            if result:
                # Check if moderator has permission
                permissions = result.permissions or {}
                return permissions.get('can_delete_others', False)

        return False

    @staticmethod
    def verify_group_permission(
        user: User,
        permission: Permission,
        group_id: str,
        db
    ) -> bool:
        """Verify group-related permission"""
        # Admins can do anything
        if user.role == UserRole.ADMIN:
            return True

        from models.bible_study import BibleStudyGroup, BibleStudyGroupModerator
        from sqlalchemy import select

        # Check if user is moderator of the group
        moderator = db.execute(
            select(BibleStudyGroupModerator).where(
                BibleStudyGroupModerator.group_id == group_id,
                BibleStudyGroupModerator.user_id == user.id,
            )
        ).scalar_one_or_none()

        if not moderator:
            return False

        # Check specific permission
        permissions = moderator.permissions or {}

        permission_map = {
            Permission.DELETE_ANY_MESSAGE: 'can_delete_others',
            Permission.MANAGE_GROUP_MEMBERS: 'can_manage_members',
            Permission.MANAGE_GROUP_MODERATORS: 'can_manage_moderators',
            Permission.MANAGE_ACTIVITIES: 'can_edit_settings',
        }

        required_perm = permission_map.get(permission)
        if required_perm:
            return permissions.get(required_perm, False)

        return False


class AuditLog:
    """Audit logging for permission-related actions"""

    @staticmethod
    def log_action(
        user_id: str,
        action: str,
        resource_type: str,
        resource_id: str,
        details: Optional[dict] = None,
        db = None
    ):
        """Log an action for audit purposes"""
        if not db:
            return

        try:
            from models.audit import AuditLogEntry
            from datetime import datetime

            entry = AuditLogEntry(
                user_id=user_id,
                action=action,
                resource_type=resource_type,
                resource_id=resource_id,
                details=details or {},
                timestamp=datetime.utcnow(),
            )
            db.add(entry)
            db.commit()
        except Exception as e:
            # Log audit failures but don't break the operation
            import logging
            logging.error(f"Failed to log audit entry: {e}")
