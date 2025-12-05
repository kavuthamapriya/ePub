from fastapi import APIRouter, UploadFile, File, HTTPException
from pathlib import Path
import tempfile
import subprocess
import json
import os
from typing import Any, Dict
from pydantic import BaseModel

router = APIRouter()


class QCReport(BaseModel):
    raw_report: Dict[str, Any]
    error_count: int
    warning_count: int
    notice_count: int | None = None


def get_ace_path() -> Path:
    """
    Return path to Ace CLI installed in backend/node_modules/.bin.
    """
    backend_dir = Path(__file__).resolve().parents[2]
    bin_dir = backend_dir / "node_modules" / ".bin"

    if os.name == "nt":
        ace_bin = bin_dir / "ace.cmd"
    else:
        ace_bin = bin_dir / "ace"

    if not ace_bin.exists():
        raise FileNotFoundError(
            f"[QC] Ace CLI not found at {ace_bin}. "
            "Run `npm install @daisy/ace --save-dev` in backend folder."
        )

    return ace_bin


@router.post("/epub", response_model=QCReport)
async def qc_epub(epub_file: UploadFile = File(...)) -> QCReport:
    """
    Run DAISY Ace on an EPUB and return JSON summary + full report.

    IMPORTANT:
    - We DO NOT use check=True on subprocess.run.
    - We DO NOT raise "Ace QC failed: ..." anywhere.
    - We ONLY fail if report.json is missing.
    """
    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            tmpdir_path = Path(tmpdir)
            epub_path = tmpdir_path / epub_file.filename
            epub_bytes = await epub_file.read()
            epub_path.write_bytes(epub_bytes)

            outdir = tmpdir_path / "ace-report"
            outdir.mkdir(parents=True, exist_ok=True)

            # 1) Resolve Ace binary
            try:
                ace_bin = get_ace_path()
            except FileNotFoundError as e:
                print("[qc] Ace path error:", e)
                raise HTTPException(status_code=500, detail=str(e))

            cmd = [
                str(ace_bin),
                str(epub_path),
                "--outdir",
                str(outdir),
                "--silent",
            ]

            # 2) Run Ace (NO check=True, we allow non-zero exit)
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
            )

            print("[qc] Ace return code:", result.returncode)
            print("[qc] Ace stdout:", result.stdout)
            print("[qc] Ace stderr:", result.stderr)

            report_path = outdir / "report.json"
            if not report_path.exists():
                # Only now do we treat it as a real failure
                raise HTTPException(
                    status_code=500,
                    detail=(
                        "[QC] Ace did not produce report.json – "
                        f"return code={result.returncode}, stderr={result.stderr}"
                    ),
                )

            # 3) Load Ace JSON report
            with report_path.open("r", encoding="utf-8") as f:
                raw = json.load(f)

            # 4) Build summary for UI
            summary = raw.get("summary", {})
            error_count = int(summary.get("errors", 0))
            warning_count = int(summary.get("warnings", 0))
            notice_count = int(summary.get("notices", 0)) if "notices" in summary else None

            return QCReport(
                raw_report=raw,
                error_count=error_count,
                warning_count=warning_count,
                notice_count=notice_count,
            )

    except HTTPException:
        raise
    except Exception as e:
        print("[qc] Unexpected error:", e)
        raise HTTPException(status_code=500, detail=f"[QC] Unexpected error: {e}")
