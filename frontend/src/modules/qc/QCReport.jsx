// src/modules/qc/QCReport.jsx
import React, { useState } from "react";

const cardRow = {
  display: "flex",
  gap: 16,
  marginBottom: 24,
};

const cardBase = {
  flex: 1,
  padding: "16px 20px",
  borderRadius: 8,
  background: "#fff",
  boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
};

const sectionsContainer = {
  marginTop: 16,
};

const accordionItem = {
  background: "#fff",
  borderRadius: 8,
  marginBottom: 10,
  overflow: "hidden",
  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.06)",
};

const accordionHeader = {
  padding: "10px 14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 500,
};

const accordionBody = {
  padding: "10px 16px 14px 16px",
  borderTop: "1px solid #e5e7eb",
  fontSize: 13,
  lineHeight: 1.5,
  background: "#f9fafb",
};

function getOutcome(assertion) {
  const r = assertion["earl:result"] || assertion.result || {};
  const oc = (r["earl:outcome"] || r.outcome || "").toLowerCase();
  if (oc === "fail") return "error";
  if (oc === "warning" || oc === "warn") return "warning";
  if (oc === "pass") return "pass";
  return "other";
}

function normaliseAssertions(rawReport) {
  const arr = rawReport?.assertions || [];
  return arr.map((a, idx) => {
    const test = a["earl:test"] || a.test || {};
    const help = test.help || {};
    const title =
      test["dct:title"] || test.title || test["@id"] || `Issue #${idx + 1}`;
    const description =
      test["dct:description"] || test.description || "No description provided.";
    const impact =
      test["earl:impact"] || test.impact || (getOutcome(a) === "error" ? "serious" : "minor");

    // Often WCAG tags / rule ids live here:
    const tags = test.rulesetTags || test["rulesetTags"] || [];
    const wcag = Array.isArray(tags) && tags.length ? tags.join(", ") : "—";

    // Locations (DOM selectors / EPUB hrefs)
    const occurrences = (a.assertions || a.occurrences || []).map((occ) => {
      const loc = occ.location || occ["earl:location"] || {};
      return (
        loc.selector ||
        loc["cssSelector"] ||
        loc["xhtml:href"] ||
        loc["href"] ||
        JSON.stringify(loc)
      );
    });

    const outcome = getOutcome(a);

    return {
      key: a["@id"] || `${idx}`,
      outcome,
      title,
      description,
      impact,
      wcag,
      helpUrl: help.url || help.href || null,
      occurrences,
    };
  });
}

export default function QCReport({ summary, rawReport }) {
  const [openKey, setOpenKey] = useState(null);

  if (!rawReport) {
    return (
      <p style={{ color: "#6b7280", marginTop: 8 }}>
        No QC run yet. Click <strong>Run QC</strong> to generate a DAISY Ace
        report.
      </p>
    );
  }

  const issues = normaliseAssertions(rawReport).filter(
    (i) => i.outcome === "error" || i.outcome === "warning"
  );
  const passes = normaliseAssertions(rawReport).filter(
    (i) => i.outcome === "pass"
  );

  const errorsCount = summary?.errors ?? issues.filter((i) => i.outcome === "error").length;
  const warningsCount =
    summary?.warnings ?? issues.filter((i) => i.outcome === "warning").length;
  const passesCount = summary?.passes ?? passes.length;

  return (
    <div>
      {/* Top cards */}
      <div style={cardRow}>
        <div
          style={{
            ...cardBase,
            borderTop: "4px solid #ef4444",
          }}
        >
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>
            Errors
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#b91c1c" }}>
            {errorsCount}
          </div>
        </div>

        <div
          style={{
            ...cardBase,
            borderTop: "4px solid #f59e0b",
          }}
        >
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>
            Warnings
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#92400e" }}>
            {warningsCount}
          </div>
        </div>

        <div
          style={{
            ...cardBase,
            borderTop: "4px solid #22c55e",
          }}
        >
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>
            Passes
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#15803d" }}>
            {passesCount}
          </div>
        </div>
      </div>

      {/* Issues list */}
      <div style={sectionsContainer}>
        <h3 style={{ margin: "0 0 10px 0" }}>Accessibility Issues</h3>
        {issues.length === 0 && (
          <p style={{ color: "#16a34a", fontSize: 14 }}>
            ✅ No errors or warnings reported. Great job!
          </p>
        )}

        {issues.map((issue) => {
          const open = openKey === issue.key;
          const headerBg =
            issue.outcome === "error"
              ? "#fee2e2"
              : issue.outcome === "warning"
              ? "#fef3c7"
              : "#e0f2fe";

          return (
            <div key={issue.key} style={accordionItem}>
              <div
                style={{ ...accordionHeader, background: headerBg }}
                onClick={() =>
                  setOpenKey(open ? null : issue.key)
                }
              >
                <div>
                  <div style={{ fontSize: 13, marginBottom: 2 }}>
                    <strong>{issue.title}</strong>
                  </div>
                  <div style={{ fontSize: 12, color: "#4b5563" }}>
                    WCAG: <strong>{issue.wcag}</strong> &nbsp;|&nbsp; Impact:{" "}
                    <strong>{issue.impact}</strong>
                  </div>
                </div>
                <span style={{ fontSize: 16 }}>
                  {open ? "▲" : "▼"}
                </span>
              </div>

              {open && (
                <div style={accordionBody}>
                  <p style={{ marginTop: 0, marginBottom: 8 }}>
                    {issue.description}
                  </p>
                  {issue.helpUrl && (
                    <p style={{ margin: "0 0 8px 0" }}>
                      <a
                        href={issue.helpUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View guidance
                      </a>
                    </p>
                  )}
                  {issue.occurrences && issue.occurrences.length > 0 && (
                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          marginBottom: 4,
                          fontSize: 12,
                        }}
                      >
                        Occurrences
                      </div>
                      <ul
                        style={{
                          margin: 0,
                          paddingLeft: 18,
                          maxHeight: 160,
                          overflow: "auto",
                        }}
                      >
                        {issue.occurrences.map((loc, i) => (
                          <li key={i} style={{ marginBottom: 2 }}>
                            <code>{loc}</code>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
