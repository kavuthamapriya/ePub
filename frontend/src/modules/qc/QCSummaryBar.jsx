import React, { useEffect, useRef } from "react";
import { useConversionStore } from "../../store/useConversionStore";
import { useQCStore } from "../../store/useQCStore";

/* --------------------------------
   Small stat box
--------------------------------- */
function SummaryBox({ label, value, bg, color }) {
  return (
    <div
      style={{
        background: bg,
        borderRadius: 10,
        padding: "10px 16px",
        minWidth: 110,
        textAlign: "center",
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
   QC Summary Bar
--------------------------------- */
export default function QCSummaryBar() {
  const { epubFile } = useConversionStore();
  const {
    qcStatus,
    qcSummary,
    setQcStatus,
    setQcSummary,
  } = useQCStore();

  // prevent re-running QC multiple times for same file
  const lastRunRef = useRef(null);

  useEffect(() => {
    if (!epubFile) return;

    // avoid duplicate runs for same file object
    if (lastRunRef.current === epubFile) return;
    lastRunRef.current = epubFile;

    async function runQcAutomatically() {
      try {
        setQcStatus("running");
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

        setQcSummary({
          errors: data?.summary?.errors ?? 0,
          warnings: data?.summary?.warnings ?? 0,
          passes: data?.summary?.passes ?? 0,
        });

        setQcStatus("done");
      } catch (err) {
        console.error("Auto QC failed:", err);
        setQcStatus("error");
      }
    }

    runQcAutomatically();
  }, [epubFile, setQcStatus, setQcSummary]);

  // hide completely until EPUB exists
  if (!epubFile) return null;

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        marginBottom: 16,
        alignItems: "center",
      }}
    >
      {qcStatus === "running" && (
        <div style={{ fontSize: 13, color: "#6b7280" }}>
          Running accessibility checks…
        </div>
      )}

      {qcStatus !== "running" && (
        <>
          <SummaryBox
            label="Errors"
            value={qcSummary?.errors}
            bg="#fee2e2"
            color="#b91c1c"
          />
          <SummaryBox
            label="Warnings"
            value={qcSummary?.warnings}
            bg="#fef3c7"
            color="#92400e"
          />
          <SummaryBox
            label="Passes"
            value={qcSummary?.passes}
            bg="#dcfce7"
            color="#166534"
          />
        </>
      )}
    </div>
  );
}
