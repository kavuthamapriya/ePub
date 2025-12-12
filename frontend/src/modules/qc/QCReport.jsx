// src/modules/qc/QCReport.jsx
import React from "react";

/**
 * Helper: flatten nested Ace assertions so that each leaf assertion becomes one "issue".
 */
function flattenAssertions(list) {
  const result = [];

  function walk(a) {
    if (!a) return;
    // if this assertion contains deeper assertions, walk them
    if (Array.isArray(a.assertions) && a.assertions.length > 0) {
      a.assertions.forEach(child => walk(child));
    } else if (Array.isArray(a["earl:assertions"]) && a["earl:assertions"].length > 0) {
      a["earl:assertions"].forEach(child => walk(child));
    } else {
      // leaf assertion — push it
      result.push(a);
    }
  }

  (list || []).forEach(a => walk(a));
  return result;
}

/**
 * Extract the top-level leaf assertion list from raw Ace report object.
 */
function getAssertionsFromReport(rawReport) {
  if (!rawReport) return [];
  const topLevel = rawReport.assertions || rawReport["earl:assertions"] || [];
  return flattenAssertions(topLevel);
}

/**
 * Small helper to produce a short title for an assertion for display in the list.
 * Uses dct:description or result.description or test/name fields if available.
 */
function shortTitleForAssertion(a) {
  if (!a) return "Unnamed issue";
  const desc = a["dct:description"] || (a.result && a.result.description) || a.description || a.test || a.name || null;
  if (desc && typeof desc === "string") {
    return desc.length > 80 ? desc.slice(0, 80) + "…" : desc;
  }
  // fallback: stringify small part
  try {
    const s = JSON.stringify(a);
    return s.length > 80 ? s.slice(0, 80) + "…" : s;
  } catch (e) {
    return "Unnamed issue";
  }
}

export default function QCReport({ summary, rawReport, onSelectIssue, selectedIssue }) {
  const assertions = getAssertionsFromReport(rawReport);

  const errors = summary ? summary.errors || 0 : 0;
  const warnings = summary ? summary.warnings || 0 : 0;
  const passes = summary ? summary.passes || 0 : 0;

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
        <div style={{ background: "#fee2e2", padding: 12, borderRadius: 8, width: 100 }}>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{errors}</div>
          <div style={{ color: "#6b7280" }}>Errors</div>
        </div>
        <div style={{ background: "#ffedd5", padding: 12, borderRadius: 8, width: 100 }}>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{warnings}</div>
          <div style={{ color: "#6b7280" }}>Warnings</div>
        </div>
        <div style={{ background: "#dcfce7", padding: 12, borderRadius: 8, width: 100 }}>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{passes}</div>
          <div style={{ color: "#6b7280" }}>Passes</div>
        </div>
      </div>

      <h3>Accessibility Issues</h3>
      <div style={{ maxHeight: "60vh", overflow: "auto", paddingRight: 8 }}>
        {assertions.length === 0 ? (
          <div style={{ color: "#6b7280" }}>No issues found (run QC to populate list).</div>
        ) : assertions.map((a, idx) => {
          const isSelected = selectedIssue === a;
          return (
            <div
              key={idx}
              onClick={() => onSelectIssue && onSelectIssue(a)}
              style={{
                borderRadius: 8,
                padding: 12,
                marginBottom: 12,
                background: isSelected ? "#eef2ff" : "#fff1f2",
                border: isSelected ? "2px solid #2563eb" : "1px solid #fca5a5",
                cursor: "pointer"
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{`Issue #${idx + 1}: ${shortTitleForAssertion(a)}`}</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                <div style={{ background: "#e6e6e6", padding: "4px 8px", borderRadius: 999, fontSize: 12 }}>
                  Impact: { (a.result && (a.result.impact || a.result["earl:outcome"])) || "unknown" }
                </div>
                <div style={{ background: "#e6e6e6", padding: "4px 8px", borderRadius: 999, fontSize: 12 }}>
                  Document: { (a.subject && (a.subject.source || a.subject["@id"])) || (a.document || a.path) || "unknown" }
                </div>
              </div>
              <div style={{ color: "#6b7280" }}>Click to inspect this issue's HTML in the editor.</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
