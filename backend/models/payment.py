"""
Payments — generic provider config + donation log.

Admin can register ANY payment API (Paystack, Flutterwave, Stripe, Razorpay,
Mollie, or a manual "Wise transfer"-style instructions provider).

For well-known slugs we initialise checkout server-side and verify webhooks.
For 'manual' or 'custom' slugs we just redirect / show instructions.
"""

from datetime import datetime
from typing import Optional, Any
from sqlalchemy import String, DateTime, Integer, Boolean, Text, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from database import Base
import uuid


class PaymentProvider(Base):
    __tablename__ = "payment_providers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    # slug controls integration behaviour: 'paystack' | 'flutterwave' | 'stripe' | 'manual' | 'custom'
    slug: Mapped[str] = mapped_column(String(40), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    mode: Mapped[str] = mapped_column(String(10), default="test")  # test | live
    public_key: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    secret_key: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    webhook_secret: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    currency: Mapped[str] = mapped_column(String(10), default="NGN")
    # JSON: provider-specific overrides — checkout_url_template, redirect_after, instructions_md, etc.
    config: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True, default=dict)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Donation(Base):
    __tablename__ = "donations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    reference: Mapped[str] = mapped_column(String(120), unique=True, nullable=False, index=True)
    provider_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("payment_providers.id", ondelete="SET NULL"), nullable=True)
    user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    payer_name: Mapped[str] = mapped_column(String(200), nullable=False, default="Anonymous")
    payer_email: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="NGN")
    fund: Mapped[str] = mapped_column(String(80), default="General")  # General | Tithe | Missions | Building | Youth
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True)  # pending | success | failed | refunded
    # NULL = one-time gift; otherwise the recurring cadence: 'weekly' | 'monthly' | 'yearly'.
    # For recurring gifts the row records the FIRST charge; the provider (Stripe
    # subscription / Paystack plan) drives every renewal after that.
    interval: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    raw_payload: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
