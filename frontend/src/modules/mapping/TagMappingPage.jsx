// src/modules/tagMapping/TagMappingPage.jsx
import React from "react";
import { useConversionStore } from "../../store/useConversionStore";
import QCSummaryBar from "../qc/QCSummaryBar";

/* ----------------------------
   Constants
----------------------------- */
const ACCESSIBILITY_OPTIONS = [
  "Not mapped",
  "Chapter Title",
  "Section Title",
  "Paragraph",
  "Figure",
  "Table",
  "List",
  "Reference",
];

/* ----------------------------
   Styles
----------------------------- */
const pageWrapper = { padding: 20 };

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
};

const cardTitle = {
  fontSize: 14,
  fontWeight: 700,
  marginBottom: 10,
};

/* Tag row */
const tagRow = {
  display: "grid",
  gridTemplateColumns: "90px 1fr 20px",
  alignItems: "center",
  gap: 10,
  padding: "8px 10px",
  marginBottom: 6,
  borderRadius: 8,
  background: "#fffaf0",
  border: "1px solid #e5e7eb",
};

const tagCode = {
  fontFamily: "monospace",
  fontSize: 13,
  color: "#111827",
};

const selectStyle = {
  width: "100%",
  padding: "6px 10px",
  borderRadius: 6,
  border: "1px solid #d1d5db",
  fontSize: 13,
  background: "#ffffff",
};

/* ----------------------------
   Component
----------------------------- */
export default function TagMappingPage() {
  const {
    bookId,
    epubToc,
    selectedTocItem,
    selectedPageHref,
    selectedPageHtml,
    selectedPageTags,
    tagMappings,

    setSelectedTocItem,
    setSelectedPageHref,
    setSelectedPageHtml,
    setTagMapping,
  } = useConversionStore();

  if (!bookId) return null;

  const currentMappings = tagMappings[selectedPageHref] || {};

  const unmappedTags =
    selectedPageTags?.filter(
      (tag) =>
        !currentMappings[tag] ||
        currentMappings[tag] === "Not mapped"
    ) || [];

  /* ----------------------------
     Load XHTML
  ----------------------------- */
  const loadXhtml = async (item) => {
    setSelectedTocItem(item);
    setSelectedPageHref(item.href);
    setSelectedPageHtml("Loading XHTML…");

    try {
      const res = await fetch(
        `http://localhost:8000/api/epub/xhtml?book_id=${bookId}&href=${encodeURIComponent(
          item.href
        )}`
      );

      const text = await res.text();

      if (!res.ok) {
        setSelectedPageHtml(`Failed to load XHTML (${res.status})\n\n${text}`);
        return;
      }

      setSelectedPageHtml(text);
    } catch (err) {
      setSelectedPageHtml(`Network error\n\n${err.message}`);
    }
  };

  return (
    <div style={pageWrapper}>
      <QCSummaryBar />

      <div style={grid}>
        {/* ---------------- LEFT: TOC ---------------- */}
        <section style={card}>
          <div style={cardTitle}>EPUB Contents</div>

          <div style={{ maxHeight: 420, overflowY: "auto" }}>
            {epubToc.map((item) => {
              const active = selectedTocItem?.href === item.href;

              return (
                <button
                  key={item.href}
                  onClick={() => loadXhtml(item)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "6px 8px",
                    marginBottom: 4,
                    borderRadius: 6,
                    border: "none",
                    background: active ? "#2563eb" : "transparent",
                    color: active ? "#ffffff" : "#111827",
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* ---------------- CENTER: TAGS + XHTML ---------------- */}
        <section style={card}>
          <div style={cardTitle}>Tags & XHTML</div>

          {!selectedTocItem ? (
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              Select a TOC item to load XHTML.
            </div>
          ) : (
            <>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 10 }}>
                Section: <b>{selectedTocItem.label}</b>
                <br />
                File: {selectedPageHref}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                {/* TAG LIST */}
                <div style={{ maxHeight: 380, overflowY: "auto" }}>
                  {selectedPageTags.map((tag) => {
                    const value = currentMappings[tag] || "Not mapped";
                    const mapped = value !== "Not mapped";

                    return (
                      <div key={tag} style={tagRow}>
                        <div style={tagCode}>&lt;{tag}&gt;</div>

                        <select
                          value={value}
                          onChange={(e) =>
                            setTagMapping(
                              selectedPageHref,
                              tag,
                              e.target.value
                            )
                          }
                          style={selectStyle}
                        >
                          {ACCESSIBILITY_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>

                        <div style={{ textAlign: "center" }}>
                          {mapped && (
                            <span style={{ color: "#16a34a" }}>✔</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* XHTML PREVIEW */}
                <pre
                  style={{
                    maxHeight: 380,
                    overflow: "auto",
                    background: "#0b1120",
                    color: "#e5e7eb",
                    padding: 10,
                    borderRadius: 8,
                    fontSize: 12,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {selectedPageHtml || "XHTML not loaded"}
                </pre>
              </div>
            </>
          )}
        </section>

        {/* ---------------- RIGHT: ERRORS ---------------- */}
        <section style={card}>
          <div style={cardTitle}>Error List</div>

          {unmappedTags.length > 0 ? (
            <ul style={{ paddingLeft: 16 }}>
              {unmappedTags.map((tag) => (
                <li key={tag} style={{ color: "#dc2626", fontSize: 13 }}>
                  &lt;{tag}&gt;
                </li>
              ))}
            </ul>
          ) : (
            <div style={{ color: "#16a34a", fontSize: 13 }}>
              No issues found for this section ✔
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
