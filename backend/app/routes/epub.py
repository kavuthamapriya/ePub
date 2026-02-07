from fastapi import APIRouter, HTTPException, Query, UploadFile, File
from fastapi.responses import Response
from pathlib import Path
import zipfile

from app.services.epub_extract import extract_epub

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent.parent
EXTRACTED_DIR = BASE_DIR / "extracted_epub"
EXTRACTED_DIR.mkdir(exist_ok=True)

# ----------------------------------------
# Utility: Extract TOC (xhtml files list)
# ----------------------------------------
def extract_epub_toc(epub_path: Path):
    toc = []
    try:
        with zipfile.ZipFile(epub_path, "r") as zf:
            for name in zf.namelist():
                if name.endswith(".xhtml") or name.endswith(".html"):
                    toc.append(name)
    except:
        pass
    return toc


# ----------------------------------------
# EPUB UPLOAD
# ----------------------------------------
@router.post("/epub/upload")
async def upload_epub(epub: UploadFile = File(...)):
    # temp save
    temp_path = EXTRACTED_DIR / epub.filename
    temp_path.write_bytes(await epub.read())

    # unzip to extracted_epub/<book_id>
    book_id = extract_epub(temp_path)

    # move original epub
    book_dir = EXTRACTED_DIR / book_id
    final_epub_path = book_dir / "original.epub"
    temp_path.rename(final_epub_path)

    # extract TOC
    toc = extract_epub_toc(final_epub_path)

    return {
        "book_id": book_id,
        "saved_path": str(final_epub_path),
        "toc": toc,  # <-- REQUIRED FOR FRONTEND
    }


# ----------------------------------------
# Load XHTML
# ----------------------------------------
@router.get("/epub/xhtml")
def get_xhtml(book_id: str = Query(...), href: str = Query(...)):
    book_root = EXTRACTED_DIR / book_id / "OEBPS"
    if not book_root.exists():
        raise HTTPException(status_code=404, detail="OEBPS not found")

    clean = href.replace("\\", "/").lstrip("/")
    clean = clean.replace("OEBPS/", "").replace("xhtml/", "").replace("Text/", "")

    candidates = [
        book_root / "xhtml" / clean,
        book_root / "Text" / clean,
        book_root / clean,
    ]

    for path in candidates:
        if path.exists():
            return Response(
                path.read_text(encoding="utf-8", errors="ignore"),
                media_type="application/xhtml+xml"
            )

    raise HTTPException(status_code=404, detail="XHTML not found")
