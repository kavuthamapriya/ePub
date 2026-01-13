# backend/app/routes/preview.py

from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse
from app.services.workspace_service import get_workspace_path

router = APIRouter(prefix="/preview")


@router.get("/{book_id}/{path:path}")
def preview_file(book_id: str, path: str):
    ws = get_workspace_path(book_id)
    file_path = ws / path

    if not file_path.exists():
        raise HTTPException(404, "File not found")

    return HTMLResponse(
        file_path.read_text(encoding="utf-8", errors="ignore")
    )
