# backend/app/services/qc_runner.py

import zipfile
import io
from pathlib import Path

from app.services.qc_engine import run_daisy_ace


def run_qc_on_folder(workspace_path: Path):
    """
    Build EPUB from WORKSPACE and run QC engine
    """

    if not workspace_path.exists():
        raise RuntimeError("Workspace path does not exist")

    epub_bytes = _build_epub_from_workspace(workspace_path)
    return run_daisy_ace(epub_bytes, f"{workspace_path.name}.epub")


def _build_epub_from_workspace(workspace_path: Path) -> bytes:
    buf = io.BytesIO()

    with zipfile.ZipFile(buf, "w") as zf:
        mimetype = workspace_path / "mimetype"
        if not mimetype.exists():
            raise RuntimeError("Workspace missing mimetype")

        # mimetype first
        zf.write(
            mimetype,
            arcname="mimetype",
            compress_type=zipfile.ZIP_STORED,
        )

        for file in workspace_path.rglob("*"):
            if file.is_file() and file.name != "mimetype":
                zf.write(
                    file,
                    arcname=file.relative_to(workspace_path),
                    compress_type=zipfile.ZIP_DEFLATED,
                )

    return buf.getvalue()
