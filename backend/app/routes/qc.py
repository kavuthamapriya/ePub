# app/routes/qc.py
from fastapi import APIRouter, UploadFile, File, HTTPException, Body
from fastapi.responses import JSONResponse
from typing import Optional
from pathlib import Path
import zipfile
import io
import os
import json
import traceback

router = APIRouter()

# Backend root (where uploads folder lives) — same approach as other services
BACKEND_ROOT = Path(__file__).resolve().parents[2]  # .../backend
UPLOADS_DIR = BACKEND_ROOT / "uploads"

# Try to import run_daisy_ace and optionally extract_doc_html from qc_service.
# If extract_doc_html is not present, we'll fall back to an internal ZIP-based extractor.
try:
    from app.services.qc_service import run_daisy_ace, extract_doc_html  # type: ignore
    _HAS_EXTRACT = True
except Exception:
    try:
        from app.services.qc_service import run_daisy_ace  # type: ignore
    except Exception as e:
        # If run_daisy_ace cannot be imported, re-raise so the server fails early.
        raise
    extract_doc_html = None
    _HAS_EXTRACT = False


@router.post("/epub")
async def qc_epub(epub_file: UploadFile = File(...)):
    """
    Run DAISY Ace on the uploaded EPUB file.
    Returns the JSON payload produced by run_daisy_ace(...)
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


def _find_latest_uploaded_epub() -> Optional[Path]:
    """
    Return Path to the most recently modified .epub file in uploads directory,
    or None if none found.
    """
    try:
        if not UPLOADS_DIR.exists():
            return None
        epubs = sorted(
            [p for p in UPLOADS_DIR.iterdir() if p.is_file() and p.suffix.lower() == ".epub"],
            key=lambda p: p.stat().st_mtime,
            reverse=True,
        )
        return epubs[0] if epubs else None
    except Exception:
        return None


def _read_file_from_epub_bytes(epub_bytes: bytes, internal_path: str) -> Optional[str]:
    """
    Read `internal_path` (e.g. 'OEBPS/nav.xhtml' or 'nav.xhtml') from the EPUB bytes.
    Returns decoded text (utf-8 or fallback), or None if not found.
    """
    try:
        with zipfile.ZipFile(io.BytesIO(epub_bytes)) as zf:
            # Normalize internal_path and try several matching strategies:
            candidates = []

            p = internal_path.replace("\\", "/").lstrip("/")
            candidates.append(p)

            # Try with/without OEBPS prefix
            if not p.lower().startswith("oebps/"):
                candidates.append("OEBPS/" + p)
                candidates.append("oebps/" + p)

            # Also try basename matches (last path segment)
            basename = Path(p).name
            for name in zf.namelist():
                if name.endswith("/" + basename) or name == basename:
                    candidates.append(name)

            # deduplicate while preserving order
            seen = set()
            ordered = []
            for c in candidates:
                if c not in seen:
                    seen.add(c)
                    ordered.append(c)

            for cand in ordered:
                if cand in zf.namelist():
                    raw = zf.read(cand)
                    # Try utf-8 decode, fallback to latin-1
                    try:
                        return raw.decode("utf-8")
                    except Exception:
                        try:
                            return raw.decode("latin-1")
                        except Exception:
                            return raw.decode(errors="ignore")
            # not found
            return None
    except zipfile.BadZipFile:
        return None
    except Exception as e:
        print("[qc] _read_file_from_epub_bytes error:", e)
        return None


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

        # normalize
        doc_path = str(doc_path)
        doc_path_norm = doc_path.replace("\\", "/").lstrip("/")

        # If the service helper exists, try to use it.
        if _HAS_EXTRACT and callable(extract_doc_html):
            try:
                # We still need EPUB bytes — the helper may expect bytes; try to find latest upload.
                latest = _find_latest_uploaded_epub()
                if not latest:
                    raise HTTPException(status_code=500, detail="No uploaded EPUB found in backend/uploads/")
                epub_bytes = latest.read_bytes()
                html = extract_doc_html(epub_bytes, doc_path_norm)
                if html is None:
                    raise HTTPException(status_code=404, detail=f"Document '{doc_path}' not found inside EPUB.")
                return {"doc_path": doc_path, "html": html}
            except HTTPException:
                raise
            except Exception as e:
                print("[qc] extract_doc_html failed, will fall back to zip extraction:", e)
                # fall through to fallback
        # Fallback: read latest uploaded EPUB and extract directly from zip
        latest = _find_latest_uploaded_epub()
        if not latest:
            raise HTTPException(status_code=500, detail="No uploaded EPUB found in backend/uploads/")

        epub_bytes = latest.read_bytes()
        html = _read_file_from_epub_bytes(epub_bytes, doc_path_norm)
        if html is None:
            raise HTTPException(status_code=404, detail=f"Document '{doc_path}' not found inside EPUB '{latest.name}'.")
        return {"doc_path": doc_path, "html": html}
    except HTTPException:
        raise
    except Exception as e:
        tb = traceback.format_exc()
        print("[qc] qc_doc_html unexpected error:", e, tb)
        raise HTTPException(status_code=500, detail=f"doc_html failed: {e}")
