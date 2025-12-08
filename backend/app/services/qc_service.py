# app/services/qc_service.py
import json
import os
import subprocess
import tempfile
from pathlib import Path

from fastapi import HTTPException

# ✅ PROJECT ROOT (backend/), not app/
# this file is backend/app/services/qc_service.py
# parents[0] = .../services
# parents[1] = .../app
# parents[2] = .../backend   ← we want this
PROJECT_ROOT = Path(__file__).resolve().parents[2]

ACE_CLI = (
    PROJECT_ROOT
    / "node_modules"
    / ".bin"
    / ("ace.cmd" if os.name == "nt" else "ace")
)


def _count_outcomes(report_json: dict):
    """Compute simple summary counts from Ace JSON."""
    assertions = report_json.get("assertions", [])
    errors = 0
    warnings = 0
    passes = 0

    for a in assertions:
        result = a.get("result") or a.get("earl:result") or {}
        outcome = (
            result.get("outcome")
            or result.get("earl:outcome")
            or ""
        ).lower()

        if outcome == "fail":
            errors += 1
        elif outcome in ("warning", "warn"):
            warnings += 1
        elif outcome == "pass":
            passes += 1

    return {"errors": errors, "warnings": warnings, "passes": passes}


def run_daisy_ace(epub_bytes: bytes, filename: str) -> dict:
    """
    Run DAISY Ace on an EPUB (bytes) and return:
      {
        "summary": { errors, warnings, passes },
        "raw_report": { ... full Ace JSON ... }
      }
    """
    if not ACE_CLI.exists():
        raise HTTPException(
            status_code=500,
            detail=(
                f"[QC] Ace CLI not found at {ACE_CLI}. "
                "Run `npm install @daisy/ace --save-dev` in backend folder."
            ),
        )

    try:
        with tempfile.TemporaryDirectory(prefix="ace-job-") as tmpdir:
            tmpdir_path = Path(tmpdir)
            epub_path = tmpdir_path / filename
            epub_path.write_bytes(epub_bytes)

            outdir = tmpdir_path / "ace-report"

            # Correct Ace invocation (no 'check' subcommand)
            cmd = [
                str(ACE_CLI),
                str(epub_path),
                "--outdir",
                str(outdir),
                "--silent",
            ]

            proc = subprocess.run(
                cmd,
                cwd=PROJECT_ROOT,
                capture_output=True,
                text=True,
            )

            stdout = proc.stdout or ""
            stderr = proc.stderr or ""
            rc = proc.returncode

            print("[qc] Ace rc:", rc)
            if stdout:
                print("[qc] Ace stdout (truncated):", stdout[:400])
            if stderr:
                print("[qc] Ace stderr (truncated):", stderr[:400])

            json_path = outdir / "report.json"
            if not json_path.exists():
                raise HTTPException(
                    status_code=500,
                    detail=(
                        f"Ace QC failed: Ace did not produce report.json. "
                        f"rc={rc}, stderr={stderr[:300]}"
                    ),
                )

            try:
                report = json.loads(json_path.read_text(encoding="utf-8"))
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Ace QC failed: report.json could not be parsed as JSON: {e}",
                )

            summary = _count_outcomes(report)

            if rc != 0:
                print(
                    "[qc] Ace returned non-zero rc, "
                    "but report.json exists – treating as soft error."
                )

            return {"summary": summary, "raw_report": report}

    except HTTPException:
        raise
    except Exception as e:
        print("[qc] Unexpected error in run_daisy_ace:", e)
        raise HTTPException(status_code=500, detail=f"Ace QC failed: {e}")
