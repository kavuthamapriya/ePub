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
    epub_file: UploadFile = File(...),
    pdf_file: UploadFile | None = File(None),
    publisher: str | None = Form(None),  # ✅ OPTIONAL (frontend safe)
) -> ConvertResponse:
    """
    Convert EPUB (and optional PDF) into accessible HTML using Gemini.
    Frontend-compatible: publisher is optional.
    Always returns ConvertResponse.
    """
    try:
        upload_dir = Path(UPLOAD_DIR)
        upload_dir.mkdir(parents=True, exist_ok=True)

        # 1️⃣ Save EPUB
        try:
            epub_path = upload_dir / epub_file.filename
            epub_bytes = await epub_file.read()
            epub_path.write_bytes(epub_bytes)
            print(f"[convert] Saved EPUB to {epub_path}")
        except Exception as e:
            print("[convert] Failed to save EPUB:", e)
            raise HTTPException(status_code=500, detail=f"Failed to save EPUB: {e}")

        # 2️⃣ Extract EPUB HTML
        try:
            html = extract_epub_html(str(epub_path))
            print(f"[convert] Extracted EPUB HTML length: {len(html)}")
        except Exception as e:
            print("[convert] Failed to extract EPUB HTML:", e)
            raise HTTPException(
                status_code=500,
                detail=f"Failed to extract EPUB HTML: {e}",
            )

        # 3️⃣ Optional PDF text
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

        # 4️⃣ Gemini prompt (unchanged logic)
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
            '  "accessible_html": "string",\n'
            '  "notes": ["string", ...],\n'
            '  "percentage": 0-100\n'
            "}\n\n"
            "EPUB_HTML:\n```html\n"
            f"{html}\n"
            "```\n\n"
            "PDF_TEXT:\n```text\n"
            f"{pdf_text}\n"
            "```"
        )

        # 5️⃣ Gemini call with safe fallback
        try:
            ai = run_gemini(prompt, expect_json=True)
            print("[convert] Gemini raw response:", ai)
        except Exception as e:
            print("[convert] Gemini failed, fallback to raw HTML:", e)
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
        raise HTTPException(status_code=500, detail=str(e))
@router.post("/convert-epub")
async def convert_epub_accessible(
    epub_file: UploadFile = File(...)
):
    """
    EPUB → Accessible EPUB
    (Rules-based, NO Gemini)
    """
    if not epub_file.filename.lower().endswith(".epub"):
        raise HTTPException(status_code=400, detail="Only EPUB files allowed")

    try:
        epub_bytes = await epub_file.read()

        # 🔥 THIS runs your rules engine
        accessible_epub_bytes = auto_fix_epub(epub_bytes)

        return Response(
            content=accessible_epub_bytes,
            media_type="application/epub+zip",
            headers={
                "Content-Disposition": "attachment; filename=accessible.epub"
            },
        )

    except Exception as e:
        print("[convert-epub] Error:", e)
        raise HTTPException(status_code=500, detail=str(e))
