# app/routes/pdf.py

from fastapi import APIRouter, HTTPException, Body, UploadFile, File, Form
from fastapi.responses import FileResponse
from pathlib import Path
import re
import fitz  # PyMuPDF

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent.parent
WORKSPACE_ROOT = BASE_DIR / "extracted_epub"


# =======================================================
# PDF UPLOAD — Save to extracted_epub/<book_id>/original.pdf
# =======================================================
@router.post("/upload")
async def upload_pdf(book_id: str = Form(...), pdf: UploadFile = File(...)):
    target_dir = WORKSPACE_ROOT / book_id
    target_dir.mkdir(parents=True, exist_ok=True)

    pdf_path = target_dir / "original.pdf"
    pdf_path.write_bytes(await pdf.read())

    return {
        "book_id": book_id,
        "pdf_path": str(pdf_path)
    }


# =======================================================
# HTML → TEXT
# =======================================================
def html_to_text(html: str) -> str:
    try:
        from bs4 import BeautifulSoup
        return BeautifulSoup(html, "html.parser").get_text("\n")
    except:
        return re.sub(r"<[^>]+>", "", html)


# =======================================================
# SERVE PDF FILE
# =======================================================
@router.get("/{book_id}/preview")
async def pdf_preview(book_id: str):
    pdf_path = WORKSPACE_ROOT / book_id / "original.pdf"

    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail="PDF not found")

    return FileResponse(pdf_path, media_type="application/pdf")
