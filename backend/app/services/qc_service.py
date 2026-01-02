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
    try:
        zin = zipfile.ZipFile(io.BytesIO(epub_bytes), "r")
    except zipfile.BadZipFile:
        raise HTTPException(400, "Invalid EPUB")

    names = zin.namelist()
    target = None

    for cand in _normalize_candidates_from_path(doc_path):
        if cand in names:
            target = cand
            break

    if not target:
        raise HTTPException(404, "Target file not found in EPUB")

    out = io.BytesIO()
    with zipfile.ZipFile(out, "w", ZIP_DEFLATED) as zout:
        for name in names:
            if name != target:
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

    assertions = report.get("assertions") or report.get("earl:assertions") or []

    for a in assertions:
        rule = (
            a.get("assertionId")
            or a.get("id")
            or a.get("earl:test", {}).get("@id")
            or a.get("earl:test", {}).get("title")
            or "Document-level check"
        )

        message = (
            a.get("description")
            or a.get("title")
            or "Accessibility requirement failed"
        )

        result = a.get("result") or a.get("earl:result") or {}
        outcome = str(
            result.get("outcome") or result.get("earl:outcome") or ""
        ).lower()

        pointers = (
            result.get("pointer", {})
            or result.get("earl:pointer", {})
        ).get("group", [])

        # FILE-LEVEL ISSUES
        if pointers:
            for p in pointers:
                item = {
                    "rule": rule,
                    "message": message,
                    "file": p.get("path") or p.get("ptr:path"),
                    "html": p.get("expression") or p.get("ptr:expression"),
                }

                if "fail" in outcome:
                    issues["errors"].append(item)
                elif "warn" in outcome:
                    issues["warnings"].append(item)
            continue

        # DOCUMENT-LEVEL ISSUE (OPF)
        item = {
            "rule": rule,
            "message": message,
            "file": "content.opf",
            "html": None,
        }

        if "fail" in outcome:
            issues["errors"].append(item)
        elif "warn" in outcome:
            issues["warnings"].append(item)

    return issues



# =========================================================
# Run Daisy Ace (FINAL)
# =========================================================
def run_daisy_ace(epub_bytes: bytes, filename: str):
    ace = _get_ace_executable()

    #  cache EPUB for doc_html
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
