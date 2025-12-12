# backend/app/routes/qc.py
from fastapi import APIRouter, UploadFile, File, HTTPException, Body, Form, Request
from typing import Optional, Tuple
from pathlib import Path
import traceback
import io
import json

from app.services.qc_service import run_daisy_ace, extract_doc_html

router = APIRouter()

BACKEND_ROOT = Path(__file__).resolve().parents[2]
UPLOADS_DIR = BACKEND_ROOT / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/epub")
async def qc_epub(epub_file: UploadFile = File(...)):
    """
    Run DAISY Ace on an uploaded EPUB file.
    Save a copy to backend/uploads/ so /doc_html can use it.
    """
    try:
        data = await epub_file.read()
        print("[qc] Received EPUB for QC:", epub_file.filename, len(data), "bytes")

        # Save uploaded EPUB to uploads/ (overwrite if exists)
        try:
            save_path = UPLOADS_DIR / epub_file.filename
            with open(save_path, "wb") as fh:
                fh.write(data)
            print(f"[qc] Saved uploaded epub to: {save_path}")
        except Exception as e:
            print("[qc] Warning: could not save uploaded epub to uploads/:", e)

        return run_daisy_ace(data, epub_file.filename)
    except HTTPException:
        raise
    except Exception as e:
        tb = traceback.format_exc()
        print("[qc] Unexpected error in qc_epub:", e, tb)
        raise HTTPException(status_code=500, detail=f"Unexpected QC error: {e}")


def _find_latest_uploaded_epub() -> Optional[Path]:
    """Return Path to most recently modified .epub in uploads directory, or None."""
    try:
        if not UPLOADS_DIR.exists():
            return None
        epubs = sorted(
            [p for p in UPLOADS_DIR.iterdir() if p.is_file() and p.suffix.lower() == ".epub"],
            key=lambda p: p.stat().st_mtime,
            reverse=True,
        )
        return epubs[0] if epubs else None
    except Exception as e:
        print("[qc] _find_latest_uploaded_epub error:", e)
        return None


async def _resolve_doc_html_inputs(request: Request, epub_file: Optional[UploadFile], doc_path_form: Optional[str]) -> Tuple[bytes, str]:
    """
    Return tuple (epub_bytes, doc_path) using the following precedence:
     1) If multipart/form-data and epub_file provided -> use its bytes
     2) else use latest file in backend/uploads/
    doc_path: prefer JSON body doc_path, then form field doc_path.
    Raises HTTPException on missing/invalid inputs.
    """
    # attempt to parse JSON body (if content-type application/json)
    body_doc_path = None
    try:
        if request.headers.get("content-type", "").startswith("application/json"):
            body = await request.json()
            if isinstance(body, dict):
                body_doc_path = body.get("doc_path") or body.get("path") or body.get("document")
    except Exception:
        # not JSON or parse failed; ignore and fallback
        body_doc_path = None

    # choose doc_path (body wins over form)
    doc_path = (body_doc_path or doc_path_form or "").strip()
    if not doc_path:
        raise HTTPException(status_code=400, detail="doc_path is required (either JSON body {\"doc_path\":\"...\"} or form field 'doc_path').")

    # epub bytes: prefer uploaded file if present
    if epub_file is not None:
        data = await epub_file.read()
        if not data:
            raise HTTPException(status_code=400, detail="Uploaded epub_file is empty.")
        # Save to uploads/ for convenience
        try:
            save_path = UPLOADS_DIR / (epub_file.filename or "uploaded.epub")
            with open(save_path, "wb") as fh:
                fh.write(data)
            print(f"[qc] Saved uploaded epub to: {save_path}")
        except Exception as e:
            print("[qc] Warning: could not save uploaded epub to uploads/:", e)
        return data, doc_path

    # no uploaded file — find latest in uploads/
    latest = _find_latest_uploaded_epub()
    if not latest:
        raise HTTPException(status_code=400, detail="No EPUB uploaded and no EPUB found in backend/uploads/. Please upload EPUB first (e.g. call /api/qc/epub or /api/convert).")
    try:
        data = latest.read_bytes()
        print(f"[qc] Using latest saved EPUB for doc_html: {latest}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not read stored EPUB {latest}: {e}")
    return data, doc_path


@router.post("/doc_html")
async def qc_doc_html(request: Request, epub_file: Optional[UploadFile] = File(None), doc_path: Optional[str] = Form(None)):
    """
    Extract raw HTML/XHTML for a document inside the EPUB.

    Accepts either:
      - JSON body: { "doc_path": "xhtml/00_Halftitle_Page.xhtml" }
      - OR multipart form: fields 'doc_path' and optional file 'epub_file'
    If no epub_file uploaded, the endpoint uses the latest saved EPUB under backend/uploads/.
    Returns: {"doc_path": "...", "html": "<...>"}
    """
    try:
        epub_bytes, resolved_doc_path = await _resolve_doc_html_inputs(request, epub_file, doc_path)
        # call the helper from qc_service (it raises HTTPException on not found)
        try:
            html = extract_doc_html(epub_bytes, resolved_doc_path)
            if html is None:
                # extract_doc_html usually raises; but be defensive
                raise HTTPException(status_code=404, detail=f"Document '{resolved_doc_path}' not found inside EPUB.")
            return {"doc_path": resolved_doc_path, "html": html}
        except HTTPException:
            raise
        except Exception as e:
            tb = traceback.format_exc()
            print("[qc] extract_doc_html error:", e, tb)
            raise HTTPException(status_code=500, detail=f"extract_doc_html failed: {e}")
    except HTTPException:
        raise
    except Exception as e:
        tb = traceback.format_exc()
        print("[qc] qc_doc_html unexpected error:", e, tb)
        raise HTTPException(status_code=500, detail=f"doc_html failed: {e}")


@router.post("/doc")
async def qc_doc_extract(epub_file: UploadFile = File(...), doc_path: str = Form(...)):
    """
    Helper for multipart testing: upload EPUB + doc_path in one request.
    Returns: { doc_path, html }
    """
    if not doc_path:
        raise HTTPException(status_code=400, detail="doc_path form field is required")
    data = await epub_file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Uploaded EPUB is empty")
    try:
        # Save uploaded EPUB for future calls
        save_path = UPLOADS_DIR / (epub_file.filename or "uploaded.epub")
        with open(save_path, "wb") as fh:
            fh.write(data)
        print(f"[qc] Saved uploaded epub to: {save_path}")
    except Exception as e:
        print("[qc] Warning: could not save uploaded epub to uploads/:", e)
    try:
        html = extract_doc_html(data, doc_path)
        return {"doc_path": doc_path, "html": html}
    except HTTPException:
        raise
    except Exception as e:
        tb = traceback.format_exc()
        print("[qc] qc_doc_extract error:", e, tb)
        raise HTTPException(status_code=500, detail=f"doc extraction failed: {e}")
