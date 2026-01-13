# backend/app/services/qc_service.py
import os
import json
import base64
import shutil
import tempfile
import subprocess
import io
import zipfile
from pathlib import Path, PurePosixPath
from zipfile import ZIP_DEFLATED
from fastapi import HTTPException
from app.services.workspace_service import get_workspace_path
from app.services.qc_runner import run_qc_on_folder


# =========================================================
# 🔥 GLOBAL CACHE: last QC EPUB (single-user dev safe)
# =========================================================
_LAST_QC_EPUB = {
    "bytes": None,
    "filename": None,
}

# =========================================================
# Helpers: normalize EPUB paths
# =========================================================
def _normalize_candidates_from_path(requested: str):
    if not requested:
        return []

    s = requested.strip()
    s = s.split("?", 1)[0].split("#", 1)[0]
    s = s.lstrip("./").lstrip("/")

    candidates = [s]

    if not s.lower().startswith(("oebps/", "ops/", "epub/")):
        candidates += [f"OEBPS/{s}", f"OPS/{s}", f"EPUB/{s}"]

    try:
        base = PurePosixPath(s).name
        if base not in candidates:
            candidates.append(base)
    except Exception:
        pass

    seen, out = set(), []
    for c in candidates:
        if c and c not in seen:
            seen.add(c)
            out.append(c)

    return out


# =========================================================
# Extract file from EPUB
# =========================================================
def extract_doc_html(epub_bytes: bytes, doc_path: str) -> str | None:
    try:
        zf = zipfile.ZipFile(io.BytesIO(epub_bytes))
    except zipfile.BadZipFile:
        return None

    names = zf.namelist()

    for cand in _normalize_candidates_from_path(doc_path):
        if cand in names:
            return zf.read(cand).decode("utf-8", errors="ignore")

    for cand in _normalize_candidates_from_path(doc_path):
        for name in names:
            if name.endswith("/" + cand) or name.endswith(cand):
                return zf.read(name).decode("utf-8", errors="ignore")

    return None


# =========================================================
# Write XHTML back into EPUB
# =========================================================
def write_doc_into_epub(epub_bytes: bytes, doc_path: str, new_html: str) -> bytes:
    if not epub_bytes or not doc_path:
        raise HTTPException(status_code=400, detail="Missing parameters")

    normalized = doc_path.replace("\\", "/").lstrip("/")

    try:
        zin = zipfile.ZipFile(io.BytesIO(epub_bytes), "r")
    except zipfile.BadZipFile:
        raise HTTPException(status_code=400, detail="Invalid EPUB")

    names = zin.namelist()
    candidates = _normalize_candidates_from_path(normalized)

    target = None

    # 1️⃣ Exact match
    for cand in candidates:
        if cand in names:
            target = cand
            break

    # 2️⃣ Endswith fallback
    if not target:
        for name in names:
            for cand in candidates:
                if name.lower().endswith(cand.lower()):
                    target = name
                    break
            if target:
                break

    # 3️⃣ FINAL OPF fallback (🔥 THIS FIXES YOUR ISSUE)
    if not target and normalized == "content.opf":
        for name in names:
            if name.lower().endswith(".opf"):
                target = name
                break

    if not target:
        raise HTTPException(
            status_code=404,
            detail=f"Target file '{doc_path}' not found in EPUB"
        )

    out = io.BytesIO()
    with zipfile.ZipFile(out, "w", ZIP_DEFLATED) as zout:
        for name in names:
            if name == target:
                continue
            zout.writestr(name, zin.read(name))

        zout.writestr(target, new_html.encode("utf-8"))

    return out.getvalue()


# =========================================================
# Daisy ACE runner
# =========================================================
BACKEND_ROOT = Path(__file__).resolve().parents[2]
NODE_BIN = BACKEND_ROOT / "node_modules" / ".bin"

def _get_ace_executable():
    ace = NODE_BIN / ("ace.cmd" if os.name == "nt" else "ace")
    if not ace.exists():
        raise HTTPException(
            500,
            "Ace CLI not found. Run: npm install @daisy/ace --save-dev",
        )
    return ace


# =========================================================
# Summary (EARL-correct)
# =========================================================
def _summarize_ace_report(report: dict):
    errors = warnings = passes = 0
    assertions = report.get("assertions") or report.get("earl:assertions") or []

    for a in assertions:
        result = a.get("result") or a.get("earl:result") or {}
        outcome = str(
            result.get("outcome") or result.get("earl:outcome") or ""
        ).lower()

        if "fail" in outcome:
            errors += 1
        elif "warn" in outcome:
            warnings += 1
        elif "pass" in outcome:
            passes += 1

    return {"errors": errors, "warnings": warnings, "passes": passes}


# =========================================================
# Parse REAL Ace issues (file + document)
# =========================================================
def _parse_ace_issues(report: dict):
    issues = {
        "errors": [],
        "warnings": [],
    }

    top_assertions = report.get("assertions") or report.get("earl:assertions") or []

    for a in top_assertions:
        subject = a.get("earl:testSubject", {})
        file_url = subject.get("url")
        if file_url:
            file_url = file_url.replace("\\", "/").lstrip("/")

        nested_assertions = a.get("assertions") or []

        # --------------------------------------------------
        # CASE 1: File-level issues (nested assertions exist)
        # --------------------------------------------------
        if nested_assertions and file_url:
            for na in nested_assertions:
                result = na.get("earl:result", {})
                outcome = str(result.get("earl:outcome", "")).lower()

                rule = (
                    na.get("earl:test", {}).get("dct:title")
                    or "Accessibility rule"
                )

                message = (
                    result.get("dct:description")
                    or na.get("earl:test", {}).get("dct:description")
                    or ""
                )

                item = {
                    "rule": rule,
                    "message": message,
                    "file": file_url,
                    "html": na.get("html"),
                }

                if "fail" in outcome:
                    issues["errors"].append(item)
                elif "warn" in outcome:
                    issues["warnings"].append(item)

            continue

        # --------------------------------------------------
        # CASE 2: TRUE document-level failure (rare)
        # --------------------------------------------------
        result = a.get("earl:result", {})
        outcome = str(result.get("earl:outcome", "")).lower()

        if "fail" in outcome:
            issues["errors"].append({
                "rule": "Document-level check",
                "message": "Document-level accessibility requirement failed",
                "file": "content.opf",
                "html": None,
            })

    return issues



# =========================================================
# Run Daisy Ace (FINAL)
# =========================================================
def run_daisy_ace(epub_bytes: bytes, filename: str):
    ace = _get_ace_executable()

    # cache EPUB for doc_html
    _LAST_QC_EPUB["bytes"] = epub_bytes
    _LAST_QC_EPUB["filename"] = filename

    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        epub_path = tmp / filename
        epub_path.write_bytes(epub_bytes)

        outdir = tmp / "ace-report"
        outdir.mkdir()

        subprocess.run(
            [str(ace), str(epub_path), "--outdir", str(outdir), "--silent"],
            check=True,
            capture_output=True,
            text=True,
        )

        json_report = next(outdir.glob("*.json"), None)
        if not json_report:
            raise HTTPException(500, "Ace report.json missing")

        report = json.loads(json_report.read_text(encoding="utf-8"))

        # ================= DEBUG: PRINT RAW ASSERTIONS =================
        print("\n========== ACE ASSERTIONS ==========")
        for a in report.get("assertions", []) or report.get("earl:assertions", []):
            print(json.dumps(a, indent=2))
        print("========== END ASSERTIONS ==========\n")
        # ===============================================================

        summary = _summarize_ace_report(report)
        issues = _parse_ace_issues(report)

        shutil.make_archive(str(outdir), "zip", outdir)
        zip_bytes = (outdir.with_suffix(".zip")).read_bytes()

        return {
            "summary": summary,
            "issues": issues,
            "raw_report": report,
            "report_zip_b64": base64.b64encode(zip_bytes).decode("ascii"),
            "report_filename": f"{Path(filename).stem}-ace-report.zip",
        }
def run_qc(book_id: str):
    """
    Run QC on current WORKSPACE (draft state)
    """
    workspace_path = get_workspace_path(book_id)

    if not workspace_path.exists():
        raise RuntimeError("Workspace not found")

    return run_qc_on_folder(workspace_path)
