"""
Notification service
Handles message notifications and delivery
"""

from typing import Optional
from datetime import datetime
from models.user import User
from models.message import Message, Conversation, Notification, NotificationType


class NotificationService:
    """Handle message notifications"""

    @staticmethod
    def notify_message_sent(
        conversation: Conversation,
        message: Message,
        sender: User,
        db
    ) -> None:
        """
        Notify conversation participants that a message was sent
        """
        # Don't notify the sender
        recipient_id = None
        if conversation.user_id == sender.id:
            recipient_id = conversation.admin_id
        else:
            recipient_id = conversation.user_id

        if not recipient_id or recipient_id == sender.id:
            return

        # Create notification
        notification = Notification(
            user_id=recipient_id,
            title=f"New message from {sender.name}",
            message=message.body[:140],
            type=NotificationType.GENERAL,
            reference_id=conversation.id,
        )
        db.add(notification)
        db.commit()

    @staticmethod
    def notify_message_read(
        message: Message,
        reader: User,
        db
    ) -> None:
        """
        Notify sender that their message was read
        """
        if message.sender_id == reader.id:
            return

        from models.message_read import MessageReadReceipt
        from sqlalchemy import select

        # Create read receipt
        existing = db.execute(
            select(MessageReadReceipt).where(
                MessageReadReceipt.message_id == message.id,
                MessageReadReceipt.user_id == reader.id,
            )
        ).scalar_one_or_none()

        if not existing:
            receipt = MessageReadReceipt(
                message_id=message.id,
                user_id=reader.id,
            )
            db.add(receipt)
            db.commit()

    @staticmethod
    def get_read_count(message: Message, db) -> int:
        """
        Get number of users who have read this message
        """
        from models.message_read import MessageReadReceipt
        from sqlalchemy import select, func

        count = db.execute(
            select(func.count(MessageReadReceipt.id)).where(
                MessageReadReceipt.message_id == message.id
            )
        ).scalar()

        return count or 0

    @staticmethod
    def get_read_status(
        message: Message,
        conversation: Conversation,
        db
    ) -> dict:
        """
        Get read status for a message
        Returns: {
            read_count: int,
            read_by: list of user info,
            is_read: bool (if current user is in context)
        }
        """
        from models.message_read import MessageReadReceipt
        from sqlalchemy import select

        receipts = db.execute(
            select(MessageReadReceipt)
            .where(MessageReadReceipt.message_id == message.id)
            .options(__import__('sqlalchemy.orm', fromlist=['selectinload']).selectinload(MessageReadReceipt.user))
        ).scalars().all()

        read_by = [
            {
                'id': r.user.id,
                'name': r.user.name,
                'read_at': r.read_at.isoformat(),
            }
            for r in receipts
        ]

        return {
            'read_count': len(read_by),
            'read_by': read_by,
        }

    @staticmethod
    def mark_conversation_as_read(
        conversation: Conversation,
        user: User,
        last_message_id: Optional[str] = None,
        db = None
    ) -> None:
        """
        Mark conversation as read for user
        """
        if not db:
            return

        from models.message_read import ConversationReadReceipt
        from sqlalchemy import select

        receipt = db.execute(
            select(ConversationReadReceipt).where(
                ConversationReadReceipt.conversation_id == conversation.id,
                ConversationReadReceipt.user_id == user.id,
            )
        ).scalar_one_or_none()

        if receipt:
            receipt.last_read_message_id = last_message_id
            receipt.read_at = datetime.utcnow()
        else:
            receipt = ConversationReadReceipt(
                conversation_id=conversation.id,
                user_id=user.id,
                last_read_message_id=last_message_id,
            )
            db.add(receipt)

        db.commit()

    @staticmethod
    def get_unread_count(user: User, db) -> int:
        """
        Get total unread message count for user
        """
        from sqlalchemy import select, func, and_
        from models.message import Message

        # Count messages where user is recipient and hasn't read them
        unread = db.execute(
            select(func.count(Message.id)).where(
                and_(
                    Message.sender_id != user.id,
                    ~Message.id.in_(
                        select(MessageReadReceipt.message_id).where(
                            MessageReadReceipt.user_id == user.id
                        )
                    ),
                )
            )
        ).scalar()

        return unread or 0
