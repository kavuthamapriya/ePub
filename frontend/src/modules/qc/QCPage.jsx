// src/modules/qc/QCPage.jsx
import React, { useState } from "react";
import { useConversionStore } from "../../store/useConversionStore";
import QCReport from "./QCReport";

const pageWrapper = {
  display: "flex",
  gap: 16,
  padding: 16,
  backgroundColor: "#f3f4f6",
  boxSizing: "border-box",
};

const leftPanel = {
  width: "22%",
  minWidth: 260,
  background: "#fff",
  borderRadius: 8,
  padding: 16,
  boxSizing: "border-box",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
};

const middlePanel = {
  flex: 1,
  background: "#fff",
  borderRadius: 8,
  padding: 16,
  boxSizing: "border-box",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
};

const rightPanel = {
  width: "32%",
  minWidth: 320,
  background: "#fff",
  borderRadius: 8,
  padding: 16,
  boxSizing: "border-box",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
};

export default function QCPage() {
  const { epubFile, accessibleHtml } = useConversionStore();

  const [loading, setLoading] = useState(false);
  const [qcSummary, setQcSummary] = useState(null);
  const [qcRaw, setQcRaw] = useState(null);

  const [reportZipB64, setReportZipB64] = useState(null);
  const [reportFilename, setReportFilename] = useState(null);

  const [pdfPreviewSrc, setPdfPreviewSrc] = useState(null);

  async function runQc() {
    if (!epubFile) {
      alert("Please upload an EPUB in the Convert section before running QC.");
      return;
    }

    try {
      setLoading(true);

      const form = new FormData();
      form.append("epub_file", epubFile);

      console.log("QCPage: POST http://localhost:8000/api/qc/epub");
      const res = await fetch("http://localhost:8000/api/qc/epub", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("QC failed. HTTP", res.status, text);
        alert(`QC failed. HTTP ${res.status} – see console for details.`);
        return;
      }

      const data = await res.json();
      console.log("QCPage: QC success payload:", data);

      setQcSummary(data.summary || null);
      setQcRaw(data.raw_report || null);
      setReportZipB64(data.report_zip_b64 || null);
      setReportFilename(data.report_filename || "ace-report.zip");
    } catch (err) {
      console.error("QC error:", err);
      alert("QC failed (network or JS error). See console for details.");
    } finally {
      setLoading(false);
    }
  }

  function downloadFullReport() {
    if (!reportZipB64) {
      alert("No DAISY Ace report available yet. Run QC first.");
      return;
    }

    try {
      const binary = atob(reportZipB64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = reportFilename || "ace-report.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download full report failed:", e);
      alert("Could not download DAISY Ace report. See console for details.");
    }
  }

  async function generateAccessiblePdf() {
    if (!accessibleHtml) {
      alert("No accessible HTML available. Run Convert first.");
      return;
    }

    try {
      setLoading(true);
      console.log("QCPage: POST http://localhost:8000/api/pdf/generate");
      const res = await fetch("http://localhost:8000/api/pdf/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: accessibleHtml }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Generate PDF failed. HTTP", res.status, text);
        alert(`Generate PDF failed. HTTP ${res.status} – see console.`);
        return;
      }

      const data = await res.json();
      console.log("QCPage: PDF success payload:", data);

      // 🔴 FIX HERE – use pdf_bytes_hex (not pdf_bytes_b64)
      const hex = data.pdf_bytes_hex;
      const filename = data.filename || "accessible.pdf";

      if (!hex) {
        console.error("No pdf_bytes_hex found in response:", data);
        alert("PDF generation response was missing pdf_bytes_hex.");
        return;
      }

      const bytes = new Uint8Array(hex.length / 2);
      for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
      }

      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      setPdfPreviewSrc(url);

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      // don’t revoke yet so iframe can still load it
    } catch (err) {
      console.error("Generate PDF error:", err);
      alert("Generate PDF failed (network or JS error). See console.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={pageWrapper}>
      {/* LEFT: controls */}
      <section style={leftPanel}>
        <h3>QC Controls</h3>
        <p style={{ fontSize: 13, color: "#4b5563" }}>
          Runs the DAISY Ace EPUB accessibility checker (WCAG / EPUB
          Accessibility).
        </p>

        <button
          onClick={runQc}
          disabled={loading}
          style={{
            width: "100%",
            marginTop: 8,
            padding: "10px 12px",
            borderRadius: 6,
            border: "none",
            backgroundColor: loading ? "#9ca3af" : "#16a34a",
            color: "#fff",
            fontWeight: 600,
            cursor: loading ? "default" : "pointer",
          }}
        >
          {loading ? "Running QC..." : "Run QC on current EPUB"}
        </button>

        <hr style={{ margin: "16px 0" }} />

        <button
          onClick={downloadFullReport}
          disabled={!reportZipB64}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 6,
            border: "none",
            backgroundColor: reportZipB64 ? "#2563eb" : "#9ca3af",
            color: "#fff",
            fontWeight: 600,
            cursor: reportZipB64 ? "pointer" : "default",
          }}
        >
          Download full DAISY Ace report
        </button>

        <hr style={{ margin: "16px 0" }} />

        <button
          onClick={generateAccessiblePdf}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 6,
            border: "none",
            backgroundColor: "#111827",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Generate Accessible PDF
        </button>
      </section>

      {/* MIDDLE: QC summary + issues */}
      <section style={middlePanel}>
        <QCReport summary={qcSummary} rawReport={qcRaw} />
      </section>

      {/* RIGHT: PDF preview */}
      <section style={rightPanel}>
        <h3>Accessible PDF Preview</h3>
        <p style={{ fontSize: 13, color: "#4b5563" }}>
          Generate the accessible PDF after QC to preview it here.
        </p>
        <div
          style={{
            marginTop: 8,
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            height: 480,
            overflow: "hidden",
            background: "#f9fafb",
          }}
        >
          {pdfPreviewSrc ? (
            <iframe
              title="Accessible PDF"
              src={pdfPreviewSrc}
              style={{
                width: "100%",
                height: "100%",
                border: "none",
              }}
            />
          ) : (
            <div
              style={{
                padding: 16,
                color: "#6b7280",
                fontSize: 13,
              }}
            >
              No PDF generated yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}