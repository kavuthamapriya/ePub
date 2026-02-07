from pathlib import Path
import shutil

# Base workspace inside extracted_epub
BASE_DIR = Path(__file__).resolve().parent.parent.parent
WORKSPACE_ROOT = BASE_DIR / "extracted_epub"
WORKSPACE_ROOT.mkdir(parents=True, exist_ok=True)

def create_workspace(book_id: str, extracted_dir: Path) -> Path:
    """
    Create workspace inside:
    extracted_epub/<book_id>/
    Copy extracted EPUB content.
    """
    ws = WORKSPACE_ROOT / book_id
    ws.mkdir(parents=True, exist_ok=True)

    shutil.copytree(extracted_dir, ws, dirs_exist_ok=True)
    return ws

def save_html(book_id: str, rel_path: str, html: str):
    """
    Save updated HTML inside workspace.
    """
    path = WORKSPACE_ROOT / book_id / rel_path
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(html, encoding="utf-8")

def get_workspace_path(book_id: str) -> Path:
    ws = WORKSPACE_ROOT / book_id
    if not ws.exists():
        raise RuntimeError(f"Workspace not found for {book_id}")
    return ws
