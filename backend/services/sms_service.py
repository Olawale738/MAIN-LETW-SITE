"""
SMS sending — dispatches to whichever provider the admin activated.

send_sms(to, message) returns (ok, detail). Best-effort by design: callers wrap
it and never let an SMS failure break the main flow. No-op (ok=False) when no
provider is active, so the whole app works with SMS switched off.
"""

import logging
from typing import Optional

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


def _normalise_msisdn(to: str) -> str:
    """Best-effort to E.164-ish. Nigerian local 0XXted -> +234XXX; keeps +.. as-is."""
    t = (to or "").strip().replace(" ", "").replace("-", "")
    if not t:
        return t
    if t.startswith("+"):
        return t
    if t.startswith("234"):
        return "+" + t
    if t.startswith("0") and len(t) == 11:
        return "+234" + t[1:]
    return t


async def _active_provider(db: AsyncSession):
    from models.sms import SmsProvider
    return (await db.execute(
        select(SmsProvider).where(SmsProvider.is_active == True)  # noqa: E712
    )).scalars().first()


async def send_sms(db: AsyncSession, to: str, message: str) -> tuple[bool, str]:
    """Send one SMS via the active provider. Returns (ok, detail)."""
    p = await _active_provider(db)
    if not p:
        return False, "No active SMS provider configured."
    number = _normalise_msisdn(to)
    if not number:
        return False, "No recipient number."
    try:
        if p.provider == "termii":
            return await _send_termii(p, number, message)
        if p.provider == "twilio":
            return await _send_twilio(p, number, message)
        if p.provider == "africastalking":
            return await _send_africastalking(p, number, message)
        if p.provider == "custom":
            return await _send_custom(p, number, message)
        return False, f"Unknown provider '{p.provider}'."
    except Exception as e:
        logger.warning("SMS send failed: %s", e)
        return False, f"{type(e).__name__}: {e}"


async def _send_termii(p, number: str, message: str) -> tuple[bool, str]:
    if not p.api_key:
        return False, "Termii API key not set."
    async with httpx.AsyncClient(timeout=20) as cli:
        r = await cli.post("https://api.ng.termii.com/api/sms/send", json={
            "to": number.lstrip("+"),
            "from": p.sender_id or "N-Alert",
            "sms": message,
            "type": "plain",
            "channel": (p.config or {}).get("channel", "generic"),
            "api_key": p.api_key,
        })
    if r.status_code >= 300:
        return False, f"Termii error {r.status_code}: {r.text[:200]}"
    return True, "sent via Termii"


async def _send_twilio(p, number: str, message: str) -> tuple[bool, str]:
    # api_key = Account SID, api_secret = Auth Token, sender_id = from-number
    if not (p.api_key and p.api_secret and p.sender_id):
        return False, "Twilio needs Account SID, Auth Token, and a From number."
    async with httpx.AsyncClient(timeout=20) as cli:
        r = await cli.post(
            f"https://api.twilio.com/2010-04-01/Accounts/{p.api_key}/Messages.json",
            data={"To": number, "From": p.sender_id, "Body": message},
            auth=(p.api_key, p.api_secret),
        )
    if r.status_code >= 300:
        return False, f"Twilio error {r.status_code}: {r.text[:200]}"
    return True, "sent via Twilio"


async def _send_africastalking(p, number: str, message: str) -> tuple[bool, str]:
    # api_key = API key, api_secret = username
    if not (p.api_key and p.api_secret):
        return False, "Africa's Talking needs an API key and username."
    async with httpx.AsyncClient(timeout=20) as cli:
        r = await cli.post(
            "https://api.africastalking.com/version1/messaging",
            headers={"apiKey": p.api_key, "Accept": "application/json",
                     "Content-Type": "application/x-www-form-urlencoded"},
            data={"username": p.api_secret, "to": number, "message": message,
                  **({"from": p.sender_id} if p.sender_id else {})},
        )
    if r.status_code >= 300:
        return False, f"Africa's Talking error {r.status_code}: {r.text[:200]}"
    return True, "sent via Africa's Talking"


async def _send_custom(p, number: str, message: str) -> tuple[bool, str]:
    """Generic HTTP GET/POST with placeholder substitution — for any gateway.
    config: { method: 'GET'|'POST', params: {..with {to}/{message}/{sender}/{key}..},
              headers: {...}, json: bool }"""
    if not p.base_url:
        return False, "Custom SMS provider has no endpoint URL."
    cfg = p.config or {}

    def fill(v: str) -> str:
        return (str(v)
                .replace("{to}", number)
                .replace("{message}", message)
                .replace("{sender}", p.sender_id or "")
                .replace("{key}", p.api_key or ""))

    params = {k: fill(v) for k, v in (cfg.get("params") or {}).items()}
    headers = {k: fill(v) for k, v in (cfg.get("headers") or {}).items()}
    method = (cfg.get("method") or "POST").upper()
    async with httpx.AsyncClient(timeout=20) as cli:
        if method == "GET":
            r = await cli.get(fill(p.base_url), params=params, headers=headers)
        elif cfg.get("json"):
            r = await cli.post(fill(p.base_url), json=params, headers=headers)
        else:
            r = await cli.post(fill(p.base_url), data=params, headers=headers)
    if r.status_code >= 300:
        return False, f"Custom SMS error {r.status_code}: {r.text[:200]}"
    return True, "sent via custom gateway"


async def send_sms_bg(to: str, message: str) -> None:
    """Fire-and-forget helper that opens its own DB session. Safe to call from
    request handlers without threading the session through."""
    try:
        from database import AsyncSessionLocal
        async with AsyncSessionLocal() as db:
            ok, detail = await send_sms(db, to, message)
            if not ok:
                logger.info("SMS not sent to %s: %s", to, detail)
    except Exception as e:
        logger.warning("send_sms_bg failed: %s", e)
