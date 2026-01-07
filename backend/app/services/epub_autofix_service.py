# backend/app/services/epub_autofix_service.py

from pathlib import Path
import shutil
import tempfile
import zipfile

from app.services.epub_accessibility_rules import apply_accessibility_rules


def auto_fix_epub(epub_path: Path) -> bytes:
    """
    Automatically applies accessibility rules to EPUB
    and returns rebuilt EPUB bytes.
    """

    print("[auto-fix] Starting EPUB auto-fix")

    with tempfile.TemporaryDirectory() as tmpdir:
        tmpdir = Path(tmpdir)
        extract_dir = tmpdir / "extracted"
        extract_dir.mkdir()

        # 1️⃣ Extract EPUB
        print("[auto-fix] Extracting EPUB")
        with zipfile.ZipFile(epub_path, "r") as zf:
            zf.extractall(extract_dir)

        # 2️⃣ Apply rules
        print("[auto-fix] Applying accessibility rules")
        report = apply_accessibility_rules(extract_dir)

        print("[auto-fix] Rules applied:")
        for f in report:
            print(" ", f["file"], "→", len(f["actions"]), "actions")

        # 3️⃣ Rebuild EPUB
        print("[auto-fix] Rebuilding EPUB")
        out_epub = tmpdir / "fixed.epub"

        with zipfile.ZipFile(out_epub, "w", zipfile.ZIP_DEFLATED) as zf:
            for file in extract_dir.rglob("*"):
                if file.is_file():
                    zf.write(
                        file,
                        arcname=file.relative_to(extract_dir)
                    )

        print("[auto-fix] EPUB auto-fix completed")

        return out_epub.read_bytes()
