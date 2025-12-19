# api/epub.py
from fastapi import APIRouter, Query, HTTPException
from pathlib import Path

router = APIRouter()

EPUB_EXTRACT_DIR = Path("data/epub_extracted")  # where EPUB is extracted

@router.get("/api/epub/xhtml")
def get_xhtml(href: str = Query(...)):
    """
    href example: xhtml/02_Copyright_Page.xhtml
    """
    file_path = EPUB_EXTRACT_DIR / href

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="XHTML file not found")

    return {
        "html": file_path.read_text(encoding="utf-8")
    }
