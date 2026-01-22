import React, { useEffect, useState } from "react";
import JSZip from "jszip";
import { FiDownload, FiFileText } from "react-icons/fi";
import { useConversionStore } from "../../store/useConversionStore";
import { useQCStore } from "../../store/useQCStore";

const page = {
  display: "grid",
  gridTemplateColumns: "280px 1fr",
  gap: 20,
  padding: 20,
  background: "#f3f4f6",
  height: "calc(100vh - 72px)",
};

const card = {
  background: "#ffffff",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
  display: "flex",
  flexDirection: "column",
};

const orangeButton = (enabled) => ({
  padding: "12px 16px",
  borderRadius: 10,
  border: "none",
  background: enabled
    ? "linear-gradient(135deg,#f97316,#ea580c)"
    : "#9ca3af",
  color: "#fff",
  fontWeight: 600,
  cursor: enabled ? "pointer" : "not-allowed",
  display: "flex",
  alignItems: "center",
  gap: 8,
  justifyContent: "center",
});

export default function QCPage() {
  const { epubFile } = useConversionStore();
  const { reportZipB64 } = useQCStore();

  const [loading, setLoading] = useState(false);
  const [reportHtml, setReportHtml] = useState(null);

  /* Load report */
  useEffect(() => {
    if (!reportZipB64) return;

    (async () => {
      const bytes = Uint8Array.from(atob(reportZipB64), (c) => c.charCodeAt(0));
      const zip = await JSZip.loadAsync(bytes);
      const file =
        zip.file("report.html") ||
        zip.file("index.html") ||
        Object.values(zip.files).find((f) => f.name.endsWith(".html"));

      if (file) {
        setReportHtml(await file.async("string"));
      }
    })();
  }, [reportZipB64]);

  /* Download report ZIP */
  async function handleRun() {
    if (!reportZipB64) {
      return alert("No QC report found. Run QC first.");
    }

    const bytes = Uint8Array.from(atob(reportZipB64), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: "application/zip" });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "daisy-ace-report.zip";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={page}>
      {/* LEFT CONTROLS */}
      <section style={card}>
        <h3 style={{ fontSize: 18, marginBottom: 12, display: "flex", gap: 8, alignItems: "center" }}>
          <FiFileText /> QC Controls
        </h3>

        <button
          onClick={handleRun}
          disabled={!epubFile || loading}
          style={orangeButton(!!epubFile)}
        >
          <FiDownload /> Download DAISY Ace Report
        </button>
      </section>

      {/* RIGHT REPORT */}
      <section style={card}>
        <h3 style={{ fontSize: 18, marginBottom: 6 }}>DAISY Ace Accessibility Report</h3>
        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
          Read-only WCAG compliance report
        </p>

        <div
          style={{
            flex: 1,
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          {reportHtml ? (
            <iframe
              key={reportHtml.length}
              srcDoc={reportHtml}
              title="DAISY Report"
              style={{ width: "100%", height: "100%", border: "none" }}
            />
          ) : (
            <div
              style={{
                padding: 16,
                color: "#9ca3af",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
              Run QC to preview the report
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
