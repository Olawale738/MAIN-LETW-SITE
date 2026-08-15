"""
Analytics Command Center — one admin endpoint that aggregates cross-domain
church KPIs, 12-month trends, and breakdowns from the live database, plus an
AI-written (or rule-based) insight summary.

Design notes (from a full data-domain map):
- Enum casing differs per table (some store UPPERCASE names, some lowercase),
  so we always compare via the ORM enum members, never hand-written strings,
  for User / PrayerRequest. Plain-String status columns use their literals.
- Datetimes are mixed naive/aware across tables; comparing a Python bound to the
  wrong kind crashes Postgres. We therefore build every trend with a pure
  `date_trunc(month, col)` GROUP BY (no bound comparison) and derive "this
  month" from the buckets — so there is never a naive/aware comparison.
- Every domain is wrapped in its own try/except: a single failing query degrades
  that section to empty, never the whole dashboard.
"""

from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.user import User
from utils.dependencies import get_admin_user


router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


# ── Helpers ───────────────────────────────────────────────────────────────────

def _last_n_months(n: int = 12) -> list[str]:
    """['YYYY-MM', ...] for the last n months ending this month (oldest first)."""
    now = datetime.utcnow()
    y, m = now.year, now.month
    keys: list[str] = []
    for _ in range(n):
        keys.append(f"{y:04d}-{m:02d}")
        m -= 1
        if m == 0:
            m = 12
            y -= 1
    return list(reversed(keys))


def _mk(dt) -> str:
    return dt.strftime("%Y-%m") if dt is not None else ""


def _series(rows: list[tuple[Any, int]], n: int = 12) -> list[dict]:
    """Align (month_datetime, count) rows to the last n months → [{month, value}]."""
    bucket = { _mk(dt): int(v or 0) for dt, v in rows if dt is not None }
    return [{"month": k, "value": bucket.get(k, 0)} for k in _last_n_months(n)]


def _this_month(series: list[dict]) -> int:
    return series[-1]["value"] if series else 0


async def _month_counts(db: AsyncSession, model, col) -> list[dict]:
    """Monthly count series for `model` bucketed by `col` (a datetime/date column)."""
    bucket = func.date_trunc("month", col)
    res = await db.execute(select(bucket, func.count()).group_by(bucket).order_by(bucket))
    return _series([(r[0], r[1]) for r in res.all()])


async def _group_counts(db: AsyncSession, model, col) -> list[dict]:
    """[{label, value}] counts grouped by an enum/category column."""
    res = await db.execute(select(col, func.count()).group_by(col).order_by(func.count().desc()))
    out = []
    for label, count in res.all():
        lab = getattr(label, "value", label)
        out.append({"label": str(lab) if lab is not None else "unspecified", "value": int(count or 0)})
    return out


async def _count(db: AsyncSession, stmt) -> int:
    return int((await db.execute(stmt)).scalar() or 0)


# ── Overview ──────────────────────────────────────────────────────────────────

@router.get("/overview")
async def analytics_overview(db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    kpis: dict[str, Any] = {}
    series: dict[str, Any] = {}
    breakdowns: dict[str, Any] = {}
    errors: list[str] = []

    # ---- Members ------------------------------------------------------------
    try:
        from models.user import UserStatus, UserRole
        kpis["members_total"] = await _count(db, select(func.count(User.id)))
        kpis["members_active"] = await _count(db, select(func.count(User.id)).where(User.status == UserStatus.ACTIVE))
        kpis["members_pending"] = await _count(db, select(func.count(User.id)).where(User.status == UserStatus.PENDING))
        series["members"] = await _month_counts(db, User, User.created_at)
        kpis["members_new_this_month"] = _this_month(series["members"])
        breakdowns["members_by_role"] = await _group_counts(db, User, User.role)
        breakdowns["members_by_status"] = await _group_counts(db, User, User.status)
    except Exception as e:
        errors.append(f"members: {type(e).__name__}: {e}")

    # ---- Giving -------------------------------------------------------------
    try:
        from models.payment import Donation
        rows = (await db.execute(
            select(Donation.currency, func.coalesce(func.sum(Donation.amount), 0), func.count(Donation.id))
            .where(Donation.status == "success").group_by(Donation.currency)
        )).all()
        kpis["giving"] = [{"currency": (c or "NGN"), "total": float(t or 0), "count": int(n or 0)} for c, t, n in rows]
        kpis["giving_gifts_total"] = sum(g["count"] for g in kpis["giving"])
        # Monthly count of settled gifts (currency-agnostic count avoids mixing sums).
        bucket = func.date_trunc("month", Donation.created_at)
        gs = (await db.execute(
            select(bucket, func.count()).where(Donation.status == "success").group_by(bucket).order_by(bucket)
        )).all()
        series["giving_gifts"] = _series([(r[0], r[1]) for r in gs])
        fr = (await db.execute(
            select(Donation.fund, Donation.currency, func.coalesce(func.sum(Donation.amount), 0), func.count(Donation.id))
            .where(Donation.status == "success").group_by(Donation.fund, Donation.currency)
        )).all()
        breakdowns["giving_by_fund"] = [
            {"fund": (f or "General"), "currency": (c or "NGN"), "total": float(t or 0), "count": int(n or 0)}
            for f, c, t, n in fr
        ]
    except Exception as e:
        errors.append(f"giving: {type(e).__name__}: {e}")

    # ---- Ministries ---------------------------------------------------------
    try:
        from models.custom_ministry import CustomMinistry, CustomMinistryMember
        kpis["ministries_total"] = await _count(db, select(func.count(CustomMinistry.id)))
        kpis["ministries_active"] = await _count(db, select(func.count(CustomMinistry.id)).where(CustomMinistry.is_active == True))  # noqa: E712
        kpis["ministry_members_active"] = await _count(db, select(func.count(CustomMinistryMember.id)).where(CustomMinistryMember.status == "active"))
        series["ministry_members"] = await _month_counts(db, CustomMinistryMember, CustomMinistryMember.requested_at)
        breakdowns["ministries_by_category"] = await _group_counts(db, CustomMinistry, CustomMinistry.category)
    except Exception as e:
        errors.append(f"ministries: {type(e).__name__}: {e}")

    # ---- Marriage prep ------------------------------------------------------
    try:
        from models.marriage_prep import MarriagePrepCouple as MC
        kpis["couples_total"] = await _count(db, select(func.count(MC.id)))
        kpis["couples_completed"] = await _count(db, select(func.count(MC.id)).where(MC.pastor_signed_off == True))  # noqa: E712
        kpis["couples_active_prep"] = await _count(db, select(func.count(MC.id)).where(MC.status.in_(["enrolled", "in_progress"])))
        kpis["couples_with_counsellor"] = await _count(db, select(func.count(MC.id)).where(MC.assigned_pastor_user_id.isnot(None)))
        series["couples"] = await _month_counts(db, MC, MC.created_at)
        breakdowns["couples_by_status"] = await _group_counts(db, MC, MC.status)
    except Exception as e:
        errors.append(f"marriage_prep: {type(e).__name__}: {e}")

    # ---- Evangelism + life events ------------------------------------------
    try:
        from models.evangelism import EvangelismInterest
        kpis["evangelism_signups_total"] = await _count(db, select(func.count(EvangelismInterest.id)))
        series["evangelism"] = await _month_counts(db, EvangelismInterest, EvangelismInterest.created_at)
    except Exception as e:
        errors.append(f"evangelism: {type(e).__name__}: {e}")
    try:
        from models.leaflet import EvangelismLeaflet
        kpis["leaflets_total"] = await _count(db, select(func.count(EvangelismLeaflet.id)))
        kpis["leaflets_published"] = await _count(db, select(func.count(EvangelismLeaflet.id)).where(EvangelismLeaflet.status == "published"))
    except Exception as e:
        errors.append(f"leaflets: {type(e).__name__}: {e}")
    try:
        from models.life_event import LifeEventRequest as LE
        kpis["life_events_total"] = await _count(db, select(func.count(LE.id)))
        kpis["life_events_pending"] = await _count(db, select(func.count(LE.id)).where(LE.status == "pending"))
        breakdowns["life_events_by_kind"] = await _group_counts(db, LE, LE.kind)
    except Exception as e:
        errors.append(f"life_events: {type(e).__name__}: {e}")

    # ---- Prayer -------------------------------------------------------------
    try:
        from models.prayer import PrayerRequest, PrayerRequestStatus, UserPrayer
        kpis["prayer_total"] = await _count(db, select(func.count(PrayerRequest.id)))
        kpis["prayer_answered"] = await _count(db, select(func.count(PrayerRequest.id)).where(PrayerRequest.status == PrayerRequestStatus.ANSWERED))
        kpis["prayer_open"] = await _count(db, select(func.count(PrayerRequest.id)).where(PrayerRequest.status.in_([PrayerRequestStatus.PENDING, PrayerRequestStatus.PRAYING])))
        kpis["prayers_offered"] = await _count(db, select(func.count(UserPrayer.id)))
        series["prayer"] = await _month_counts(db, PrayerRequest, PrayerRequest.created_at)
        breakdowns["prayer_by_status"] = await _group_counts(db, PrayerRequest, PrayerRequest.status)
    except Exception as e:
        errors.append(f"prayer: {type(e).__name__}: {e}")

    # ---- Engagement (subscribers / events / sermons / blog) -----------------
    try:
        from models.newsletter import NewsletterSubscriber
        kpis["subscribers_active"] = await _count(db, select(func.count(NewsletterSubscriber.id)).where(NewsletterSubscriber.is_active == True))  # noqa: E712
        series["subscribers"] = await _month_counts(db, NewsletterSubscriber, NewsletterSubscriber.subscribed_at)
    except Exception as e:
        errors.append(f"subscribers: {type(e).__name__}: {e}")
    try:
        from models.event import Event
        from datetime import date as _date
        kpis["events_total"] = await _count(db, select(func.count(Event.id)))
        kpis["events_upcoming"] = await _count(db, select(func.count(Event.id)).where(Event.event_date >= _date.today(), Event.is_published == True))  # noqa: E712
    except Exception as e:
        errors.append(f"events: {type(e).__name__}: {e}")
    try:
        from models.sermon import Sermon
        kpis["sermons_total"] = await _count(db, select(func.count(Sermon.id)))
        kpis["sermon_views_total"] = await _count(db, select(func.coalesce(func.sum(Sermon.view_count), 0)))
    except Exception as e:
        errors.append(f"sermons: {type(e).__name__}: {e}")
    try:
        from models.blog import BlogPost
        kpis["blog_published"] = await _count(db, select(func.count(BlogPost.id)).where(BlogPost.status == "published"))
    except Exception as e:
        errors.append(f"blog: {type(e).__name__}: {e}")

    # ---- Children check-in --------------------------------------------------
    try:
        from models.children_checkin import CheckIn
        kpis["children_on_site_now"] = await _count(db, select(func.count(CheckIn.id)).where(CheckIn.checked_out_at.is_(None)))
        kpis["children_checkins_total"] = await _count(db, select(func.count(CheckIn.id)))
    except Exception as e:
        errors.append(f"children: {type(e).__name__}: {e}")

    highlights = _highlights(kpis, series)

    return {
        "generated_at": datetime.utcnow().isoformat(),
        "kpis": kpis,
        "series": series,
        "breakdowns": breakdowns,
        "highlights": highlights,
        "_errors": errors,
    }


def _trend(series: list[dict]) -> str:
    """Compare the latest month to the previous month → a short phrase."""
    if not series or len(series) < 2:
        return ""
    cur, prev = series[-1]["value"], series[-2]["value"]
    if prev == 0 and cur == 0:
        return "flat"
    if prev == 0:
        return f"up (+{cur} this month)"
    pct = round((cur - prev) / prev * 100)
    if pct > 0:
        return f"up {pct}% vs last month"
    if pct < 0:
        return f"down {abs(pct)}% vs last month"
    return "flat vs last month"


def _highlights(kpis: dict, series: dict) -> list[str]:
    """Rule-based insight lines — always present even with no AI configured."""
    h: list[str] = []
    if kpis.get("members_total") is not None:
        nm = kpis.get("members_new_this_month", 0)
        t = _trend(series.get("members", []))
        h.append(f"{kpis['members_total']} members total ({kpis.get('members_active', 0)} active); {nm} joined this month" + (f" — {t}." if t else "."))
    if kpis.get("giving"):
        parts = ", ".join(f"{g['currency']} {g['total']:,.0f}" for g in kpis["giving"])
        gt = _trend(series.get("giving_gifts", []))
        h.append(f"Giving (settled): {parts} across {kpis.get('giving_gifts_total', 0)} gifts" + (f" — gift volume {gt}." if gt else "."))
    if kpis.get("prayer_total"):
        rate = round((kpis.get("prayer_answered", 0) / kpis["prayer_total"]) * 100) if kpis["prayer_total"] else 0
        h.append(f"{kpis['prayer_total']} prayer requests, {kpis.get('prayer_answered', 0)} answered ({rate}%); {kpis.get('prayers_offered', 0)} prayers offered on the wall.")
    if kpis.get("couples_total"):
        h.append(f"Marriage prep: {kpis['couples_total']} couples, {kpis.get('couples_completed', 0)} completed, {kpis.get('couples_active_prep', 0)} currently in preparation.")
    if kpis.get("ministries_total"):
        h.append(f"{kpis.get('ministries_active', 0)}/{kpis['ministries_total']} ministries active with {kpis.get('ministry_members_active', 0)} active memberships.")
    if kpis.get("evangelism_signups_total") is not None:
        h.append(f"Evangelism: {kpis.get('evangelism_signups_total', 0)} outreach sign-ups, {kpis.get('leaflets_published', 0)} leaflets published.")
    if kpis.get("life_events_pending"):
        h.append(f"{kpis['life_events_pending']} life-event request(s) awaiting review.")
    if kpis.get("subscribers_active"):
        st = _trend(series.get("subscribers", []))
        h.append(f"{kpis['subscribers_active']} active newsletter subscribers" + (f" — {st}." if st else "."))
    return h


# ── AI insight narrative (optional; rule-based fallback) ──────────────────────

@router.get("/insight")
async def analytics_insight(db: AsyncSession = Depends(get_db), admin: User = Depends(get_admin_user)):
    data = await analytics_overview(db, admin)  # reuse aggregation
    highlights = data.get("highlights", [])
    try:
        from utils import ai_provider
        if ai_provider.has_any():
            facts = "\n".join(f"- {line}" for line in highlights)
            prompt = (
                "You are the analytics advisor for a church (Light Encounter Tabernacle Worldwide). "
                "Given these current numbers, write a warm, concise briefing (max ~130 words) for the pastoral/admin team: "
                "2-3 sentences on what stands out, then 2-3 short bullet recommendations of what to act on this week. "
                "Be specific and encouraging; do not invent numbers beyond those given.\n\nCurrent numbers:\n" + facts
            )
            text = await ai_provider.chat_completion(prompt, max_tokens=400)
            if text and text.strip():
                return {"source": "ai", "text": text.strip(), "highlights": highlights}
    except Exception as e:
        print(f"[analytics] AI insight failed: {type(e).__name__}: {e}", flush=True)
    return {"source": "rules", "text": "\n".join(highlights), "highlights": highlights}
