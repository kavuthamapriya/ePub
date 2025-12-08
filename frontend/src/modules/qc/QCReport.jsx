// src/modules/qc/QCReport.jsx
import React, { useState } from "react";

/**
 * Props:
 *  - summary: { errors, warnings, passes }
 *  - report: full DAISY Ace JSON report
 */
export default function QCReport({ summary, report }) {
  if (!report) return null;

  const assertions = report.assertions || [];
  const [openId, setOpenId] = useState(null);

  return (
    <div style={styles.wrapper}>
      {/* ---------- SUMMARY ---------- */}
      <div style={styles.summaryRow}>
        <SummaryCard label="Errors" value={summary.errors} color="#dc2626" />
        <SummaryCard label="Warnings" value={summary.warnings} color="#f59e0b" />
        <SummaryCard label="Passes" value={summary.passes} color="#16a34a" />
      </div>

      {/* ---------- ISSUES ---------- */}
      <h3 style={{ marginTop: 24 }}>Accessibility Issues</h3>

      {assertions.length === 0 && (
        <div style={styles.successBox}>
          ✅ No accessibility issues found. EPUB is WCAG compliant.
        </div>
      )}

      {assertions.map((item, idx) => {
        const isOpen = openId === idx;

        return (
          <div key={idx} style={styles.issueBox}>
            <div
              style={styles.issueHeader}
              onClick={() => setOpenId(isOpen ? null : idx)}
            >
              <div>
                <strong>{item.assertionId}</strong>
                <div style={styles.small}>
                  WCAG: {item.rule?.wcag || "—"} | Impact:{" "}
                  <span style={{ fontWeight: 600 }}>
                    {item.impact?.toUpperCase()}
                  </span>
                </div>
              </div>

              <span>{isOpen ? "▲" : "▼"}</span>
            </div>

            {isOpen && (
              <div style={styles.issueBody}>
                <p>{item.description}</p>

                <h4>Occurrences</h4>
                <ul>
                  {(item.locations || []).map((loc, i) => (
                    <li key={i}>
                      <strong>File:</strong> {loc.path}
                      {loc.element && (
                        <>
                          <br />
                          <strong>Element:</strong> {loc.element}
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- SMALL COMPONENT ---------- */
function SummaryCard({ label, value, color }) {
  return (
    <div style={{ ...styles.card, borderTop: `4px solid ${color}` }}>
      <div style={styles.cardValue}>{value}</div>
      <div style={styles.cardLabel}>{label}</div>
    </div>
  );
}

/* ---------- STYLES ---------- */
const styles = {
  wrapper: {
    marginTop: 16,
    background: "#ffffff",
    padding: 16,
    borderRadius: 8,
  },
  summaryRow: {
    display: "flex",
    gap: 12,
  },
  card: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    background: "#f9fafb",
    textAlign: "center",
  },
  cardValue: {
    fontSize: 28,
    fontWeight: 700,
  },
  cardLabel: {
    marginTop: 4,
    color: "#374151",
    fontWeight: 500,
  },
  issueBox: {
    marginTop: 12,
    border: "1px solid #e5e7eb",
    borderRadius: 6,
    overflow: "hidden",
  },
  issueHeader: {
    padding: 12,
    background: "#f3f4f6",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  issueBody: {
    padding: 12,
    background: "#ffffff",
  },
  small: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  successBox: {
    padding: 16,
    background: "#ecfdf5",
    color: "#065f46",
    borderRadius: 6,
    marginTop: 12,
    fontWeight: 600,
  },
};
