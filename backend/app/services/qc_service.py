# app/services/qc_service.py
import os
import json
import base64
import shutil
import tempfile
import subprocess
from pathlib import Path
from zipfile import ZipFile

from fastapi import HTTPException

# Backend root (where node_modules lives)
BACKEND_ROOT = Path(__file__).resolve().parents[2]
NODE_BIN = BACKEND_ROOT / "node_modules" / ".bin"


# -----------------------------
# Ace CLI resolution
# -----------------------------
def _get_ace_executable() -> Path:
    if os.name == "nt":
        ace = NODE_BIN / "ace.cmd"
    else:
        ace = NODE_BIN / "ace"

    if not ace.exists():
        raise HTTPException(
            status_code=500,
            detail=f"Ace CLI not found at {ace}. Run `npm install @daisy/ace`.",
        )
    return ace


# -----------------------------
# Ace report summarizer
# -----------------------------
def _summarize_ace_report(report: dict) -> dict:
    errors = warnings = passes = 0

    assertions = report.get("assertions") or report.get("earl:assertions") or []

    for a in assertions:
        result = a.get("result") or a.get("earl:result") or {}
        outcome = str(
            result.get("outcome") or result.get("earl:outcome") or ""
        ).lower()

        if "fail" in outcome or "error" in outcome:
            errors += 1
        elif "warn" in outcome:
            warnings += 1
        elif "pass" in outcome:
            passes += 1

    return {"errors": errors, "warnings": warnings, "passes": passes}


# -----------------------------
# Run DAISY Ace (tolerant of winston bug)
# -----------------------------
def run_daisy_ace(epub_bytes: bytes, filename: str) -> dict:
    """
    Run DAISY Ace on the given EPUB bytes and return:
      {
        "summary": {...},
        "raw_report": {...},
        "report_zip_b64": "...",
        "report_filename": "...",
        "html_report": "<!doctype html>..."
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

        stdout = proc.stdout or ""
        stderr = proc.stderr or ""
        print("[qc_service] Ace stdout:\n", stdout)
        print("[qc_service] Ace stderr:\n", stderr)

        # Known Ace 1.3.7 + Node 20 bug:
        # "TypeError: winston.logAndWaitFinish is not a function"
        # Ace still writes the report but exits with rc=1.
        winston_bug = "winston.logAndWaitFinish is not a function" in stderr

        # Try to find JSON report regardless of rc (it might still exist)
        json_path = next(outdir.glob("*.json"), None)

        if proc.returncode != 0 and not (winston_bug and json_path):
            # Real failure: no usable report
            raise HTTPException(
                status_code=500,
                detail=(
                    f"Ace CLI failed (rc={proc.returncode}).\n\n"
                    f"stdout:\n{stdout}\n\nstderr:\n{stderr}"
                ),
            )

        if not json_path or not json_path.exists():
            raise HTTPException(
                status_code=500,
                detail="[QC] Ace JSON report not found in output directory.",
            )

        print("[qc_service] Using report JSON:", json_path)
        report = json.loads(json_path.read_text(encoding="utf-8"))
        summary = _summarize_ace_report(report)

        # Zip full report directory for download
        zip_base = job_dir / "ace-report"
        shutil.make_archive(str(zip_base), "zip", root_dir=outdir)
        zip_path = zip_base.with_suffix(".zip")
        zip_bytes = zip_path.read_bytes()
        zip_b64 = base64.b64encode(zip_bytes).decode("ascii")

        # HTML report (optional)
        html_report = ""
        html_path = outdir / "report.html"
        if html_path.exists():
            html_report = html_path.read_text(encoding="utf-8")

        return {
            "summary": summary,
            "raw_report": report,
            "report_zip_b64": zip_b64,
            "report_filename": f"{epub_path.stem}-ace-report.zip",
            "html_report": html_report,
        }


# -----------------------------
# Extract single XHTML from EPUB
# -----------------------------
def extract_doc_html(epub_bytes: bytes, doc_path: str) -> dict:
    """
    Extract a single XHTML file from an EPUB.

    doc_path example: "/OEBPS/nav.xhtml" or "OEBPS/nav.xhtml"
    """
    if not doc_path:
        raise HTTPException(status_code=400, detail="doc_path is required")

    # Normalize: strip leading slash, unify separators
    normalized = doc_path.lstrip("/").replace("\\", "/")

    with tempfile.TemporaryDirectory() as tmpdir:
        epub_file = Path(tmpdir) / "book.epub"
        epub_file.write_bytes(epub_bytes)

        from zipfile import ZipFile

        with ZipFile(epub_file, "r") as zf:
            names = zf.namelist()

            if normalized not in names:
                raise HTTPException(
                    status_code=404,
                    detail=f"Document '{normalized}' not found in EPUB.",
                )

            html_bytes = zf.read(normalized)
            html = html_bytes.decode("utf-8", errors="replace")

            return {"doc_path": normalized, "html": html}
