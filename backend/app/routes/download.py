# backend/app/routes/download.py
from fastapi import APIRouter, HTTPException, Body
from fastapi.responses import FileResponse
import tempfile, zipfile, json
from pathlib import Path

router = APIRouter()

@router.post("/final_package")
async def final_package(payload: dict = Body(...)):
    epub_hex = payload.get("epub_bytes_hex")
    pdf_hex = payload.get("pdf_bytes_hex")
    qc_json = payload.get("qc_report_json", {})

    if not epub_hex and not pdf_hex:
        raise HTTPException(status_code=400, detail="Provide epub or pdf bytes")

    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            tmp = Path(tmpdir)
            if epub_hex:
                epub_path = tmp / "final.epub"
                epub_path.write_bytes(bytes.fromhex(epub_hex))
            else:
                epub_path = None
            if pdf_hex:
                pdf_path = tmp / "final.pdf"
                pdf_path.write_bytes(bytes.fromhex(pdf_hex))
            else:
                pdf_path = None

            qc_path = tmp / "qc_report.json"
            qc_path.write_text(json.dumps(qc_json or {}, indent=2), encoding="utf-8")

            zip_path = tmp / "package.zip"
            with zipfile.ZipFile(zip_path, "w") as z:
                if epub_path:
                    z.write(epub_path, arcname="final.epub")
                if pdf_path:
                    z.write(pdf_path, arcname="final.pdf")
                z.write(qc_path, arcname="qc_report.json")
            return FileResponse(str(zip_path), media_type="application/zip", filename="accessible_package.zip")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
