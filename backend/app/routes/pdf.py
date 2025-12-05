# backend/app/routes/pdf.py
from fastapi import APIRouter, HTTPException, Body
from weasyprint import HTML
import tempfile
from pathlib import Path

router = APIRouter()


@router.post("/generate_pdf")
async def generate_pdf_from_html(payload: dict = Body(...)):
    """
    payload: { "html": "<body>...</body>" }
    returns: { "pdf_bytes_b64": "..." }
    """
    html = payload.get("html", "")
    if not html:
        raise HTTPException(status_code=400, detail="No html provided")

    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            out = Path(tmpdir) / "out.pdf"
            HTML(string=html).write_pdf(str(out))
            pdf_bytes = out.read_bytes()
            return {"pdf_bytes_b64": pdf_bytes.hex(), "filename": "accessible.pdf"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {e}")
