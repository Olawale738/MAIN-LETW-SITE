"""
Database backups → Supabase Storage.

Strategy: SELECT * from every table, serialise to JSON, gzip, upload.
Survives Supabase's 7-day rolling window so you can recover from a bug
or accidental delete that happened more than a week ago.

Endpoints
- POST /api/admin/backups/run          — execute a backup now (admin OR cron token)
- GET  /api/admin/backups              — list backups stored in Supabase
- DELETE /api/admin/backups/{name}     — manual delete (admin only)
- POST /api/admin/backups/cleanup      — delete backups older than RETENTION_DAYS

Cron setup (daily 2am UTC):
- Sign up free at https://cron-job.org
- Add job:
    URL:    https://letw-backend.onrender.com/api/admin/backups/run
    Method: POST
    Schedule: 0 2 * * *
    Header: X-Backup-Token: <BACKUP_TOKEN env var on Render>
"""

import gzip
import json
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import inspect, text
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db, engine
from models.user import User
from utils.dependencies import get_admin_user


router = APIRouter(prefix="/api/admin/backups", tags=["Backups"])

RETENTION_DAYS = 30
BUCKET_PREFIX = "backups"  # backups/letw-YYYY-MM-DDTHH-MM-SS.json.gz


# ─── Auth: admin OR cron token ───────────────────────────────────────────────

async def admin_or_cron_token(
    request: Request,
    current_user: Optional[User] = Depends(get_admin_user, use_cache=False),
):
    """This dependency is replaced manually below to make the admin requirement optional."""
    return True


def _check_cron_token(request: Request) -> bool:
    token_required = os.getenv("BACKUP_TOKEN")
    if not token_required:
        return False
    provided = request.headers.get("X-Backup-Token") or request.query_params.get("token")
    return bool(provided) and secrets.compare_digest(provided, token_required)


def _verify_caller(request: Request, current_user_optional: Optional[User]):
    """Allow admin user OR matching X-Backup-Token header."""
    if current_user_optional is not None:
        return  # admin
    if _check_cron_token(request):
        return
    raise HTTPException(401, "Admin or valid backup token required")


# ─── JSON serialisation that handles datetime/Decimal/bytes ──────────────────

def _to_jsonable(obj):
    if obj is None or isinstance(obj, (bool, int, float, str)):
        return obj
    if isinstance(obj, datetime):
        return obj.isoformat()
    if isinstance(obj, (bytes, bytearray)):
        return {"__bytes__": True, "b64": __import__("base64").b64encode(bytes(obj)).decode()}
    if isinstance(obj, dict):
        return {k: _to_jsonable(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple, set)):
        return [_to_jsonable(v) for v in obj]
    # Fallback — repr is safe for Decimal / UUID / Enum members
    try:
        return str(obj)
    except Exception:
        return None


async def _dump_database(db: AsyncSession) -> bytes:
    """SELECT * from every public-schema table, return gzip-compressed JSON bytes."""
    # Get list of tables from the connected DB (not just SQLAlchemy metadata).
    res = await db.execute(text(
        "SELECT table_name FROM information_schema.tables "
        "WHERE table_schema = 'public' AND table_type = 'BASE TABLE' "
        "ORDER BY table_name"
    ))
    tables = [r[0] for r in res.fetchall()]

    dump: dict = {
        "version": 1,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "table_count": len(tables),
        "tables": {},
    }

    for tbl in tables:
        # Quote table name to handle reserved words / case
        rows_res = await db.execute(text(f'SELECT * FROM public."{tbl}"'))
        rows = rows_res.mappings().all()
        dump["tables"][tbl] = {
            "row_count": len(rows),
            "rows": [_to_jsonable(dict(r)) for r in rows],
        }

    raw = json.dumps(dump, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    return gzip.compress(raw, compresslevel=9)


# ─── Supabase Storage helpers ────────────────────────────────────────────────

def _supabase_ready() -> tuple[str, str, str]:
    base = os.getenv("SUPABASE_URL", "").rstrip("/")
    key = os.getenv("SUPABASE_SERVICE_KEY", "")
    bucket = os.getenv("SUPABASE_BUCKET", "letw-uploads")
    if not base or not key:
        raise HTTPException(500, "Supabase Storage not configured (SUPABASE_URL / SUPABASE_SERVICE_KEY missing)")
    return base, key, bucket


def _upload_backup(blob: bytes, filename: str) -> str:
    base, key, bucket = _supabase_ready()
    object_path = f"{BUCKET_PREFIX}/{filename}"
    url = f"{base}/storage/v1/object/{bucket}/{object_path}"
    with httpx.Client(timeout=120) as cli:
        r = cli.post(
            url,
            content=blob,
            headers={
                "Authorization": f"Bearer {key}",
                "apikey": key,
                "Content-Type": "application/gzip",
                "x-upsert": "true",
                "Cache-Control": "no-store",
            },
        )
    if r.status_code >= 300:
        raise HTTPException(502, f"Supabase upload failed: {r.status_code} {r.text[:300]}")
    return f"{base}/storage/v1/object/public/{bucket}/{object_path}"


def _list_backups() -> list[dict]:
    base, key, bucket = _supabase_ready()
    url = f"{base}/storage/v1/object/list/{bucket}"
    with httpx.Client(timeout=30) as cli:
        r = cli.post(
            url,
            headers={"Authorization": f"Bearer {key}", "apikey": key, "Content-Type": "application/json"},
            json={"prefix": f"{BUCKET_PREFIX}/", "limit": 200, "sortBy": {"column": "name", "order": "desc"}},
        )
    if r.status_code >= 300:
        return []
    items = r.json()
    return [{
        "name": it["name"].split("/")[-1],
        "size_bytes": it.get("metadata", {}).get("size", 0),
        "created_at": it.get("created_at"),
        "public_url": f"{base}/storage/v1/object/public/{bucket}/{BUCKET_PREFIX}/{it['name'].split('/')[-1]}",
    } for it in items if it.get("name")]


def _delete_backup(filename: str) -> bool:
    base, key, bucket = _supabase_ready()
    url = f"{base}/storage/v1/object/{bucket}/{BUCKET_PREFIX}/{filename}"
    with httpx.Client(timeout=30) as cli:
        r = cli.delete(url, headers={"Authorization": f"Bearer {key}", "apikey": key})
    return r.status_code < 300


# ─── Endpoints ───────────────────────────────────────────────────────────────

@router.post("/run")
async def run_backup(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Execute backup. Auth: admin session OR matching X-Backup-Token header."""
    # Manual auth check (allow either admin OR cron token)
    is_authed = False
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        # Try admin session
        try:
            from utils.security import decode_token
            from sqlalchemy import select
            payload = decode_token(auth_header.split(" ", 1)[1])
            if payload:
                res = await db.execute(select(User).where(User.id == payload.get("sub")))
                u = res.scalar_one_or_none()
                if u and u.role.value == "admin":
                    is_authed = True
        except Exception:
            pass
    if not is_authed and _check_cron_token(request):
        is_authed = True
    if not is_authed:
        raise HTTPException(401, "Admin login or valid X-Backup-Token required")

    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H-%M-%S")
    filename = f"letw-{stamp}.json.gz"

    blob = await _dump_database(db)
    public_url = _upload_backup(blob, filename)
    auto_cleanup_count = _cleanup_old()

    return {
        "ok": True,
        "filename": filename,
        "size_bytes": len(blob),
        "size_mb": round(len(blob) / 1024 / 1024, 2),
        "public_url": public_url,
        "auto_cleaned_old": auto_cleanup_count,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/")
async def list_backups(_: User = Depends(get_admin_user)):
    return {"retention_days": RETENTION_DAYS, "backups": _list_backups()}


@router.delete("/{filename}")
async def delete_backup(filename: str, _: User = Depends(get_admin_user)):
    if "/" in filename or ".." in filename or not filename.endswith(".json.gz"):
        raise HTTPException(400, "Invalid filename")
    ok = _delete_backup(filename)
    return {"deleted": ok, "filename": filename}


@router.post("/cleanup")
async def cleanup_old(_: User = Depends(get_admin_user)):
    return {"deleted": _cleanup_old()}


def _cleanup_old() -> int:
    """Delete backups older than RETENTION_DAYS. Returns count deleted."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=RETENTION_DAYS)
    deleted = 0
    for b in _list_backups():
        # Parse "letw-YYYY-MM-DDTHH-MM-SS.json.gz"
        try:
            stem = b["name"].replace("letw-", "").replace(".json.gz", "")
            when = datetime.strptime(stem, "%Y-%m-%dT%H-%M-%S").replace(tzinfo=timezone.utc)
            if when < cutoff and _delete_backup(b["name"]):
                deleted += 1
        except Exception:
            pass
    return deleted
