# app/routes/pdf.py

from fastapi import APIRouter, HTTPException, Body
from io import BytesIO
from xhtml2pdf import pisa

router = APIRouter()


@router.post("/generate")
async def generate_pdf_from_html(payload: dict = Body(...)):
    """
    payload: { "html": "<body>...</body>" }

    returns:
      {
        "pdf_hex": "....",       # PDF bytes as hex string
        "filename": "accessible.pdf"
      }
    """
    html = payload.get("html")
    if not html:
        raise HTTPException(status_code=400, detail="No html provided")

    pdf_io = BytesIO()

    try:
        # xhtml2pdf generates PDF directly from HTML string
        result = pisa.CreatePDF(
            src=html,
            dest=pdf_io,
            encoding="utf-8",
        )

        if result.err:
            # pisa returns a simple flag; surface it as a 500
            raise HTTPException(
                status_code=500,
                detail=f"xhtml2pdf reported an error while generating PDF",
            )

        pdf_bytes = pdf_io.getvalue()
        return {
            "pdf_hex": pdf_bytes.hex(),
            "filename": "accessible.pdf",
        }

    except HTTPException:
        # Let our explicit HTTP errors bubble up
        raise

    except Exception as e:
        # Catch-all to avoid crashing the server
        raise HTTPException(
            status_code=500, detail=f"PDF generation failed: {e}"
        )

    finally:
        pdf_io.close()
