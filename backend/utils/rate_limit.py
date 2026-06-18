"""
Lightweight in-memory rate limiter for public endpoints.

Replace with slowapi/redis-backed for multi-process deployments. For a single
backend process this is sufficient and zero-dependency.
"""

import time
from collections import defaultdict, deque
from typing import Optional

from fastapi import Request, HTTPException

# (route_key, ip) -> deque of timestamps
_history: dict[tuple[str, str], deque[float]] = defaultdict(lambda: deque(maxlen=200))


def _client_ip(request: Request) -> str:
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def rate_limit(max_calls: int, per_seconds: int, key: Optional[str] = None):
    """Reject if the same IP exceeds max_calls within per_seconds for this key.

    Usage:
        @router.post("/")
        async def submit(request: Request, _rl=Depends(rate_limit(5, 60, "prayer"))):
            ...
    """
    key_name = key or "default"

    async def _dep(request: Request):
        ip = _client_ip(request)
        bucket = _history[(key_name, ip)]
        now = time.monotonic()
        cutoff = now - per_seconds
        while bucket and bucket[0] < cutoff:
            bucket.popleft()
        if len(bucket) >= max_calls:
            retry_after = int(per_seconds - (now - bucket[0]))
            raise HTTPException(
                status_code=429,
                detail=f"Too many requests. Try again in {max(retry_after, 1)}s.",
                headers={"Retry-After": str(max(retry_after, 1))},
            )
        bucket.append(now)
        return True

    return _dep
