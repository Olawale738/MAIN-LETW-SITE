"""
Brute-force protection and password strength for account sign-in.

Two separate jobs, both about the same thing — that a password is only as good
as the number of guesses an attacker gets.

The lockout is deliberately per-account rather than per-IP: an attacker
distributes across addresses trivially, but cannot avoid naming the account
they are trying to break into. Locking the account is inconvenient for that one
user and useless for the attacker, which is the right way round.
"""

from __future__ import annotations

import re
import time
from datetime import datetime, timedelta
from typing import Optional

# Attempts allowed before the first lock, then the lock lengthens each time.
# Short at first so an ordinary person mistyping is barely inconvenienced;
# long quickly enough that automated guessing stops being worth the wait.
FREE_ATTEMPTS = 5
LOCK_STEPS_SECONDS = [60, 300, 900, 3600, 21600]   # 1m, 5m, 15m, 1h, 6h
ATTEMPT_WINDOW = timedelta(hours=6)


def lock_duration(consecutive_failures: int) -> int:
    """Seconds to lock after this many consecutive failures."""
    over = max(0, consecutive_failures - FREE_ATTEMPTS)
    if over <= 0:
        return 0
    return LOCK_STEPS_SECONDS[min(over - 1, len(LOCK_STEPS_SECONDS) - 1)]


def locked_for(user) -> int:
    """Seconds remaining on a lock, or 0."""
    until = getattr(user, "locked_until", None)
    if not until:
        return 0
    remaining = (until - datetime.utcnow()).total_seconds()
    return int(remaining) if remaining > 0 else 0


def note_failure(user) -> int:
    """Record a failed attempt. Returns the lock length applied, in seconds."""
    last = getattr(user, "last_failed_login_at", None)
    # A long gap since the last failure means this is a fresh attempt by a real
    # person, not a continuing attack — start their count again.
    if last and datetime.utcnow() - last > ATTEMPT_WINDOW:
        user.failed_login_attempts = 0
    user.failed_login_attempts = (getattr(user, "failed_login_attempts", 0) or 0) + 1
    user.last_failed_login_at = datetime.utcnow()
    seconds = lock_duration(user.failed_login_attempts)
    if seconds:
        user.locked_until = datetime.utcnow() + timedelta(seconds=seconds)
    return seconds


def note_success(user) -> None:
    user.failed_login_attempts = 0
    user.locked_until = None
    user.last_failed_login_at = None


def lock_message(seconds: int) -> str:
    if seconds >= 3600:
        return f"Too many failed sign-in attempts. Try again in about {seconds // 3600} hour(s)."
    if seconds >= 60:
        return f"Too many failed sign-in attempts. Try again in about {seconds // 60} minute(s)."
    return "Too many failed sign-in attempts. Try again shortly."


# ── Password strength ────────────────────────────────────────────────────────

# Not a dictionary check — just the handful that show up constantly, plus the
# ones this church's own students are most likely to reach for.
COMMON = {
    "password", "password1", "password123", "12345678", "123456789", "1234567890",
    "qwerty", "qwerty123", "letmein", "welcome", "welcome1", "admin123",
    "iloveyou", "sunshine", "princess", "football", "monkey", "abc12345",
    "jesus123", "godislove", "hallelujah", "letwletw", "changeme", "student",
    "theology", "church123", "amen1234",
}

MIN_LENGTH = 10


def password_problem(password: str, *, email: str = "", name: str = "") -> Optional[str]:
    """Why this password is not acceptable, or None if it is.

    Length carries most of the weight — it is the property that actually
    resists guessing — so this asks for a longer password rather than a
    thicket of character classes that mostly produces "Password1!".
    """
    pw = (password or "").strip()
    if len(pw) < MIN_LENGTH:
        return f"Use at least {MIN_LENGTH} characters. A short phrase is easier to remember and harder to guess."
    if len(pw) > 128:
        return "That password is too long — 128 characters maximum."
    if pw.lower() in COMMON:
        return "That password is one of the most commonly used ones. Please choose something else."
    if re.fullmatch(r"(.)\1+", pw):
        return "That password is a single repeated character."
    if re.search(r"0123|1234|2345|3456|4567|5678|6789|abcd|qwer", pw.lower()):
        return "Avoid straight runs of letters or numbers."

    # A password built from the account's own details is public knowledge.
    local = (email or "").split("@")[0].lower()
    if local and len(local) > 2 and local in pw.lower():
        return "Your password should not contain your email address."
    for part in (name or "").lower().split():
        if len(part) > 3 and part in pw.lower():
            return "Your password should not contain your name."
    return None


# ── Throttle for server-to-server credential checks ──────────────────────────

# The classroom's sign-in call is a password oracle: it answers "is this the
# right password" to anyone holding the integration key. Per-account lockout
# covers the account; this covers the endpoint, so one compromised key cannot
# be used to sweep many accounts quickly.
_calls: dict[str, list[float]] = {}
VERIFY_PER_MINUTE = 30


def verify_throttled(bucket: str = "lms") -> bool:
    now = time.time()
    hits = [t for t in _calls.get(bucket, []) if now - t < 60]
    hits.append(now)
    _calls[bucket] = hits
    return len(hits) > VERIFY_PER_MINUTE
