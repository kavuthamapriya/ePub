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
        "raw_report": <full JSON from report.json>,
        "ace_status": { "returncode": int, "stderr": str },
        "warning": Optional[str]
      }

    IMPORTANT:
    - Ace 1.3.x on newer Node sometimes exits with rc=1 AFTER writing report.json
      due to a winston.logAndWaitFinish() bug.
    - Here we treat that as a *soft* failure:
        * If report.json exists -> we still return a full QC result.
        * Only if report.json is missing we raise HTTP 500.
    """
    tmp_root = Path(tempfile.mkdtemp(prefix="ace-job-"))
    epub_path = tmp_root / filename
    out_dir = tmp_root / "ace-report"

    try:
        # 1) Save EPUB into temp dir
        epub_path.write_bytes(epub_bytes)

        # 2) Resolve ace binary in node_modules/.bin
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
            "--silent",
        ]
        print("[qc] Running Ace:", " ".join(cmd))

        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            cwd=str(project_root),
        )

        # 3) Check for report.json FIRST (even if rc != 0)
        report_file = out_dir / "report.json"
        if not report_file.exists():
            # Ace really failed: no report generated
            print("[qc] Ace failed with no report.json")
            raise HTTPException(
                status_code=500,
                detail=(
                    f"Ace QC failed: Ace CLI failed (rc={proc.returncode}). "
                    f"stdout: {proc.stdout}\nstderr: {proc.stderr}"
                ),
            )

        # 4) Parse report.json
        raw_report = json.loads(report_file.read_text(encoding="utf-8"))

        # 5) Build a simple summary
        errors = 0
        warnings = 0

        # Ace report may store assertions under different keys;
        # the common one is "assertions"
        assertions = raw_report.get("assertions") or raw_report.get("earl:assertions") or []
        for a in assertions:
            result = (a.get("result") or a.get("earl:result") or {}).get("outcome")
            if result == "fail":
                errors += 1
            elif result == "warning":
                warnings += 1

        # 6) Prepare response object
        warning_msg = None
        if proc.returncode != 0:
            # Node 20 / winston bug case: rc=1 but report exists
            warning_msg = (
                "Ace exited with non-zero status but report.json was generated. "
                "This is usually caused by the winston.logAndWaitFinish() bug "
                "on newer Node versions. QC results are still valid."
            )
            print("[qc] Ace returned rc != 0, but report.json exists – treating as soft failure")

        return {
            "summary": {"errors": errors, "warnings": warnings},
            "raw_report": raw_report,
            "ace_status": {
                "returncode": proc.returncode,
                "stderr": proc.stderr,
            },
            "warning": warning_msg,
        }

    finally:
        # 7) Clean up temp directory
        try:
            shutil.rmtree(tmp_root, ignore_errors=True)
        except Exception:
            pass
