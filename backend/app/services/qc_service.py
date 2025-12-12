# backend/app/services/qc_service.py
import os
import json
import base64
import shutil
import tempfile
import subprocess
from pathlib import Path
from zipfile import ZipFile, BadZipFile, ZIP_DEFLATED

from fastapi import HTTPException
import io
import zipfile
from pathlib import PurePosixPath

# -------------------------
# Existing helper: normalise candidates
# -------------------------
def _normalize_candidates_from_path(requested: str):
    """
    Given a requested path (possibly a URL, a fragment, or a bare filename),
    return an ordered list of candidate names to try inside an EPUB ZIP.
    """
    if not requested:
        return []

    s = requested.strip()
    # remove scheme+host
    if s.startswith("http://") or s.startswith("https://"):
        try:
            s = s.split("://", 1)[1]
            s = s.split("/", 1)[1] if "/" in s else s
        except Exception:
            pass
    # strip query/fragment
    if "?" in s:
        s = s.split("?", 1)[0]
    if "#" in s:
        s = s.split("#", 1)[0]
    s = s.lstrip("./").lstrip("/")

    candidates = []
    if s:
        candidates.append(s)

    if not s.lower().startswith("oebps/"):
        candidates.append("OEBPS/" + s)
        candidates.append("oebps/" + s)

    if not s.lower().startswith("xhtml/") and s:
        candidates.append("xhtml/" + s)

    try:
        basename = PurePosixPath(s).name
        if basename and basename not in candidates:
            candidates.append(basename)
    except Exception:
        pass

    lower = s.lower()
    if lower != s and lower not in candidates:
        candidates.append(lower)

    if " " in s:
        candidates.append(s.replace(" ", "_"))

    seen = set()
    filtered = []
    for c in candidates:
        if not c:
            continue
        if c in seen:
            continue
        seen.add(c)
        filtered.append(c)
    return filtered

# -------------------------
# Extract doc html (existing)
# -------------------------
def extract_doc_html(epub_bytes: bytes, doc_path: str) -> str | None:
    """
    Extract a single HTML/XHTML file from an EPUB archive (bytes).
    Returns decoded text or None.
    """
    if epub_bytes is None or doc_path is None:
        return None

    try:
        zf = zipfile.ZipFile(io.BytesIO(epub_bytes))
    except zipfile.BadZipFile:
        return None

    all_names = zf.namelist()
    candidates = _normalize_candidates_from_path(doc_path)

    for cand in candidates:
        if cand in all_names:
            try:
                raw = zf.read(cand)
            except Exception:
                continue
            for enc in ("utf-8", "utf-8-sig", "latin-1"):
                try:
                    return raw.decode(enc)
                except Exception:
                    continue
            return raw.decode(errors="ignore")

    for cand in candidates:
        for name in all_names:
            if name.endswith("/" + cand) or name.endswith(cand):
                try:
                    raw = zf.read(name)
                except Exception:
                    continue
                for enc in ("utf-8", "utf-8-sig", "latin-1"):
                    try:
                        return raw.decode(enc)
                    except Exception:
                        continue
                return raw.decode(errors="ignore")

    return None

# -------------------------
# New: write_doc_into_epub()
# -------------------------
def write_doc_into_epub(epub_bytes: bytes, doc_path: str, new_html: str) -> bytes:
    """
    Return a new EPUB (bytes) where the entry corresponding to doc_path is replaced
    with new_html. Tries a set of path candidates inside the EPUB. If an exact
    match is not found, it will add the doc_path (normalized) as a new file.
    """
    if epub_bytes is None or doc_path is None or new_html is None:
        raise HTTPException(status_code=400, detail="Missing parameters for write_doc_into_epub")

    # Normalize doc path
    normalized = doc_path.replace("\\", "/").lstrip("/")

    try:
        in_zf = zipfile.ZipFile(io.BytesIO(epub_bytes), "r")
    except zipfile.BadZipFile:
        raise HTTPException(status_code=400, detail="Provided EPUB is not a valid ZIP/EPUB file")

    all_names = in_zf.namelist()
    candidates = _normalize_candidates_from_path(normalized)

    # Determine which name to replace (exact first, then endswith matches)
    target_name = None
    for cand in candidates:
        if cand in all_names:
            target_name = cand
            break

    if not target_name:
        # Attempt endswith search
        for cand in candidates:
            for name in all_names:
                if name.endswith("/" + cand) or name.endswith(cand):
                    target_name = name
                    break
            if target_name:
                break

    # If still not found, we'll write a best-effort path (use 'normalized' or 'xhtml/normalized')
    if not target_name:
        if normalized in all_names:
            target_name = normalized
        else:
            # try OEBPS/normalized or xhtml/normalized
            trial = normalized
            if not trial.lower().startswith("oebps/"):
                trial = f"OEBPS/{normalized}"
                if trial not in all_names:
                    trial = f"xhtml/{normalized}"
            target_name = trial

    # Build a new zip in memory, copying everything except target entry
    out_io = io.BytesIO()
    with zipfile.ZipFile(out_io, "w", compression=ZIP_DEFLATED) as out_zf:
        for name in all_names:
            if name == target_name:
                # skip original entry; we'll write replacement below
                continue
            # copy original file bytes preserving attributes minimally
            try:
                data = in_zf.read(name)
                out_zf.writestr(name, data)
            except Exception:
                # best effort: skip unreadable file
                continue

        # write the replacement entry (create directories implicitly)
        # ensure target_name does not start with './'
        to_write_name = target_name.lstrip("./")
        if to_write_name.endswith("/"):
            # improbable but guard: append 'index.xhtml'
            to_write_name = to_write_name + "index.xhtml"
        # ensure bytes
        write_bytes = new_html.encode("utf-8")
        out_zf.writestr(to_write_name, write_bytes)

    try:
        in_zf.close()
    except Exception:
        pass

    return out_io.getvalue()

# -------------------------
# Rest of previous code: ACE runner (unchanged)
# -------------------------
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

# Exports (functions that routes import)
# Note: Python modules export everything, but these are the main helpers used by routes.
__all__ = [
    "extract_doc_html",
    "write_doc_into_epub",
    "run_daisy_ace",
]
