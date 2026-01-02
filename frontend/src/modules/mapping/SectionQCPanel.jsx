import React, { useMemo, useState, useEffect } from "react";

/**
 * Props:
 * - activeSection: { label, href }
 * - aceAssertions: flattened Ace EARL assertions array
 */
export default function SectionQCPanel({
  activeSection,
  aceAssertions = [],
}) {
  const [runQC, setRunQC] = useState(false);

  // Reset QC when section changes
  useEffect(() => {
    setRunQC(false);
  }, [activeSection?.href]);

  // 🔍 Filter issues by section document path
  const sectionIssues = useMemo(() => {
    if (!activeSection?.href) return [];

    return aceAssertions.filter((a) => {
      const source =
        a?.["earl:testSubject"]?.source ||
        a?.["earl:testSubject"]?.["@id"] ||
        "";

      return source.includes(activeSection.href);
    });
  }, [aceAssertions, activeSection]);

  // 📊 Group by outcome
  const grouped = useMemo(() => {
    const result = {
      fail: [],
      warning: [],
      pass: [],
    };

    sectionIssues.forEach((a) => {
      const outcome =
        a?.["earl:result"]?.["earl:outcome"] || "unknown";

      if (outcome === "fail") result.fail.push(a);
      else if (outcome === "warning") result.warning.push(a);
      else if (outcome === "pass") result.pass.push(a);
    });

    return result;
  }, [sectionIssues]);

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 12,
        padding: 16,
        height: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <h3 style={{ margin: 0 }}>Error List</h3>

      {!activeSection && (
        <p style={{ fontSize: 13, color: "#6b7280" }}>
          Select a section to view accessibility issues.
        </p>
      )}

      {activeSection && !runQC && (
        <>
          <p style={{ fontSize: 13, color: "#374151" }}>
            Run QC for:
            <br />
            <strong>{activeSection.label}</strong>
          </p>

          <button
            onClick={() => setRunQC(true)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "none",
              background: "#2563eb",
              color: "#ffffff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Run QC for this section
          </button>
        </>
      )}

      {activeSection && runQC && (
        <div style={{ overflowY: "auto", flex: 1 }}>
          <QCGroup
            title="Errors"
            color="#fee2e2"
            issues={grouped.fail}
          />
          <QCGroup
            title="Warnings"
            color="#fef3c7"
            issues={grouped.warning}
          />
          <QCGroup
            title="Passes"
            color="#dcfce7"
            issues={grouped.pass}
          />
        </div>
      )}
    </div>
  );
}

/* ---------- Helper Components ---------- */

function QCGroup({ title, color, issues }) {
  if (!issues.length) return null;

  return (
    <div style={{ marginBottom: 12 }}>
      <h4 style={{ marginBottom: 6 }}>{title} ({issues.length})</h4>

      {issues.map((a, i) => (
        <div
          key={i}
          style={{
            background: color,
            borderRadius: 8,
            padding: 8,
            marginBottom: 6,
            fontSize: 12,
          }}
        >
          <div>
            <strong>Rule:</strong>{" "}
            {a?.["earl:test"]?.["@id"] || "Unknown"}
          </div>
          <div>
            <strong>Outcome:</strong>{" "}
            {a?.["earl:result"]?.["earl:outcome"]}
          </div>
        </div>
      ))}
    </div>
  );
}
