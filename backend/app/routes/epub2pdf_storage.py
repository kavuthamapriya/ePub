from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from uuid import uuid4
from pathlib import Path
import shutil
import zipfile
import base64
from app.db import database

router = APIRouter()

STORAGE_DIR = Path("storage/epubs")
STORAGE_DIR.mkdir(parents=True, exist_ok=True)


# ============================
#   SAFE COVER EXTRACTION
# ============================
def extract_cover(epub_path: Path):
    try:
        with zipfile.ZipFile(epub_path, "r") as zip_ref:
            container = zip_ref.read("META-INF/container.xml").decode()

        import xml.etree.ElementTree as ET
        root = ET.fromstring(container)

        # Get OPF path
        rootfile = root.find(".//{*}rootfile")
        if rootfile is None:
            return None

        opf_path = rootfile.attrib.get("full-path")
        if not opf_path:
            return None

        # Load OPF
        with zipfile.ZipFile(epub_path, "r") as zip_ref:
            opf_xml = zip_ref.read(opf_path).decode()

        opf = ET.fromstring(opf_xml)

        # --- UNIVERSAL COVER DETECTION ---
        manifest_items = list(opf.iterfind(".//{*}item"))

        cover_img_href = None

        # 1️⃣ Check EPUB3: properties="cover-image"
        for item in manifest_items:
            if "cover-image" in item.attrib.get("properties", ""):
                cover_img_href = item.attrib["href"]
                break

        # 2️⃣ Check ID pattern "cover" (but ignore XHTML)
        if not cover_img_href:
            for item in manifest_items:
                if "cover" in item.attrib.get("id", "").lower():
                    if item.attrib.get("media-type", "").startswith("image"):
                        cover_img_href = item.attrib["href"]
                        break

        # 3️⃣ Fallback: first real image
        if not cover_img_href:
            for item in manifest_items:
                if item.attrib.get("media-type", "").startswith("image"):
                    cover_img_href = item.attrib["href"]
                    break

        if not cover_img_href:
            return None

        # Resolve path
        base_dir = "/".join(opf_path.split("/")[:-1])
        full_path = f"{base_dir}/{cover_img_href}" if base_dir else cover_img_href

        with zipfile.ZipFile(epub_path, "r") as zip_ref:
            img_bytes = zip_ref.read(full_path)

        return base64.b64encode(img_bytes).decode()

    except Exception as e:
        print("❌ COVER EXTRACTION FAILED:", epub_path, "\nERROR:", e)
        return None


# ============================
#   UPLOAD EPUB
# ============================
@router.post("/upload")
async def upload_epub(epub: UploadFile = File(...)):
    epub_id = str(uuid4())
    file_path = STORAGE_DIR / f"{epub_id}.epub"

    # Save EPUB file
    with file_path.open("wb") as out:
        shutil.copyfileobj(epub.file, out)

    # Extract cover image
    cover64 = extract_cover(file_path)

    # Insert into PostgreSQL
    await database.execute(
        """
        INSERT INTO epubs (id, filename, cover_base64, storage_path)
        VALUES (:id, :filename, :cover, :path)
        """,
        {
            "id": epub_id,
            "filename": epub.filename,
            "cover": f"data:image/jpeg;base64,{cover64}" if cover64 else None,
            "path": str(file_path),
        },
    )

    return {"id": epub_id, "uploaded": True}


# ============================
#   LIST ALL EPUBS
# ============================
@router.get("/all")
async def get_all():
    rows = await database.fetch_all(
        "SELECT id, filename, cover_base64 FROM epubs ORDER BY uploaded_at DESC"
    )
    return rows


# ============================
#   DOWNLOAD EPUB FILE
# ============================
@router.get("/{epub_id}")
async def get_epub(epub_id: str):
    row = await database.fetch_one(
        "SELECT storage_path FROM epubs WHERE id = :id",
        {"id": epub_id}
    )

    if not row:
        raise HTTPException(404, "EPUB not found")

    return FileResponse(row["storage_path"], media_type="application/epub+zip")


# ============================
#   DELETE EPUB
# ============================
@router.delete("/{epub_id}")
async def delete_epub(epub_id: str):
    row = await database.fetch_one(
        "SELECT storage_path FROM epubs WHERE id = :id",
        {"id": epub_id}
    )

    if row:
        Path(row["storage_path"]).unlink(missing_ok=True)

    await database.execute(
        "DELETE FROM epubs WHERE id = :id",
        {"id": epub_id},
    )

    return {"deleted": True}
