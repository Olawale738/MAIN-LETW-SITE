"""
AiConfig — single-row store for AI provider API keys, admin-managed.
Falls back to OPENAI_API_KEY / ANTHROPIC_API_KEY env vars on Render.

Keys are stored in plaintext in the DB. Same security posture as the
payment provider secret_key column (admin-only endpoint, masked in
responses). The DB itself is protected by Supabase service role.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, Integer
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class AiConfig(Base):
    __tablename__ = "ai_config"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    openai_api_key: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    anthropic_api_key: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
