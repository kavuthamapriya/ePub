// src/modules/qc/QCPage.jsx
import React, { useState } from "react";
import JSZip from "jszip";
import { useConversionStore } from "../../store/useConversionStore";

/* ---------------- Styles ---------------- */

const pageWrapper = {
  display: "grid",
  gridTemplateColumns: "260px 1fr 1fr",
  gap: 16,
  padding: 16,
  backgroundColor: "#f3f4f6",
  height: "calc(100vh - 72px)",
  boxSizing: "border-box",
};

const panel = {
  background: "#fff",
  borderRadius: 12,
  padding: 16,
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

const title = { fontSize: 16, fontWeight: 700, marginBottom: 8 };
const subtitle = { fontSize: 13, color: "#6b7280", marginBottom: 12 };

const button = (enabled) => ({
  padding: "10px 14px",
  borderRadius: 8,
  border: "none",
  background: enabled ? "#2563eb" : "#9ca3af",
  color: "#fff",
  fontWeight: 600,
  cursor: enabled ? "pointer" : "not-allowed",
});

/* ---------------- Component ---------------- */

export default function QCPage() {
  const { epubFile } = useConversionStore();

  const [loading, setLoading] = useState(false);
  const [reportHtml, setReportHtml] = useState(null);

  /* ------------------------------------------------
     SINGLE BUTTON:
     Run QC → Download ZIP → Preview report.html
  -------------------------------------------------- */
  async function handleDownloadAndPreview() {
  if (!epubFile) {
    alert("Please upload an EPUB first.");
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

    const base64 = data.report_zip_b64;
    if (!base64) {
      throw new Error("No report ZIP returned");
    }

    /* ---------- Download ZIP ---------- */
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    const zipBlob = new Blob([bytes], { type: "application/zip" });

    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = data.report_filename || "daisy-ace-report.zip";
    a.click();
    URL.revokeObjectURL(url);

    /* ---------- Extract report.html ---------- */
    const zip = await JSZip.loadAsync(bytes);

    const htmlFile =
      zip.file("report.html") ||
      zip.file("index.html") ||
      Object.values(zip.files).find(f => f.name.endsWith(".html"));

    if (!htmlFile) {
      throw new Error("No report.html found in ZIP");
    }

    const html = await htmlFile.async("string");
    setReportHtml(html);

  } catch (err) {
    console.error(err);
    alert("Failed to run QC or load report. Check console.");
  } finally {
    setLoading(false);
  }
}

  return (
    <div style={pageWrapper}>
      {/* ---------- LEFT: QC CONTROLS ---------- */}
      <section style={panel}>
        <div style={title}>QC Controls</div>

        <button
          onClick={handleDownloadAndPreview}
          disabled={!epubFile || loading}
          style={button(!!epubFile && !loading)}
        >
          {loading ? "Running QC…" : "Download DAISY Ace Report"}
        </button>
      </section>

      {/* ---------- MIDDLE: DAISY HTML REPORT ---------- */}
      <section style={panel}>
        <div style={title}>DAISY Ace HTML Report</div>
        <div style={subtitle}>
          Read-only accessibility report (scrollable).
        </div>

        <div
          style={{
            flex: 1,
            overflow: "hidden",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
          }}
        >
          {reportHtml ? (
            <iframe
              title="DAISY Ace Report"
              srcDoc={reportHtml}
              style={{
                width: "100%",
                height: "100%",
                border: "none",
              }}
            />
          ) : (
            <div style={{ padding: 12, color: "#6b7280", fontSize: 13 }}>
              Click “Download DAISY Ace Report” to run QC and preview the report.
            </div>
          )}
        </div>
      </section>

      {/* ---------- RIGHT: ACCESSIBLE EPUB PREVIEW ---------- */}
      <section style={panel}>
        <div style={title}>Accessible EPUB Preview</div>
        <div style={subtitle}>
          Preview of the converted accessible EPUB.
        </div>

        <div
          style={{
            flex: 1,
            overflow: "auto",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            padding: 12,
            color: "#6b7280",
          }}
        >
          {/* Later: plug EPUBViewer here */}
          EPUB preview component goes here.
        </div>
      </section>
    </div>
  );
}
