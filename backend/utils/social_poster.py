"""
Direct posters to Twitter (X) and Facebook page. Instagram stubbed (manual).
Each function returns (external_url_or_None, error_or_None).
"""

import httpx
from typing import Optional


async def post_to_twitter(access_token: str, text: str) -> tuple[Optional[str], Optional[str]]:
    """POST https://api.twitter.com/2/tweets — uses an OAuth2 user access token."""
    if not access_token:
        return None, "Twitter access token not configured"
    text = (text or "").strip()[:280]
    async with httpx.AsyncClient(timeout=20) as cli:
        r = await cli.post(
            "https://api.twitter.com/2/tweets",
            headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"},
            json={"text": text},
        )
    if r.status_code >= 300:
        return None, f"Twitter API {r.status_code}: {r.text[:300]}"
    data = r.json().get("data", {})
    tweet_id = data.get("id")
    return f"https://twitter.com/i/web/status/{tweet_id}" if tweet_id else None, None


async def post_to_facebook(page_id: str, page_access_token: str, message: str, link: Optional[str] = None) -> tuple[Optional[str], Optional[str]]:
    """POST https://graph.facebook.com/{page_id}/feed — requires a Page access token."""
    if not page_access_token or not page_id:
        return None, "Facebook page_id or access token missing"
    body: dict = {"message": message, "access_token": page_access_token}
    if link:
        body["link"] = link
    async with httpx.AsyncClient(timeout=20) as cli:
        r = await cli.post(f"https://graph.facebook.com/v19.0/{page_id}/feed", data=body)
    if r.status_code >= 300:
        return None, f"Facebook API {r.status_code}: {r.text[:300]}"
    post_id = r.json().get("id")
    if not post_id:
        return None, "Facebook did not return a post id"
    return f"https://facebook.com/{post_id}", None


async def post_to_instagram(*_args, **_kwargs) -> tuple[Optional[str], Optional[str]]:
    """Instagram requires a Facebook Business linked IG account + media container
    flow with an image URL. Left unimplemented; admin can post manually for now."""
    return None, "Instagram auto-posting not yet implemented (use manual upload)"
