// src/modules/qc/QCReport.jsx
import React from "react";

/**
 * QCReport
 * Props:
 *  - summary: { errors, warnings, passes }
 *  - rawReport: full Ace JSON (object)
 *  - onSelectIssue(assertion): callback invoked when user clicks an issue
 *  - selectedIssue: the currently selected assertion (object identity used)
 *
 * This component does not fetch files — it only lists issues and calls
 * onSelectIssue when an issue is clicked.
 */

function safeGetAssertions(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  return raw.assertions || raw["earl:assertions"] || raw["assertions"] || [];
}

function humanTitleFromAssertion(a, idx) {
  if (!a) return `Issue #${idx + 1}`;
  // try common fields in ace results
  if (a.test) return a.test;
  if (a.title) return a.title;
  if (a.name) return a.name;

  const r = a.result || a["earl:result"] || {};
  if (r.description) return r.description;

  // fallback to a short label if available
  if (a["@id"]) return String(a["@id"]).split("/").pop();

  return `Issue #${idx + 1}`;
}

function inferDocumentFromAssertion(a) {
  if (!a) return "unknown";
  const tryVals = [];

  const subj = a.subject || a["earl:subject"] || {};
  if (typeof subj === "string") tryVals.push(subj);
  if (subj && subj.source) tryVals.push(subj.source);
  if (subj && subj["@id"]) tryVals.push(subj["@id"]);

  const res = a.result || a["earl:result"] || {};
  if (res.pointer) tryVals.push(res.pointer);
  if (res.selector) tryVals.push(res.selector);

  if (a.location) tryVals.push(a.location);
  if (a.path) tryVals.push(a.path);

  for (const v of tryVals) {
    if (!v || typeof v !== "string") continue;
    const cleaned = v.split("#")[0];
    // common epub internal file markers
    if (cleaned.endsWith(".xhtml") || cleaned.endsWith(".html") || cleaned.includes("OEBPS") || cleaned.includes("oebps")) return cleaned;
  }
  return "unknown";
}

export default function QCReport({ summary, rawReport, onSelectIssue, selectedIssue }) {
  const assertions = safeGetAssertions(rawReport);

  const issues = assertions.map((a, i) => {
    const title = humanTitleFromAssertion(a, i);
    const document = inferDocumentFromAssertion(a);

    let impact = "unknown";
    const res = a.result || a["earl:result"] || {};
    if (res.outcome) impact = res.outcome;

    return {
      index: i,
      raw: a,
      title,
      document,
      impact,
    };
  });

  return (
    <div style={{ padding: 0 }}>
      {/* Top summary cards */}
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <div style={{ flex: "0 0 120px", padding: 12, borderRadius: 8, background: "#fff5f5", border: "1px solid #fca5a5" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#ef4444" }}>{summary?.errors ?? 0}</div>
          <div style={{ fontSize: 12 }}>Errors</div>
        </div>

        <div style={{ flex: "0 0 120px", padding: 12, borderRadius: 8, background: "#fff7ed", border: "1px solid #fcd34d" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#d97706" }}>{summary?.warnings ?? 0}</div>
          <div style={{ fontSize: 12 }}>Warnings</div>
        </div>

        <div style={{ flex: "0 0 120px", padding: 12, borderRadius: 8, background: "#ecfdf5", border: "1px solid #86efac" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#059669" }}>{summary?.passes ?? 0}</div>
          <div style={{ fontSize: 12 }}>Passes</div>
        </div>
      </div>

      <h3 style={{ marginTop: 4 }}>Accessibility Issues</h3>

      {/* Issue list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: "62vh", overflowY: "auto", paddingRight: 6 }}>
        {issues.map((it) => {
          const isSelected = selectedIssue && selectedIssue === it.raw;

          return (
            <div
              key={it.index}
              onClick={() => onSelectIssue && onSelectIssue(it.raw)}
              style={{
                cursor: onSelectIssue ? "pointer" : "default",
                padding: 12,
                borderRadius: 8,
                border: isSelected ? "2px solid #2563eb" : "1px solid #f4a8a8",
                background: isSelected ? "#eef2ff" : "#fff6f6",
              }}
            >
              <div style={{ fontWeight: 700 }}>
                Issue #{it.index + 1}: {it.title}
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ background: "#f3f4f6", padding: "4px 8px", borderRadius: 12, fontSize: 12 }}>
                  WCAG: —
                </div>

                <div style={{ background: "#fff1f2", padding: "4px 8px", borderRadius: 12, fontSize: 12 }}>
                  Impact: {it.impact}
                </div>

                <div style={{ background: "#f3f4f6", padding: "4px 8px", borderRadius: 12, fontSize: 12 }}>
                  Document: {it.document}
                </div>
              </div>

              <div style={{ marginTop: 8, fontSize: 13, color: "#6b7280" }}>
                Click to view this issue's HTML in the editor.
              </div>
            </div>
          );
        })}

        {issues.length === 0 && (
          <div style={{ padding: 12, background: "#fafafa", borderRadius: 8, border: "1px dashed #e5e7eb" }}>
            No issues found in the current Ace report.
          </div>
        )}
      </div>
    </div>
  );
}
