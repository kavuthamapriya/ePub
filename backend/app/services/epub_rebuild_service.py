# backend/app/services/epub_rebuild_service.py

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
        with zipfile.ZipFile(epub_path, "r") as zf:
            zf.extractall(extract_dir)

        # 2️⃣ Apply accessibility rules
        apply_accessibility_rules(extract_dir)

        # 3️⃣ Rebuild EPUB (🔥 EPUB SPEC COMPLIANT)
        output_epub = tmpdir / "accessible.epub"

        with zipfile.ZipFile(output_epub, "w") as zf:
            mimetype = extract_dir / "mimetype"
            if not mimetype.exists():
                raise RuntimeError("Invalid EPUB: mimetype missing")

            # ✅ 1. mimetype FIRST, NO compression
            zf.write(
                mimetype,
                arcname="mimetype",
                compress_type=zipfile.ZIP_STORED,
            )

            # ✅ 2. Remaining files (compressed)
            for file in extract_dir.rglob("*"):
                if file.is_file() and file.name != "mimetype":
                    zf.write(
                        file,
                        arcname=file.relative_to(extract_dir),
                        compress_type=zipfile.ZIP_DEFLATED,
                    )

        print("[rebuild] Accessible EPUB built correctly")

        return output_epub.read_bytes()
