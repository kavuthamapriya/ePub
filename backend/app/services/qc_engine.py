# backend/app/services/qc_engine.py

import tempfile
import subprocess
from pathlib import Path


def run_daisy_ace(epub_bytes: bytes, filename: str):
    """
    Runs DAISY ACE on given EPUB bytes.
    Returns parsed report (reuse your existing logic if any).
    """

    with tempfile.TemporaryDirectory() as tmpdir:
        tmpdir = Path(tmpdir)

        epub_path = tmpdir / filename
        epub_path.write_bytes(epub_bytes)

        report_dir = tmpdir / "report"
        report_dir.mkdir()

        # 🔥 Example ACE call (adjust if already implemented)
        cmd = [
            "ace",
            str(epub_path),
            "--outdir",
            str(report_dir),
            "--force",
        ]

        subprocess.run(cmd, check=True)

        return {
            "status": "completed",
            "report_path": str(report_dir),
        }
