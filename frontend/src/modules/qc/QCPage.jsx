// src/modules/qc/QCPage.jsx
import React, { useEffect, useState } from "react";
import JSZip from "jszip";
import { useConversionStore } from "../../store/useConversionStore";
import { useQCStore } from "../../store/useQCStore";

/* ---------------- Styles ---------------- */

const pageWrapper = {
  display: "grid",
  gridTemplateColumns: "260px 1fr",
  gap: 16,
  padding: 16,
  backgroundColor: "#f3f4f6",
  height: "calc(100vh - 72px)",
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
  const { reportZipB64 } = useQCStore();

  const [loading, setLoading] = useState(false);
  const [reportHtml, setReportHtml] = useState(null);

  /* --------------------------------
     LOAD REPORT FROM STORE (AUTO + RERUN)
  --------------------------------- */
  useEffect(() => {
    if (!reportZipB64) return;

    async function loadReport() {
      setReportHtml(null);

      const binary = atob(reportZipB64);
      const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      const zip = await JSZip.loadAsync(bytes);

      const htmlFile =
        zip.file("report.html") ||
        zip.file("index.html") ||
        Object.values(zip.files).find((f) => f.name.endsWith(".html"));

      if (!htmlFile) return;

      const html = await htmlFile.async("string");
      setReportHtml(html);
    }

    loadReport();
  }, [reportZipB64]);

  /* --------------------------------
     MANUAL DOWNLOAD + PREVIEW
  --------------------------------- */
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

      if (!res.ok) throw new Error("QC failed");

      const data = await res.json();

      // 🔥 Store report globally (used by rerun too)
      if (data.report_zip_b64) {
        useQCStore.setState({ reportZipB64: data.report_zip_b64 });
      }

      // Download ZIP
      const bytes = Uint8Array.from(
        atob(data.report_zip_b64),
        (c) => c.charCodeAt(0)
      );
      const zipBlob = new Blob([bytes], { type: "application/zip" });

      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.report_filename || "daisy-ace-report.zip";
      a.click();
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error(err);
      alert("Failed to run QC or load report.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={pageWrapper}>
      {/* LEFT: CONTROLS */}
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

      {/* RIGHT: REPORT */}
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
              key={Date.now()} // 🔥 force refresh
              title="DAISY Ace Report"
              srcDoc={reportHtml}
              style={{ width: "100%", height: "100%", border: "none" }}
            />
          ) : (
            <div style={{ padding: 12, color: "#6b7280", fontSize: 13 }}>
              Click “Download DAISY Ace Report” to run QC and preview the report.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
