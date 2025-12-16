import React, { useState } from "react";
import { useConversionStore } from "../../store/useConversionStore";

/* ---------------- Layout styles ---------------- */

const pageWrapper = { padding: 20 };

const subtitleStyle = {
  fontSize: 13,
  color: "#6b7280",
  marginBottom: 20,
};

const grid = {
  display: "grid",
  gridTemplateColumns: "280px 1fr 320px",
  gap: 16,
};

const card = {
  background: "#ffffff",
  borderRadius: 12,
  padding: 14,
  boxShadow: "0 1px 3px rgba(15,23,42,0.08)",
  minHeight: 420,
};

const cardTitle = {
  fontSize: 14,
  fontWeight: 700,
  marginBottom: 10,
};

/* ---------------- Component ---------------- */

export default function TagMapping() {
  const {
    epubToc,
    selectedTocItem,
    setSelectedTocItem,
    selectedPageTags,
    selectedPageHref,
  } = useConversionStore();

  /* ---------- Local QC state (section-level) ---------- */
  const [qcLoading, setQcLoading] = useState(false);
  const [qcIssues, setQcIssues] = useState([]);

  /* ---------- Run QC for selected section ---------- */
  async function runQCForSection() {
    if (!selectedTocItem) return;

    try {
      setQcLoading(true);
      setQcIssues([]);

      const res = await fetch("http://localhost:8000/api/qc", {
        method: "POST",
      });

      const data = await res.json();

      const filtered = (data?.issues || []).filter((issue) => {
        const src =
          issue?.["earl:testSubject"]?.source ||
          issue?.document ||
          "";
        return src.includes(selectedTocItem.href);
      });

      setQcIssues(filtered);
    } catch (err) {
      console.error("QC failed:", err);
    } finally {
      setQcLoading(false);
    }
  }

  return (
    <div style={pageWrapper}>
      <div style={subtitleStyle}>
        Select a section from the EPUB Table of Contents to start mapping tags.
      </div>

      <div style={grid}>
        {/* ---------------- LEFT: EPUB TOC ---------------- */}
        <section style={card}>
          <div style={cardTitle}>EPUB Contents</div>

          {!epubToc || epubToc.length === 0 ? (
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              No TOC available. Load an EPUB first.
            </div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {epubToc.map((item) => {
                const active = selectedTocItem?.href === item.href;

                return (
                  <li key={item.href} style={{ marginBottom: 6 }}>
                    <button
                      onClick={() => setSelectedTocItem(item)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "6px 8px",
                        borderRadius: 6,
                        border: "none",
                        background: active ? "#2563eb" : "transparent",
                        color: active ? "#ffffff" : "#1f2937",
                        cursor: "pointer",
                        fontSize: 13,
                      }}
                    >
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ---------------- CENTER: TAGS ---------------- */}
        <section style={card}>
          <div style={cardTitle}>Tags in Selected Section</div>

          {!selectedTocItem ? (
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              Choose a TOC item to view its tags.
            </div>
          ) : (
            <>
              <div
                style={{
                  fontSize: 12,
                  color: "#6b7280",
                  marginBottom: 8,
                }}
              >
                Section: <b>{selectedTocItem.label}</b>
                <br />
                File: {selectedPageHref}
              </div>

              {!selectedPageTags || selectedPageTags.length === 0 ? (
                <div style={{ fontSize: 13, color: "#9ca3af" }}>
                  No tags detected on this page.
                </div>
              ) : (
                <ul style={{ paddingLeft: 16 }}>
                  {selectedPageTags.map((tag) => (
                    <li key={tag} style={{ fontSize: 13, marginBottom: 4 }}>
                      &lt;{tag}&gt;
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>

        {/* ---------------- RIGHT: QC / ERRORS ---------------- */}
        <section style={card}>
          <div style={cardTitle}>Error List</div>

          <button
            onClick={runQCForSection}
            disabled={!selectedTocItem || qcLoading}
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: 12,
              background: "#16a34a",
              color: "#ffffff",
              border: "none",
              borderRadius: 8,
              cursor: selectedTocItem ? "pointer" : "not-allowed",
            }}
          >
            {qcLoading ? "Running QC…" : "Run QC for this section"}
          </button>

          {qcIssues.length === 0 ? (
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              No issues found for this section.
            </div>
          ) : (
            qcIssues.map((issue, idx) => (
              <div
                key={idx}
                style={{
                  border: "1px solid #fecaca",
                  background: "#fff1f2",
                  padding: 10,
                  borderRadius: 8,
                  marginBottom: 8,
                }}
              >
                <b>{issue["dct:description"] || issue.type}</b>
                <div style={{ fontSize: 12 }}>
                  Impact: {issue["earl:outcome"]}
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
