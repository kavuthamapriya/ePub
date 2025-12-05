// src/modules/qc/QCPage.jsx
import React, { useState } from "react";
import { useConversionStore } from "../../store/useConversionStore";

export default function QCPage() {
  const { epubFile, setQcReport, setQcLoading, setQcError, qcReport, qcLoading, qcError } = useConversionStore();

  const [localReport, setLocalReport] = useState(qcReport);
  const [running, setRunning] = useState(false);

  async function runQc() {
    if (!epubFile) {
      alert("No EPUB loaded yet. Please upload and run Convert first.");
      return;
    }
    setRunning(true);
    setQcLoading(true);
    setQcError(null);
    try {
      const form = new FormData();
      form.append("epub_file", epubFile);

      const res = await fetch("/qc/epub", { method: "POST", body: form });
      if (!res.ok) {
        const txt = await res.text();
        console.error("QC failed:", res.status, txt);
        setQcError(txt);
        alert(`QC failed: HTTP ${res.status}`);
        setRunning(false);
        setQcLoading(false);
        return;
      }
      const json = await res.json();
      setQcReport(json);
      setLocalReport(json);
      setRunning(false);
      setQcLoading(false);
      alert("QC completed (see report)");
    } catch (e) {
      console.error("QC error:", e);
      setQcError(String(e));
      alert("QC failed (see console)");
      setRunning(false);
      setQcLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", gap: 12, padding: 16 }}>
      <div style={{ width: 320, background: "#fff", padding: 12, borderRadius: 8 }}>
        <h3>QC Controls</h3>
        <p style={{ color: "#374151" }}>Runs the DAISY Ace EPUB accessibility checker (WCAG / EPUB Accessibility).</p>

        <button onClick={runQc} style={{ padding: "8px 12px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 6 }}>
          {running ? "Running QC..." : "Run QC on current EPUB"}
        </button>

        {qcError && <div style={{ marginTop: 8, color: "crimson" }}>QC Error: {String(qcError).slice(0, 200)}</div>}
      </div>

      <div style={{ flex: 1, background: "#fff", padding: 12, borderRadius: 8, minHeight: 200 }}>
        <h3>QC Summary</h3>
        {!localReport && <p>No QC run yet.</p>}
        {localReport && (
          <>
            <p>Violations: {localReport?.summary?.violations ?? "n/a"}</p>
            <pre style={{ whiteSpace: "pre-wrap", maxHeight: 600, overflow: "auto", background: "#f8fafc", padding: 8 }}>
              {JSON.stringify(localReport, null, 2)}
            </pre>
          </>
        )}
      </div>
    </div>
  );
}
