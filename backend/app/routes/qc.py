# app/routes/qc.py
from fastapi import APIRouter, UploadFile, File, HTTPException

from app.services.qc_service import run_daisy_ace

router = APIRouter()


@router.post("/epub")
async def qc_epub(epub_file: UploadFile = File(...)):
    """
    Run DAISY Ace QC on an uploaded EPUB file.
    Returns:
      {
        "summary": { "errors": int, "warnings": int },
        "raw_report": { ...full Ace JSON... }
      }
    """
    try:
        data = await epub_file.read()
        print("[qc] Received EPUB for QC:", epub_file.filename, len(data), "bytes")
        return run_daisy_ace(data, epub_file.filename)
    except HTTPException:
        raise
    except Exception as e:
        print("[qc] Unexpected error:", e)
        raise HTTPException(status_code=500, detail=f"Unexpected QC error: {e}")
