import zipfile
import uuid
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
EXTRACT_BASE = BASE_DIR / "extracted_epub"

def extract_epub(epub_file_path: Path) -> str:
    book_id = str(uuid.uuid4())
    target_dir = EXTRACT_BASE / book_id
    target_dir.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(epub_file_path, "r") as zip_ref:
        zip_ref.extractall(target_dir)

    return book_id