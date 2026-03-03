# backend/app/routes/pac_validator.py

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from pathlib import Path
import subprocess
import uuid
import json
import shutil
import os

router = APIRouter()

# 🔥 FIX 1: Confirm your PAC installation path
PAC_PATH = r"C:\Program Files\PAC 2024\PAC.exe"

TEMP_DIR = Path("./temp_pac")
TEMP_DIR.mkdir(exist_ok=True)


@router.post("/validate")
async def validate_pdf(pdf: UploadFile = File(...)):
    try:
        # -------------------------------------------
        # 1. Save uploaded PDF to temp folder
        # -------------------------------------------
        file_id = str(uuid.uuid4())
        input_path = TEMP_DIR / f"{file_id}.pdf"
        output_json = TEMP_DIR / f"{file_id}.json"

        with open(input_path, "wb") as f:
            shutil.copyfileobj(pdf.file, f)

        # -------------------------------------------
        # 2. Run PAC 2024 CLI
        # -------------------------------------------
        cmd = [
            f'"{PAC_PATH}"',
            "--report-json", f'"{output_json}"',
            "--check-pdf", f'"{input_path}"'
        ]

        command = " ".join(cmd)
        print("Running PAC:", command)

        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            shell=True
        )

        # Debug output
        print("STDOUT:", result.stdout)
        print("STDERR:", result.stderr)

        if result.returncode != 0:
            raise HTTPException(
                status_code=500,
                detail=f"PAC failed: {result.stderr or 'Unknown PAC Error'}"
            )

        # -------------------------------------------
        # 3. Read the PAC JSON result
        # -------------------------------------------
        if not output_json.exists():
            raise HTTPException(
                status_code=500,
                detail="PAC did not generate a JSON output file."
            )

        with open(output_json, "r", encoding="utf8") as f:
            pac_result = json.load(f)

        is_compliant = pac_result.get("IsCompliant", False)

        # -------------------------------------------
        # 4. Cleanup
        # -------------------------------------------
        try:
            input_path.unlink()
            output_json.unlink()
        except:
            pass

        # -------------------------------------------
        # 5. Send response
        # -------------------------------------------
        return {
            "status": "PASS" if is_compliant else "FAIL",
            "message": "PDF is fully compliant!" if is_compliant else "Accessibility Issues Found",
            "details": pac_result
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
