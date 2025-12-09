# app/routes/pdf.py
from fastapi import APIRouter, HTTPException, Body
from pathlib import Path
import tempfile
import subprocess

router = APIRouter()


@router.post("/generate")
async def generate_pdf(payload: dict = Body(...)):
    """
    payload: { "html": "<body>...</body>" }
    returns: { "pdf_bytes_hex": "...", "filename": "accessible.pdf" }
    """
    html = payload.get("html")
    if not html:
        raise HTTPException(status_code=400, detail="No HTML provided")

    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            tmpdir_path = Path(tmpdir)
            html_file = tmpdir_path / "doc.html"
            pdf_file = tmpdir_path / "doc.pdf"

            # Wrap HTML in a basic document so browsers/Chromium render correctly
            html_file.write_text(
                f"""
                <html>
                  <head>
                    <meta charset="utf-8">
                    <style>
                      body {{
                        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                        line-height: 1.6;
                        font-size: 12pt;
                      }}
                    </style>
                  </head>
                  <body>
                    {html}
                  </body>
                </html>
                """,
                encoding="utf-8",
            )

            # Uses Playwright's chromium print command
            # Make sure `npm install playwright` and `npx playwright install chromium` have been run.
            cmd = [
                "npx",
                "playwright",
                "print",
                str(html_file),
                str(pdf_file),
            ]
            print("[pdf] Running:", " ".join(cmd))
            proc = subprocess.run(
                cmd,
                cwd=str(tmpdir_path),
                capture_output=True,
                text=True,
            )
            if proc.returncode != 0:
                detail = f"PDF generator failed (rc={proc.returncode}). stdout: {proc.stdout}\n\nstderr: {proc.stderr}"
                print("[pdf] ERROR:", detail)
                raise HTTPException(status_code=500, detail=detail)

            pdf_bytes = pdf_file.read_bytes()

            # 🔵 Standard name we're going to use from now on
            pdf_bytes_hex = pdf_bytes.hex()

            return {
                "pdf_bytes_hex": pdf_bytes_hex,
                "filename": "accessible.pdf",
            }

    except HTTPException:
        raise
    except Exception as e:
        print("[pdf] Unexpected error:", e)
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {e}")
