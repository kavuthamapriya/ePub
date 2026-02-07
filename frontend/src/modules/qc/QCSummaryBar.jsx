import React, { useEffect, useRef, useState } from "react";
import {
  FiAlertTriangle,
  FiInfo,
  FiCheckCircle,
  FiRefreshCcw,
} from "react-icons/fi";
import { useConversionStore } from "../../store/useConversionStore";
import { useQCStore } from "../../store/useQCStore";

/* Summary Box */
function SummaryBox({ label, value, icon, color, bg, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "14px 16px",
        borderRadius: "14px",
        cursor: "pointer",
        minWidth: "140px",
        background: bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        transition: "0.2s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {icon}
        <span style={{ fontWeight: 700, fontSize: "20px", color }}>
          {value}
        </span>
      </div>
      <span style={{ fontSize: "13px", marginTop: "4px", color: "#334155" }}>
        {label}
      </span>
    </div>
  );
}

export default function QCSummaryBar({
  onErrorsClick,
  onWarningsClick,
  onPassesClick,
}) {
  const { epubFile } = useConversionStore();
  const { qcStatus, qcSummary, setQcStatus, setQcSummary, setQcIssues } =
    useQCStore();

  const [rerunMessage, setRerunMessage] = useState("");
  const lastRunRef = useRef(null);

  /* Auto QC on EPUB upload */
  useEffect(() => {
    if (!epubFile) return;
    if (lastRunRef.current === epubFile) return;

    lastRunRef.current = epubFile;

    async function runQC() {
      try {
        setQcStatus("running");
        setQcIssues({ errors: [], warnings: [], passes: [] });
        setQcSummary({ errors: 0, warnings: 0, passes: 0 });

        const { bookId } = useConversionStore.getState();

        // 💥 CRITICAL FIX — send book_id + epub_file
        const fd = new FormData();
        fd.append("book_id", bookId);      // required
        fd.append("epub_file", epubFile);  // required

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
        console.error("QC ERROR:", err);
        setQcStatus("error");
      }
    }

    runQC();
  }, [epubFile]);

  /* Manual Re-run QC */
  async function rerunQC() {
    setRerunMessage("");
    setQcStatus("running");

    try {
      const res = await fetch("http://localhost:8000/api/qc/rerun", {
        method: "POST",
      });

      if (!res.ok) throw new Error("Failed");

      const data = await res.json();

      setQcIssues(data.issues);
      setQcSummary(data.summary);

      if (data.report_zip_b64) {
        useQCStore.setState({ reportZipB64: data.report_zip_b64 });
      }

      setQcStatus("done");
    } catch (err) {
      console.error("Re-run QC error:", err);
      setQcStatus("error");
    }
  }

  if (!epubFile) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {qcStatus === "running" && (
        <div>
          <div style={{ fontSize: "13px", marginBottom: "6px" }}>
            Running accessibility tests…
          </div>
          <div
            style={{
              height: "6px",
              width: "100%",
              background: "#e2e8f0",
              borderRadius: "999px",
              overflow: "hidden",
            }}
          >
            <div className="qc-shimmer" />
          </div>

          <style>
            {`
            .qc-shimmer {
              height: 100%;
              width: 40%;
              background: linear-gradient(90deg,#2563eb,#93c5fd,#2563eb);
              animation: qcshimmer 1.3s infinite;
            }
            @keyframes qcshimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(250%); }
            }
          `}
          </style>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <SummaryBox
          label="Errors"
          value={qcSummary.errors}
          bg="#fee2e2"
          color="#b91c1c"
          icon={<FiAlertTriangle size={20} color="#dc2626" />}
          onClick={onErrorsClick}
        />

        <SummaryBox
          label="Warnings"
          value={qcSummary.warnings}
          bg="#eff6ff"
          color="#f1560e"
          icon={<FiInfo size={20} color="#f1560e" />}
          onClick={onWarningsClick}
        />

        <SummaryBox
          label="Passes"
          value={qcSummary.passes}
          bg="#dcfce7"
          color="#166534"
          icon={<FiCheckCircle size={20} color="#16a34a" />}
          onClick={onPassesClick}
        />

        <div style={{ display: "flex", flexDirection: "column" }}>
          <button
            onClick={rerunQC}
            style={{
              padding: "10px 16px",
              borderRadius: "12px",
              border: "none",
              background: "linear-gradient(135deg,#f97316,#ea580c)",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              gap: "8px",
              alignItems: "center",
            }}
          >
            <FiRefreshCcw />
            Re-run QC
          </button>

          {rerunMessage && (
            <span style={{ marginTop: "6px", color: "#b91c1c" }}>
              {rerunMessage}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
