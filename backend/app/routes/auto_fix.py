# backend/app/routes/auto_fix.py
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pathlib import Path
import tempfile, json
from app.services.gemini_service import run_gemini
from ebooklib import epub

router = APIRouter()


def build_prompt_for_autofix(accessible_html: str) -> str:
    return (
        "You are an accessibility editor. Given raw ACCESSIBLE_HTML extract, "
        "clean it to produce well-formed semantic HTML. Keep only the content that "
        "belongs in the <body>. Use semantic tags (h1..h6, p, ul, ol, li, figure, figcaption, "
        "img with alt if available). Do not invent missing content. Return the corrected HTML string only.\n\n"
        f"ACCESSIBLE_HTML:\n```html\n{accessible_html}\n```\n\n"
        "Return JSON: {\"fixed_html\": \"...\"}"
    )


@router.post("/autofix")
async def autofix_epub(
    publisher: str = Form("Unknown"),
    epub_file: UploadFile = File(...),
    accessible_html: str | None = Form(None),
):
    """
    Accept uploaded EPUB and accessible_html (the 'accessible' output).
    Returns: a new EPUB (bytes) and the fixed HTML in JSON.
    """
    # Save original EPUB to temp dir
    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            tmpdir_p = Path(tmpdir)
            orig_path = tmpdir_p / epub_file.filename
            orig_bytes = await epub_file.read()
            orig_path.write_bytes(orig_bytes)

            # If accessible_html not provided, try to extract from epub_service (not included here)
            if not accessible_html:
                accessible_html = ""  # fallback; but ideally the client sends this

            # Call Gemini for autofix
            prompt = build_prompt_for_autofix(accessible_html)
            try:
                ai = run_gemini(prompt, expect_json=True)
            except Exception as e:
                # fallback: return original accessible_html
                ai = {"fixed_html": accessible_html, "notes": [f"Gemini error: {e}"]}

            fixed_html = ai.get("fixed_html") or ai.get("accessible_html") or accessible_html

            # Rebuild EPUB by replacing XHTML files with the fixed_html for simplicity:
            # Strategy: open original with ebooklib, find document items (media_type 'application/xhtml+xml'),
            # and replace their content with the fixed_html (same file for all spine items: simplest approach).
            book = epub.read_epub(str(orig_path))

            # Replace the first document found with fixed_html
            replaced = False
            for item in list(book.get_items()):
                if item.media_type == "application/xhtml+xml":
                    # create a new EpubHtml
                    new_item = epub.EpubItem(
                        uid=item.get_id(),
                        file_name=item.file_name,
                        media_type=item.media_type,
                        content=fixed_html.encode("utf-8"),
                    )
                    # Remove old and add new
                    book.remove_item(item)
                    book.add_item(new_item)
                    replaced = True
                    break

            if not replaced:
                # if no document found, just add a new one
                new_chap = epub.EpubHtml(title="Accessible", file_name="accessible.xhtml", lang="en")
                new_chap.set_content(fixed_html)
                book.add_item(new_chap)
                book.spine.append(new_chap)

            # write new epub
            new_epub_path = tmpdir_p / f"fixed_{epub_file.filename}"
            epub.write_epub(str(new_epub_path), book)

            # Return fixed_html and provide path for frontend to request download via separate endpoint
            with new_epub_path.open("rb") as f:
                epub_bytes = f.read()

            return {
                "fixed_html": fixed_html,
                "epub_filename": f"fixed_{epub_file.filename}",
                "epub_bytes_b64": epub_bytes.hex(),  # quick transport: hex; frontend can convert
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Auto-fix error: {e}")
