// src/modules/qc/QCPage.jsx
import React, { useState } from "react";
import { useConversionStore } from "../../store/useConversionStore";

// 👇 Same base as ConvertPage
const API_BASE = "http://localhost:8000/api";

const wrapperStyle = {
  display: "flex",
  backgroundColor: "#f3f4f6",
};

const leftStyle = {
  width: "25%",
  padding: "0.75rem",
  borderRight: "1px solid #e1e4e8",
  backgroundColor: "#ffffff",
};

const rightStyle = {
  flex: 1,
  padding: "0.75rem",
  backgroundColor: "#ffffff",
};

export default function QCPage() {
  const { epubFile } = useConversionStore();
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState(null);

  async function runQc() {
    if (!epubFile) {
      alert("No EPUB loaded. Please upload in Convert section first.");
      return;
    }

    try {
      setRunning(true);

      const form = new FormData();
      form.append("epub_file", epubFile);

      const url = `${API_BASE}/qc/epub`;
      console.log("QCPage: POST", url);

      const res = await fetch(url, {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        let errText = "";
        try {
          const j = await res.json();
          errText = JSON.stringify(j, null, 2);
        } catch {
          errText = await res.text();
        }
        console.error("QC failed. HTTP", res.status, errText);
        alert(`QC failed: HTTP ${res.status}`);
        return;
      }

      const data = await res.json();
      console.log("QC success payload:", data);
      setReport(data);
    } catch (e) {
      console.error("QC error:", e);
      alert("QC failed: unexpected error (see console)");
    } finally {
      setRunning(false);
    }
  }

  const errorCount = report?.summary?.errors ?? 0;
  const warningCount = report?.summary?.warnings ?? 0;

  return (
    <div style={wrapperStyle}>
      <section style={leftStyle}>
        <h3>QC Controls</h3>
        <p style={{ marginBottom: 12 }}>
          Runs the DAISY Ace EPUB accessibility checker (WCAG / EPUB
          Accessibility).
        </p>
        <button
          onClick={runQc}
          disabled={running}
          style={{
            padding: "10px 16px",
            backgroundColor: running ? "#6b7280" : "#16a34a",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: running ? "default" : "pointer",
          }}
        >
          {running ? "Running QC..." : "Run QC on current EPUB"}
        </button>
        {!epubFile && (
          <p style={{ marginTop: 12, color: "#b91c1c" }}>
            No EPUB loaded yet. Please upload an EPUB in the Convert section
            above.
          </p>
        )}
      </section>

      <section style={rightStyle}>
        <h3>QC Summary</h3>
        {!report ? (
          <p>No QC run yet.</p>
        ) : (
          <>
            <p>
              <strong>Errors:</strong> {errorCount}
              <br />
              <strong>Warnings:</strong> {warningCount}
            </p>

            <details style={{ marginTop: 12 }}>
              <summary>View full DAISY Ace JSON report</summary>
              <pre
                style={{
                  marginTop: 8,
                  maxHeight: 360,
                  overflow: "auto",
                  background: "#f9fafb",
                  padding: 8,
                  borderRadius: 4,
                  border: "1px solid #e5e7eb",
                  fontSize: 12,
                }}
              >
                {JSON.stringify(report.raw_report, null, 2)}
              </pre>
            </details>
          </>
        )}
      </section>
    </div>
  );
}
