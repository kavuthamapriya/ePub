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

export default function TagMapping() {
  const {
    epubFile,
    epubToc,
    selectedTocItem,
    setSelectedTocItem,
    selectedPageHref,
    selectedPageHtml,
    selectedPageTags,
    tagMappings,
    setTagMapping,
    setSelectedPageHref,
    setSelectedPageHtml,
  } = useConversionStore();

  // ⛔ Do not render before EPUB upload
  if (!epubFile) return null;

  const currentMappings = tagMappings?.[selectedPageHref] || {};
  const unmappedTags =
    selectedPageTags?.filter(
      (tag) =>
        !currentMappings[tag] ||
        currentMappings[tag] === "Not mapped"
    ) || [];

  return (
    <div style={pageWrapper}>
      {/* QC summary */}
      <QCSummaryBar />

      <h2 style={{ marginTop: 10 }}>Tag Mapping</h2>

      <div style={grid}>
        {/* ---------------- LEFT: EPUB TOC ---------------- */}
        <section style={card}>
          <div style={cardTitle}>EPUB Contents</div>

          <div style={{ maxHeight: 420, overflowY: "auto" }}>
            {epubToc.map((item) => {
              const active = selectedTocItem?.href === item.href;

              return (
                <button
                  key={item.href}
                  onClick={async () => {
                    setSelectedTocItem(item);
                    setSelectedPageHref(item.href);

                    // ✅ LOAD XHTML DIRECTLY (same source used for tag extraction)
                    const res = await fetch(
                      `http://localhost:8000/api/epub/xhtml?href=${encodeURIComponent(
                        item.href
                      )}`
                    );

                    const html = await res.text();
                    setSelectedPageHtml(html);
                  }}
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
            })}
          </div>
        </section>

        {/* ---------------- CENTER: TAGS + XHTML ---------------- */}
        <section style={card}>
          <div style={cardTitle}>Tags in Selected Section</div>

          {!selectedTocItem ? (
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              Select a TOC item to view tags and XHTML.
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
                {/* TAG MAPPING */}
                <div style={{ maxHeight: 380, overflowY: "auto" }}>
                  {selectedPageTags.map((tag) => {
                    const value = currentMappings[tag] || "Not mapped";
                    const mapped = value !== "Not mapped";

                    return (
                      <div
                        key={tag}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 8,
                          padding: 8,
                          borderRadius: 8,
                          border: "1px solid #e5e7eb",
                          background: "#fffaf0",
                        }}
                      >
                        <div style={{ width: 70, fontFamily: "monospace" }}>
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
                          style={{ flex: 1 }}
                        >
                          {ACCESSIBILITY_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>

                        {mapped && (
                          <span style={{ color: "#16a34a" }}>✔</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* XHTML SOURCE PREVIEW */}
                <div
                  style={{
                    maxHeight: 380,
                    overflow: "auto",
                    background: "#0b1120",
                    borderRadius: 8,
                    padding: 10,
                    fontSize: 12,
                    color: "#e5e7eb",
                    fontFamily: "monospace",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {selectedPageHtml ? (
                    selectedPageHtml
                  ) : (
                    <span style={{ color: "#9ca3af" }}>
                      XHTML not loaded for this section.
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </section>

        {/* ---------------- RIGHT: ERRORS ---------------- */}
        <section style={card}>
          <div style={cardTitle}>Error List</div>

          {unmappedTags.length > 0 ? (
            <>
              <p style={{ fontSize: 13, color: "#374151" }}>
                Daisy detected unmapped elements in this section:
              </p>
              <ul>
                {unmappedTags.map((tag) => (
                  <li key={tag} style={{ color: "#dc2626" }}>
                    &lt;{tag}&gt;
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              No issues found for this section.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
