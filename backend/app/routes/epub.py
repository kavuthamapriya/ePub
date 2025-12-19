from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response
from pathlib import Path

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent.parent
OEBPS_DIR = BASE_DIR / "extracted_epub" / "OEBPS"

@router.get("/epub/xhtml")
def get_xhtml(href: str = Query(...)):
    print("RAW href:", href)

    clean = href.replace("\\", "/").lstrip("/")
    clean = clean.replace("OEBPS/", "")
    clean = clean.replace("xhtml/", "")
    clean = clean.replace("Text/", "")

    print("NORMALIZED:", clean)

    # try common EPUB folders
    candidates = [
        OEBPS_DIR / "xhtml" / clean,
        OEBPS_DIR / "Text" / clean,
        OEBPS_DIR / clean,
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
        detail=f"XHTML not found. Tried: {[str(p) for p in candidates]}"
    )
