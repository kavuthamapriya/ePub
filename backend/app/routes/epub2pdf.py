# app/routes/epub2pdf.py

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from pathlib import Path
import subprocess
import uuid
import io

router = APIRouter()

# Base directory
BASE_DIR = Path("D:/Epub2PDF")
INPUT_DIR = BASE_DIR / "input"
OUTPUT_DIR = BASE_DIR / "output"

# Create folders
INPUT_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/epub-to-pdf")
async def epub_to_pdf(epub: UploadFile = File(...)):
    print("\n==============================")
    print("🔥 ROUTE HIT — EPUB2PDF")
    print("==============================")

    try:
        # Validate file
        if not epub:
            raise HTTPException(400, "EPUB not uploaded")

        epub_filename = epub.filename
        epub_path = INPUT_DIR / epub_filename

        print(f" RECEIVED EPUB FILE: {epub_filename}")

        # Save file
        with open(epub_path, "wb") as f:
            f.write(await epub.read())

        # Output file name
        pdf_filename = epub_filename.replace(".epub", "") + "_converted.pdf"
        pdf_path = OUTPUT_DIR / pdf_filename

        # Docker command
        command = [
            "docker", "run", "--rm",
            "-v", "D:/Epub2PDF:/data",
            "myvivliostyle:latest",
            "build",
            f"/data/input/{epub_filename}",
            "--format", "pdf",
            "-o",
            f"/data/output/{pdf_filename}"
        ]

        print("🐳 RUNNING DOCKER COMMAND:")
        print(" ".join(command))

        # Execute docker command
        result = subprocess.run(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        print("\n📄 DOCKER STDOUT:\n", result.stdout)
        print("\n⚠ DOCKER STDERR:\n", result.stderr)

        # Check failure
        if result.returncode != 0:
            raise Exception(f"Docker failed: {result.stderr}")

        # Ensure PDF exists
        if not pdf_path.exists():
            raise Exception("PDF was not generated!")

        print(f"📄 PDF GENERATED SUCCESSFULLY: {pdf_filename}")

        # Read PDF bytes
        pdf_bytes = pdf_path.read_bytes()

        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={pdf_filename}"
            }
        )

    except Exception as e:
        print("🚨 ERROR DURING EPUB→PDF:", e)
        raise HTTPException(status_code=500, detail=str(e))

