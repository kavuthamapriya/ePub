# backend/app/routes/convert.py

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from app.services.workspace_service import get_workspace_path
from app.services.epub_rebuild_service import rebuild_epub_accessible

router = APIRouter()


@router.post("/convert/{book_id}")
def convert_epub_accessible(book_id: str):
    """
    Convert WORKSPACE → Accessible EPUB
    NO re-upload
    """

    try:
        workspace = get_workspace_path(book_id)
        epub_bytes = rebuild_epub_accessible(workspace)

        return Response(
            content=epub_bytes,
            media_type="application/epub+zip",
            headers={
                "Content-Disposition": "attachment; filename=accessible.epub"
            },
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
