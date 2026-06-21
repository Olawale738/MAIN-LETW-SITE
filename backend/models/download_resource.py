"""
Downloadable resource the public can grab from /download.

Each row is either a hosted file (binary stored in DB) OR an external URL.
"""

import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Text, Boolean, Integer, LargeBinary
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from database import Base


class DownloadResource(Base):
    __tablename__ = "download_resources"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    # Sermon | E-book | Bulletin | Music | Video | Article | Other
    category: Mapped[str] = mapped_column(String(50), nullable=False, default="Other", index=True)

    # 'file' (DB-hosted binary) or 'url' (external link)
    kind: Mapped[str] = mapped_column(String(10), nullable=False, default="file")

    external_url: Mapped[str] = mapped_column(String(800), nullable=True)

    file_data: Mapped[bytes] = mapped_column(LargeBinary, nullable=True)
    file_name: Mapped[str] = mapped_column(String(255), nullable=True)
    file_mime_type: Mapped[str] = mapped_column(String(120), nullable=True)
    file_size: Mapped[int] = mapped_column(Integer, nullable=True)

    is_published: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    download_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<DownloadResource {self.title} ({self.category})>"
