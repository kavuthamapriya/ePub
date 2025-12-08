from fastapi import APIRouter, HTTPException, Body

router = APIRouter()


@router.post("/generate_pdf")
async def generate_pdf_from_html(payload: dict = Body(...)):
    """
    STUB:
    Accessible PDF generation requires PrinceXML.
    """
    raise HTTPException(
        status_code=501,
        detail="Accessible PDF generation requires PrinceXML (PDF/UA)."
    )
