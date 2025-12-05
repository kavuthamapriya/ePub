import React, { useState } from "react";
import { useConversionStore } from "../../store/useConversionStore";
import { callAutoFix, callGeneratePdf, callFinalPackage } from "./qcApi";

export default function QCReview() {
  const epubFile = useConversionStore((s) => s.epubFile);
  const accessibleHtml = useConversionStore((s) => s.accessibleHtml);
  const [qcReport, setQcReport] = useState(null);
  const [fixedHtml, setFixedHtml] = useState(null);
  const [epubHex, setEpubHex] = useState(null);
  const [pdfHex, setPdfHex] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleAutoFix() {
    if (!epubFile || !accessibleHtml) return alert("Upload EPUB & convert first");
    setLoading(true);
    try {
      const res = await callAutoFix(epubFile, accessibleHtml);
      setFixedHtml(res.fixed_html);
      setEpubHex(res.epub_bytes_b64); // hex string
      alert("Auto-fix completed. Preview available.");
    } catch (e) {
      console.error(e);
      alert("Auto-fix failed: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGeneratePdf() {
    const htmlToUse = fixedHtml || accessibleHtml;
    if (!htmlToUse) return alert("No HTML available");
    setLoading(true);
    try {
      const res = await callGeneratePdf(htmlToUse);
      setPdfHex(res.pdf_bytes_b64);
      alert("PDF generated");
    } catch (e) {
      console.error(e);
      alert("PDF failed: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadPackage() {
    try {
      const blob = await callFinalPackage(epubHex, pdfHex, qcReport || {});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "accessible_package.zip";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Package failed: " + e.message);
    }
  }

  return (
    <div style={{ marginTop: 12 }}>
      <button onClick={handleAutoFix} disabled={loading}>
        {loading ? "Working..." : "Auto-Fix EPUB (AI)"}
      </button>
      <button onClick={handleGeneratePdf} style={{ marginLeft: 8 }}>
        Generate Accessible PDF
      </button>
      <button onClick={handleDownloadPackage} style={{ marginLeft: 8 }}>
        Download Final Package (EPUB + PDF + QC JSON)
      </button>

      {fixedHtml && (
        <div style={{ marginTop: 12 }}>
          <h4>Fixed HTML preview</h4>
          <div style={{ maxHeight: 300, overflow: "auto", border: "1px solid #ddd", padding: 8 }}>
            <div dangerouslySetInnerHTML={{ __html: fixedHtml }} />
          </div>
        </div>
      )}
    </div>
  );
}
