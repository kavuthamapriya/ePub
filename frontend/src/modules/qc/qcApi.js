export async function callAutoFix(epubFile, accessibleHtml) {
  const form = new FormData();
  form.append("epub_file", epubFile);
  form.append("accessible_html", accessibleHtml);
  form.append("publisher", "Unknown");

  const res = await fetch("/api/autofix", { method: "POST", body: form });
  if (!res.ok) throw new Error(await res.text());
  return await res.json(); // { fixed_html, epub_filename, epub_bytes_b64 (hex) }
}

export async function callGeneratePdf(html) {
  const res = await fetch("/api/generate_pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ html }),
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json(); // { pdf_bytes_b64, filename }
}

export async function callFinalPackage(epubHex, pdfHex, qcJson) {
  const res = await fetch("/api/final_package", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      epub_bytes_hex: epubHex,
      pdf_bytes_hex: pdfHex,
      qc_report_json: qcJson,
    }),
  });

  if (!res.ok) throw new Error(await res.text());

  // returns a downloadable file stream; we can return the blob
  const blob = await res.blob();
  return blob;
}
