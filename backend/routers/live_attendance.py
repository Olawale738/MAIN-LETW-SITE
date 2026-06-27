"""
Live Attendance Counter
=======================

Anonymous, in-memory presence tracking for whichever online_service is live.
The viewer page hits POST /heartbeat every ~15s; the backend keeps an
expiring TTL set keyed on a random session id. Country/continent come from
Cloudflare-style headers when available, with a static country list fallback
for the public map.

In-memory only — survives the lifetime of a Render process. That's fine for
"how many right now"; if we ever scale to multiple workers we can swap the
TTL set for Redis behind the same interface.
"""

from __future__ import annotations

import time
import uuid
from collections import defaultdict
from typing import Optional

from fastapi import APIRouter, Header, Request
from pydantic import BaseModel

router = APIRouter(prefix="/api/live-attendance", tags=["Live Attendance"])

# session_id -> (expires_at_epoch, country_code, continent)
_sessions: dict[str, tuple[float, str, str]] = {}
HEARTBEAT_TTL_SECONDS = 45  # ~3 heartbeats grace


def _gc() -> None:
    """Drop expired sessions. Called on every read so we never grow forever."""
    now = time.time()
    expired = [sid for sid, (exp, _, _) in _sessions.items() if exp < now]
    for sid in expired:
        _sessions.pop(sid, None)


def _country_from_request(req: Request) -> tuple[str, str]:
    """
    Best-effort country/continent lookup from edge headers.
    Cloudflare sets cf-ipcountry; Vercel sets x-vercel-ip-country. Render's
    Cloudflare front sets cf-ipcountry too. We accept either.
    """
    cc = (req.headers.get("cf-ipcountry") or req.headers.get("x-vercel-ip-country") or "").upper().strip()
    if not cc or len(cc) != 2 or cc == "XX":
        return "", ""
    cont = _CONTINENT_BY_COUNTRY.get(cc, "")
    return cc, cont


class HeartbeatIn(BaseModel):
    session_id: Optional[str] = None


@router.post("/heartbeat")
async def heartbeat(body: HeartbeatIn, req: Request):
    """
    Viewer pings every ~15s. Returns the session id (echoed back so the
    client can persist it) and the current live count + by-country breakdown.
    """
    sid = (body.session_id or "").strip() or uuid.uuid4().hex[:16]
    cc, cont = _country_from_request(req)
    _sessions[sid] = (time.time() + HEARTBEAT_TTL_SECONDS, cc, cont)
    _gc()
    return {"session_id": sid, **_snapshot()}


@router.get("/snapshot")
async def snapshot_endpoint():
    """Public anonymous read for the on-page widget."""
    _gc()
    return _snapshot()


def _snapshot() -> dict:
    """Aggregate currently-live sessions into a UI-friendly shape."""
    by_country: dict[str, int] = defaultdict(int)
    by_continent: dict[str, int] = defaultdict(int)
    for _, cc, cont in _sessions.values():
        if cc:
            by_country[cc] += 1
        if cont:
            by_continent[cont] += 1
    # Sort by largest first; cap at 30 countries to keep the payload small.
    countries = sorted(
        [{"code": code, "count": count} for code, count in by_country.items()],
        key=lambda x: x["count"], reverse=True,
    )[:30]
    return {
        "total":      len(_sessions),
        "countries":  countries,
        "continents": dict(by_continent),
    }


# ── Country → Continent lookup (minimal, common cases). Augments without
# blocking when the country code isn't listed. ─────────────────────────────

_CONTINENT_BY_COUNTRY: dict[str, str] = {
    # Africa
    "NG":"Africa","GH":"Africa","KE":"Africa","ZA":"Africa","ET":"Africa","UG":"Africa","TZ":"Africa",
    "EG":"Africa","MA":"Africa","CM":"Africa","CI":"Africa","SN":"Africa","SO":"Africa","ZW":"Africa",
    "ZM":"Africa","RW":"Africa","BW":"Africa","NA":"Africa","SD":"Africa","DZ":"Africa","TN":"Africa",
    "LY":"Africa","MZ":"Africa","AO":"Africa","MG":"Africa","MW":"Africa","BJ":"Africa","BF":"Africa",
    "ML":"Africa","NE":"Africa","TD":"Africa","SL":"Africa","LR":"Africa","TG":"Africa","GN":"Africa",
    "GA":"Africa","CD":"Africa","CG":"Africa","BI":"Africa","ER":"Africa","DJ":"Africa","CF":"Africa",
    # Europe
    "GB":"Europe","FR":"Europe","DE":"Europe","IT":"Europe","ES":"Europe","NL":"Europe","BE":"Europe",
    "PL":"Europe","RO":"Europe","SE":"Europe","NO":"Europe","FI":"Europe","DK":"Europe","CH":"Europe",
    "AT":"Europe","IE":"Europe","PT":"Europe","GR":"Europe","CZ":"Europe","HU":"Europe","BG":"Europe",
    "RS":"Europe","SK":"Europe","HR":"Europe","SI":"Europe","LT":"Europe","LV":"Europe","EE":"Europe",
    "RU":"Europe","UA":"Europe","BY":"Europe","MD":"Europe","AL":"Europe","BA":"Europe","MK":"Europe",
    "ME":"Europe","IS":"Europe","LU":"Europe","MT":"Europe","CY":"Europe",
    # North America
    "US":"North America","CA":"North America","MX":"North America","CU":"North America","HT":"North America",
    "JM":"North America","DO":"North America","PR":"North America","GT":"North America","HN":"North America",
    "NI":"North America","CR":"North America","PA":"North America","SV":"North America","BZ":"North America",
    "BS":"North America","TT":"North America","BB":"North America",
    # South America
    "BR":"South America","AR":"South America","CL":"South America","CO":"South America","PE":"South America",
    "VE":"South America","EC":"South America","BO":"South America","PY":"South America","UY":"South America",
    "GY":"South America","SR":"South America",
    # Asia
    "CN":"Asia","JP":"Asia","KR":"Asia","KP":"Asia","IN":"Asia","ID":"Asia","PK":"Asia","BD":"Asia",
    "PH":"Asia","VN":"Asia","TH":"Asia","MY":"Asia","SG":"Asia","TR":"Asia","SA":"Asia","IR":"Asia",
    "IQ":"Asia","IL":"Asia","AE":"Asia","KW":"Asia","QA":"Asia","OM":"Asia","JO":"Asia","LB":"Asia",
    "SY":"Asia","YE":"Asia","AF":"Asia","KZ":"Asia","UZ":"Asia","AZ":"Asia","GE":"Asia","AM":"Asia",
    "NP":"Asia","LK":"Asia","MM":"Asia","KH":"Asia","LA":"Asia","TW":"Asia","HK":"Asia","MO":"Asia",
    "MN":"Asia","BN":"Asia","BT":"Asia","MV":"Asia",
    # Oceania
    "AU":"Oceania","NZ":"Oceania","PG":"Oceania","FJ":"Oceania","SB":"Oceania","VU":"Oceania","WS":"Oceania",
    "TO":"Oceania","KI":"Oceania","TV":"Oceania","NR":"Oceania","FM":"Oceania","PW":"Oceania","MH":"Oceania",
}
