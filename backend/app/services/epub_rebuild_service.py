# backend/app/services/epub_rebuild_service.py

import zipfile
from pathlib import Path

from app.services.epub_accessibility_rules import apply_accessibility_rules
from app.services.epub_standard_rules import apply_standard_rules_from_excel


# 📌 Path to your STANDARD RULES Excel
# You can move this to config later if needed
STANDARD_RULES_EXCEL = Path("rules/INForm_to_Accessibility_Standard_Rules_UPDATED.xlsx")

apply_standard_rules_from_excel(
    extracted_dir=workspace_dir,
    excel_path=STANDARD_RULES_EXCEL,
)

def rebuild_epub_accessible(workspace_dir: Path) -> bytes:
    """
    Rebuild FINAL accessible EPUB from workspace directory.

    Flow:
    1. Workspace already has extracted EPUB
    2. Apply QC-driven auto fixes (reactive)
    3. Apply Excel-driven STANDARD rules (proactive)
    4. Rebuild EPUB (EPUB-spec compliant)
    """

    print("[rebuild] Starting FINAL accessible EPUB rebuild")

    if not workspace_dir.exists():
        raise RuntimeError("Workspace directory does not exist")

    # --------------------------------------------------
    # 1️⃣ QC / ERROR-DRIVEN FIXES (Safety net)
    # --------------------------------------------------
    print("🔥 Applying QC accessibility fixes 🔥")
    apply_accessibility_rules(workspace_dir)

    # --------------------------------------------------
    # 2️⃣ STANDARD / COMPLIANCE RULES (Excel-driven)
    # --------------------------------------------------
    if STANDARD_RULES_EXCEL.exists():
        print("📘 Applying STANDARD accessibility rules from Excel")
        apply_standard_rules_from_excel(
            extracted_dir=workspace_dir,
            excel_path=STANDARD_RULES_EXCEL,
        )
    else:
        print("⚠️ Standard rules Excel not found — skipping")

    # --------------------------------------------------
    # 3️⃣ Build FINAL EPUB
    # --------------------------------------------------
    output_epub_path = workspace_dir.parent / f"{workspace_dir.name}_accessible.epub"

    with zipfile.ZipFile(output_epub_path, "w") as zf:
        mimetype = workspace_dir / "mimetype"
        if not mimetype.exists():
            raise RuntimeError("Invalid EPUB workspace: mimetype missing")

        # ✅ 1. mimetype FIRST, UNCOMPRESSED (EPUB SPEC)
        zf.write(
            mimetype,
            arcname="mimetype",
            compress_type=zipfile.ZIP_STORED,
        )

        # ✅ 2. Remaining files (compressed)
        for file in workspace_dir.rglob("*"):
            if file.is_file() and file.name != "mimetype":
                zf.write(
                    file,
                    arcname=file.relative_to(workspace_dir),
                    compress_type=zipfile.ZIP_DEFLATED,
                )

    print("[rebuild] FINAL accessible EPUB built successfully")

    return output_epub_path.read_bytes()
