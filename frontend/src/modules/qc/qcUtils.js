// frontend/src/modules/qc/qcUtils.js
export async function runAceQC(epubFile) {
  if (!epubFile) {
    throw new Error("No EPUB file provided to QC");
  }

  const form = new FormData();
  form.append("epub_file", epubFile);

  const res = await fetch("/api/qc/epub", {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`QC failed: HTTP ${res.status} – ${text}`);
  }

  return await res.json(); // { raw_report, error_count, warning_count, notice_count }
}
