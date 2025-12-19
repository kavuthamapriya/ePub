from fastapi import APIRouter, HTTPException, Query
from pathlib import Path

router = APIRouter()

# ROOT extracted epub folder
EPUB_ROOT = Path("extracted_epub/OEBPS")

@router.get("/epub/xhtml")
def get_xhtml(href: str = Query(...)):
    """
    Example href values coming from frontend:
    - Cover.xhtml
    - xhtml/Cover.xhtml
    - 04_Contents.xhtml
    """

    # 1️⃣ clean href
    clean_href = href.replace("\\", "/")

    if clean_href.startswith("xhtml/"):
        clean_href = clean_href.replace("xhtml/", "")

    # 2️⃣ build full path
    xhtml_path = EPUB_ROOT / "xhtml" / clean_href

    # 3️⃣ validate
    if not xhtml_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"XHTML not found: {xhtml_path}"
        )

    # 4️⃣ read file
    html = xhtml_path.read_text(encoding="utf-8", errors="ignore")

    return {
        "href": clean_href,
        "html": html
    }
