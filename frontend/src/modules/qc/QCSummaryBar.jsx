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

  // Prevent duplicate QC for same file
  const lastRunRef = useRef(null);

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

        if (!res.ok) {
          throw new Error(`QC failed (${res.status})`);
        }

        const data = await res.json();

        // ✅ Backend is single source of truth
        setQcIssues(data.issues || { errors: [], warnings: [], passes: [] });
        setQcSummary(
          data.summary || { errors: 0, warnings: 0, passes: 0 }
        );

        setQcStatus("done");
      } catch (err) {
        console.error("Auto QC failed:", err);
        setQcStatus("error");
      }
    }

    runQcAutomatically();
  }, [epubFile, setQcStatus, setQcIssues, setQcSummary]);

  // Hide until EPUB exists
  if (!epubFile) return null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        marginBottom: 16,
      }}
    >
      {/* 🔥 LOADING STATE */}
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

      {/* ✅ RESULT STATE */}
      {qcStatus !== "running" && (
        <div style={{ display: "flex", gap: 12 }}>
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
        </div>
      )}

      {/* 🔧 LOCAL CSS (scoped & safe) */}
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
            0% {
              left: -40%;
            }
            100% {
              left: 100%;
            }
          }
        `}
      </style>
    </div>
  );
}
