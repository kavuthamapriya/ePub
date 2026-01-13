# backend/app/services/epub_rebuild_service.py

import zipfile
from pathlib import Path

from app.services.epub_accessibility_rules import apply_accessibility_rules
from app.services.epub_standard_rules import apply_standard_rules_from_excel

STANDARD_RULES_EXCEL = Path("rules/INForm_to_Accessibility_Standard_Rules_UPDATED.xlsx")


def rebuild_epub_accessible(workspace_dir: Path) -> bytes:
    """
    FINAL rebuild from WORKSPACE
    """

    if not workspace_dir.exists():
        raise RuntimeError("Workspace directory does not exist")

    # 1️⃣ QC-driven fixes
    apply_accessibility_rules(workspace_dir)

    # 2️⃣ Standard rules (Excel)
    if STANDARD_RULES_EXCEL.exists():
        apply_standard_rules_from_excel(
            extracted_dir=workspace_dir,
            excel_path=STANDARD_RULES_EXCEL,
        )

    # 3️⃣ Build EPUB
    output_epub = workspace_dir / "accessible.epub"

    with zipfile.ZipFile(output_epub, "w") as zf:
        mimetype = workspace_dir / "mimetype"
        zf.write(mimetype, "mimetype", compress_type=zipfile.ZIP_STORED)

        for file in workspace_dir.rglob("*"):
            if file.is_file() and file.name not in ("mimetype", "accessible.epub"):
                zf.write(
                    file,
                    arcname=file.relative_to(workspace_dir),
                    compress_type=zipfile.ZIP_DEFLATED,
                )

    return output_epub.read_bytes()
