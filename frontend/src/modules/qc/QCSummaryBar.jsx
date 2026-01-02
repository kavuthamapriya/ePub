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
   QC Summary Bar
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

  // prevent duplicate runs for same EPUB
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

        /* --------------------------------
           Parse Daisy ACE issues
        --------------------------------- */
        const errors = [];
        const warnings = [];
        const passes = [];

        const raw = data?.raw_report || {};
        const assertions = Array.isArray(raw.assertions)
          ? raw.assertions
          : Array.isArray(raw["earl:assertions"])
          ? raw["earl:assertions"]
          : [];

        console.log("Assertions count:", assertions.length);

        assertions.forEach((a) => {
          const result = a?.result || a?.["earl:result"] || {};
          const outcome = (
            a?.outcome ||
            a?.["earl:outcome"] ||
            result?.outcome ||
            result?.["earl:outcome"] ||
            ""
          )
            .toString()
            .toLowerCase();

          const locations =
            Array.isArray(a?.locations) && a.locations.length > 0
              ? a.locations
              : [null]; // document-level issue

          locations.forEach((loc) => {
            const issue = {
  rule:
    a?.assertionId ||
    a?.id ||
    a?.["earl:test"]?.["@id"] ||
    "Document-level check",

  message:
    a?.description ||
    a?.help ||
    a?.["earl:test"]?.title ||
    "Document-level accessibility requirement failed",

  file: loc?.path || "EPUB package (OPF / metadata)",
  line: loc?.line ?? null,
  html: loc?.html ?? null,
};


            if (outcome.includes("fail") || outcome.includes("error")) {
              errors.push(issue);
            } else if (outcome.includes("warn")) {
              warnings.push(issue);
            } else if (outcome.includes("pass")) {
              passes.push(issue);
            }
          });
        });

        /* --------------------------------
           SINGLE SOURCE OF TRUTH
        --------------------------------- */
        setQcIssues({ errors, warnings, passes });
        setQcSummary({
          errors: errors.length,
          warnings: warnings.length,
          passes: passes.length,
        });

        setQcStatus("done");
      } catch (err) {
        console.error("Auto QC failed:", err);
        setQcStatus("error");
      }
    }

    runQcAutomatically();
  }, [epubFile, setQcStatus, setQcIssues, setQcSummary]);

  // hide until EPUB exists
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
        </>
      )}
    </div>
  );
}
