import React, { useEffect, useRef } from "react";
import { useConversionStore } from "../../store/useConversionStore";
import { useQCStore } from "../../store/useQCStore";

/* --------------------------------
   Small stat box (clickable)
--------------------------------- */
function SummaryBox({ label, value, bg, color, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: bg,
        borderRadius: 10,
        padding: "10px 16px",
        minWidth: 110,
        textAlign: "center",
        cursor: onClick ? "pointer" : "default",
        transition: "transform 0.15s ease",
      }}
      onMouseEnter={(e) => {
        if (onClick) e.currentTarget.style.transform = "scale(1.05)";
      }}
      onMouseLeave={(e) => {
        if (onClick) e.currentTarget.style.transform = "scale(1)";
      }}
    >
      <div style={{ fontSize: 20, fontWeight: 700, color }}>
        {value ?? 0}
      </div>
      <div style={{ fontSize: 12, color: "#374151" }}>{label}</div>
    </div>
  );
}

/* --------------------------------
   QC Summary Bar (FINAL)
--------------------------------- */
export default function QCSummaryBar({
  onErrorsClick,
  onWarningsClick,
  onPassesClick,
}) {
  const { epubFile } = useConversionStore();

  const {
    qcStatus,
    qcSummary,
    setQcStatus,
    setQcSummary,
    setQcIssues,
  } = useQCStore();

  // Prevent duplicate auto QC for same file
  const lastRunRef = useRef(null);

  /* --------------------------------
     AUTO QC on EPUB upload
  --------------------------------- */
  useEffect(() => {
    if (!epubFile) return;
    if (lastRunRef.current === epubFile) return;

    lastRunRef.current = epubFile;

    async function runQcAutomatically() {
      try {
        setQcStatus("running");
        setQcIssues({ errors: [], warnings: [], passes: [] });
        setQcSummary({ errors: 0, warnings: 0, passes: 0 });

        const form = new FormData();
        form.append("epub_file", epubFile);

        const res = await fetch("http://localhost:8000/api/qc/epub", {
          method: "POST",
          body: form,
        });

        if (!res.ok) throw new Error("QC failed");

        const data = await res.json();

        setQcIssues(data.issues);
        setQcSummary(data.summary);

        // 🔥 store report for QCPage
        if (data.report_zip_b64) {
          useQCStore.setState({ reportZipB64: data.report_zip_b64 });
        }

        setQcStatus("done");
      } catch (err) {
        console.error("Auto QC failed:", err);
        setQcStatus("error");
      }
    }

    runQcAutomatically();
  }, [epubFile, setQcIssues, setQcStatus, setQcSummary]);

  /* --------------------------------
     🔁 MANUAL RE-RUN (NO REUPLOAD)
  --------------------------------- */
  async function handleRerunQC() {
    try {
      setQcStatus("running");

      const res = await fetch("http://localhost:8000/api/qc/rerun", {
        method: "POST",
      });

      if (!res.ok) throw new Error("Re-run failed");

      const data = await res.json();

      setQcIssues(data.issues);
      setQcSummary(data.summary);

      // 🔥 IMPORTANT: push NEW report to QCPage
      if (data.report_zip_b64) {
        useQCStore.setState({ reportZipB64: data.report_zip_b64 });
      }

      setQcStatus("done");
    } catch (err) {
      console.error("Re-run QC failed:", err);
      setQcStatus("error");
    }
  }

  if (!epubFile) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* LOADING STATE */}
      {qcStatus === "running" && (
        <div style={{ width: "100%" }}>
          <div
            style={{
              fontSize: 12,
              color: "#374151",
              marginBottom: 6,
            }}
          >
            Running accessibility checks…
          </div>

          <div
            style={{
              height: 6,
              width: "100%",
              background: "#e5e7eb",
              borderRadius: 999,
              overflow: "hidden",
              position: "relative",
            }}
          >
            <div className="qc-shimmer-bar" />
          </div>
        </div>
      )}

      {/* RESULT STATE */}
      {qcStatus !== "running" && (
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <SummaryBox
            label="Errors"
            value={qcSummary.errors}
            bg="#fee2e2"
            color="#b91c1c"
            onClick={onErrorsClick}
          />
          <SummaryBox
            label="Warnings"
            value={qcSummary.warnings}
            bg="#fef3c7"
            color="#92400e"
            onClick={onWarningsClick}
          />
          <SummaryBox
            label="Passes"
            value={qcSummary.passes}
            bg="#dcfce7"
            color="#166534"
            onClick={onPassesClick}
          />

          <button
            onClick={handleRerunQC}
            style={{
              marginLeft: "auto",
              padding: "8px 14px",
              background: "#2563eb",
              color: "#fff",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Re-run DAISY
          </button>
        </div>
      )}

      {/* SHIMMER CSS */}
      <style>
        {`
          .qc-shimmer-bar {
            position: absolute;
            height: 100%;
            width: 40%;
            background: linear-gradient(
              90deg,
              #2563eb 0%,
              #60a5fa 50%,
              #2563eb 100%
            );
            animation: qc-shimmer 1.3s infinite ease-in-out;
            border-radius: 999px;
          }

          @keyframes qc-shimmer {
            0% { left: -40%; }
            100% { left: 100%; }
          }
        `}
      </style>
    </div>
  );
}
