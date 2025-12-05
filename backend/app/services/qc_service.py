# app/services/qc_service.py
import subprocess
import shutil
import os
import tempfile
from pathlib import Path
from fastapi import HTTPException

BACKEND_DIR = Path(__file__).resolve().parents[2]  # adjust if file placement differs

def _find_local_ace():
    # Windows: ace.cmd in node_modules\.bin
    local_cmd = BACKEND_DIR / "node_modules" / ".bin" / "ace.cmd"
    local_sh = BACKEND_DIR / "node_modules" / ".bin" / "ace"
    if local_cmd.exists():
        return str(local_cmd)
    if local_sh.exists():
        return str(local_sh)
    return None

def run_ace_on_epub(epub_path: str) -> dict:
    """
    Run DAISY ACE on epub_path and return parsed JSON.
    Raises HTTPException on failure with helpful message.
    """
    ace_path = _find_local_ace()

    # fallback to npx (works if package installed or will download temporarily)
    if not ace_path:
        # try npx presence
        if shutil.which("npx"):
            cmd = ["npx", "ace", "check", epub_path, "--format", "json"]
        else:
            raise HTTPException(status_code=500, detail=(
                "[QC] Ace CLI not found at "
                f"{(BACKEND_DIR / 'node_modules' / '.bin' / 'ace.cmd')}."
                " Run `npm install @daisy/ace --save-dev` in backend folder or install npx."
            ))
    else:
        cmd = [ace_path, "check", epub_path, "--format", "json"]

    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, cwd=str(BACKEND_DIR), timeout=120)
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=f"[QC] Ace CLI not found: {e}")
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=500, detail="[QC] Ace CLI timed out")

    if proc.returncode not in (0, 2):  # ACE returns non-zero when issues found; it's still useful
        # include stderr to help debugging
        msg = proc.stderr.strip() or proc.stdout.strip()
        raise HTTPException(status_code=500, detail=f"Ace QC failed: {msg}")

    # proc.stdout should be JSON
    raw = proc.stdout.strip()
    if not raw:
        raise HTTPException(status_code=500, detail="Ace returned empty output")

    # parse JSON safely
    import json
    try:
        report = json.loads(raw)
    except Exception as e:
        # sometimes ACE writes logs to stdout; try to extract last JSON substring
        # fallback: find first '{' and last '}' and parse
        try:
            start = raw.index("{")
            end = raw.rindex("}") + 1
            report = json.loads(raw[start:end])
        except Exception:
            raise HTTPException(status_code=500, detail=f"Ace output parsing error: {e}\nRaw output: {raw[:2000]}")

    return report
