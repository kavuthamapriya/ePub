import React from "react";

/**
 * Helper: flatten nested Ace assertions so that each leaf assertion becomes one "issue".
 */
function flattenAssertions(list) {
  const result = [];

  function walk(a) {
    
    if (!a) return;

    // DAISY Ace sometimes nests assertions
    if (Array.isArray(a.assertions) && a.assertions.length > 0) {
      a.assertions.forEach(child => walk(child));
    } else if (Array.isArray(a["earl:assertions"]) && a["earl:assertions"].length > 0) {
      a["earl:assertions"].forEach(child => walk(child));
    } else {
      // leaf assertion
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
  const topLevel =
    rawReport.assertions ||
    rawReport["earl:assertions"] ||
    [];
  return flattenAssertions(topLevel);
}

/**
 * Produce a readable short title for an assertion.
 * Correctly reads from earl:test (DAISY Ace standard).
 */
function shortTitleForAssertion(a) {
  if (!a) return "Unnamed issue";

  const test = a["earl:test"] || a.test || {};

  const desc =
    test["dct:title"] ||
    test["dct:description"] ||
    a["dct:description"] ||
    a.description ||
    null;

  if (desc && typeof desc === "string") {
    return desc.length > 80 ? desc.slice(0, 80) + "…" : desc;
  }

  // fallback – small JSON preview
  try {
    const s = JSON.stringify(a);
    return s.length > 80 ? s.slice(0, 80) + "…" : s;
  } catch (e) {
    return "Unnamed issue";
  }
}

/**
 * Extract impact / outcome from DAISY Ace EARL result.
 */
function getImpact(a) {
  return (
    a?.["earl:result"]?.["earl:outcome"] ||
    a?.result?.["earl:outcome"] ||
    a?.result?.outcome ||
    "unknown"
  );
}

/**
 * Extract document path from assertion.
 */
function getDocument(a) {
  const doc =
    a?.subject?.source ||
    a?.subject?.["@id"] ||
    a?.["earl:subject"]?.source ||
    a?.["earl:subject"]?.["@id"] ||
    a?.document ||
    a?.path ||
    null;

  if (doc) return doc;

  // GLOBAL EPUB RULES (no specific file)
  const ruleId = a?.["earl:test"]?.["@id"] || "";
  if (ruleId.includes("pagelist")) return "EPUB navigation (page-list)";
  if (ruleId.includes("nav")) return "EPUB navigation";
  if (ruleId.includes("package")) return "OPF package document";

  return "EPUB (global)";
}


export default function QCReport({
  summary,
  rawReport,
  onSelectIssue,
  selectedIssue
}) {
  const assertions = getAssertionsFromReport(rawReport);

  const errors = summary ? summary.errors || 0 : 0;
  const warnings = summary ? summary.warnings || 0 : 0;
  const passes = summary ? summary.passes || 0 : 0;

  return (
    <div>
      {/* Summary cards */}
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
          <div style={{ color: "#6b7280" }}>
            No issues found (run QC to populate list).
          </div>
        ) : (
          assertions.map((a, idx) => {
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
                <div style={{ fontWeight: 700, marginBottom: 6 }}>
                  {`Issue #${idx + 1}: ${shortTitleForAssertion(a)}`}
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                  <div
                    style={{
                      background: "#e6e6e6",
                      padding: "4px 8px",
                      borderRadius: 999,
                      fontSize: 12
                    }}
                  >
                    Impact: {getImpact(a)}
                  </div>

                  <div
                    style={{
                      background: "#e6e6e6",
                      padding: "4px 8px",
                      borderRadius: 999,
                      fontSize: 12
                    }}
                  >
                    Document: {getDocument(a)}
                  </div>
                </div>

                <div style={{ color: "#6b7280" }}>
                  Click to inspect this issue&apos;s HTML in the editor.
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
