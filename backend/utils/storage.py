"""
Storage abstraction — saves bytes to local disk, S3-compatible (Cloudflare R2,
AWS S3, MinIO), or Supabase Storage depending on env vars.

Env vars (set on Render):
    STORAGE_BACKEND=local | s3 | supabase   (default 'local')

Supabase mode:
    SUPABASE_URL=https://<project>.supabase.co
    SUPABASE_SERVICE_KEY=<service_role secret key>
    SUPABASE_BUCKET=letw-uploads

S3 mode:
    S3_ENDPOINT_URL=https://<account>.r2.cloudflarestorage.com  (R2 only; omit for AWS)
    S3_REGION=auto                          (R2 uses 'auto')
    S3_ACCESS_KEY=...
    S3_SECRET_KEY=...
    S3_BUCKET=...
    S3_PUBLIC_BASE=https://files.letw.org   (optional public CDN/domain)

All backends return a publicly fetchable URL that the frontend can render directly.
"""

import os
import httpx
from pathlib import Path


def _backend() -> str:
    return os.getenv("STORAGE_BACKEND", "local").lower()


def is_remote() -> bool:
    return _backend() in ("s3", "supabase")


def save_bytes(data: bytes, path: str, content_type: str = "application/octet-stream") -> str:
    """Save bytes to the configured storage backend. Returns a public URL."""
    backend = _backend()
    if backend == "supabase":
        return _save_supabase(data, path, content_type)
    if backend == "s3":
        return _save_s3(data, path, content_type)
    return _save_local(data, path)


def _save_local(data: bytes, path: str) -> str:
    rel = path.lstrip("/")
    dest = Path("uploads") / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(data)
    return f"/uploads/{rel}"


def _save_supabase(data: bytes, path: str, content_type: str) -> str:
    base = os.environ["SUPABASE_URL"].rstrip("/")
    key = os.environ["SUPABASE_SERVICE_KEY"]
    bucket = os.environ.get("SUPABASE_BUCKET", "letw-uploads")
    object_path = path.lstrip("/")

    # PUT with x-upsert: true so re-uploading the same path overwrites.
    url = f"{base}/storage/v1/object/{bucket}/{object_path}"
    with httpx.Client(timeout=30) as client:
        r = client.post(
            url,
            content=data,
            headers={
                "Authorization": f"Bearer {key}",
                "apikey": key,
                "Content-Type": content_type,
                "x-upsert": "true",
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        )
    if r.status_code >= 300:
        raise RuntimeError(f"Supabase upload failed ({r.status_code}): {r.text[:300]}")

    # Public bucket URL pattern
    return f"{base}/storage/v1/object/public/{bucket}/{object_path}"


def _save_s3(data: bytes, path: str, content_type: str) -> str:
    try:
        import boto3
    except ImportError:
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
