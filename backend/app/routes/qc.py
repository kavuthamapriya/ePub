from fastapi import APIRouter, UploadFile, File, HTTPException, Body, Form
from pathlib import Path
import traceback
import io
import zipfile
import time
from app.services.epub_autofix_service import auto_fix_epub
from app.services.qc_service import _LAST_QC_EPUB


from app.services.qc_service import (
    run_daisy_ace,
    extract_doc_html,
    write_doc_into_epub,
)

router = APIRouter()

BACKEND_ROOT = Path(__file__).resolve().parents[2]
UPLOADS_DIR = BACKEND_ROOT / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# -------------------------------------------------
# Run QC on EPUB
# -------------------------------------------------
@router.post("/epub")
async def qc_epub(epub_file: UploadFile = File(...)):
    try:
        data = await epub_file.read()

        save_path = UPLOADS_DIR / epub_file.filename
        save_path.write_bytes(data)

        return run_daisy_ace(data, epub_file.filename)

    except Exception as e:
        print(traceback.format_exc())
        raise HTTPException(500, str(e))


# -------------------------------------------------
# Extract OPF / XHTML from EPUB
# -------------------------------------------------
@router.post("/doc_html")
async def qc_doc_html(payload: dict = Body(...)):
    doc_path = payload.get("doc_path")
    if not doc_path:
        raise HTTPException(400, "doc_path missing")

    epubs = sorted(
        [p for p in UPLOADS_DIR.iterdir() if p.suffix.lower() == ".epub"],
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )

    if not epubs:
        raise HTTPException(404, "No EPUB uploaded")

    epub_bytes = epubs[0].read_bytes()

    html = extract_doc_html(epub_bytes, doc_path)

    # 🔥 fallback: auto-detect OPF
    if html is None and doc_path.endswith(".opf"):
        with zipfile.ZipFile(io.BytesIO(epub_bytes)) as zf:
            for name in zf.namelist():
                if name.lower().endswith(".opf"):
                    html = zf.read(name).decode("utf-8", errors="ignore")
                    break

    if html is None:
        raise HTTPException(404, "Document not found")

    return {"html": html}


# -------------------------------------------------
# Save edited OPF/XHTML and re-run QC
# -------------------------------------------------
@router.post("/fix")
async def qc_fix(
    doc_path: str = Form(...),
    html: str = Form(...),
):
    try:
        epubs = sorted(
            [p for p in UPLOADS_DIR.iterdir() if p.suffix.lower() == ".epub"],
            key=lambda p: p.stat().st_mtime,
            reverse=True,
        )

        if not epubs:
            raise HTTPException(404, "No EPUB found")

        latest = epubs[0]
        epub_bytes = latest.read_bytes()

        new_epub = write_doc_into_epub(epub_bytes, doc_path, html)

        ts = int(time.time())
        out_path = UPLOADS_DIR / f"{latest.stem}-fixed-{ts}.epub"
        out_path.write_bytes(new_epub)

        return run_daisy_ace(new_epub, out_path.name)

    except Exception as e:
        print(traceback.format_exc())
        raise HTTPException(500, str(e))
# -------------------------------------------------
# Convert EPUB → Accessible EPUB (DOWNLOADABLE)
# -------------------------------------------------
@router.post("/auto-fix")
async def qc_auto_fix():
    """
    Uses Excel-based accessibility rules
    and returns Accessible EPUB as base64
    """
    from app.services.epub_autofix_service import auto_fix_epub
    import base64

    epubs = sorted(
        [p for p in UPLOADS_DIR.iterdir() if p.suffix.lower() == ".epub"],
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )

    if not epubs:
        raise HTTPException(404, "No EPUB uploaded")

    latest_epub = epubs[0]

    # 🔥 RUN YOUR EXISTING SCRIPT
    fixed_bytes = auto_fix_epub(latest_epub)

    return {
        "filename": f"{latest_epub.stem}-accessible.epub",
        "epub_b64": base64.b64encode(fixed_bytes).decode("utf-8"),
    }
