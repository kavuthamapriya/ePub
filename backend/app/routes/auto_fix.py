# backend/app/routes/auto_fix.py

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pathlib import Path
import zipfile
import io
import base64

from app.services.epub_accessibility_rules import apply_accessibility_rules
from app.services.qc_service import _LAST_QC_EPUB   # ✅ IMPORTANT

router = APIRouter()

EXTRACT_ROOT = Path("extracted_epub")


# ------------------------------
# Correct EPUB Rebuilder
# ------------------------------
def rebuild_epub(folder: Path) -> bytes:
    buffer = io.BytesIO()

    with zipfile.ZipFile(buffer, "w") as zf:

        # 1) Write mimetype FIRST without compression
        mimetype = folder / "mimetype"
        if mimetype.exists():
            zf.write(mimetype, "mimetype", compress_type=zipfile.ZIP_STORED)

        # 2) Write rest compressed
        for file in folder.rglob("*"):
            if file.name == "mimetype":
                continue

            if file.is_file():
                zf.write(
                    file,
                    arcname=str(file.relative_to(folder)),
                    compress_type=zipfile.ZIP_DEFLATED,
                )

    return buffer.getvalue()


# ------------------------------
# FINAL AUTO-FIX ENDPOINT
# ------------------------------
@router.post("/autofix")
async def autofix_epub(
    book_id: str = Form(...),
    epub_file: UploadFile = File(...),   # ignored but required
    accessible_html: str = Form(""),
):
    try:
        book_folder = EXTRACT_ROOT / book_id

        if not book_folder.exists():
            raise HTTPException(404, "Extracted EPUB folder not found")

        print("\n=========================================")
        print(" 🔥 FULL AUTO-FIX STARTED")
        print("   Working folder:", book_folder)
        print("=========================================\n")

        # 1️⃣ Apply full accessibility engine
        apply_accessibility_rules(book_folder)

        # 2️⃣ Rebuild EPUB
        epub_bytes = rebuild_epub(book_folder)

        # 3️⃣ Save output
        out_path = book_folder / "accessible.epub"
        out_path.write_bytes(epub_bytes)

        print("=========================================")
        print(" 🎉 ACCESSIBLE EPUB BUILT SUCCESSFULLY")
        print("    Saved:", out_path)
        print("=========================================\n")

        # 4️⃣ Update QC memory so re-run QC uses the NEW EPUB
        _LAST_QC_EPUB["bytes"] = epub_bytes
        _LAST_QC_EPUB["filename"] = "accessible.epub"
        _LAST_QC_EPUB["book_id"] = book_id

        # 5️⃣ Send Base64 to FE
        epub_b64 = base64.b64encode(epub_bytes).decode("utf-8")

        return {
            "book_id": book_id,
            "filename": "accessible.epub",
            "epub_b64": epub_b64,
            "saved_at": str(out_path),
        }

    except Exception as e:
        print("AUTO-FIX ERROR:", e)
        raise HTTPException(500, f"Auto-fix error: {e}")
