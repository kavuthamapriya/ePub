# app/routes/pdf.py
from fastapi import APIRouter, HTTPException, Body
from pathlib import Path
import tempfile
import re

import fitz  # PyMuPDF

router = APIRouter()


def html_to_text(html: str) -> str:
    """
    Convert HTML into reasonably readable plain text.
    Tries BeautifulSoup if available; otherwise falls back to
    stripping tags with a simple regex.
    """
    try:
        from bs4 import BeautifulSoup  # type: ignore
        soup = BeautifulSoup(html, "html.parser")
        # Use newlines between blocks so the PDF isn't one long line
        return soup.get_text(separator="\n")
    except Exception:
        # Fallback: very simple strip of tags
        text = re.sub(r"<[^>]+>", "", html)
        return text


@router.post("/generate")
async def generate_pdf_from_html(payload: dict = Body(...)):
    """
    Endpoint: POST /api/pdf/generate

    payload JSON:
      { "html": "<h1>Title</h1><p>Content...</p>" }

    response JSON:
      {
        "pdf_bytes_hex": "<hex-encoded PDF bytes>",
        "filename": "accessible.pdf"
      }
    """
    html = payload.get("html", "")
    if not html:
        raise HTTPException(status_code=400, detail="No html provided")

    try:
        # 1) Convert HTML -> plain-ish text
        text = html_to_text(html)

        # 2) Create a simple PDF with PyMuPDF
        doc = fitz.open()
        page = doc.new_page()

        # Basic text insertion. You could get fancier here and
        # detect headings and change font sizes, etc.
        # (50, 72) is roughly 50pt from left, 1-inch from top.
        page.insert_text(
            (50, 72),
            text,
            fontsize=11,
            fontname="helv",
        )

        pdf_bytes = doc.tobytes()
        doc.close()

        # 3) Encode bytes as hex for transport
        pdf_hex = pdf_bytes.hex()

        return {
            "pdf_bytes_hex": pdf_hex,
            "filename": "accessible.pdf",
        }

    except Exception as e:
        print("[pdf] PDF generation failed:", e)
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {e}")
