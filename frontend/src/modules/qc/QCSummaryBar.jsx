// src/modules/qc/QCSummaryBar.jsx
import React from "react";
import { useQCStore } from "../../store/useQCStore";
import { useConversionStore } from "../../store/useConversionStore";

export default function QCSummaryBar() {
  const { epubFile } = useConversionStore();
  const { qcStatus, qcSummary } = useQCStore();

  // Do NOT render before EPUB upload
  if (!epubFile) return null;

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        marginBottom: 16,
      }}
    >
      {qcStatus === "running" ? (
        <div style={{ fontSize: 13, color: "#6b7280" }}>
          Running accessibility checks…
        </div>
      ) : (
        <>
          <SummaryBox label="Errors" value={qcSummary.errors} color="#fee2e2" />
          <SummaryBox label="Warnings" value={qcSummary.warnings} color="#fef3c7" />
          <SummaryBox label="Passes" value={qcSummary.passes} color="#dcfce7" />
        </>
      )}
    </div>
  );
}

function SummaryBox({ label, value, color }) {
  return (
    <div
      style={{
        background: color,
        borderRadius: 10,
        padding: "10px 14px",
        minWidth: 90,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: 12 }}>{label}</div>
    </div>
  );
}
