from fastapi import APIRouter, UploadFile, File, HTTPException, Body, Form
from pathlib import Path
import traceback
import io
import zipfile
import time
import base64

from app.services.epub_autofix_service import auto_fix_epub
from app.services.qc_service import (
    run_daisy_ace,
    extract_doc_html,
    write_doc_into_epub,
    _LAST_QC_EPUB,
)

router = APIRouter()

BACKEND_ROOT = Path(__file__).resolve().parents[2]
UPLOADS_DIR = BACKEND_ROOT / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# -------------------------------------------------
# Run QC on EPUB (UPLOAD)
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
        raise HTTPException(status_code=500, detail=str(e))


# -------------------------------------------------
# Extract OPF / XHTML
# -------------------------------------------------
@router.post("/doc_html")
async def qc_doc_html(payload: dict = Body(...)):
    doc_path = payload.get("doc_path")
    if not doc_path:
        raise HTTPException(status_code=400, detail="doc_path missing")

    epubs = sorted(
        [p for p in UPLOADS_DIR.iterdir() if p.suffix.lower() == ".epub"],
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )

    if not epubs:
        raise HTTPException(status_code=404, detail="No EPUB uploaded")

    epub_bytes = epubs[0].read_bytes()

    html = extract_doc_html(epub_bytes, doc_path)

    # OPF fallback
    if html is None and doc_path.endswith(".opf"):
        with zipfile.ZipFile(io.BytesIO(epub_bytes)) as zf:
            for name in zf.namelist():
                if name.lower().endswith(".opf"):
                    html = zf.read(name).decode("utf-8", errors="ignore")
                    break

    if html is None:
        raise HTTPException(status_code=404, detail="Document not found")

    return {"html": html}


# -------------------------------------------------
# Save edited XHTML / OPF + Re-run QC
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
            raise HTTPException(status_code=404, detail="No EPUB found")

        latest = epubs[0]
        epub_bytes = latest.read_bytes()

        new_epub = write_doc_into_epub(epub_bytes, doc_path, html)

        ts = int(time.time())
        out_path = UPLOADS_DIR / f"{latest.stem}-fixed-{ts}.epub"
        out_path.write_bytes(new_epub)

        # 🔥 IMPORTANT: update cache for rerun
        _LAST_QC_EPUB["bytes"] = new_epub
        _LAST_QC_EPUB["filename"] = out_path.name

        return run_daisy_ace(new_epub, out_path.name)

    except Exception as e:
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


# -------------------------------------------------
# AUTO FIX EPUB (Accessible EPUB)
# -------------------------------------------------
@router.post("/auto-fix")
async def qc_auto_fix():
    epub_bytes = _LAST_QC_EPUB.get("bytes")
    filename = _LAST_QC_EPUB.get("filename")

    if not epub_bytes or not filename:
        raise HTTPException(
            status_code=400,
            detail="No EPUB available. Run QC first."
        )

    try:
        fixed_epub_bytes = auto_fix_epub(epub_bytes)

        # 🔥 UPDATE CACHE
        _LAST_QC_EPUB["bytes"] = fixed_epub_bytes
        _LAST_QC_EPUB["filename"] = filename.replace(".epub", "-autofixed.epub")

        return {
            "epub_b64": base64.b64encode(fixed_epub_bytes).decode("utf-8"),
            "filename": "accessible.epub",
        }

    except Exception as e:
        print("AUTO FIX ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))


# -------------------------------------------------
# 🔁 Re-run DAISY QC (NO re-upload)
# -------------------------------------------------
@router.post("/rerun")
async def qc_rerun():
    epub_bytes = _LAST_QC_EPUB.get("bytes")
    filename = _LAST_QC_EPUB.get("filename")

    if not epub_bytes or not filename:
        raise HTTPException(
            status_code=400,
            detail="No EPUB available. Upload or fix EPUB first."
        )

    try:
        print("🔁 Re-running QC on:", filename)
        return run_daisy_ace(epub_bytes, filename)

    except Exception as e:
        print("RE-RUN QC ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))
