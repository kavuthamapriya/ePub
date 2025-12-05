import React, { useState } from "react";
import { useConversionStore } from "../../store/useConversionStore";
import { runAceQC } from "./qcUtils";

const wrapperStyle = {
  marginTop: "24px",
  padding: "16px",
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
};

function QCSection() {
  const epubFile = useConversionStore((s) => s.epubFile);
  const [qcReport, setQcReport] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleRunQC() {
    if (!epubFile) {
      alert("Upload an EPUB and run Convert first.");
      return;
    }

    try {
      setLoading(true);
      const report = await runAceQC(epubFile);
      console.log("QC report:", report);
      setQcReport(report);
    } catch (err) {
      console.error("QC error", err);
      alert(err.message || "QC failed (see console for details)");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={wrapperStyle}>
      <h2 style={{ marginBottom: "8px" }}>QC – WCAG / DAISY Validation</h2>
      <p style={{ marginBottom: "12px", color: "#4b5563" }}>
        Runs the DAISY Ace EPUB accessibility checker (WCAG / EPUB Accessibility).
      </p>

      <button
        onClick={handleRunQC}
        disabled={loading || !epubFile}
        style={{
          padding: "8px 16px",
          backgroundColor: loading ? "#9ca3af" : "#16a34a",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: loading ? "default" : "pointer",
          fontWeight: 600,
        }}
      >
        {loading ? "Running QC..." : "Run QC on current EPUB"}
      </button>

      {!epubFile && (
        <p style={{ marginTop: "8px", color: "#ef4444" }}>
          No EPUB loaded yet. Please upload an EPUB in the Convert section above.
        </p>
      )}

      {qcReport && (
        <div style={{ marginTop: "16px" }}>
          <h3>Summary</h3>
          <p>Errors: {qcReport.error_count}</p>
          <p>Warnings: {qcReport.warning_count}</p>
          {qcReport.notice_count != null && <p>Notices: {qcReport.notice_count}</p>}

          <details style={{ marginTop: "10px" }}>
            <summary style={{ cursor: "pointer" }}>View full DAISY Ace JSON report</summary>
            <pre
              style={{
                maxHeight: "300px",
                overflow: "auto",
                fontSize: "11px",
                background: "#f9fafb",
                padding: "8px",
                borderRadius: "4px",
                marginTop: "8px",
              }}
            >
              {JSON.stringify(qcReport.raw_report, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </section>
  );
}

export default QCSection;
