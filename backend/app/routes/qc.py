from fastapi import APIRouter, UploadFile, File, HTTPException, Form
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

BASE_DIR = Path(__file__).resolve().parents[2]
EXTRACTED_DIR = BASE_DIR / "extracted_epub"
EXTRACTED_DIR.mkdir(parents=True, exist_ok=True)

# -------------------------------------------------
# 1️⃣ Run QC on EPUB (UPLOAD)
# -------------------------------------------------
@router.post("/epub")
async def qc_epub(
    book_id: str = Form(...),
    epub_file: UploadFile = File(...)
):
    """
    Stores EPUB correctly into:
    extracted_epub/<book_id>/original.epub
    and sets _LAST_QC_EPUB so QC & TagMapping work.
    """

    try:
        epub_bytes = await epub_file.read()

        # Folder
        book_dir = EXTRACTED_DIR / book_id
        book_dir.mkdir(parents=True, exist_ok=True)

        # Save EPUB
        epub_path = book_dir / "original.epub"
        epub_path.write_bytes(epub_bytes)

        # 🔥 REQUIRED: Update QC cache
        _LAST_QC_EPUB["bytes"] = epub_bytes
        _LAST_QC_EPUB["filename"] = "original.epub"
        _LAST_QC_EPUB["book_id"] = book_id

        # Run QC
        return run_daisy_ace(epub_bytes, epub_file.filename)

    except Exception as e:
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


# -------------------------------------------------
# 2️⃣ Extract XHTML / OPF
# -------------------------------------------------
@router.post("/doc_html")
async def qc_doc_html(
    book_id: str = Form(...),
    doc_path: str = Form(...)
):
    epub_bytes = _LAST_QC_EPUB.get("bytes")

    if not epub_bytes:
        raise HTTPException(status_code=404, detail="No QC EPUB uploaded")

    html = extract_doc_html(epub_bytes, doc_path)

    # fallback for OPF
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
# 3️⃣ FIX EPUB + Re-run QC
# -------------------------------------------------
@router.post("/fix")
async def qc_fix(
    book_id: str = Form(...),
    doc_path: str = Form(...),
    html: str = Form(...)
):
    try:
        epub_bytes = _LAST_QC_EPUB.get("bytes")
        if not epub_bytes:
            raise HTTPException(status_code=404, detail="No QC EPUB found")

        # Write updated XHTML into EPUB
        new_epub = write_doc_into_epub(epub_bytes, doc_path, html)

        # Save updated version
        book_dir = EXTRACTED_DIR / book_id
        book_dir.mkdir(parents=True, exist_ok=True)

        out_path = book_dir / "qc_fixed.epub"
        out_path.write_bytes(new_epub)

        # Update cache
        _LAST_QC_EPUB["bytes"] = new_epub
        _LAST_QC_EPUB["filename"] = "qc_fixed.epub"
        _LAST_QC_EPUB["book_id"] = book_id

        return run_daisy_ace(new_epub, "qc_fixed.epub")

    except Exception as e:
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


# -------------------------------------------------
# 4️⃣ AUTO-FIX EPUB
# -------------------------------------------------
@router.post("/auto-fix")
async def qc_auto_fix(
    book_id: str = Form(...)
):
    epub_bytes = _LAST_QC_EPUB.get("bytes")

    if not epub_bytes:
        raise HTTPException(status_code=400, detail="No EPUB available")

    try:
        fixed_epub_bytes = auto_fix_epub(epub_bytes)

        book_dir = EXTRACTED_DIR / book_id
        book_dir.mkdir(parents=True, exist_ok=True)

        out_path = book_dir / "qc_autofixed.epub"
        out_path.write_bytes(fixed_epub_bytes)

        # Update cache
        _LAST_QC_EPUB["bytes"] = fixed_epub_bytes
        _LAST_QC_EPUB["filename"] = "qc_autofixed.epub"
        _LAST_QC_EPUB["book_id"] = book_id

        return {
            "epub_b64": base64.b64encode(fixed_epub_bytes).decode("utf-8"),
            "filename": "qc_autofixed.epub",
            "saved_at": str(out_path),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------------------------------------------
# 5️⃣ RE-RUN QC (uses last modified EPUB)
# ---------------------------------------------
@router.post("/rerun")
async def qc_rerun():
    epub_bytes = _LAST_QC_EPUB.get("bytes")
    filename = _LAST_QC_EPUB.get("filename")

    if not epub_bytes:
        raise HTTPException(status_code=400, detail="No EPUB available for re-run")

    try:
        result = run_daisy_ace(epub_bytes, filename)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
