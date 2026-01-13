# backend/app/services/workspace_service.py

from pathlib import Path
import shutil

BASE = Path("app/storage/workspace")
BASE.mkdir(parents=True, exist_ok=True)


def create_workspace(book_id: str, extracted_dir: Path) -> Path:
    ws = BASE / book_id
    ws.mkdir(parents=True, exist_ok=True)
    shutil.copytree(extracted_dir, ws, dirs_exist_ok=True)
    return ws


def save_html(book_id: str, rel_path: str, html: str):
    path = BASE / book_id / rel_path
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(html, encoding="utf-8")


def get_workspace_path(book_id: str) -> Path:
    ws = BASE / book_id
    if not ws.exists():
        raise RuntimeError("Workspace not found")
    return ws
