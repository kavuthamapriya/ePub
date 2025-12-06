# app/routes/convert.py
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from app.config import UPLOAD_DIR
from app.services.epub_service import extract_epub_html
from app.services.pdf_service import extract_pdf_text
from app.services.gemini_service import run_gemini
from app.models.convert_models import ConvertResponse, AccessibleEPUB

router = APIRouter()


@router.post("/convert", response_model=ConvertResponse)
async def convert_epub(
    publisher: str = Form(...),
    epub_file: UploadFile = File(...),
    pdf_file: UploadFile | None = None,
) -> ConvertResponse:
    """
    Convert EPUB (and optional PDF) into accessible HTML using Gemini.
    Ensures a valid ConvertResponse is ALWAYS returned.
    """
    try:
        upload_dir = Path(UPLOAD_DIR)
        upload_dir.mkdir(parents=True, exist_ok=True)

        # 1) Save EPUB
        try:
            epub_path = upload_dir / epub_file.filename
            epub_bytes = await epub_file.read()
            epub_path.write_bytes(epub_bytes)
            print(f"[convert] Saved EPUB to {epub_path}")
        except Exception as e:
            print("[convert] Failed to save EPUB:", e)
            raise HTTPException(status_code=500, detail=f"Failed to save EPUB: {e}")

        # 2) Extract EPUB HTML
        try:
            html = extract_epub_html(str(epub_path))
            print(f"[convert] Extracted EPUB HTML length: {len(html)}")
        except Exception as e:
            print("[convert] Failed to extract EPUB HTML:", e)
            raise HTTPException(
                status_code=500,
                detail=f"Failed to extract EPUB HTML: {e}",
            )

        # 3) Optional PDF text
        pdf_text = ""
        if pdf_file:
            try:
                pdf_path = upload_dir / pdf_file.filename
                pdf_bytes = await pdf_file.read()
                pdf_path.write_bytes(pdf_bytes)
                pdf_text = extract_pdf_text(str(pdf_path))
                print(f"[convert] Extracted PDF text length: {len(pdf_text)}")
            except Exception as e:
                print("[convert] PDF extraction failed (non-fatal):", e)
                pdf_text = ""

        # 4) Build prompt for Gemini
        prompt = (
            "You are an accessibility expert.\n\n"
            "Convert the following EPUB HTML into a clean, WCAG 2.1 AA "
            "compliant accessible HTML fragment.\n\n"
            "Requirements:\n"
            "- Use semantic HTML tags (<h1>-<h6>, <p>, <ul>, <ol>, <li>, "
            "<blockquote>, <figure>, etc.)\n"
            "- Preserve heading hierarchy\n"
            "- Do not invent alt text; use alt=\"\" for unknown images\n"
            "- Remove inline styles, scripts, EPUB-specific wrappers\n"
            "- DO NOT output <html>, <head>, or <body> tags\n\n"
            "Output JSON shape:\n"
            "{\n"
            '  \"accessible_html\": \"string\",\n'
            '  \"notes\": [\"string\", ...],\n'
            '  \"percentage\": 0-100\n'
            "}\n\n"
            "EPUB_HTML:\n```html\n"
            f"{html}\n"
            "```\n\n"
            "PDF_TEXT:\n```text\n"
            f"{pdf_text}\n"
            "```"
        )

        # 5) Gemini call with fallback
        try:
            ai = run_gemini(prompt, expect_json=True)
            print("[convert] Gemini raw response:", ai)
        except Exception as e:
            print("[convert] Gemini call failed:", e)
            ai = {
                "accessible_html": html,
                "notes": [f"Gemini failed: {e}"],
                "percentage": 0,
            }

        if not isinstance(ai, dict):
            ai = {
                "accessible_html": html,
                "notes": ["Gemini returned invalid response"],
                "percentage": 0,
            }

        accessible_html = ai.get("accessible_html") or html
        notes = ai.get("notes") or []
        percentage = ai.get("percentage") or 0

        result = ConvertResponse(
            accessible=AccessibleEPUB(
                accessible_html=accessible_html,
                notes=notes,
                percentage=percentage,
            )
        )
        print("[convert] Returning ConvertResponse")
        return result

    except HTTPException:
        raise
    except Exception as e:
        print("[convert] Unexpected error:", e)
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")
