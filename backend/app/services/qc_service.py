# app/services/qc_service.py
import json
import os
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Any, Dict

from fastapi import HTTPException


def run_daisy_ace(epub_bytes: bytes, filename: str) -> Dict[str, Any]:
    """
    Run DAISY Ace CLI on the given EPUB bytes and return:
      {
        "summary": { "errors": int, "warnings": int },
        "raw_report": <full JSON from report.json>
      }
    """
    tmp_root = Path(tempfile.mkdtemp(prefix="ace-job-"))
    epub_path = tmp_root / filename
    out_dir = tmp_root / "ace-report"

    try:
        epub_path.write_bytes(epub_bytes)

        # resolve ace binary in node_modules/.bin
        project_root = Path(__file__).resolve().parents[2]
        if os.name == "nt":
            ace_bin = project_root / "node_modules" / ".bin" / "ace.cmd"
        else:
            ace_bin = project_root / "node_modules" / ".bin" / "ace"

        if not ace_bin.exists():
            raise HTTPException(
                status_code=500,
                detail=(
                    f"[QC] Ace CLI not found at {ace_bin}. "
                    "Run `npm install @daisy/ace --save-dev` in backend folder."
                ),
            )

        cmd = [
            str(ace_bin),
            str(epub_path),
            "--outdir",
            str(out_dir),
            "--silent",  # quiet stdout, errors still go to stderr
        ]
        print("[qc] Running Ace:", " ".join(cmd))

        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            cwd=str(project_root),
        )

        if proc.returncode != 0:
            # Ace failed: bubble stderr up to frontend
            print("[qc] Ace stderr:\n", proc.stderr)
            raise HTTPException(
                status_code=500,
                detail=(
                    f"Ace QC failed: Ace CLI failed (rc={proc.returncode}). "
                    f"stdout: {proc.stdout}\nstderr: {proc.stderr}"
                ),
            )

        report_file = out_dir / "report.json"
        if not report_file.exists():
            raise HTTPException(
                status_code=500,
                detail=f"Ace QC failed: report.json not found in {out_dir}",
            )

        raw_report = json.loads(report_file.read_text(encoding="utf-8"))

        # very simple summary: count fail / warn assertions if present
        errors = 0
        warnings = 0
        assertions = raw_report.get("assertions") or []
        for a in assertions:
            result = (a.get("result") or {}).get("outcome")
            if result == "fail":
                errors += 1
            elif result == "warning":
                warnings += 1

        return {
            "summary": {"errors": errors, "warnings": warnings},
            "raw_report": raw_report,
        }

    finally:
        # Clean up temp dir
        try:
            shutil.rmtree(tmp_root, ignore_errors=True)
        except Exception:
            pass
