// src/modules/qc/QCPage.jsx
import React, { useState } from "react";
import { useConversionStore } from "../../store/useConversionStore";
import QCReport from "./QCReport";

const API_BASE = "http://localhost:8000/api";

const pageWrapper = {
  display: "flex",
  gap: 16,
  padding: 16,
  backgroundColor: "#f3f4f6",
  boxSizing: "border-box",
  minHeight: "calc(100vh - 88px)",
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
  display: "flex",
  flexDirection: "column",
};

export default function QCPage() {
  const { epubFile } = useConversionStore();

  const [loading, setLoading] = useState(false);
  const [qcSummary, setQcSummary] = useState(null);
  const [qcRaw, setQcRaw] = useState(null);

  const [reportZipB64, setReportZipB64] = useState(null);
  const [reportFilename, setReportFilename] = useState(null);
  const [reportHtml, setReportHtml] = useState("");

  async function runQc() {
    if (!epubFile) {
      alert("Please upload an EPUB (in Convert tab) before running QC.");
      return;
    }

    try {
      setLoading(true);

      const form = new FormData();
      form.append("epub_file", epubFile);

      console.log("QCPage: POST", `${API_BASE}/qc/epub`);
      const res = await fetch(`${API_BASE}/qc/epub`, {
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

      // 🔴 IMPORTANT: backend returns "html_report", not "report_html"
      setReportHtml(
        data.html_report || data.report_html || "" // support either name
      );
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

  return (
    <div style={pageWrapper}>
      {/* LEFT: controls */}
      <section style={leftPanel}>
        <h3>QC Controls</h3>
        <p style={{ fontSize: 13, color: "#4b5563" }}>
          Runs the DAISY Ace EPUB accessibility checker (WCAG / EPUB
          Accessibility) on the uploaded EPUB.
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

        <p style={{ fontSize: 12, color: "#6b7280" }}>
          To actually fix issues you will edit the XHTML in your EPUB and rerun
          QC. The Issue Inspector on the right only shows the HTML in your
          browser.
        </p>
      </section>

      {/* MIDDLE: summary + issues + HTML report + inspector */}
      <section style={middlePanel}>
        <QCReport summary={qcSummary} rawReport={qcRaw} reportHtml={reportHtml} />
      </section>
    </div>
  );
}
