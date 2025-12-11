# backend/app/services/qc_service.py
import os
import json
import base64
import shutil
import tempfile
import subprocess
from pathlib import Path
from zipfile import ZipFile, BadZipFile

from fastapi import HTTPException

# Backend root (where node_modules lives)
BACKEND_ROOT = Path(__file__).resolve().parents[2]  # .../backend
NODE_BIN = BACKEND_ROOT / "node_modules" / ".bin"

# Uploads folder (used by convert endpoint to save uploaded EPUBs)
UPLOADS_DIR = BACKEND_ROOT / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


def _get_ace_executable() -> Path:
    if os.name == "nt":
        ace = NODE_BIN / "ace.cmd"
    else:
        ace = NODE_BIN / "ace"

    if not ace.exists():
        raise HTTPException(
            status_code=500,
            detail=f"[QC] Ace CLI not found at {ace}. Run `npm install @daisy/ace --save-dev` in the backend folder.",
        )
    return ace


def _summarize_ace_report(report: dict) -> dict:
    errors = 0
    warnings = 0
    passes = 0

    try:
        assertions = report.get("assertions") or report.get("earl:assertions") or []
        for a in assertions:
            result = a.get("result") or a.get("earl:result") or {}
            outcome = (result.get("outcome") or result.get("earl:outcome") or "").lower()
            if "fail" in outcome or "error" in outcome:
                errors += 1
            elif "warn" in outcome:
                warnings += 1
            elif "pass" in outcome:
                passes += 1
    except Exception:
        # keep safe: return 0 counts on error
        pass

    return {"errors": errors, "warnings": warnings, "passes": passes}


def run_daisy_ace(epub_bytes: bytes, filename: str) -> dict:
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

        if proc.returncode != 0:
            detail = (
                f"Ace QC failed: Ace CLI failed (rc={proc.returncode}). "
                f"stdout: {proc.stdout}\n\nstderr: {proc.stderr}"
            )
            print("[qc_service] ERROR:", detail)
            raise HTTPException(status_code=500, detail=detail)

        # Find JSON report inside outdir.
        json_path = None
        for cand in outdir.glob("*.json"):
            json_path = cand
            if cand.name.startswith("report"):
                break

        if json_path is None:
            raise HTTPException(
                status_code=500,
                detail="[QC] Ace JSON report not found in output directory.",
            )

        print("[qc_service] Using report JSON:", json_path)
        report = json.loads(json_path.read_text(encoding="utf-8"))
        summary = _summarize_ace_report(report)

        # Zip the entire Ace report directory so user can download original report
        zip_base = job_dir / "ace-report"
        shutil.make_archive(str(zip_base), "zip", root_dir=outdir)
        zip_path = zip_base.with_suffix(".zip")
        zip_bytes = zip_path.read_bytes()
        zip_b64 = base64.b64encode(zip_bytes).decode("ascii")

        return {
            "summary": summary,
            "raw_report": report,
            "report_zip_b64": zip_b64,
            "report_filename": f"{Path(filename).stem}-ace-report.zip",
        }


def extract_doc_html(epub_source, doc_path: str) -> str:
    """
    Return raw XHTML/HTML string for a document inside an EPUB.

    - epub_source may be:
      * bytes (full EPUB bytes)
      * path-like string to an EPUB file on disk

    - doc_path should be a relative path inside the EPUB ZIP, e.g. "OEBPS/nav.xhtml" or "xhtml/00_Halftitle_Page.xhtml".
      Leading slashes or backslashes are tolerated and normalized.

    Returns the file contents as text (utf-8). Raises HTTPException(400) on missing / invalid input.
    """
    if not doc_path:
        raise HTTPException(status_code=400, detail="doc_path must be provided")

    # normalize path separators and remove leading "/" or "\" if present
    normalized = doc_path.replace("\\", "/").lstrip("/")

    # get a ZipFile to read
    zf = None
    try:
        if isinstance(epub_source, (bytes, bytearray)):
            # treat as bytes
            from io import BytesIO
            zf = ZipFile(BytesIO(epub_source))
        else:
            # treat as path string / Path
            epub_path = Path(epub_source)
            if not epub_path.exists():
                raise HTTPException(status_code=400, detail=f"EPUB file not found at {epub_path}")
            zf = ZipFile(str(epub_path), "r")
    except BadZipFile:
        raise HTTPException(status_code=400, detail="Uploaded file is not a valid EPUB (bad ZIP)")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not open EPUB: {e}")

    # try common possible internal names:
    candidates = [normalized, normalized.lstrip("/"), f"OEBPS/{normalized}", f"./{normalized}"]
    # also try doc path with and without a leading "OEBPS/" or "OPS/"
    # (many EPUBs are packaged differently)
    if not normalized.startswith("OEBPS/"):
        candidates.extend([f"OEBPS/{normalized}", f"OPS/{normalized}"])
    if not normalized.startswith("xhtml/") and "xhtml/" in normalized:
        candidates.append(normalized.split("xhtml/", 1)[-1])

    # remove duplicates while preserving order
    seen = set()
    try:
        for cand in candidates:
            cand = cand.replace("\\", "/").lstrip("./")
            if cand in seen:
                continue
            seen.add(cand)
            if cand in zf.namelist():
                with zf.open(cand) as f:
                    raw = f.read()
                    try:
                        text = raw.decode("utf-8")
                    except UnicodeDecodeError:
                        # fallback to latin-1
                        text = raw.decode("latin-1")
                    return text
    finally:
        try:
            zf.close()
        except Exception:
            pass

    # not found — helpful error
    raise HTTPException(
        status_code=400,
        detail=f"Document '{doc_path}' not found inside EPUB. Tried candidates: {list(seen)[:8]}",
    )
