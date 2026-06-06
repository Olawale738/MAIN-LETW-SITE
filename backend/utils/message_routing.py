"""
Message routing service for all conversation scenarios.
Handles routing messages correctly across all participant combinations:
  - Regular user -> Admin
  - Admin -> Regular user
  - Coordinator (non-admin) -> Member
  - Mentor -> Mentee
  - Bidirectional mentor-mentee messaging
"""

import logging
from typing import Optional, Tuple
from models.user import User, UserRole
from models.message import Conversation

logger = logging.getLogger(__name__)

class MessageRouter:
    """Service to determine correct message recipient and routing."""

    @staticmethod
    def validate_sender_is_participant(
        conversation: Conversation,
        sender: User,
    ) -> Tuple[bool, Optional[str]]:
        """
        Validate that sender is a participant in the conversation.

        Returns:
            (is_valid, error_message)
        """
        is_user_party = conversation.user_id == sender.id
        is_admin_party = conversation.admin_id == sender.id
        is_sys_admin = sender.role == UserRole.ADMIN

        if not (is_user_party or is_admin_party or is_sys_admin):
            return False, f"User {sender.id} is not a participant in conversation {conversation.id}"

        return True, None

    @staticmethod
    def get_message_recipient(
        conversation: Conversation,
        sender: User,
    ) -> Tuple[Optional[str], str]:
        """
        Determine the correct recipient for a message.

        Returns:
            (recipient_user_id, routing_description)
        """
        # Case 1: Sender is in user_id slot
        if sender.id == conversation.user_id:
            recipient = conversation.admin_id
            routing = "user→admin"
            logger.debug(
                f"[ROUTING] {routing}: Message from {sender.name} ({sender.id}) "
                f"in user_id slot to admin {recipient}"
            )
            return recipient, routing

        # Case 2: Sender is in admin_id slot
        if sender.id == conversation.admin_id:
            recipient = conversation.user_id
            routing = "admin→user"
            logger.debug(
                f"[ROUTING] {routing}: Message from {sender.name} ({sender.id}) "
                f"in admin_id slot to user {recipient}"
            )
            return recipient, routing

        # Case 3: System admin can message anyone (shouldn't reach here if validate passed)
        if sender.role == UserRole.ADMIN:
            # Default to user_id if sender is a system admin and not explicitly a party
            recipient = conversation.user_id or conversation.admin_id
            routing = "admin→participant"
            logger.debug(
                f"[ROUTING] {routing}: System admin {sender.name} ({sender.id}) "
                f"messaging {recipient}"
            )
            return recipient, routing

        logger.error(
            f"[ROUTING] INVALID STATE: Sender {sender.id} passed validation but routing failed. "
            f"Conversation user_id={conversation.user_id}, admin_id={conversation.admin_id}"
        )
        return None, "error"

    @staticmethod
    def get_unread_increment_target(
        conversation: Conversation,
        sender: User,
    ) -> str:
        """
        Determine whether to increment unread_for_user or unread_for_admin.

        Returns:
            "user" or "admin"
        """
        if sender.id == conversation.user_id:
            # User sent -> increment admin's unread
            return "admin"
        elif sender.id == conversation.admin_id:
            # Admin sent -> increment user's unread
            return "user"
        else:
            # Fallback (shouldn't reach here if validate passed)
            return "admin"

    @staticmethod
    def should_assign_admin_on_reply(
        conversation: Conversation,
        sender: User,
    ) -> bool:
        """
        Check if an admin should claim an unassigned conversation.

        Returns:
            True if admin should be assigned as admin_id
        """
        return (
            sender.role == UserRole.ADMIN and
            conversation.admin_id is None
        )

    @staticmethod
    def log_routing_summary(
        conversation_id: str,
        sender: User,
        recipient_id: Optional[str],
        routing_type: str,
        unread_target: str,
    ) -> None:
        """Log comprehensive routing information for debugging."""
        logger.info(
            f"[ROUTING_SUMMARY] conversation={conversation_id}, "
            f"sender={sender.id}({sender.name}), "
            f"recipient={recipient_id}, "
            f"type={routing_type}, "
            f"unread_to={unread_target}"
        )
