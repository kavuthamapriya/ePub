from fastapi import APIRouter, HTTPException
from app.services.workspace_service import get_workspace_path
from app.services.epub_rebuild_service import rebuild_epub_accessible

router = APIRouter()

@router.post("/finalize/{book_id}")
def finalize_accessibility(book_id: str):
    ws_path = get_workspace_path(book_id)

    if not ws_path.exists():
        raise HTTPException(404, "Workspace not found")

    epub_bytes = rebuild_epub_accessible(ws_path)

    return {
        "status": "finalized",
        "download_url": f"/api/reports/epub/{book_id}"
    }
