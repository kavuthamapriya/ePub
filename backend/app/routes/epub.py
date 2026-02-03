from fastapi import APIRouter, HTTPException, Query, UploadFile, File
from fastapi.responses import Response
from pathlib import Path

from app.services.epub_extract import extract_epub

router = APIRouter()

# ---------- Upload EPUB & Extract ----------
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/epub/upload")
async def upload_epub(epub: UploadFile = File(...)):
    epub_path = UPLOAD_DIR / epub.filename

    with open(epub_path, "wb") as f:
        f.write(await epub.read())

    book_id = extract_epub(epub_path)

    # --- Terminal Log ---
    print("=========================================")
    print("EPUB Uploaded Successfully!")
    print(f"Uploaded File      : {epub.filename}")
    print(f"Generated Book ID  : {book_id}")
    print("=========================================")

    return {
        "book_id": book_id,
        "message": "EPUB uploaded and extracted successfully"
    }


# ---------- Load XHTML ----------
BASE_DIR = Path(__file__).resolve().parent.parent.parent
EXTRACTED_DIR = BASE_DIR / "extracted_epub"

@router.get("/epub/xhtml")
def get_xhtml(
    book_id: str = Query(...),
    href: str = Query(...)
):
    print("BOOK ID:", book_id)
    print("RAW href:", href)

    book_root = EXTRACTED_DIR / book_id / "OEBPS"

    if not book_root.exists():
        raise HTTPException(
            status_code=404,
            detail=f"OEBPS folder not found for book_id={book_id}"
        )

    # normalize href
    clean = href.replace("\\", "/").lstrip("/")
    clean = clean.replace("OEBPS/", "")
    clean = clean.replace("xhtml/", "")
    clean = clean.replace("Text/", "")

    print("NORMALIZED href:", clean)

    candidates = [
        book_root / "xhtml" / clean,
        book_root / "Text" / clean,
        book_root / clean,
    ]

    for path in candidates:
        print("TRY:", path)
        if path.exists():
            return Response(
                content=path.read_text(encoding="utf-8", errors="ignore"),
                media_type="application/xhtml+xml"
            )

    raise HTTPException(
        status_code=404,
        detail={
            "error": "XHTML not found",
            "book_id": book_id,
            "href": href,
            "tried": [str(p) for p in candidates]
        }
    )
