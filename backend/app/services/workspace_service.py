from pathlib import Path
import shutil

BASE = Path("app/storage/workspace")

def create_workspace(book_id: str, extracted_dir: Path):
    ws = BASE / book_id
    ws.mkdir(parents=True, exist_ok=True)
    shutil.copytree(extracted_dir, ws, dirs_exist_ok=True)
    return ws

def save_html(book_id: str, rel_path: str, html: str):
    path = BASE / book_id / rel_path
    path.write_text(html, encoding="utf-8")

def get_workspace_path(book_id: str) -> Path:
    return BASE / book_id
