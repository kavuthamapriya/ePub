import React, { useMemo, useState } from "react";

/**
 * Extract human-friendly issue objects from a DAISY Ace JSON report.
 * Ace structure (simplified):
 *   report.assertions[]                         -> document-level assertions
 *   docAssertion.assertions[]                   -> test-level assertions (only failures)
 *   each test assertion:
 *     - earl:test: { "earl:impact", "dct:title", "dct:description", help: {...} }
 *     - earl:result: { "earl:outcome", "dct:description", "earl:pointer": {...} }
 */
function extractIssuesFromAceReport(rawReport) {
  if (!rawReport || typeof rawReport !== "object") return [];

  const docAssertions = Array.isArray(rawReport.assertions)
    ? rawReport.assertions
    : [];

  const issues = [];

  docAssertions.forEach((docAssertion) => {
    const subject = docAssertion["earl:testSubject"] || {};
    const docTitle =
      subject["dct:title"] ||
      subject.title ||
      subject.url ||
      "EPUB Document";
    const docUrl = subject.url || "";

    const testAssertions = Array.isArray(docAssertion.assertions)
      ? docAssertion.assertions
      : [];

    testAssertions.forEach((a) => {
      const result = a["earl:result"] || {};
      const outcome = result["earl:outcome"];

      // Ace only outputs failing tests, but keep the guard.
      if (outcome && outcome !== "fail") return;

      const test = a["earl:test"] || {};
      const impact = test["earl:impact"] || test.impact || "unknown";

      const title =
        test["dct:title"] ||
        test.title ||
        "Unnamed accessibility rule";

      const description =
        result["dct:description"] ||
        test["dct:description"] ||
        test.description ||
        "No description provided.";

      const help = test.help || {};
      const helpTitle = help["dct:title"] || help.title || "";
      const wcagLabel = helpTitle || "WCAG / Rule";

      const helpUrl = help.url || "";

      const pointer = result["earl:pointer"] || {};
      const pointers = [];

      if (Array.isArray(pointer.cfi)) {
        pointer.cfi.forEach((cfi) =>
          pointers.push({ type: "EPUB CFI", value: cfi })
        );
      }
      if (Array.isArray(pointer.css)) {
        pointer.css.forEach((css) =>
          pointers.push({ type: "CSS", value: css })
        );
      }

      issues.push({
        id: issues.length + 1,
        outcome,
        impact,
        title,
        description,
        wcagLabel,
        helpUrl,
        docTitle,
        docUrl,
        pointers,
      });
    });
  });

  return issues;
}

const cardBase = {
  flex: 1,
  padding: "14px 18px",
  borderRadius: 8,
  background: "#fff",
  border: "1px solid #e5e7eb",
};

const badgeBase = {
  display: "inline-block",
  fontSize: 12,
  padding: "3px 8px",
  borderRadius: 999,
  background: "#f3f4f6",
  marginRight: 8,
};

export default function QCReport({ summary, rawReport }) {
  const [openIssueId, setOpenIssueId] = useState(null);

  const errors = summary?.errors ?? 0;
  const warnings = summary?.warnings ?? 0;
  const passes = summary?.passes ?? 0;

  // Parse the Ace JSON only once per change
  const issues = useMemo(
    () => extractIssuesFromAceReport(rawReport),
    [rawReport]
  );

  const hasAnyIssues = issues.length > 0;
  const hasProblems = errors + warnings > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Summary cards */}
      <div style={{ display: "flex", gap: 16 }}>
        <div style={{ ...cardBase, borderTop: "4px solid #ef4444" }}>
          <div style={{ fontSize: 13, color: "#6b7280" }}>Errors</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#b91c1c" }}>
            {errors}
          </div>
        </div>
        <div style={{ ...cardBase, borderTop: "4px solid #f59e0b" }}>
          <div style={{ fontSize: 13, color: "#6b7280" }}>Warnings</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#b45309" }}>
            {warnings}
          </div>
        </div>
        <div style={{ ...cardBase, borderTop: "4px solid #22c55e" }}>
          <div style={{ fontSize: 13, color: "#6b7280" }}>Passes</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#15803d" }}>
            {passes}
          </div>
        </div>
      </div>

      {/* Issues header */}
      <div style={{ marginTop: 8, marginBottom: 4, fontWeight: 600 }}>
        Accessibility Issues
      </div>

      {/* If parse produced issues, render them */}
      {hasAnyIssues && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {issues.map((issue) => {
            const isOpen = openIssueId === issue.id;

            return (
              <div
                key={issue.id}
                style={{
                  borderRadius: 8,
                  border: "1px solid #fecaca",
                  background: "#fee2e2",
                  overflow: "hidden",
                }}
              >
                {/* Header row */}
                <button
                  type="button"
                  onClick={() =>
                    setOpenIssueId(isOpen ? null : issue.id)
                  }
                  style={{
                    all: "unset",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                    padding: "10px 14px",
                    cursor: "pointer",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, color: "#6b7280" }}>
                      Issue #{issue.id}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      {issue.title}
                    </div>
                    <div style={{ marginTop: 4 }}>
                      <span style={badgeBase}>
                        WCAG: {issue.wcagLabel}
                      </span>
                      <span style={badgeBase}>
                        Impact: {issue.impact}
                      </span>
                      {issue.docTitle && (
                        <span style={badgeBase}>
                          Document: {issue.docTitle}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    aria-hidden="true"
                    style={{ fontSize: 16, paddingLeft: 8 }}
                  >
                    {isOpen ? "▲" : "▼"}
                  </span>
                </button>

                {/* Body */}
                {isOpen && (
                  <div
                    style={{
                      borderTop: "1px solid #fecaca",
                      padding: "10px 14px 12px",
                      background: "#fff",
                    }}
                  >
                    <div style={{ marginBottom: 8 }}>
                      <strong>Description:</strong>
                      <div style={{ marginTop: 4, fontSize: 14 }}>
                        {issue.description}
                      </div>
                    </div>

                    {issue.pointers?.length > 0 && (
                      <div style={{ marginBottom: 8 }}>
                        <strong>Occurrences:</strong>
                        <ul
                          style={{
                            margin: "4px 0 0 18px",
                            padding: 0,
                            fontSize: 13,
                          }}
                        >
                          {issue.pointers.map((p, idx) => (
                            <li key={idx}>
                              <code>{p.type}</code>: {p.value}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {issue.helpUrl && (
                      <div style={{ fontSize: 13 }}>
                        <a
                          href={issue.helpUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open DAISY KB / WCAG guidance
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* If no issues and also no errors/warnings -> clean EPUB */}
      {!hasAnyIssues && !hasProblems && (
        <div
          style={{
            padding: "10px 12px",
            borderRadius: 6,
            background: "#ecfdf3",
            border: "1px solid #bbf7d0",
            color: "#166534",
            fontSize: 14,
          }}
        >
          No accessibility issues reported by DAISY Ace.
        </div>
      )}

      {/* If no issues, but summary shows errors/warnings -> parsing fallback */}
      {!hasAnyIssues && hasProblems && (
        <div
          style={{
            padding: "10px 12px",
            borderRadius: 6,
            background: "#fef3c7",
            border: "1px solid #facc15",
            color: "#92400e",
            fontSize: 14,
          }}
        >
          DAISY Ace reported <strong>{errors}</strong> errors and{" "}
          <strong>{warnings}</strong> warnings, but the detailed issue list
          couldn’t be parsed from the JSON report.
          <br />
          Please open the full DAISY Ace HTML/JSON report for exact locations
          and descriptions.
        </div>
      )}
    </div>
  );
}
