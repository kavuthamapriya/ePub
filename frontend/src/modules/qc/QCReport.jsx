// src/modules/qc/QCReport.jsx
import React, { useEffect, useMemo, useState } from "react";

/**
 * Strip script tags from the DAISY Ace HTML report that try to load
 * local JS files (jquery / bootstrap / datatables). They don't exist
 * in your React app, they just spam 404 + "$ is not defined".
 */
function sanitizeAceHtml(html) {
  if (!html) return "";

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // ✅ Remove ALL <script> tags (inline + external)
    doc.querySelectorAll("script").forEach((s) => s.remove());

    // ✅ Remove inline JS handlers (onclick, onload, etc.)
    doc.querySelectorAll("*").forEach((el) => {
      [...el.attributes].forEach((attr) => {
        if (attr.name.startsWith("on")) {
          el.removeAttribute(attr.name);
        }
      });
    });

    return "<!doctype html>\n" + doc.documentElement.outerHTML;
  } catch (e) {
    console.error("sanitizeAceHtml failed:", e);
    return html;
  }
}


/**
 * Extract a friendlier list of issues from the Ace JSON report.
 * We try multiple fields so names like "epub-pagelist-broken" appear,
 * not just "Issue #1".
 */
function extractIssues(rawReport) {
  if (!rawReport) return [];

  const assertions =
    rawReport["earl:assertions"] ||
    rawReport.assertions ||
    [];

  return assertions.map((a, index) => {
    const test = a["earl:test"] || a.test || {};
    const result = a["earl:result"] || a.result || {};
    const subject = a["earl:subject"] || a.subject || {};

    // Title / rule id
    const title =
      test["dct:title"] ||
      test["title"] ||
      test["earl:title"] ||
      a["dct:title"] ||
      a["title"] ||
      `Issue #${index + 1}`;

    // WCAG string, if present
    const wcag =
      a["wcag"] ||
      test["wcag"] ||
      result["wcag"] ||
      "";

    // Impact / severity: Ace usually encodes it in the outcome + description.
    let impact =
      result["impact"] ||
      result["dct:impact"] ||
      "unknown";

    const outcomeRaw =
      result["earl:outcome"] ||
      result["outcome"] ||
      "";

    const outcome = String(outcomeRaw).toLowerCase();
    if (!impact || impact === "unknown") {
      if (outcome.includes("fail")) impact = "serious";
      else if (outcome.includes("warn")) impact = "moderate";
    }

    const documentPath =
      subject["dct:source"] ||
      subject["source"] ||
      subject["title"] ||
      "unknown";

    const description =
      result["dct:description"] ||
      result["description"] ||
      "";

    // Some Ace rules may include inline HTML snippets; many don't.
    const htmlSnippet =
      result["html"] ||
      result["snippet"] ||
      "";

    return {
      id: index,
      title: String(title),
      wcag: String(wcag || "—"),
      impact: String(impact || "unknown"),
      document: String(documentPath || "unknown"),
      description: String(description || ""),
      htmlSnippet,
    };
  });
}

const cardsRow = {
  display: "flex",
  gap: 16,
  marginBottom: 16,
};

const cardBase = {
  flex: 1,
  borderRadius: 8,
  padding: 12,
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
};

const issuesLayout = {
  display: "flex",
  gap: 16,
  flex: 1,
  minHeight: 0, // so children flex correctly inside parent
};

const issuesListStyle = {
  flex: 1,
  overflowY: "auto",
  paddingRight: 4,
};

const rightColumnStyle = {
  width: "40%",
  minWidth: 360,
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const panelStyle = {
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  background: "#fff",
  padding: 12,
  boxSizing: "border-box",
};

export default function QCReport({ summary, rawReport, reportHtml }) {
  const issues = useMemo(() => extractIssues(rawReport), [rawReport]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [sanitizedHtml, setSanitizedHtml] = useState("");

  useEffect(() => {
    setSelectedIndex(0);
  }, [issues.length]);

  useEffect(() => {
    setSanitizedHtml(sanitizeAceHtml(reportHtml || ""));
  }, [reportHtml]);

  const selectedIssue = issues[selectedIndex] || null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Summary cards */}
      <div style={cardsRow}>
        <div
          style={{
            ...cardBase,
            borderTop: "4px solid #ef4444",
          }}
        >
          <div style={{ fontSize: 14, color: "#6b7280" }}>Errors</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#b91c1c" }}>
            {summary?.errors ?? 0}
          </div>
        </div>

        <div
          style={{
            ...cardBase,
            borderTop: "4px solid #f59e0b",
          }}
        >
          <div style={{ fontSize: 14, color: "#6b7280" }}>Warnings</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#b45309" }}>
            {summary?.warnings ?? 0}
          </div>
        </div>

        <div
          style={{
            ...cardBase,
            borderTop: "4px solid #10b981",
          }}
        >
          <div style={{ fontSize: 14, color: "#6b7280" }}>Passes</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#047857" }}>
            {summary?.passes ?? 0}
          </div>
        </div>
      </div>

      {/* Issues + Right column */}
      <div style={issuesLayout}>
        {/* LEFT: issues list */}
        <div style={issuesListStyle}>
          <h3 style={{ marginTop: 0, marginBottom: 8 }}>Accessibility Issues</h3>

          {issues.length === 0 ? (
            <div
              style={{
                padding: 12,
                borderRadius: 6,
                background: "#ecfdf5",
                color: "#166534",
                fontSize: 14,
              }}
            >
              No accessibility issues reported by DAISY Ace.
            </div>
          ) : (
            issues.map((issue, idx) => {
              const isSelected = idx === selectedIndex;

              return (
                <div
                  key={issue.id}
                  onClick={() => setSelectedIndex(idx)}
                  style={{
                    marginBottom: 10,
                    padding: 12,
                    borderRadius: 8,
                    border: isSelected
                      ? "2px solid #2563eb"
                      : "1px solid #fecaca",
                    background: isSelected ? "#eff6ff" : "#fee2e2",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      marginBottom: 4,
                      fontSize: 14,
                    }}
                  >
                    {`Issue #${idx + 1}: ${issue.title}`}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    <span
                      style={{
                        fontSize: 12,
                        padding: "2px 6px",
                        borderRadius: 999,
                        background: "#f3f4f6",
                      }}
                    >
                      WCAG: {issue.wcag || "—"}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        padding: "2px 6px",
                        borderRadius: 999,
                        background: "#fee2e2",
                        color: "#b91c1c",
                      }}
                    >
                      Impact: {issue.impact}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        padding: "2px 6px",
                        borderRadius: 999,
                        background: "#e5e7eb",
                      }}
                    >
                      Document: {issue.document}
                    </span>
                  </div>

                  {issue.description && (
                    <p
                      style={{
                        marginTop: 8,
                        marginBottom: 0,
                        fontSize: 13,
                        color: "#4b5563",
                      }}
                    >
                      {issue.description}
                    </p>
                  )}

                  <p
                    style={{
                      marginTop: 6,
                      marginBottom: 0,
                      fontSize: 12,
                      color: "#6b7280",
                    }}
                  >
                    Click to inspect this issue’s HTML (if available) in the
                    Issue Inspector.
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* RIGHT: Ace HTML report + Issue inspector */}
        <div style={rightColumnStyle}>
          {/* Ace HTML report */}
          <div style={panelStyle}>
            <h3
              style={{
                marginTop: 0,
                marginBottom: 4,
                fontSize: 15,
              }}
            >
              DAISY Ace HTML Report
            </h3>
            <p
              style={{
                fontSize: 12,
                color: "#6b7280",
                marginTop: 0,
                marginBottom: 8,
              }}
            >
              This is the full DAISY Ace HTML report for the current EPUB.
            </p>
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                height: 260,
                overflow: "hidden",
                background: "#f9fafb",
              }}
            >
              {sanitizedHtml ? (
                <iframe
                  title="DAISY Ace HTML report"
                  srcDoc={sanitizedHtml}
                  style={{ width: "100%", height: "100%", border: "none" }}
                  sandbox="allow-same-origin allow-forms allow-pointer-lock allow-scripts allow-popups allow-modals"
                />
              ) : (
                <div
                  style={{
                    padding: 12,
                    fontSize: 13,
                    color: "#6b7280",
                  }}
                >
                  Run QC to view the full DAISY Ace HTML report here.
                </div>
              )}
            </div>
          </div>

          {/* Issue HTML inspector */}
          <div style={panelStyle}>
            <h3
              style={{
                marginTop: 0,
                marginBottom: 4,
                fontSize: 15,
              }}
            >
              Issue HTML Inspector
            </h3>
            <p
              style={{
                fontSize: 12,
                color: "#6b7280",
                marginTop: 0,
                marginBottom: 8,
              }}
            >
              Click an issue in the list to inspect its HTML snippet (if
              available). You can edit the snippet locally here.
            </p>
            <p
              style={{
                fontSize: 11,
                color: "#6b7280",
                marginTop: 0,
                marginBottom: 8,
              }}
            >
              <strong>Note:</strong> edits here are only in the browser. To
              actually fix the EPUB, you’ll need a backend endpoint that writes
              the edited HTML back into the EPUB and re-runs QC.
            </p>

            {selectedIssue ? (
              <>
                <div
                  style={{
                    fontSize: 13,
                    marginBottom: 4,
                  }}
                >
                  <strong>{`Issue #${selectedIndex + 1}: ${selectedIssue.title}`}</strong>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#4b5563",
                    marginBottom: 8,
                  }}
                >
                  <div>Document: {selectedIssue.document}</div>
                  <div>Impact: {selectedIssue.impact}</div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "stretch",
                    minHeight: 140,
                  }}
                >
                  {/* HTML source (editable locally) */}
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 12,
                        marginBottom: 4,
                        color: "#374151",
                      }}
                    >
                      HTML source (local edits)
                    </div>
                    <div
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 4,
                        background: "#f9fafb",
                        height: 140,
                        overflow: "hidden",
                      }}
                    >
                      {selectedIssue.htmlSnippet ? (
                        <textarea
                          defaultValue={selectedIssue.htmlSnippet}
                          style={{
                            width: "100%",
                            height: "100%",
                            border: "none",
                            resize: "none",
                            fontFamily: "monospace",
                            fontSize: 12,
                            padding: 6,
                            boxSizing: "border-box",
                            background: "transparent",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            fontSize: 12,
                            color: "#6b7280",
                            padding: 8,
                          }}
                        >
                          <strong>No HTML snippet available.</strong>{" "}
                          The selected issue does not include an inline HTML
                          snippet in the DAISY Ace JSON report. You may need to
                          open the referenced XHTML file directly in an editor
                          to fix it.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Preview – just echo the snippet */}
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 12,
                        marginBottom: 4,
                        color: "#374151",
                      }}
                    >
                      Preview
                    </div>
                    <div
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 4,
                        background: "#f9fafb",
                        height: 140,
                        overflow: "auto",
                        padding: 6,
                        fontFamily: "monospace",
                        fontSize: 12,
                      }}
                    >
                      {selectedIssue.htmlSnippet ? (
                        <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                          {selectedIssue.htmlSnippet}
                        </pre>
                      ) : (
                        <div style={{ fontSize: 12, color: "#6b7280" }}>
                          No HTML snippet available for this issue.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div
                style={{
                  fontSize: 13,
                  color: "#6b7280",
                  marginTop: 8,
                }}
              >
                Select an issue in the list to inspect its details here.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
