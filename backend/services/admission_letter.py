"""
Server-side admission letter (PDF).

The letter is a document of the School of Theology, signed by the Registrar or
the Deputy Registrar. It deliberately carries no administrator's name, no
account identity and no dashboard chrome — whoever happens to be logged in when
it is generated is irrelevant to what the letter says. The only person named on
it is the signatory the school has appointed.

Drawn with reportlab rather than rendered from the web page: pure Python with
prebuilt wheels, so it needs no headless browser or system packages on Render,
and the output is identical every time regardless of who asks for it.
"""

from __future__ import annotations

import base64
import io
from datetime import datetime
from typing import Any, Optional

from reportlab.lib.colors import Color, HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas as _canvas

INK = HexColor("#140152")
GOLD = HexColor("#f5bb00")
GOLD_DEEP = HexColor("#9a6f00")
RULE = HexColor("#c9c9d4")
BODY = HexColor("#26263a")
MUTED = HexColor("#6b7280")

MM = 72.0 / 25.4
PAGE_W, PAGE_H = A4
LEFT = 22 * MM
RIGHT = PAGE_W - 16 * MM
TOP = PAGE_H - 16 * MM


def _fetch(url: Optional[str], timeout: float = 8.0) -> Optional[bytes]:
    """Best-effort fetch of a remote or inline image. A missing picture must
    never stop a letter being issued."""
    if not url:
        return None
    try:
        if url.startswith("data:"):
            return base64.b64decode(url.split(",", 1)[1])
        if url.startswith("http"):
            import httpx
            r = httpx.get(url, timeout=timeout, follow_redirects=True)
            if 200 <= r.status_code < 300:
                return r.content
    except Exception as e:
        print(f"[admission-letter] could not load image {str(url)[:60]}: {type(e).__name__}: {e}", flush=True)
    return None


def _image(data: Optional[bytes]) -> Optional[ImageReader]:
    if not data:
        return None
    try:
        return ImageReader(io.BytesIO(data))
    except Exception:
        return None


def _qr_png(verify_url: str) -> Optional[bytes]:
    try:
        import qrcode
        qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, border=1)
        qr.add_data(verify_url)
        qr.make(fit=True)
        buf = io.BytesIO()
        qr.make_image(fill_color="black", back_color="white").save(buf, format="PNG")
        return buf.getvalue()
    except Exception as e:
        print(f"[admission-letter] QR generation failed: {type(e).__name__}: {e}", flush=True)
        return None


def _wrap(c: _canvas.Canvas, text: str, font: str, size: float, width: float) -> list[str]:
    """Greedy wrap on the canvas's own metrics, so justification is accurate."""
    words, lines, line = text.split(), [], ""
    for w in words:
        trial = f"{line} {w}".strip()
        if c.stringWidth(trial, font, size) <= width:
            line = trial
        else:
            if line:
                lines.append(line)
            line = w
    if line:
        lines.append(line)
    return lines


def _para(c: _canvas.Canvas, text: str, x: float, y: float, width: float,
          font: str = "Helvetica", size: float = 9.6, leading: float = 15.0,
          color: Color = BODY, justify: bool = True) -> float:
    """Draw a justified paragraph; returns the y below it."""
    c.setFillColor(color)
    lines = _wrap(c, text, font, size, width)
    for i, line in enumerate(lines):
        last = i == len(lines) - 1
        if justify and not last and len(line.split()) > 1:
            words = line.split()
            gap = (width - c.stringWidth("".join(words), font, size)) / (len(words) - 1)
            cx = x
            for w in words:
                c.setFont(font, size)
                c.drawString(cx, y, w)
                cx += c.stringWidth(w, font, size) + gap
        else:
            c.setFont(font, size)
            c.drawString(x, y, line)
        y -= leading
    return y


def build_admission_letter(
    *,
    full_name: str,
    email: str,
    admission_number: str,
    program_name: str,
    level: Optional[str],
    duration_months: Optional[int],
    tuition_amount: Optional[float],
    currency: str,
    issued_at: Optional[datetime],
    photo_url: Optional[str],
    logo_url: Optional[str],
    signatory: dict[str, Any],
    verify_url: str,
    fingerprint: str,
) -> bytes:
    """Render the letter and return the PDF bytes."""
    buf = io.BytesIO()
    c = _canvas.Canvas(buf, pagesize=A4)
    c.setTitle(f"Admission Letter — {admission_number}")
    c.setAuthor("LETW School of Theology")
    c.setSubject("Offer of Provisional Admission")

    logo = _image(_fetch(logo_url))

    # Binding edge
    c.setFillColor(GOLD)
    c.rect(0, 0, 6 * MM, PAGE_H, stroke=0, fill=1)
    c.setFillColor(INK)
    c.rect(0, 0, 6 * MM, PAGE_H * 0.42, stroke=0, fill=1)

    # Seal watermark
    if logo:
        c.saveState()
        try:
            c.setFillAlpha(0.05)
            c.drawImage(logo, PAGE_W / 2 - 67 * MM, PAGE_H / 2 - 67 * MM,
                        134 * MM, 134 * MM, mask="auto", preserveAspectRatio=True)
        except Exception:
            pass
        c.restoreState()

    y = TOP

    # ── Letterhead ──────────────────────────────────────────────────────────
    # The band is sized to the photograph, which is the tallest element in it.
    # Sizing it to the logo instead is what pushed the picture through the rule.
    PHOTO_W, PHOTO_H = 25 * MM, 31 * MM
    LOGO = 19 * MM
    BAND = PHOTO_H + 2 * MM

    band_top = y
    band_bottom = band_top - BAND

    # Logo, vertically centred in the band.
    logo_y = band_bottom + (BAND - LOGO) / 2
    if logo:
        try:
            c.drawImage(logo, LEFT, logo_y, LOGO, LOGO, mask="auto", preserveAspectRatio=True)
        except Exception:
            pass

    # Wordmark, optically centred against the logo.
    tx = LEFT + LOGO + 4 * MM
    ty = logo_y + LOGO - 4.6 * MM
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 12.5)
    c.drawString(tx, ty, "LIGHT ENCOUNTER TABERNACLE WORLDWIDE")
    c.setFillColor(GOLD_DEEP)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(tx, ty - 5.2 * MM, "S C H O O L   O F   T H E O L O G Y")
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 7)
    c.drawString(tx, ty - 9.6 * MM, "Office of the Registrar  |  letw.org")
    c.drawString(tx, ty - 13 * MM, "Admissions & Student Records")

    # Passport photograph, sitting square in the band and clear of the rule.
    photo = _image(_fetch(photo_url))
    px = RIGHT - PHOTO_W
    py = band_bottom + 1 * MM
    if photo:
        try:
            c.drawImage(photo, px, py, PHOTO_W, PHOTO_H, mask="auto", preserveAspectRatio=False)
        except Exception:
            photo = None
    c.setStrokeColor(RULE)
    c.setLineWidth(0.6)
    c.rect(px, py, PHOTO_W, PHOTO_H, stroke=1, fill=0)
    if not photo:
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 5.6)
        c.drawCentredString(px + PHOTO_W / 2, py + PHOTO_H / 2 + 2, "PHOTOGRAPH")
        c.drawCentredString(px + PHOTO_W / 2, py + PHOTO_H / 2 - 5, "TO BE AFFIXED")

    y = band_bottom - 3 * MM
    c.setStrokeColor(INK)
    c.setLineWidth(1.4)
    c.line(LEFT, y, RIGHT, y)
    c.setLineWidth(0.5)
    c.line(LEFT, y - 1.6, RIGHT, y - 1.6)
    y -= 9 * MM

    # ── Reference line ──────────────────────────────────────────────────────
    c.setFillColor(MUTED)
    c.setFont("Helvetica-Bold", 6.6)
    c.drawString(LEFT, y, "OUR REF")
    c.drawRightString(RIGHT, y, "DATE")
    y -= 4.6 * MM
    c.setFillColor(INK)
    c.setFont("Courier-Bold", 10)
    c.drawString(LEFT, y, admission_number)
    c.setFont("Helvetica-Bold", 9)
    c.drawRightString(RIGHT, y, (issued_at or datetime.utcnow()).strftime("%d %B %Y"))
    y -= 12 * MM

    # ── Title ───────────────────────────────────────────────────────────────
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 13.5)
    c.drawCentredString(PAGE_W / 2, y, "O F F E R   O F   P R O V I S I O N A L   A D M I S S I O N")
    y -= 4 * MM
    mid = PAGE_W / 2
    c.setStrokeColor(GOLD_DEEP)
    c.setLineWidth(0.7)
    c.line(mid - 26 * MM, y, mid - 4 * MM, y)
    c.line(mid + 4 * MM, y, mid + 26 * MM, y)
    c.setFillColor(GOLD)
    c.rect(mid - 1.4 * MM, y - 1.4 * MM, 2.8 * MM, 2.8 * MM, stroke=0, fill=1)
    y -= 11 * MM

    width = RIGHT - LEFT

    # ── Body ────────────────────────────────────────────────────────────────
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(LEFT, y, full_name)
    y -= 4.4 * MM
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8)
    c.drawString(LEFT, y, email)
    y -= 8 * MM

    first = (full_name or "").split(" ")[0]
    c.setFillColor(BODY)
    c.setFont("Helvetica", 9.6)
    c.drawString(LEFT, y, f"Dear {first},")
    y -= 7 * MM

    lvl = f" at {level} level" if level else ""
    dur = f", a course of study extending over {duration_months} months" if duration_months else ""
    y = _para(c, (
        f"On the recommendation of the Academic Board, I am pleased to inform you that you have been "
        f"offered provisional admission into the {program_name} programme{lvl}{dur} in the School of "
        f"Theology of Light Encounter Tabernacle Worldwide."
    ), LEFT, y, width)
    y -= 4 * MM

    fee = f"{currency} {float(tuition_amount or 0):,.0f}"
    y = _para(c, (
        f"Your application has been assessed and the prescribed tuition of {fee} has been received and "
        f"verified in full. This admission is granted on that basis and takes effect upon your "
        f"acceptance of this offer."
    ), LEFT, y, width)
    y -= 8 * MM

    # ── Particulars ─────────────────────────────────────────────────────────
    c.setFillColor(MUTED)
    c.setFont("Helvetica-Bold", 6.4)
    c.drawString(LEFT, y, "P A R T I C U L A R S   O F   A D M I S S I O N")
    y -= 4 * MM

    rows = [
        ("Name of candidate", full_name),
        ("Admission number", admission_number),
        ("Programme", program_name),
        ("Level of award", level or "—"),
        ("Duration of study", f"{duration_months} months" if duration_months else "—"),
        ("Tuition (settled)", fee),
        ("Student login", email),
    ]
    rh = 6.4 * MM
    label_w = width * 0.36
    table_top = y
    for i, (label, value) in enumerate(rows):
        ry = y - rh
        if i % 2:
            c.setFillColor(HexColor("#f6f6fa"))
            c.rect(LEFT, ry, width, rh, stroke=0, fill=1)
        c.setStrokeColor(HexColor("#e2e2ee"))
        c.setLineWidth(0.4)
        c.rect(LEFT, ry, width, rh, stroke=1, fill=0)
        c.line(LEFT + label_w, ry, LEFT + label_w, ry + rh)
        c.setFillColor(MUTED)
        c.setFont("Helvetica-Bold", 6.4)
        c.drawString(LEFT + 2.4 * MM, ry + 2.4 * MM, label.upper())
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 8.4)
        c.drawString(LEFT + label_w + 2.4 * MM, ry + 2.2 * MM, str(value))
        y = ry
    c.setStrokeColor(HexColor("#b9b9cc"))
    c.setLineWidth(0.7)
    c.rect(LEFT, y, width, table_top - y, stroke=1, fill=0)
    y -= 9 * MM

    y = _para(c, (
        "To take up this offer you must record your acceptance. Upon acceptance your student record is "
        "opened, your identity card is issued, and access to your classes is arranged. Should you not "
        "accept within the period stated in your offer correspondence, this admission may be withdrawn "
        "without further notice."
    ), LEFT, y, width)
    y -= 4 * MM
    y = _para(c, (
        "It is a privilege to welcome you into the school. It is our prayer that this training will "
        "deepen your walk with God and equip you thoroughly for the work of the ministry to which you "
        "have been called."
    ), LEFT, y, width)

    # ── Signature block ─────────────────────────────────────────────────────
    sig_y = max(y - 14 * MM, 46 * MM)
    c.setFillColor(BODY)
    c.setFont("Helvetica", 9.6)
    c.drawString(LEFT, sig_y, "Yours faithfully,")

    sig = _image(_fetch((signatory or {}).get("signature_url")))
    line_y = sig_y - 20 * MM
    if sig:
        try:
            c.drawImage(sig, LEFT, line_y + 1.5 * MM, 50 * MM, 15 * MM,
                        mask="auto", preserveAspectRatio=True, anchor="sw")
        except Exception:
            pass
    c.setStrokeColor(HexColor("#6b7280"))
    c.setLineWidth(0.7)
    c.line(LEFT, line_y, LEFT + 58 * MM, line_y)
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 9.4)
    c.drawString(LEFT, line_y - 4.6 * MM, (signatory or {}).get("name") or "")
    c.setFillColor(MUTED)
    c.setFont("Helvetica-Bold", 6.6)
    c.drawString(LEFT, line_y - 8.4 * MM, ((signatory or {}).get("title") or "Registrar").upper())
    c.setFont("Helvetica", 6.4)
    c.drawString(LEFT, line_y - 12 * MM, "For and on behalf of the Academic Board")

    # ── Authentication chip ─────────────────────────────────────────────────
    qr = _image(_qr_png(verify_url))
    qs = 23 * MM
    qx, qy = RIGHT - qs, line_y - 6 * MM
    if qr:
        try:
            c.drawImage(qr, qx, qy, qs, qs, preserveAspectRatio=True)
        except Exception:
            pass
    c.setFillColor(MUTED)
    c.setFont("Helvetica-Bold", 5.6)
    c.drawCentredString(qx + qs / 2, qy - 3.4 * MM, "S C A N   T O   V E R I F Y")
    c.setFont("Courier", 6.4)
    c.drawCentredString(qx + qs / 2, qy - 7 * MM, fingerprint)

    # ── Footer ──────────────────────────────────────────────────────────────
    fy = 15 * MM
    c.setStrokeColor(HexColor("#d7d7e2"))
    c.setLineWidth(0.5)
    c.line(LEFT, fy + 4 * MM, RIGHT, fy + 4 * MM)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 5.8)
    c.drawString(LEFT, fy, "Issued electronically by the School of Theology and valid without a wet signature.")
    c.drawString(LEFT, fy - 3.2 * MM, "Authenticity may be confirmed by scanning the code above.")
    c.setFont("Courier", 5.8)
    c.drawRightString(RIGHT, fy, admission_number)

    c.showPage()
    c.save()
    return buf.getvalue()
