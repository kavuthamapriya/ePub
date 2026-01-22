import React, { useEffect, useState } from "react";
import JSZip from "jszip";
import { FiFileText } from "react-icons/fi";
import { useQCStore } from "../../store/useQCStore";
import { useConversionStore } from "../../store/useConversionStore";

const card = {
  background: "rgba(255,255,255,0.7)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  padding: "20px",
  borderRadius: "16px",
  boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
  border: "1px solid rgba(255,255,255,0.5)",
};

export default function QCPage() {
  const { reportZipB64 } = useQCStore();
  const { epubFile } = useConversionStore();

  const [reportHtml, setReportHtml] = useState(null);

  /* Load report */
  useEffect(() => {
    if (!reportZipB64) return;

    async function loadReport() {
      const bytes = Uint8Array.from(atob(reportZipB64), (c) =>
        c.charCodeAt(0)
      );
      const zip = await JSZip.loadAsync(bytes);

      const file =
        zip.file("report.html") || zip.file("index.html") ||
        Object.values(zip.files).find((f) => f.name.endsWith(".html"));

      if (file) {
        setReportHtml(await file.async("string"));
      }
    }

    loadReport();
  }, [reportZipB64]);

  /* Download zip */
  function downloadZip() {
    if (!reportZipB64) return;

    const bytes = Uint8Array.from(atob(reportZipB64), (c) =>
      c.charCodeAt(0)
    );
    const blob = new Blob([bytes], { type: "application/zip" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "daisy-ace-report.zip";
    a.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ ...card }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "16px",
        }}
      >
        <h3 style={{ margin: 0, display: "flex", gap: "8px", alignItems: "center" }}>
          <FiFileText size={20} color="#2563eb" />
          DAISY Ace Report
        </h3>

        <button
          onClick={downloadZip}
          disabled={!reportZipB64}
          style={{
            padding: "10px 16px",
            borderRadius: "10px",
            background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
            color: "#fff",
            border: "none",
            fontWeight: 600,
            cursor: reportZipB64 ? "pointer" : "not-allowed",
          }}
        >
          Download Report ZIP
        </button>
      </div>

      <div
        style={{
          borderRadius: "14px",
          border: "1px solid #e5e7eb",
          height: "70vh",
          overflow: "hidden",
        }}
      >
        {reportHtml ? (
          <iframe
            srcDoc={reportHtml}
            title="DAISY Ace Report"
            style={{ width: "100%", height: "100%", border: "none" }}
          />
        ) : (
          <div
            style={{
              padding: "20px",
              color: "#6b7280",
              textAlign: "center",
            }}
          >
            Run QC to generate the report.
          </div>
        )}
      </div>
    </div>
  );
}
