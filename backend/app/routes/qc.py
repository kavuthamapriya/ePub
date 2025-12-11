# backend/app/routes/qc.py
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from typing import Optional
from pathlib import Path
import time
import os

from app.services.qc_service import run_daisy_ace, extract_doc_html

router = APIRouter()

UPLOADS_DIR = Path(__file__).resolve().parents[2] / "uploads"


@router.post("/epub")
async def qc_epub(epub_file: UploadFile = File(...)):
    try:
        data = await epub_file.read()
        print("[qc] Received EPUB for QC:", epub_file.filename, len(data), "bytes")
        return run_daisy_ace(data, epub_file.filename)
    except HTTPException:
        raise
    except Exception as e:
        print("[qc] Unexpected error:", e)
        raise HTTPException(status_code=500, detail=f"Unexpected QC error: {e}")


@router.post("/doc_html")
async def qc_doc_html(
    epub_file: Optional[UploadFile] = File(None),
    doc_path: str = Form(""),
):
    """
    Return the raw HTML for a single document inside the EPUB.

    Accepts either:
      - epub_file: uploaded EPUB bytes (preferred), OR
      - if no epub_file provided, the endpoint will attempt to use the latest EPUB in the backend uploads folder.

    doc_path: path inside the EPUB, e.g. "xhtml/00_Halftitle_Page.xhtml" or "OEBPS/nav.xhtml"
    """
    if not doc_path:
        raise HTTPException(status_code=400, detail="doc_path form field is required")

    epub_source = None
    try:
        if epub_file is not None:
            data = await epub_file.read()
            epub_source = data
        else:
            # find the most-recent file in uploads folder
            if not UPLOADS_DIR.exists():
                raise HTTPException(status_code=400, detail="No uploads folder on server")
            candidates = sorted(
                [p for p in UPLOADS_DIR.iterdir() if p.is_file() and p.suffix.lower() in (".epub",)],
                key=lambda p: p.stat().st_mtime,
                reverse=True
            )
            if not candidates:
                raise HTTPException(status_code=400, detail="No EPUBs found in server uploads folder")
            epub_source = str(candidates[0])
            print(f"[qc/doc_html] Using server-stored EPUB: {epub_source}")

        html = extract_doc_html(epub_source, doc_path)
        return {"doc_path": doc_path, "html": html}
    except HTTPException:
        raise
    except Exception as e:
        print("[qc] qc_doc_html unexpected error:", e)
        raise HTTPException(status_code=500, detail=f"doc_html failed: {e}")
