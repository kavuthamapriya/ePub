import React, { useState } from "react";
import JSZip from "jszip";
import { useConversionStore } from "../../store/useConversionStore";

/* -------------------- Styles -------------------- */

const pageWrapper = {
  display: "flex",
  gap: 16,
  padding: 16,
  backgroundColor: "#f3f4f6",
  boxSizing: "border-box",
  height: "calc(100vh - 72px)",
};
const panelBase = {
  background: "#ffffff",
  borderRadius: 8,
  padding: 16,
  boxSizing: "border-box",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  display: "flex",
  flexDirection: "column",
};

const leftPanel = {
  ...panelBase,
  width: "22%",
  minWidth: 260,
};
const panel = {
  background: "#ffffff",
  borderRadius: 12,
  padding: 16,
  boxShadow: "0 1px 3px rgba(15,23,42,0.08)",
  display: "flex",
  flexDirection: "column",
};

const title = { fontSize: 16, fontWeight: 700, marginBottom: 8 };
const subtitle = { fontSize: 13, color: "#6b7280", marginBottom: 12 };

const button = (enabled) => ({
  padding: "10px 12px",
  borderRadius: 8,
  border: "none",
  background: enabled ? "#2563eb" : "#9ca3af",
  color: "#fff",
  fontWeight: 600,
  cursor: enabled ? "pointer" : "not-allowed",
});

/* -------------------- Component -------------------- */

export default function QCPage() {
  const { epubFile } = useConversionStore();

  const [loading, setLoading] = useState(false);
  const [zipBase64, setZipBase64] = useState(null);
  const [reportHtml, setReportHtml] = useState(null);

  /* -------------------- Run QC -------------------- */
  async function runQc() {
    if (!epubFile) {
      alert("Upload an EPUB before running QC.");
      return;
    }

    try {
      setLoading(true);
      setReportHtml(null);

      const form = new FormData();
      form.append("epub_file", epubFile);

      const res = await fetch("http://localhost:8000/api/qc/epub", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        throw new Error(`QC failed (${res.status})`);
      }

      const data = await res.json();

      setZipBase64(data.report_zip_b64);
    } catch (err) {
      console.error(err);
      alert("QC failed. See console.");
    } finally {
      setLoading(false);
    }
  }

  /* -------------------- Download + Extract ZIP -------------------- */
  async function downloadAndDisplayReport() {
    if (!zipBase64) return;

    try {
      // Convert base64 → Uint8Array
      const binary = atob(zipBase64);
      const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));

      // Download ZIP
      const zipBlob = new Blob([bytes], { type: "application/zip" });
      const url = URL.createObjectURL(zipBlob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "daisy-ace-report.zip";
      a.click();
      URL.revokeObjectURL(url);

      // Extract report.html
      const zip = await JSZip.loadAsync(bytes);
      const htmlFile =
        zip.file("report.html") ||
        zip.file("index.html") ||
        Object.values(zip.files).find((f) => f.name.endsWith(".html"));

      if (!htmlFile) {
        alert("No HTML report found in ZIP.");
        return;
      }

      const html = await htmlFile.async("string");
      setReportHtml(html);
    } catch (e) {
      console.error(e);
      alert("Failed to extract DAISY report.");
    }
  }

  return (
    <div style={pageWrapper}>
      {/* ---------------- LEFT: CONTROLS ---------------- */}
      <section style={panel}>
        <div style={title}>QC Controls</div>

        <button
          onClick={runQc}
          disabled={loading || !epubFile}
          style={button(!!epubFile && !loading)}
        >
          {loading ? "Running QC…" : "Run QC"}
        </button>

        <div style={{ height: 12 }} />

        <button
          onClick={downloadAndDisplayReport}
          disabled={!zipBase64}
          style={button(!!zipBase64)}
        >
          Download full DAISY Ace report
        </button>
      </section>

      {/* ---------------- MIDDLE: HTML REPORT ---------------- */}
      <section style={panel}>
        <div style={title}>DAISY Ace HTML Report</div>
        <div style={subtitle}>
          Read-only DAISY Ace accessibility report.
        </div>

        <div
          style={{
            flex: 1,
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            padding: 8,
            overflow: "auto",
          }}
        >
          {reportHtml ? (
            <div dangerouslySetInnerHTML={{ __html: reportHtml }} />
          ) : (
            <div style={{ color: "#6b7280", fontSize: 13 }}>
              Run QC and download the report to view it here.
            </div>
          )}
        </div>
      </section>

      {/* ---------------- RIGHT: ACCESSIBLE EPUB PREVIEW ---------------- */}
      <section style={panel}>
        <div style={title}>Accessible EPUB Preview</div>
        <div style={subtitle}>
          Preview of the converted accessible EPUB content.
        </div>

        <div
          style={{
            flex: 1,
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            overflow: "auto",
          }}
        >
          {/* Reuse your existing EPUBViewer here */}
          {/* <EPUBViewer file={epubFile} mode="scrolled" /> */}
          <div style={{ padding: 12, color: "#6b7280" }}>
            EPUB preview component goes here.
          </div>
        </div>
      </section>
    </div>
  );
}
