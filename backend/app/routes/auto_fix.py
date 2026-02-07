from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pathlib import Path
import tempfile
from ebooklib import epub
from app.services.workspace_service import get_workspace_path

router = APIRouter()

@router.post("/autofix")
async def autofix_epub(
    book_id: str = Form(...),
    epub_file: UploadFile = File(...),
    accessible_html: str = Form("")
):
    try:
        workspace = get_workspace_path(book_id)
        workspace.mkdir(parents=True, exist_ok=True)

        fixed_epub_path = workspace / "autofixed.epub"

        with tempfile.TemporaryDirectory() as tmpdir:
            tmpfile = Path(tmpdir) / epub_file.filename
            tmpfile.write_bytes(await epub_file.read())

            book = epub.read_epub(str(tmpfile))

            replaced = False
            for item in list(book.get_items()):
                if item.media_type == "application/xhtml+xml":
                    new_item = epub.EpubItem(
                        uid=item.get_id(),
                        file_name=item.file_name,
                        media_type=item.media_type,
                        content=accessible_html.encode("utf-8"),
                    )
                    book.remove_item(item)
                    book.add_item(new_item)
                    replaced = True
                    break

            if not replaced:
                new = epub.EpubHtml(
                    title="Accessible",
                    file_name="accessible.xhtml",
                    lang="en"
                )
                new.set_content(accessible_html)
                book.add_item(new)
                book.spine.append(new)

            epub.write_epub(str(fixed_epub_path), book)

        return {
            "book_id": book_id,
            "fixed_epub_path": str(fixed_epub_path)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Auto-fix error: {e}")
