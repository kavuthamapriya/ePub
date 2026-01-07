# backend/app/services/epub_rebuild_service.py

import shutil
import tempfile
import zipfile
from pathlib import Path

from app.services.epub_accessibility_rules import apply_accessibility_rules


def rebuild_epub_accessible(epub_path: Path) -> bytes:
    print("[rebuild] Starting accessible EPUB rebuild")

    with tempfile.TemporaryDirectory() as tmpdir:
        tmpdir = Path(tmpdir)

        extract_dir = tmpdir / "extracted"
        extract_dir.mkdir()

        # 1️⃣ Extract EPUB
        print("[rebuild] Extracting EPUB")
        with zipfile.ZipFile(epub_path, "r") as zf:
            zf.extractall(extract_dir)

        # 2️⃣ Apply accessibility rules
        print("[rebuild] Applying accessibility rules")
        report = apply_accessibility_rules(extract_dir)

        print("[rebuild] Rule application summary:")
        for f in report:
            print("  ", f["file"], "→", len(f["actions"]), "rules checked")

        # 3️⃣ Rebuild EPUB
        print("[rebuild] Repacking EPUB")
        output_epub = tmpdir / "accessible.epub"

        with zipfile.ZipFile(output_epub, "w", zipfile.ZIP_DEFLATED) as zf:
            for file in extract_dir.rglob("*"):
                if file.is_file():
                    zf.write(
                        file,
                        arcname=file.relative_to(extract_dir)
                    )

        print("[rebuild] Accessible EPUB build complete")

        return output_epub.read_bytes()
