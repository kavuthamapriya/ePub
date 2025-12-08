// src/modules/qc/QCPage.jsx
import React, { useState } from "react";
import { useConversionStore } from "../../store/useConversionStore";
import QCReport from "./QCReport";

const wrapper = {
  display: "flex",
  gap: 16,
  padding: 16,
  background: "#f3f4f6",
  borderRadius: 8,
};

const leftBox = {
  width: "24%",
  minWidth: 260,
  background: "#ffffff",
  padding: 16,
  borderRadius: 8,
  boxSizing: "border-box",
};

const rightBox = {
  flex: 1,
  background: "#ffffff",
  padding: 16,
  borderRadius: 8,
  boxSizing: "border-box",
};

export default function QCPage() {
  const { epubFile } = useConversionStore();
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [report, setReport] = useState(null);

  async function runQc() {
    if (!epubFile) {
      alert("No EPUB loaded. Please upload an EPUB in the Convert section first.");
      return;
    }

    try{
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
        let msg = `QC failed. HTTP ${res.status}`;
        try {
          const data = JSON.parse(text);
          if (data.detail) msg += ` – ${data.detail}`;
        } catch {
          // ignore JSON parse error
        }
        alert(msg);
        return;
      }

      const data = await res.json();
      console.log("QCPage: QC success payload:", data);

      setSummary(data.summary || { errors: 0, warnings: 0, passes: 0 });
      setReport(data.raw_report || data.report || null);
    } catch (e) {
      console.error("QCPage: unexpected QC error:", e);
      alert("QC failed (see console for details)");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginTop: 24 }}>
      {/* <h2 style={{ marginBottom: 8 }}>QC</h2> */}

      <div style={wrapper}>
        {/* LEFT: controls */}
        <section style={leftBox}>
          <h3>QC Controls</h3>
          <p style={{ fontSize: 14, color: "#4b5563" }}>
            Runs the DAISY Ace EPUB accessibility checker (WCAG / EPUB
            Accessibility).
          </p>

          <button
            onClick={runQc}
            disabled={loading}
            style={{
              marginTop: 10,
              padding: "10px 18px",
              backgroundColor: loading ? "#6b7280" : "#16a34a",
              color: "#ffffff",
              border: "none",
              borderRadius: 6,
              fontWeight: 600,
              cursor: loading ? "default" : "pointer",
            }}
          >
            {loading ? "Running QC..." : "Run QC on current EPUB"}
          </button>

          {!epubFile && (
            <p style={{ marginTop: 12, fontSize: 13, color: "#b91c1c" }}>
              No EPUB loaded yet. Please upload and convert an EPUB above.
            </p>
          )}
        </section>

        {/* RIGHT: report */}
        <section style={rightBox}>
          <h3>QC Summary</h3>
          {!report && (
            <p style={{ fontSize: 14, color: "#6b7280" }}>
              No QC run yet. Click <strong>Run QC</strong> to generate a
              DAISY Ace report.
            </p>
          )}

          {report && summary && (
            <QCReport summary={summary} report={report} />
          )}
        </section>
      </div>
    </div>
  );
}
