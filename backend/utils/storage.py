"""
Storage abstraction — saves bytes to local disk OR S3-compatible
(Cloudflare R2, AWS S3, MinIO, etc.) depending on env vars.

Env vars (set on Render):
    STORAGE_BACKEND=local | s3      (default 'local')
    S3_ENDPOINT_URL=https://<account>.r2.cloudflarestorage.com   (R2 only; omit for AWS)
    S3_REGION=auto                  (R2 uses 'auto', AWS uses e.g. 'us-east-1')
    S3_ACCESS_KEY=...
    S3_SECRET_KEY=...
    S3_BUCKET=letw-uploads
    S3_PUBLIC_BASE=https://files.letw.org   (public CDN/domain for the bucket)

Returns a public URL that the frontend can render directly.
"""

import os
from typing import Optional
from pathlib import Path


def is_s3_enabled() -> bool:
    return os.getenv("STORAGE_BACKEND", "local").lower() == "s3"


def save_bytes(data: bytes, path: str, content_type: str = "application/octet-stream") -> str:
    """Save bytes to either local disk or S3. Returns a publicly fetchable URL."""
    if is_s3_enabled():
        return _save_s3(data, path, content_type)
    return _save_local(data, path)


def _save_local(data: bytes, path: str) -> str:
    rel = path.lstrip("/")
    dest = Path("uploads") / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(data)
    return f"/uploads/{rel}"


def _save_s3(data: bytes, path: str, content_type: str) -> str:
    try:
        import boto3
    except ImportError:
        # Fallback if boto3 not installed
        return _save_local(data, path)
    bucket = os.environ["S3_BUCKET"]
    key = path.lstrip("/")
    client = boto3.client(
        "s3",
        endpoint_url=os.getenv("S3_ENDPOINT_URL") or None,
        region_name=os.getenv("S3_REGION", "auto"),
        aws_access_key_id=os.environ["S3_ACCESS_KEY"],
        aws_secret_access_key=os.environ["S3_SECRET_KEY"],
    )
    client.put_object(
        Bucket=bucket, Key=key, Body=data, ContentType=content_type,
        CacheControl="public, max-age=31536000, immutable",
    )
    base = os.getenv("S3_PUBLIC_BASE")
    if base:
        return f"{base.rstrip('/')}/{key}"
    return f"https://{bucket}.s3.amazonaws.com/{key}"
