# backend/app/routes/qc.py
from fastapi import APIRouter, UploadFile, File, HTTPException, Body, Form
from fastapi.responses import JSONResponse
from typing import Optional
from pathlib import Path
import zipfile
import io
import os
import json
import traceback
import time

router = APIRouter()

# Backend root (where uploads folder lives)
BACKEND_ROOT = Path(__file__).resolve().parents[2]  # .../backend
UPLOADS_DIR = BACKEND_ROOT / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# Import qc_service helpers
from app.services.qc_service import run_daisy_ace, extract_doc_html, write_doc_into_epub

# ---------- existing /epub endpoint ----------
@router.post("/epub")
async def qc_epub(epub_file: UploadFile = File(...)):
    """
    Run DAISY Ace on the uploaded EPUB file.
    Returns the JSON payload produced by run_daisy_ace(...).
    """
    try:
        data = await epub_file.read()
        print("[qc] Received EPUB for QC:", epub_file.filename, len(data), "bytes")
        return run_daisy_ace(data, epub_file.filename)
    except HTTPException:
        raise
    except Exception as e:
        tb = traceback.format_exc()
        print("[qc] Unexpected error in qc_epub:", e, tb)
        raise HTTPException(status_code=500, detail=f"Unexpected QC error: {e}")

# ---------- existing /doc_html endpoint ----------
@router.post("/doc_html")
async def qc_doc_html(payload: dict = Body(...)):
    """
    Return the raw HTML for a single document inside the EPUB.

    Expected JSON body:
      { "doc_path": "/OEBPS/nav.xhtml" }

    Behavior:
      - If app.services.qc_service.extract_doc_html exists, call it with (epub_bytes, doc_path).
      - Otherwise find the most recent EPUB in backend/uploads/ and extract the file from the EPUB zip.
    """
    try:
        doc_path = payload.get("doc_path") if isinstance(payload, dict) else None
        if not doc_path:
            raise HTTPException(status_code=400, detail="Missing 'doc_path' in request body.")

        doc_path_norm = str(doc_path).replace("\\", "/").lstrip("/")

        # Use latest uploaded EPUB
        epubs = sorted([p for p in UPLOADS_DIR.iterdir() if p.is_file() and p.suffix.lower() == ".epub"],
                       key=lambda p: p.stat().st_mtime, reverse=True)
        if not epubs:
            raise HTTPException(status_code=500, detail="No uploaded EPUB found in backend/uploads/")
        latest = epubs[0]
        epub_bytes = latest.read_bytes()

        html = extract_doc_html(epub_bytes, doc_path_norm)
        if html is None:
            raise HTTPException(status_code=404, detail=f"Document '{doc_path}' not found inside EPUB '{latest.name}'.")
        return {"doc_path": doc_path, "html": html}
    except HTTPException:
        raise
    except Exception as e:
        tb = traceback.format_exc()
        print("[qc] qc_doc_html unexpected error:", e, tb)
        raise HTTPException(status_code=500, detail=f"doc_html failed: {e}")

# ---------- NEW: /fix endpoint ----------
@router.post("/fix")
async def qc_fix(
    epub_file: Optional[UploadFile] = File(None),
    doc_path: str = Form(...),
    html: str = Form(...),
    save_as: Optional[str] = Form(None),
):
    """
    Replace the file at `doc_path` inside the EPUB with `html` content,
    save the modified EPUB in uploads/ (with timestamped name), and re-run Ace.

    Accepts:
      - epub_file (optional multipart file) OR uses latest file in uploads/
      - doc_path (form field) e.g. 'xhtml/01_Chapter.xhtml'
      - html (form field): the edited document content (full XHTML document recommended)
      - save_as (optional form field): filename to use for the modified EPUB (if provided)

    Returns: same payload as run_daisy_ace (summary, raw_report, report zip b64, report_filename)
    """
    if not doc_path:
        raise HTTPException(status_code=400, detail="Missing 'doc_path' form field.")
    if html is None:
        raise HTTPException(status_code=400, detail="Missing 'html' form field.")

    try:
        # determine EPUB bytes to modify
        if epub_file is not None:
            epub_bytes = await epub_file.read()
            original_name = epub_file.filename or "edited.epub"
        else:
            # pick most recent uploaded EPUB
            epubs = sorted([p for p in UPLOADS_DIR.iterdir() if p.is_file() and p.suffix.lower() == ".epub"],
                           key=lambda p: p.stat().st_mtime, reverse=True)
            if not epubs:
                raise HTTPException(status_code=400, detail="No EPUBs found in server uploads folder")
            latest = epubs[0]
            epub_bytes = latest.read_bytes()
            original_name = latest.name

        # perform the in-memory replacement
        try:
            new_epub_bytes = write_doc_into_epub(epub_bytes, doc_path, html)
        except HTTPException as e:
            # propagate helpful 4xx errors
            raise

        # save modified EPUB to uploads folder with a timestamped name unless save_as provided
        ts = int(time.time())
        safe_base = save_as if save_as else f"{Path(original_name).stem}-fixed-{ts}.epub"
        out_path = UPLOADS_DIR / safe_base
        out_path.write_bytes(new_epub_bytes)
        print(f"[qc/fix] Saved modified EPUB to: {out_path}")

        # re-run Ace on the modified EPUB bytes (use the saved filename for readable output)
        result = run_daisy_ace(new_epub_bytes, out_path.name)

        # return same structure as /epub endpoint
        return result
    except HTTPException:
        raise
    except Exception as e:
        tb = traceback.format_exc()
        print("[qc] Unexpected error in qc_fix:", e, tb)
        raise HTTPException(status_code=500, detail=f"qc_fix failed: {e}")
