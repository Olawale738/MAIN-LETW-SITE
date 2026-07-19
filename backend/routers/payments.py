"""
Payments API — pluggable provider registry + donation log.

Native integrations:
- paystack      — server-side `transaction/initialize` + HMAC SHA512 webhook
- flutterwave   — server-side `/v3/payments` + hash-header webhook
- stripe        — Checkout Session create + signature-bearing webhook (acks all events)
- manual        — no API; admin's instructions_md is shown verbatim (bank transfer, Wise, etc.)
- custom        — admin pastes a checkout_url_template like
                  "https://pay.example.com/checkout?amount={amount}&ref={ref}&email={email}"
                  and we redirect with placeholders filled. Webhook is best-effort.

All providers populate the same `donations` table so the admin sees one log.
"""

import hmac
import hashlib
import json
import logging
import secrets
import urllib.parse
from datetime import datetime
from typing import List, Optional, Any

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, func, or_ as sa_or
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.payment import PaymentProvider, Donation
from models.user import User
from utils.dependencies import get_admin_user, get_current_user
from utils.audit import log_action

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/payments", tags=["Payments"])


# ─── Provider CRUD (admin) ───────────────────────────────────────────────────

class ProviderIn(BaseModel):
    slug: str
    name: str
    mode: str = "test"
    public_key: Optional[str] = None
    secret_key: Optional[str] = None
    webhook_secret: Optional[str] = None
    currency: str = "NGN"
    config: Optional[Any] = None
    description: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0


class ProviderOutPublic(BaseModel):
    """Public view — never expose secret_key/webhook_secret."""
    id: str
    slug: str
    name: str
    mode: str
    public_key: Optional[str]
    currency: str
    description: Optional[str]
    sort_order: int


class ProviderOutAdmin(ProviderOutPublic):
    secret_key: Optional[str]
    webhook_secret: Optional[str]
    config: Optional[Any]
    is_active: bool
    created_at: datetime
    updated_at: datetime


def _mask(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    if len(value) <= 8:
        return "•" * len(value)
    return value[:4] + "•" * (len(value) - 8) + value[-4:]


@router.get("/providers/public", response_model=List[ProviderOutPublic])
async def list_providers_public(db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(PaymentProvider).where(PaymentProvider.is_active == True).order_by(PaymentProvider.sort_order)
    )
    return res.scalars().all()


@router.get("/providers", response_model=List[ProviderOutAdmin])
async def list_providers_admin(db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(PaymentProvider).order_by(PaymentProvider.sort_order))
    rows = res.scalars().all()
    return [ProviderOutAdmin(
        id=r.id, slug=r.slug, name=r.name, mode=r.mode,
        public_key=r.public_key, currency=r.currency, description=r.description, sort_order=r.sort_order,
        secret_key=_mask(r.secret_key), webhook_secret=_mask(r.webhook_secret),
        config=r.config, is_active=r.is_active,
        created_at=r.created_at, updated_at=r.updated_at,
    ) for r in rows]


@router.post("/providers", response_model=ProviderOutAdmin, status_code=201)
async def create_provider(body: ProviderIn, request: Request, db: AsyncSession = Depends(get_db), admin: User = Depends(get_admin_user)):
    p = PaymentProvider(**body.model_dump())
    db.add(p)
    await log_action(
        db, request, admin,
        action="payment_provider.create",
        target_kind="payment_provider", target_id=p.id,
        details={"slug": p.slug, "name": p.name, "mode": p.mode, "currency": p.currency},
    )
    await db.commit()
    await db.refresh(p)
    return ProviderOutAdmin(
        id=p.id, slug=p.slug, name=p.name, mode=p.mode,
        public_key=p.public_key, currency=p.currency, description=p.description, sort_order=p.sort_order,
        secret_key=_mask(p.secret_key), webhook_secret=_mask(p.webhook_secret),
        config=p.config, is_active=p.is_active,
        created_at=p.created_at, updated_at=p.updated_at,
    )


@router.put("/providers/{pid}", response_model=ProviderOutAdmin)
async def update_provider(pid: str, body: ProviderIn, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(PaymentProvider).where(PaymentProvider.id == pid))
    p = res.scalar_one_or_none()
    if not p:
        raise HTTPException(404, "Provider not found")
    data = body.model_dump()
    # If secret/webhook fields come back masked, keep existing value
    for sensitive in ("secret_key", "webhook_secret"):
        v = data.get(sensitive)
        if v is not None and "•" in v:
            data[sensitive] = getattr(p, sensitive)
    for k, v in data.items():
        setattr(p, k, v)
    await db.commit()
    await db.refresh(p)
    return ProviderOutAdmin(
        id=p.id, slug=p.slug, name=p.name, mode=p.mode,
        public_key=p.public_key, currency=p.currency, description=p.description, sort_order=p.sort_order,
        secret_key=_mask(p.secret_key), webhook_secret=_mask(p.webhook_secret),
        config=p.config, is_active=p.is_active,
        created_at=p.created_at, updated_at=p.updated_at,
    )


@router.delete("/providers/{pid}")
async def delete_provider(pid: str, request: Request, db: AsyncSession = Depends(get_db), admin: User = Depends(get_admin_user)):
    res = await db.execute(select(PaymentProvider).where(PaymentProvider.id == pid))
    p = res.scalar_one_or_none()
    if not p:
        return {"deleted": 0}
    await log_action(
        db, request, admin,
        action="payment_provider.delete",
        target_kind="payment_provider", target_id=pid,
        details={"slug": p.slug, "name": p.name},
    )
    await db.delete(p)
    await db.commit()
    return {"deleted": 1}


# ─── Checkout initiation ─────────────────────────────────────────────────────

class CheckoutIn(BaseModel):
    provider_id: str
    amount: float
    currency: Optional[str] = None
    fund: str = "General"
    payer_name: str = "Anonymous"
    payer_email: Optional[EmailStr] = None
    message: Optional[str] = None
    # None = one-time gift. Otherwise a recurring cadence. Only Stripe and
    # Paystack support recurring; other providers reject a non-None interval.
    interval: Optional[str] = None  # 'weekly' | 'monthly' | 'yearly'


def _gen_ref() -> str:
    return f"LETW-{secrets.token_urlsafe(10)}"


async def _optional_user_id(request: Request, db: AsyncSession) -> Optional[str]:
    """Best-effort: if the caller sent a valid member access token, return their
    user id so the gift can be tied to their account (not just a typed email).
    Anonymous/guest giving stays fully supported — any problem returns None."""
    try:
        auth = request.headers.get("authorization") or request.headers.get("Authorization") or ""
        if not auth.lower().startswith("bearer "):
            return None
        from utils.security import decode_token
        payload = decode_token(auth.split(" ", 1)[1].strip())
        if not payload or payload.get("type") != "access":
            return None
        uid = payload.get("sub")
        if not uid:
            return None
        u = (await db.execute(select(User).where(User.id == uid))).scalar_one_or_none()
        return u.id if u else None
    except Exception:
        return None


# Providers that can bill on a schedule + how each names our cadences.
RECURRING_PROVIDERS = {"stripe", "paystack"}
# Stripe recurring interval keys.
_STRIPE_INTERVAL = {"weekly": "week", "monthly": "month", "yearly": "year"}
# Paystack plan interval keys.
_PAYSTACK_INTERVAL = {"weekly": "weekly", "monthly": "monthly", "yearly": "annually"}


def _norm_interval(raw: Optional[str]) -> Optional[str]:
    """Normalise an incoming interval to one of our canonical cadences, or None
    for a one-time gift. Unknown values raise so the donor isn't silently
    enrolled in the wrong cadence."""
    if raw is None or str(raw).strip() == "":
        return None
    v = str(raw).strip().lower()
    if v in ("weekly", "monthly", "yearly"):
        return v
    raise HTTPException(400, "interval must be one of: weekly, monthly, yearly")


@router.post("/checkout")
async def checkout(body: CheckoutIn, request: Request, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(PaymentProvider).where(PaymentProvider.id == body.provider_id, PaymentProvider.is_active == True))
    p = res.scalar_one_or_none()
    if not p:
        raise HTTPException(404, "Provider not found or inactive")

    # If a signed-in member is giving, tie the gift to their account so their
    # giving history/statements are exact rather than email-matched.
    donor_user_id = await _optional_user_id(request, db)
    interval = _norm_interval(body.interval)
    if interval and p.slug not in RECURRING_PROVIDERS:
        raise HTTPException(
            400,
            f"{p.name} can't process recurring gifts. Recurring giving is available "
            f"through Stripe (international) or Paystack (card).",
        )

    ref = _gen_ref()
    d = Donation(
        reference=ref, provider_id=p.id, payer_name=body.payer_name,
        payer_email=body.payer_email, amount=body.amount, currency=body.currency or p.currency,
        fund=body.fund, status="pending", message=body.message, interval=interval,
        user_id=donor_user_id,
    )
    db.add(d)
    await db.commit()

    cfg = p.config or {}
    redirect_after = cfg.get("redirect_after") or "https://letw.org/giving/thank-you"

    if p.slug == "paystack":
        if not p.secret_key:
            raise HTTPException(400, "Paystack secret key not configured")
        init_payload: dict[str, Any] = {
            "email": body.payer_email or "anon@letw.org",
            "amount": int(round(body.amount * 100)),  # kobo
            "currency": p.currency,
            "reference": ref,
            "callback_url": redirect_after,
            "metadata": {"fund": body.fund, "payer_name": body.payer_name},
        }
        if interval:
            # Paystack recurring = create a plan for this amount+cadence, then
            # pass its code to initialize. Paystack auto-creates the subscription
            # after the first successful charge and rebills on schedule. A plan
            # is created per (amount, cadence, fund); Paystack tolerates repeats.
            async with httpx.AsyncClient(timeout=15) as cli:
                pr = await cli.post(
                    "https://api.paystack.co/plan",
                    headers={"Authorization": f"Bearer {p.secret_key}"},
                    json={
                        "name": f"LETW {body.fund} — {interval} ({body.amount:g} {p.currency})",
                        "interval": _PAYSTACK_INTERVAL[interval],
                        "amount": int(round(body.amount * 100)),
                        "currency": p.currency,
                    },
                )
            if pr.status_code >= 300:
                raise HTTPException(502, f"Paystack plan create failed: {pr.text}")
            plan_code = pr.json().get("data", {}).get("plan_code")
            if not plan_code:
                raise HTTPException(502, "Paystack did not return a plan code")
            init_payload["plan"] = plan_code
            # With a plan, Paystack derives the amount from the plan itself.
            init_payload.pop("amount", None)
        async with httpx.AsyncClient(timeout=15) as cli:
            r = await cli.post(
                "https://api.paystack.co/transaction/initialize",
                headers={"Authorization": f"Bearer {p.secret_key}"},
                json=init_payload,
            )
        if r.status_code >= 300:
            raise HTTPException(502, f"Paystack init failed: {r.text}")
        data = r.json().get("data", {})
        return {"checkout_url": data.get("authorization_url"), "reference": ref}

    if p.slug == "flutterwave":
        if not p.secret_key:
            raise HTTPException(400, "Flutterwave secret key not configured")
        async with httpx.AsyncClient(timeout=15) as cli:
            r = await cli.post(
                "https://api.flutterwave.com/v3/payments",
                headers={"Authorization": f"Bearer {p.secret_key}"},
                json={
                    "tx_ref": ref,
                    "amount": body.amount,
                    "currency": p.currency,
                    "redirect_url": redirect_after,
                    "customer": {"email": body.payer_email or "anon@letw.org", "name": body.payer_name},
                    "meta": {"fund": body.fund},
                },
            )
        if r.status_code >= 300:
            raise HTTPException(502, f"Flutterwave init failed: {r.text}")
        link = r.json().get("data", {}).get("link")
        return {"checkout_url": link, "reference": ref}

    if p.slug == "stripe":
        if not p.secret_key:
            raise HTTPException(400, "Stripe secret key not configured")
        # Stripe Checkout via form-encoded REST (no SDK dependency). One-time
        # gifts use mode=payment; recurring gifts use mode=subscription with an
        # inline recurring price — donors self-manage/cancel via the Customer
        # Portal (see /billing-portal).
        form = {
            "mode": "subscription" if interval else "payment",
            "success_url": f"{redirect_after}?ref={ref}",
            "cancel_url": redirect_after,
            "client_reference_id": ref,
            "line_items[0][price_data][currency]": p.currency.lower(),
            "line_items[0][price_data][product_data][name]": f"Donation — {body.fund}",
            "line_items[0][price_data][unit_amount]": str(int(round(body.amount * 100))),
            "line_items[0][quantity]": "1",
        }
        if interval:
            form["line_items[0][price_data][recurring][interval]"] = _STRIPE_INTERVAL[interval]
            # Carry our reference into the subscription metadata too so webhook
            # events for later renewals can still be traced back.
            form["subscription_data[metadata][ref]"] = ref
            form["subscription_data[metadata][fund]"] = body.fund
        if body.payer_email:
            form["customer_email"] = body.payer_email
        async with httpx.AsyncClient(timeout=15) as cli:
            r = await cli.post(
                "https://api.stripe.com/v1/checkout/sessions",
                headers={"Authorization": f"Bearer {p.secret_key}", "Content-Type": "application/x-www-form-urlencoded"},
                data=form,
            )
        if r.status_code >= 300:
            raise HTTPException(502, f"Stripe init failed: {r.text}")
        return {"checkout_url": r.json().get("url"), "reference": ref}

    if p.slug == "paypal":
        # Native PayPal handling — keep it simple and robust by supporting the
        # PayPal.me redirect, which works for any PayPal personal/business
        # account without OAuth integration:
        #     https://www.paypal.me/<handle>/<amount><currency_code>
        # Admin sets config.paypal_me_handle (preferred) OR config.business_email
        # as a fallback to a hosted-button URL. Either way we never hit a
        # secret_key — no API auth required.
        handle = (cfg.get("paypal_me_handle") or "").strip().lstrip("@")
        if handle:
            curr = (p.currency or "USD").upper()
            # PayPal.me amounts use "<value><currency>" — e.g. 50USD, 25EUR.
            link = f"https://www.paypal.me/{urllib.parse.quote(handle)}/{body.amount}{curr}"
            return {"checkout_url": link, "reference": ref}
        biz = (cfg.get("business_email") or "").strip()
        if biz:
            # PayPal's classic hosted donate button. amount + currency_code are
            # respected by PayPal's checkout flow.
            qs = urllib.parse.urlencode({
                "cmd": "_donations",
                "business": biz,
                "currency_code": (p.currency or "USD").upper(),
                "amount": body.amount,
                "item_name": f"Donation — {body.fund}",
                "return": redirect_after,
                "no_shipping": "1",
                "no_note": "0",
                "custom": ref,
            })
            return {"checkout_url": f"https://www.paypal.com/donate?{qs}", "reference": ref}
        raise HTTPException(
            400,
            "PayPal provider needs either config.paypal_me_handle (e.g. 'letw') "
            "or config.business_email set at /admin/payments.",
        )

    if p.slug == "manual":
        return {
            "checkout_url": None,
            "reference": ref,
            "instructions_md": cfg.get("instructions_md", "Bank transfer instructions are not yet set."),
        }

    # custom: redirect to template URL with placeholders filled
    template = cfg.get("checkout_url_template") or ""
    if not template:
        raise HTTPException(400, "Custom provider has no checkout_url_template configured")
    filled = (template
        .replace("{amount}", str(body.amount))
        .replace("{ref}", ref)
        .replace("{currency}", p.currency)
        .replace("{email}", urllib.parse.quote(body.payer_email or ""))
        .replace("{name}", urllib.parse.quote(body.payer_name)))
    return {"checkout_url": filled, "reference": ref}


# ─── Webhooks ────────────────────────────────────────────────────────────────

async def _mark_donation(db: AsyncSession, reference: str, status: str, raw: Any):
    res = await db.execute(select(Donation).where(Donation.reference == reference))
    d = res.scalar_one_or_none()
    if not d:
        return
    d.status = status
    d.raw_payload = raw
    await db.commit()
    # If this payment settles a hall booking, mark it paid + alert admins.
    if status == "success":
        try:
            from routers.sanctuary import confirm_booking_payment
            await confirm_booking_payment(db, reference)
        except Exception as e:
            print(f"[payments] booking-payment hook failed: {type(e).__name__}: {e}", flush=True)


@router.post("/webhook/paystack")
async def webhook_paystack(req: Request, db: AsyncSession = Depends(get_db)):
    raw = await req.body()
    sig = req.headers.get("x-paystack-signature", "")
    res = await db.execute(select(PaymentProvider).where(PaymentProvider.slug == "paystack", PaymentProvider.is_active == True))
    p = res.scalar_one_or_none()
    if p and p.secret_key:
        expected = hmac.new(p.secret_key.encode(), raw, hashlib.sha512).hexdigest()
        if not hmac.compare_digest(expected, sig):
            raise HTTPException(400, "Invalid signature")
    payload = json.loads(raw or b"{}")
    event = payload.get("event")
    data = payload.get("data", {})
    ref = data.get("reference")
    if event == "charge.success" and ref:
        await _mark_donation(db, ref, "success", payload)
    elif event in ("charge.failed",) and ref:
        await _mark_donation(db, ref, "failed", payload)
    return {"ok": True}


@router.post("/webhook/flutterwave")
async def webhook_flutterwave(req: Request, db: AsyncSession = Depends(get_db)):
    raw = await req.body()
    hash_hdr = req.headers.get("verif-hash", "")
    res = await db.execute(select(PaymentProvider).where(PaymentProvider.slug == "flutterwave", PaymentProvider.is_active == True))
    p = res.scalar_one_or_none()
    if p and p.webhook_secret and hash_hdr != p.webhook_secret:
        raise HTTPException(400, "Invalid hash")
    payload = json.loads(raw or b"{}")
    data = payload.get("data", {})
    ref = data.get("tx_ref") or data.get("txRef")
    status = (data.get("status") or "").lower()
    mapped = {"successful": "success", "success": "success", "failed": "failed"}.get(status, "pending")
    if ref:
        await _mark_donation(db, ref, mapped, payload)
    return {"ok": True}


@router.post("/webhook/stripe")
async def webhook_stripe(req: Request, db: AsyncSession = Depends(get_db)):
    payload = await req.json()
    event_type = payload.get("type", "")
    obj = (payload.get("data") or {}).get("object", {})
    ref = obj.get("client_reference_id") or obj.get("metadata", {}).get("ref")
    if event_type == "checkout.session.completed" and ref:
        await _mark_donation(db, ref, "success", payload)
    elif event_type in ("checkout.session.expired", "payment_intent.payment_failed") and ref:
        await _mark_donation(db, ref, "failed", payload)
    return {"ok": True}


@router.post("/webhook/custom/{pid}")
async def webhook_custom(pid: str, req: Request, db: AsyncSession = Depends(get_db)):
    """Generic webhook for custom providers. Expects {reference, status} in JSON body."""
    res = await db.execute(select(PaymentProvider).where(PaymentProvider.id == pid))
    p = res.scalar_one_or_none()
    if not p:
        raise HTTPException(404, "Provider not found")
    body = await req.json()
    ref = body.get("reference") or body.get("ref")
    status = (body.get("status") or "pending").lower()
    if status not in {"success", "failed", "pending", "refunded"}:
        status = "pending"
    if ref:
        await _mark_donation(db, ref, status, body)
    return {"ok": True}


# ─── Donation log + stats ────────────────────────────────────────────────────

@router.get("/donations")
async def list_donations(
    status: Optional[str] = None,
    fund: Optional[str] = None,
    limit: int = 200,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    q = select(Donation).order_by(Donation.created_at.desc())
    if status:
        q = q.where(Donation.status == status)
    if fund:
        q = q.where(Donation.fund == fund)
    q = q.limit(limit)
    res = await db.execute(q)
    rows = res.scalars().all()
    return [{
        "id": d.id, "reference": d.reference, "provider_id": d.provider_id,
        "payer_name": d.payer_name, "payer_email": d.payer_email,
        "amount": float(d.amount), "currency": d.currency, "fund": d.fund,
        "status": d.status, "message": d.message, "interval": d.interval,
        "created_at": d.created_at,
    } for d in rows]


class BillingPortalIn(BaseModel):
    return_url: Optional[str] = None
    customer_email: Optional[str] = None


@router.post("/billing-portal")
async def stripe_billing_portal(
    body: BillingPortalIn,
    db: AsyncSession = Depends(get_db),
):
    """Create a Stripe Customer Portal session so recurring donors can self-manage
    their subscriptions (pause, update card, cancel). Returns the portal URL.

    Notes:
    - Stripe needs a customer_id. We look it up by the payer_email of the most
      recent successful Stripe donation. Once recurring donations exist, store
      stripe_customer_id on the user record for cleaner lookup.
    - The Customer Portal must be enabled in Stripe Dashboard → Settings → Billing
      → Customer Portal (one-time setup).
    """
    res = await db.execute(select(PaymentProvider).where(
        PaymentProvider.slug == "stripe", PaymentProvider.is_active == True
    ))
    provider = res.scalar_one_or_none()
    if not provider or not provider.secret_key:
        raise HTTPException(400, "Stripe provider not configured")

    if not body.customer_email:
        raise HTTPException(400, "customer_email is required to locate the Stripe customer")

    # Find a Stripe customer from past donations by this email
    res2 = await db.execute(select(Donation).where(
        Donation.payer_email == body.customer_email,
        Donation.provider_id == provider.id,
        Donation.status == "success",
    ).order_by(Donation.created_at.desc()).limit(1))
    last = res2.scalar_one_or_none()

    customer_id: Optional[str] = None
    if last and last.raw_payload:
        # Stripe checkout.session.completed payloads include the customer id
        obj = (last.raw_payload.get("data") or {}).get("object") or last.raw_payload
        customer_id = obj.get("customer") if isinstance(obj, dict) else None

    if not customer_id:
        # Search Stripe for a customer by email as a fallback
        async with httpx.AsyncClient(timeout=15) as cli:
            r = await cli.get(
                "https://api.stripe.com/v1/customers",
                headers={"Authorization": f"Bearer {provider.secret_key}"},
                params={"email": body.customer_email, "limit": 1},
            )
        if r.status_code >= 300:
            raise HTTPException(502, f"Stripe customer lookup failed: {r.text[:200]}")
        items = r.json().get("data", [])
        if not items:
            raise HTTPException(404, "No Stripe customer found for this email")
        customer_id = items[0]["id"]

    return_url = body.return_url or "https://letw.org/giving/thank-you"
    async with httpx.AsyncClient(timeout=15) as cli:
        r = await cli.post(
            "https://api.stripe.com/v1/billing_portal/sessions",
            headers={"Authorization": f"Bearer {provider.secret_key}", "Content-Type": "application/x-www-form-urlencoded"},
            data={"customer": customer_id, "return_url": return_url},
        )
    if r.status_code >= 300:
        raise HTTPException(502, f"Stripe portal create failed: {r.text[:300]}")
    return {"url": r.json().get("url")}


@router.get("/donations/by-reference/{reference}")
async def donation_by_reference(reference: str, db: AsyncSession = Depends(get_db)):
    """Public lookup by reference — for the thank-you page to confirm payment status.
    Reference is an unguessable random token, so this is safe to expose unauthenticated."""
    res = await db.execute(select(Donation).where(Donation.reference == reference))
    d = res.scalar_one_or_none()
    if not d:
        raise HTTPException(404, "Donation not found")
    return {
        "reference": d.reference, "payer_name": d.payer_name,
        "amount": float(d.amount), "currency": d.currency,
        "fund": d.fund, "status": d.status, "created_at": d.created_at,
    }


@router.get("/me/giving")
async def my_giving(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """The signed-in member's own giving: gifts tied to their account (exact)
    OR matched by their account email (for gifts made before they signed in).
    Returns this-year total (per currency) plus most recent gifts. Powers the
    'My Giving' card in the member hub."""
    email = (user.email or "").strip().lower()
    conds = [Donation.user_id == user.id]
    if email:
        conds.append(func.lower(Donation.payer_email) == email)
    rows = (await db.execute(
        select(Donation).where(
            sa_or(*conds),
            Donation.status == "success",
        ).order_by(Donation.created_at.desc()).limit(200)
    )).scalars().all()
    if not rows:
        return {"year": None, "totals": [], "recent": [], "count": 0}
    year = rows[0].created_at.year
    totals: dict[str, float] = {}
    for d in rows:
        if d.created_at.year == year:
            cur = (d.currency or "").upper()
            totals[cur] = totals.get(cur, 0.0) + float(d.amount)
    recent = [{
        "date": d.created_at.isoformat(), "amount": float(d.amount),
        "currency": (d.currency or "").upper(), "fund": d.fund,
        "status": d.status, "recurring": bool(d.interval),
    } for d in rows[:6]]
    has_recurring = any(d.interval for d in rows)
    return {
        "year": year,
        "totals": [{"currency": c, "amount": round(a, 2)} for c, a in sorted(totals.items())],
        "recent": recent, "count": len(rows), "has_recurring": has_recurring,
    }


@router.get("/recurring")
async def recurring_donors(db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    """Members who set up a recurring (monthly/weekly/yearly) gift, with the
    expected monthly-equivalent total. Note: reflects recurring gifts that were
    STARTED here — a donor who later cancelled at the provider still shows until
    the provider webhook reports it, so treat totals as an upper-bound estimate."""
    res = await db.execute(
        select(Donation).where(
            Donation.interval.isnot(None), Donation.status == "success",
        ).order_by(Donation.created_at.desc())
    )
    # One entry per (donor, amount, interval, currency) — the newest of each.
    seen: dict[tuple, dict] = {}
    for d in res.scalars().all():
        cur = (d.currency or "").upper()
        who = (d.payer_email or d.payer_name or "Anonymous").strip().lower()
        key = (who, round(float(d.amount), 2), d.interval, cur)
        if key in seen:
            continue
        seen[key] = {
            "name": d.payer_name or "Anonymous", "email": d.payer_email,
            "amount": round(float(d.amount), 2), "currency": cur,
            "interval": d.interval, "fund": d.fund,
            "since": d.created_at.isoformat(),
        }
    donors = list(seen.values())
    # Monthly-equivalent per currency: weekly ×52/12, monthly ×1, yearly ÷12.
    factor = {"weekly": 52 / 12, "monthly": 1.0, "yearly": 1 / 12}
    monthly: dict[str, float] = {}
    for d in donors:
        monthly[d["currency"]] = monthly.get(d["currency"], 0.0) + d["amount"] * factor.get(d["interval"], 1.0)
    return {
        "donors": donors,
        "count": len(donors),
        "expected_monthly": [{"currency": c, "amount": round(a, 2)} for c, a in sorted(monthly.items())],
    }


@router.get("/statements")
async def giving_statements(year: int, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    """Year-end giving summary grouped by donor (by email, falling back to name),
    across successful gifts only. One row per donor with per-currency totals —
    the admin picks a donor and opens their detailed statement to print/send."""
    start = datetime(year, 1, 1)
    end = datetime(year + 1, 1, 1)
    res = await db.execute(
        select(Donation).where(
            Donation.status == "success",
            Donation.created_at >= start, Donation.created_at < end,
        ).order_by(Donation.created_at)
    )
    donors: dict[str, dict] = {}
    for d in res.scalars().all():
        key = (d.payer_email or "").strip().lower() or f"name:{(d.payer_name or 'Anonymous').strip().lower()}"
        entry = donors.setdefault(key, {
            "email": d.payer_email, "name": d.payer_name or "Anonymous",
            "count": 0, "totals": {},
        })
        entry["count"] += 1
        if d.payer_email:
            entry["email"] = d.payer_email  # prefer a real email if any gift had one
        cur = (d.currency or "").upper()
        entry["totals"][cur] = entry["totals"].get(cur, 0.0) + float(d.amount)
    out = []
    for e in donors.values():
        out.append({
            "email": e["email"], "name": e["name"], "count": e["count"],
            "totals": [{"currency": c, "amount": round(a, 2)} for c, a in sorted(e["totals"].items())],
        })
    out.sort(key=lambda r: -(sum(t["amount"] for t in r["totals"])))
    return {"year": year, "donors": out}


@router.get("/statement")
async def giving_statement(year: int, email: str = "", name: str = "", db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    """One donor's detailed year-end statement: every successful gift, per-fund
    and per-currency totals. Matched by email when given, else by exact name
    (for cash/anonymous donors an admin recorded without an email)."""
    start = datetime(year, 1, 1)
    end = datetime(year + 1, 1, 1)
    q = select(Donation).where(
        Donation.status == "success",
        Donation.created_at >= start, Donation.created_at < end,
    )
    if email:
        q = q.where(func.lower(Donation.payer_email) == email.strip().lower())
    elif name:
        q = q.where(Donation.payer_email.is_(None), func.lower(Donation.payer_name) == name.strip().lower())
    else:
        raise HTTPException(400, "Provide an email or a name")
    rows = (await db.execute(q.order_by(Donation.created_at))).scalars().all()
    if not rows:
        raise HTTPException(404, "No successful gifts found for this donor and year")
    donor_name = rows[-1].payer_name or "Anonymous"
    donor_email = next((r.payer_email for r in rows if r.payer_email), email or None)
    items, by_fund, totals = [], {}, {}
    for d in rows:
        cur = (d.currency or "").upper()
        amt = float(d.amount)
        items.append({
            "date": d.created_at.isoformat(), "fund": d.fund,
            "amount": round(amt, 2), "currency": cur, "reference": d.reference,
            "recurring": bool(d.interval),
        })
        by_fund.setdefault((d.fund, cur), 0.0)
        by_fund[(d.fund, cur)] += amt
        totals[cur] = totals.get(cur, 0.0) + amt
    return {
        "year": year, "donor_name": donor_name, "donor_email": donor_email,
        "count": len(rows),
        "items": items,
        "by_fund": [{"fund": f, "currency": c, "amount": round(a, 2)} for (f, c), a in sorted(by_fund.items())],
        "totals": [{"currency": c, "amount": round(a, 2)} for c, a in sorted(totals.items())],
    }


@router.get("/stats")
async def donation_stats(db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(
        select(Donation.status, func.count(Donation.id), func.coalesce(func.sum(Donation.amount), 0))
        .group_by(Donation.status)
    )
    by_status = {row[0]: {"count": row[1], "amount": float(row[2])} for row in res.all()}
    res2 = await db.execute(
        select(Donation.fund, func.count(Donation.id), func.coalesce(func.sum(Donation.amount), 0))
        .where(Donation.status == "success").group_by(Donation.fund)
    )
    by_fund = [{"fund": r[0], "count": r[1], "amount": float(r[2])} for r in res2.all()]
    return {"by_status": by_status, "by_fund": by_fund}
