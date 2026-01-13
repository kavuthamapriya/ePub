from pathlib import Path
import tempfile
import zipfile

from app.services.epub_accessibility_rules import apply_accessibility_rules


def auto_fix_epub(epub_bytes: bytes) -> bytes:
    print("[auto-fix] Starting EPUB auto-fix")

    with tempfile.TemporaryDirectory() as tmpdir:
        tmpdir = Path(tmpdir)

        input_epub = tmpdir / "input.epub"
        input_epub.write_bytes(epub_bytes)

        extract_dir = tmpdir / "extracted"
        extract_dir.mkdir()

        # 1️⃣ Extract EPUB
        with zipfile.ZipFile(input_epub, "r") as zf:
            zf.extractall(extract_dir)

        # 2️⃣ Apply accessibility rules
        print("🔥 CALLING apply_accessibility_rules 🔥")
        apply_accessibility_rules(extract_dir)

        # 3️⃣ Rebuild EPUB CORRECTLY
        output_epub = tmpdir / "accessible.epub"

        with zipfile.ZipFile(output_epub, "w") as zf:

            # ✅ 1. mimetype MUST be first & uncompressed
            mimetype = extract_dir / "mimetype"
            if mimetype.exists():
                zf.write(
                    mimetype,
                    "mimetype",
                    compress_type=zipfile.ZIP_STORED,
                )

            # ✅ 2. All other files (compressed)
            for file in extract_dir.rglob("*"):
                if file.name == "mimetype":
                    continue
                if file.is_file():
                    zf.write(
                        file,
                        arcname=file.relative_to(extract_dir),
                        compress_type=zipfile.ZIP_DEFLATED,
                    )

        print("[auto-fix] Accessible EPUB created correctly")

        return output_epub.read_bytes()