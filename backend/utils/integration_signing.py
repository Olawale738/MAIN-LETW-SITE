"""
Signed transport for the sharepoints boundary (LETW-INTEGRATION-HMAC-V1).

An API key proves only that the caller once knew a secret. A signature proves
that *this* request, with *this* body, was produced by someone holding the
secret and has not been replayed or altered in transit. The two are layered:
the key still gates the route, the signature attests the message.

Canonical input, joined with newlines:

    LETW-INTEGRATION-HMAC-V1
    UPPERCASE_HTTP_METHOD
    /path?query=sorted
    X-LETW-Timestamp
    X-LETW-Nonce
    X-LETW-Content-SHA256
    X-Correlation-ID
    Idempotency-Key-or-empty

Signature is ``sha256=`` followed by the lowercase hex HMAC-SHA256 digest.
"""

from __future__ import annotations

import hashlib
import hmac
import time
import uuid
from typing import Optional
from urllib.parse import urlencode, urlsplit, parse_qsl

VERSION = "v1"
PREFIX = "LETW-INTEGRATION-HMAC-V1"

# How far a timestamp may be from ours. Wide enough for ordinary clock drift
# between two hosts, narrow enough that a captured request stops being useful
# quickly.
SKEW_SECONDS = 300

HEADERS = {
    "version": "X-LETW-Signature-Version",
    "timestamp": "X-LETW-Timestamp",
    "nonce": "X-LETW-Nonce",
    "content": "X-LETW-Content-SHA256",
    "correlation": "X-Correlation-ID",
    "idempotency": "Idempotency-Key",
    "source": "X-LETW-Source",
    "signature": "X-LETW-Signature",
}

# Nonces already seen, with the time they expire. Held in memory: the window is
# five minutes, so a restart forfeits at most that much replay protection, and
# a shared store would be a database round trip on every integration call.
_seen: dict[str, float] = {}


def _sweep(now: float) -> None:
    if len(_seen) < 512:
        return
    for k, exp in list(_seen.items()):
        if exp < now:
            _seen.pop(k, None)


def body_hash(raw: bytes) -> str:
    """SHA-256 of the exact bytes on the wire. Re-serialising parsed JSON would
    produce a different hash for a semantically identical body, which is why
    every caller here works from raw bytes."""
    return hashlib.sha256(raw or b"").hexdigest()


def canonical_path(url: str) -> str:
    """Path plus query with parameters sorted, so two orderings of the same
    query sign identically."""
    parts = urlsplit(url)
    path = parts.path or "/"
    if not parts.query:
        return path
    return f"{path}?{urlencode(sorted(parse_qsl(parts.query, keep_blank_values=True)))}"


def canonical_string(method: str, path: str, timestamp: str, nonce: str,
                     content_sha: str, correlation: str, idempotency: str) -> str:
    return "\n".join([
        PREFIX,
        (method or "").upper(),
        path,
        timestamp,
        nonce,
        content_sha,
        correlation,
        idempotency or "",
    ])


def compute(secret: str, method: str, path: str, timestamp: str, nonce: str,
            content_sha: str, correlation: str, idempotency: str) -> str:
    mac = hmac.new(
        secret.encode(),
        canonical_string(method, path, timestamp, nonce, content_sha, correlation, idempotency).encode(),
        hashlib.sha256,
    ).hexdigest()
    return f"sha256={mac}"


def sign_headers(secret: str, method: str, url: str, raw: bytes,
                 idempotency: Optional[str] = None,
                 correlation: Optional[str] = None,
                 source: str = "letw.org") -> dict:
    """Headers that sign one outgoing request.

    A retry of the same business event keeps its body and idempotency key but
    gets a fresh timestamp, nonce and signature — otherwise the retry looks
    exactly like the replay the receiver is meant to reject.
    """
    if not secret:
        return {}
    ts = str(int(time.time() * 1000))
    nonce = uuid.uuid4().hex
    corr = correlation or uuid.uuid4().hex
    sha = body_hash(raw)
    path = canonical_path(url)
    return {
        HEADERS["version"]: VERSION,
        HEADERS["timestamp"]: ts,
        HEADERS["nonce"]: nonce,
        HEADERS["content"]: sha,
        HEADERS["correlation"]: corr,
        HEADERS["source"]: source,
        HEADERS["signature"]: compute(secret, method, path, ts, nonce, sha, corr, idempotency or ""),
        **({HEADERS["idempotency"]: idempotency} if idempotency else {}),
    }


class SignatureError(Exception):
    """Raised when signature headers are present but do not hold up."""


def verify(secret: str, method: str, url: str, raw: bytes, headers) -> Optional[dict]:
    """Check a signed request.

    Returns None when the request carries no signature headers at all — the
    caller decides whether unsigned is acceptable. Raises when headers are
    present but wrong: a malformed signature must never be downgraded to
    unsigned authentication, or an attacker could strip a signature to weaken
    the check.
    """
    def h(name: str) -> str:
        try:
            return (headers.get(name) or "").strip()
        except Exception:
            return ""

    version = h(HEADERS["version"])
    ts = h(HEADERS["timestamp"])
    nonce = h(HEADERS["nonce"])
    declared = h(HEADERS["content"]).lower()
    corr = h(HEADERS["correlation"])
    idem = h(HEADERS["idempotency"])
    sig = h(HEADERS["signature"])

    present = [x for x in (version, ts, nonce, declared, sig) if x]
    if not present:
        return None
    if len(present) != 5:
        raise SignatureError("Signed integration headers are incomplete.")
    if version.lower() != VERSION:
        raise SignatureError(f"Unsupported signature version {version!r}.")
    if not secret:
        raise SignatureError("Signed integration verification is not configured.")

    try:
        sent_ms = int(ts)
    except ValueError:
        raise SignatureError("Invalid signature timestamp.")
    now = time.time()
    if abs(now - sent_ms / 1000.0) > SKEW_SECONDS:
        raise SignatureError("Signature timestamp is outside the accepted window.")

    actual = body_hash(raw)
    if not hmac.compare_digest(actual, declared):
        raise SignatureError("Request body does not match its content hash.")

    expected = compute(secret, method, canonical_path(url), ts, nonce, declared, corr, idem)
    if not hmac.compare_digest(expected, sig):
        raise SignatureError("Signature does not match.")

    # Only now, once the signature is known good, is the nonce worth recording —
    # otherwise an unauthenticated caller could burn arbitrary nonces.
    _sweep(now)
    if nonce in _seen and _seen[nonce] > now:
        raise SignatureError("This request has already been seen.")
    _seen[nonce] = now + SKEW_SECONDS

    return {"version": version, "correlation_id": corr, "source": h(HEADERS["source"]) or None,
            "idempotency_key": idem or None, "signed": True}
