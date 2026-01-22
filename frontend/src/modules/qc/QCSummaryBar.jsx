import React, { useEffect, useRef, useState } from "react";
import { useConversionStore } from "../../store/useConversionStore";
import { useQCStore } from "../../store/useQCStore";
import {
  FiAlertTriangle,
  FiInfo,
  FiCheckCircle,
  FiRefreshCcw,
} from "react-icons/fi";

/* --------------------------------
   SummaryBox Component
--------------------------------- */
function SummaryBox({ label, value, bg, icon, color, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: bg,
        borderRadius: 12,
        padding: "12px 16px",
        minWidth: 130,
        cursor: onClick ? "pointer" : "default",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
        transition: "transform 0.18s ease",
      }}
      onMouseEnter={(e) => {
        if (onClick) e.currentTarget.style.transform = "scale(1.07)";
      }}
      onMouseLeave={(e) => {
        if (onClick) e.currentTarget.style.transform = "scale(1)";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {icon}
        <span style={{ fontSize: 20, fontWeight: 700, color }}>
          {value ?? 0}
        </span>
      </div>

      <div style={{ fontSize: 13, color: "#374151", marginTop: 2 }}>
        {label}
      </div>
    </div>
  );
}

/* --------------------------------
   QC Summary Bar (NEW ORANGE UI)
--------------------------------- */
export default function QCSummaryBar({
  onErrorsClick,
  onWarningsClick,
  onPassesClick,
}) {
  const { epubFile, accessibleEpubBlob } = useConversionStore();

  const {
    qcStatus,
    qcSummary,
    setQcStatus,
    setQcSummary,
    setQcIssues,
  } = useQCStore();

  const [rerunMessage, setRerunMessage] = useState("");
  const lastRunRef = useRef(null);

  /* --------------------------------
     AUTO QC on EPUB upload
  --------------------------------- */
  useEffect(() => {
    if (!epubFile) return;
    if (lastRunRef.current === epubFile) return;

    lastRunRef.current = epubFile;

    async function runQc() {
      try {
        setQcStatus("running");
        setQcIssues({ errors: [], warnings: [], passes: [] });
        setQcSummary({ errors: 0, warnings: 0, passes: 0 });

        const fd = new FormData();
        fd.append("epub_file", epubFile);

        const res = await fetch("http://localhost:8000/api/qc/epub", {
          method: "POST",
          body: fd,
        });

        if (!res.ok) throw new Error("QC failed");
        const data = await res.json();

        setQcIssues(data.issues);
        setQcSummary(data.summary);

        if (data.report_zip_b64) {
          useQCStore.setState({ reportZipB64: data.report_zip_b64 });
        }

        setQcStatus("done");
      } catch (err) {
        console.error(err);
        setQcStatus("error");
      }
    }

    runQc();
  }, [epubFile]);

  /* --------------------------------
     MANUAL RE-RUN
  --------------------------------- */
  async function handleRerunQC() {
    if (!accessibleEpubBlob) {
      setRerunMessage("⚠️ Convert EPUB to Accessible EPUB before re-running.");
      return;
    }

    setRerunMessage("");
    setQcStatus("running");

    try {
      const res = await fetch("http://localhost:8000/api/qc/rerun", {
        method: "POST",
      });

      if (!res.ok) throw new Error("Re-run failed");

      const data = await res.json();
      setQcIssues(data.issues);
      setQcSummary(data.summary);

      if (data.report_zip_b64) {
        useQCStore.setState({ reportZipB64: data.report_zip_b64 });
      }

      setQcStatus("done");
    } catch (err) {
      console.error(err);
      setQcStatus("error");
    }
  }

  if (!epubFile) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      
      {/* LOADING BAR */}
      {qcStatus === "running" && (
        <div>
          <div style={{ fontSize: 13, marginBottom: 6 }}>Running accessibility checks…</div>

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
            <div className="qc-shimmer-bar"></div>
          </div>
        </div>
      )}

      {/* RESULTS */}
      {qcStatus !== "running" && (
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          
          {/* Errors */}
          <SummaryBox
            label="Errors"
            value={qcSummary.errors}
            bg="#fee2e2"
            color="#b91c1c"
            onClick={onErrorsClick}
            icon={<FiAlertTriangle size={18} color="#dc2626" />}
          />

          {/* Warnings */}
          <SummaryBox
            label="Warnings"
            value={qcSummary.warnings}
            bg="#fef3c7"
            color="#92400e"
            onClick={onWarningsClick}
            icon={<FiInfo size={18} color="#f59e0b" />}
          />

          {/* Passes */}
          <SummaryBox
            label="Passes"
            value={qcSummary.passes}
            bg="#dcfce7"
            color="#166534"
            onClick={onPassesClick}
            icon={<FiCheckCircle size={18} color="#16a34a" />}
          />

          {/* Re-run Button */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <button
              onClick={handleRerunQC}
              style={{
                padding: "9px 16px",
                borderRadius: 10,
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                color: "#fff",
                background: "linear-gradient(135deg,#f97316,#ea580c)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <FiRefreshCcw size={16} />
              Re-run DAISY
            </button>

            {rerunMessage && (
              <div style={{ marginTop: 6, fontSize: 13, color: "#b91c1c" }}>
                {rerunMessage}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SHIMMER CSS */}
      <style>
        {`
          .qc-shimmer-bar {
            position: absolute;
            inset: 0;
            width: 40%;
            background: linear-gradient(
              90deg,
              #ff7a18 0%,
              #ffb566 50%,
              #ff7a18 100%
            );
            animation: qcShimmer 1.2s ease-in-out infinite;
          }

          @keyframes qcShimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(250%); }
          }
        `}
      </style>
    </div>
  );
}
