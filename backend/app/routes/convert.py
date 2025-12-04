from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pathlib import Path
from app.config import UPLOAD_DIR
from app.services.epub_service import extract_epub_html
from app.services.pdf_service import extract_pdf_text
from app.services.gemini_service import run_gemini
from app.models.convert_models import ConvertResponse, AccessibleEPUB

router = APIRouter()


@router.post("", response_model=ConvertResponse)
async def convert_epub(
    publisher: str = Form(...),
    epub_file: UploadFile = File(...),
    pdf_file: UploadFile | None = None,
):
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
        raise HTTPException(500, detail=f"Failed to save EPUB: {e}")

    # 2) Extract EPUB HTML
    try:
        html = extract_epub_html(str(epub_path))
        print(f"[convert] Extracted EPUB HTML length: {len(html)}")
    except Exception as e:
        print("[convert] Failed to extract EPUB HTML:", e)
        raise HTTPException(500, detail=f"Failed to extract EPUB HTML: {e}")

    # 3) Optionally extract PDF text
    pdf_text = ""
    if pdf_file:
        try:
            pdf_path = upload_dir / pdf_file.filename
            pdf_bytes = await pdf_file.read()
            pdf_path.write_bytes(pdf_bytes)
            pdf_text = extract_pdf_text(str(pdf_path))
            print(f"[convert] Extracted PDF text length: {len(pdf_text)}")
        except Exception as e:
            print("[convert] PDF extraction failed:", e)
            pdf_text = ""  # not fatal

    # 4) Call Gemini (or fallback)
    prompt = f"""
You are an accessibility expert.

Task:
Convert this EPUB HTML into a single, clean, accessible HTML fragment that is WCAG 2.1 AA friendly.

Requirements:
- Use proper semantic tags: <h1>–<h6>, <p>, <ul>, <ol>, <li>, <blockquote>, <figure>, <figcaption>, <section>, <nav>, <main>, <footer>, etc.
- Preserve reading order and heading hierarchy as much as possible.
- For images, use <img> with alt="" (empty) where alt text is unknown – do not invent descriptions.
- Use <a> for links and keep href attributes as-is.
- Remove EPUB-specific wrapper elements, inline styles, and scripting that are not necessary for meaning.
- Do NOT include <html>, <head>, or <body> tags – only the contents that would go inside <body>.

Output:
Return a single JSON object with:
- "accessible_html": string – the cleaned, accessible HTML fragment
- "notes": string[] – brief notes about what you changed
- "percentage": number – rough accessibility completeness from 0–100

EPUB_HTML:
```html
{html}
