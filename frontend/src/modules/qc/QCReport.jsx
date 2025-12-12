// src/modules/qc/QCReport.jsx
import React from "react";

/* ---------------------------
   Utility: Flatten nested assertions
   (Ace reports can nest assertions; the real issues are leaf assertions)
---------------------------- */
function flattenAssertions(list) {
  const result = [];

  function walk(a) {
    if (!a) return;

    // If this assertion contains deeper assertions, walk them
    if (Array.isArray(a.assertions) && a.assertions.length > 0) {
      a.assertions.forEach(child => walk(child));
    } else {
      // leaf assertion -> real issue
      result.push(a);
    }
  }

  if (Array.isArray(list)) {
    list.forEach(a => walk(a));
  }

  return result;
}

function getAssertionsFromReport(rawReport) {
  if (!rawReport) return [];

  const topLevel =
    rawReport.assertions ||
    rawReport["earl:assertions"] ||
    [];

  return flattenAssertions(topLevel);
}

/* Helper to build a readable issue title from assertion fields */
function getIssueTitle(assertion) {
  if (!assertion) return "Unknown Issue";

  // common fields used by Ace / EARL style reports
  if (assertion.test && typeof assertion.test === "string") return assertion.test;
  if (assertion.rule && typeof assertion.rule === "string") return assertion.rule;
  if (assertion.title && typeof assertion.title === "string") return assertion.title;
  if (assertion.name && typeof assertion.name === "string") return assertion.name;

  // result.description sometimes exists
  const result = assertion.result || assertion["earl:result"] || {};
  if (result.description && typeof result.description === "string") return result.description;

  // try assertions[0].test etc (defensive)
  if (Array.isArray(assertion.assertions) && assertion.assertions.length > 0) {
    const child = assertion.assertions[0];
    if (child && (child.test || child.title || child.rule)) {
      return child.test || child.title || child.rule || "Issue";
    }
  }

  // fallback: small JSON snippet
  try {
    const str = JSON.stringify(assertion);
    const truncated = str.length > 120 ? str.slice(0, 116) + "..." : str;
    return truncated;
  } catch (e) {
    return "Unknown Issue";
  }
}

/* Small helper to read document path from assertion */
function getDocPath(assertion) {
  if (!assertion) return "unknown";
  const subj = assertion.subject || assertion["earl:subject"] || {};
  if (typeof subj === "string") {
    return subj.split("#")[0] || "unknown";
  }
  if (subj && subj.source) return (subj.source + "").split("#")[0];
  if (assertion.location) return assertion.location.split("#")[0];
  if (assertion.path) return assertion.path.split("#")[0];
  if (assertion.document) return assertion.document.split("#")[0];
  return "unknown";
}

export default function QCReport({ summary, rawReport, onSelectIssue, selectedIssue }) {
  const issues = getAssertionsFromReport(rawReport);

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Accessibility Issues</h2>

      {summary && (
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          <div style={{ background: "#fee2e2", padding: 10, borderRadius: 8, minWidth: 80, textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{summary.errors}</div>
            <div style={{ fontSize: 12 }}>Errors</div>
          </div>
          <div style={{ background: "#fef3c7", padding: 10, borderRadius: 8, minWidth: 80, textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{summary.warnings}</div>
            <div style={{ fontSize: 12 }}>Warnings</div>
          </div>
          <div style={{ background: "#dcfce7", padding: 10, borderRadius: 8, minWidth: 80, textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{summary.passes}</div>
            <div style={{ fontSize: 12 }}>Passes</div>
          </div>
        </div>
      )}

      {issues.length === 0 && (
        <div style={{ color: "#6b7280" }}>No issues found (run QC to populate issues).</div>
      )}

      <div>
        {issues.map((issue, idx) => {
          const title = getIssueTitle(issue) || `Issue #${idx + 1}`;
          const docPath = getDocPath(issue) || "unknown";
          const isSelected = selectedIssue === issue;

          return (
            <div
              key={idx}
              onClick={() => onSelectIssue && onSelectIssue(issue)}
              style={{
                border: isSelected ? "2px solid #2563eb" : "1px solid #e5e7eb",
                padding: 12,
                borderRadius: 8,
                background: isSelected ? "#eff6ff" : "#fff5f5",
                marginBottom: 12,
                cursor: "pointer",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 16 }}>
                Issue #{idx + 1}: {title}
              </div>

              <div style={{ marginTop: 6, fontSize: 13, color: "#374151" }}>
                <span style={{ marginRight: 12 }}>
                  <strong>Impact:</strong>{" "}
                  {(issue.impact || (issue.result && issue.result.impact) || "unknown")}
                </span>
                <span>
                  <strong>Document:</strong> {docPath}
                </span>
              </div>

              <div style={{ marginTop: 8, color: "#6b7280", fontSize: 13 }}>
                Click to inspect this issue's HTML in the editor.
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
