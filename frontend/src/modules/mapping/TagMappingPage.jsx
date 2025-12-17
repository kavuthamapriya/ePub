// src/modules/tagMapping/TagMapping.jsx
import React from "react";
import { useConversionStore } from "../../store/useConversionStore";

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

const subtitleStyle = {
  fontSize: 13,
  color: "#6b7280",
  marginBottom: 16,
};

const grid = {
  display: "grid",
  gridTemplateColumns: "280px 1fr 300px",
  gap: 16,
};

const card = {
  background: "#fff",
  borderRadius: 12,
  padding: 14,
  boxShadow: "0 1px 3px rgba(15,23,42,0.08)",
};

const cardTitle = {
  fontSize: 14,
  fontWeight: 700,
  marginBottom: 10,
};

/* ----------------------------
   Component
----------------------------- */
export default function TagMapping() {
  const {
    epubToc,
    selectedTocItem,
    setSelectedTocItem,
    selectedPageTags,
    selectedPageHref,
    tagMappings,
    setTagMapping,
  } = useConversionStore();

  const currentMappings = tagMappings?.[selectedPageHref] || {};

  const unmappedTags = selectedPageTags?.filter(
    (tag) => !currentMappings[tag] || currentMappings[tag] === "Not mapped"
  );

  return (
    <div style={pageWrapper}>
      <div style={subtitleStyle}>
        Select a section from the EPUB Table of Contents to start mapping tags.
      </div>

      <div style={grid}>
        {/* ---------------- LEFT: EPUB TOC ---------------- */}
        <section style={card}>
          <div style={cardTitle}>EPUB Contents</div>

          <div
            style={{
              maxHeight: 420,
              overflowY: "auto",
              paddingRight: 6,
            }}
          >
            {!epubToc?.length ? (
              <div style={{ fontSize: 13, color: "#6b7280" }}>
                No TOC available.
              </div>
            ) : (
              epubToc.map((item) => {
                const active = selectedTocItem?.href === item.href;
                return (
                  <button
                    key={item.href}
                    onClick={() => setSelectedTocItem(item)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "6px 8px",
                      marginBottom: 4,
                      borderRadius: 6,
                      border: "none",
                      background: active ? "#2563eb" : "transparent",
                      color: active ? "#fff" : "#111827",
                      cursor: "pointer",
                      fontSize: 13,
                    }}
                  >
                    {item.label}
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* ---------------- CENTER: TAG MAPPING ---------------- */}
        <section style={card}>
          <div style={cardTitle}>Tags in Selected Section</div>

          {!selectedTocItem ? (
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              Select a TOC item to view tags.
            </div>
          ) : (
            <>
              <div
                style={{
                  fontSize: 12,
                  color: "#6b7280",
                  marginBottom: 10,
                }}
              >
                Section: <b>{selectedTocItem.label}</b>
                <br />
                File: {selectedPageHref}
              </div>

              <div
                style={{
                  maxHeight: 420,
                  overflowY: "auto",
                  paddingRight: 6,
                }}
              >
                {!selectedPageTags?.length ? (
                  <div style={{ fontSize: 13, color: "#9ca3af" }}>
                    No tags found on this page.
                  </div>
                ) : (
                  selectedPageTags.map((tag) => {
                    const value = currentMappings[tag] || "Not mapped";
                    const isMapped = value !== "Not mapped";

                    return (
                      <div
                        key={tag}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          marginBottom: 8,
                          padding: 10,
                          borderRadius: 8,
                          border: "1px solid #e5e7eb",
                          background: "#fffaf0",
                        }}
                      >
                        <div
                          style={{
                            width: 70,
                            fontFamily: "monospace",
                            fontSize: 13,
                          }}
                        >
                          &lt;{tag}&gt;
                        </div>

                        <select
                          value={value}
                          onChange={(e) =>
                            setTagMapping(
                              selectedPageHref,
                              tag,
                              e.target.value
                            )
                          }
                          style={{
                            flex: 1,
                            padding: "6px 10px",
                            borderRadius: 6,
                            border: "1px solid #d1d5db",
                            fontSize: 13,
                          }}
                        >
                          {ACCESSIBILITY_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>

                        {/* ✅ Green tick */}
                        <div style={{ width: 20, textAlign: "center" }}>
                          {isMapped && (
                            <span style={{ color: "#16a34a", fontSize: 16 }}>
                              ✔
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </section>

        {/* ---------------- RIGHT: QC + ERRORS ---------------- */}
        <section style={card}>
          <div style={cardTitle}>Error List</div>

          <button
            disabled={!selectedTocItem}
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: 12,
              background: selectedTocItem ? "#16a34a" : "#9ca3af",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: selectedTocItem ? "pointer" : "not-allowed",
            }}
          >
            Run QC for this section
          </button>

          {unmappedTags?.length > 0 && (
            <>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>
                Unmapped Tags
              </div>
              <ul style={{ paddingLeft: 16 }}>
                {unmappedTags.map((tag) => (
                  <li key={tag} style={{ color: "#dc2626", fontSize: 13 }}>
                    &lt;{tag}&gt;
                  </li>
                ))}
              </ul>
            </>
          )}

          {(!unmappedTags || unmappedTags.length === 0) && (
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              No issues found for this section.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
