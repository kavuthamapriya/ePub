# app/services/qc_service.py
import os
import json
import base64
import shutil
import tempfile
import subprocess
from pathlib import Path

from fastapi import HTTPException

# Backend root (where node_modules lives)
BACKEND_ROOT = Path(__file__).resolve().parents[2]  # .../backend
NODE_BIN = BACKEND_ROOT / "node_modules" / ".bin"


def _get_ace_executable() -> Path:
    """
    Resolve the DAISY Ace CLI binary:
    - Windows: node_modules/.bin/ace.cmd
    - Linux/Mac: node_modules/.bin/ace
    """
    if os.name == "nt":
        ace = NODE_BIN / "ace.cmd"
    else:
        ace = NODE_BIN / "ace"

    if not ace.exists():
        raise HTTPException(
            status_code=500,
            detail=(
                f"[QC] Ace CLI not found at {ace}. "
                "Run `npm install @daisy/ace --save-dev` in the backend folder."
            ),
        )
    return ace


def _summarize_ace_report(report: dict) -> dict:
    """
    Defensive summary parser:
    tries to count errors / warnings / passes from the Ace JSON.
    If structure is unexpected, returns zeros (but raw_report is still available).
    """
    errors = 0
    warnings = 0
    passes = 0

    try:
        assertions = (
            report.get("assertions")
            or report.get("earl:assertions")
            or []
        )

        for a in assertions:
            result = a.get("result") or a.get("earl:result") or {}
            outcome = (
                result.get("outcome")
                or result.get("earl:outcome")
                or ""
            )
            outcome = str(outcome).lower()

            if "fail" in outcome or "error" in outcome:
                errors += 1
            elif "warn" in outcome:
                warnings += 1
            elif "pass" in outcome:
                passes += 1

    except Exception as e:
        print("[qc_service] _summarize_ace_report failed:", e)

    return {"errors": errors, "warnings": warnings, "passes": passes}


def run_daisy_ace(epub_bytes: bytes, filename: str) -> dict:
    """
    Run DAISY Ace on the given EPUB bytes.

    Returns:
      {
        "summary": { "errors": int, "warnings": int, "passes": int },
        "raw_report": { ...full Ace JSON... },
        "html_report": "<!doctype html>....",          # NEW
        "report_zip_b64": "<base64 of zip>",
        "report_filename": "book-ace-report.zip"
      }
    """
    ace_exe = _get_ace_executable()

    with tempfile.TemporaryDirectory() as tmpdir:
        job_dir = Path(tmpdir)
        epub_path = job_dir / filename
        epub_path.write_bytes(epub_bytes)

        outdir = job_dir / "ace-report"
        outdir.mkdir(parents=True, exist_ok=True)

        cmd = [
            str(ace_exe),
            str(epub_path),
            "--outdir",
            str(outdir),
            "--silent",
        ]

        print("[qc_service] Running Ace CLI:", " ".join(cmd))
        proc = subprocess.run(
            cmd,
            cwd=str(job_dir),
            capture_output=True,
            text=True,
        )

        # Ace sometimes exits rc=1 with a winston.logAndWaitFinish error
        # *after* writing the reports. Treat that as a warning; only fail if
        # no JSON report exists.
        if proc.returncode != 0:
            print(
                "[qc_service] WARNING: Ace CLI returned non-zero exit code:",
                proc.returncode,
            )
            print("[qc_service] stdout:\n", proc.stdout)
            print("[qc_service] stderr:\n", proc.stderr)

        # --- JSON report ---
        json_path = None
        for cand in outdir.glob("*.json"):
            json_path = cand
            if cand.name.startswith("report"):
                break

        if json_path is None:
            detail = (
                "Ace QC failed: JSON report not found. "
                f"Exit code={proc.returncode}. "
                f"stdout: {proc.stdout}\n\nstderr: {proc.stderr}"
            )
            print("[qc_service] ERROR:", detail)
            raise HTTPException(status_code=500, detail=detail)

        print("[qc_service] Using report JSON:", json_path)
        report = json.loads(json_path.read_text(encoding="utf-8"))
        summary = _summarize_ace_report(report)

        # --- HTML report (for inline view in UI) ---
        html_path = None
        for cand in outdir.glob("*.html"):
            html_path = cand
            if cand.name.startswith("report"):
                break

        html_report = ""
        if html_path is not None:
            try:
                html_report = html_path.read_text(encoding="utf-8")
                print("[qc_service] Using HTML report:", html_path)
            except Exception as e:
                print("[qc_service] Failed to read HTML report:", e)

        # --- Zip the entire Ace report directory for download ---
        zip_base = job_dir / "ace-report"
        shutil.make_archive(str(zip_base), "zip", root_dir=outdir)
        zip_path = zip_base.with_suffix(".zip")
        zip_bytes = zip_path.read_bytes()
        zip_b64 = base64.b64encode(zip_bytes).decode("ascii")

        return {
            "summary": summary,
            "raw_report": report,
            "html_report": html_report,  # NEW
            "report_zip_b64": zip_b64,
            "report_filename": f"{epub_path.stem}-ace-report.zip",
        }
