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

  /* ⛔ Do not render before upload */
  if (!epubFile) return null;

  const currentMappings = tagMappings[selectedPageHref] || {};
  console.log("STORE BOOK ID IN TAG MAPPING:", bookId);
  console.log("TAG MAPPING READ BOOK ID:", bookId);


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
    console.group("📘 TOC CLICK");
    console.log("Item:", item);
    console.log("Book ID:", bookId);

    setSelectedTocItem(item);
    setSelectedPageHref(item.href);

    if (!bookId) {
      const msg = "❌ Book ID not ready. Upload EPUB again.";
      console.error(msg);
      setSelectedPageHtml(msg);
      console.groupEnd();
      return;
    }

    const url = `http://localhost:8000/api/epub/xhtml?book_id=${bookId}&href=${encodeURIComponent(
      item.href
    )}`;

    console.log("Fetching:", url);

    try {
      const res = await fetch(url);
      console.log("Status:", res.status);

      const text = await res.text();
      console.log("Response preview:", text.slice(0, 300));

      if (!res.ok) {
        setSelectedPageHtml(
          `❌ XHTML load failed (${res.status})\n\n${text}`
        );
        console.groupEnd();
        return;
      }

      setSelectedPageHtml(text);
    } catch (err) {
      console.error("Network error:", err);
      setSelectedPageHtml(`❌ Network error\n\n${err.message}`);
    }

    console.groupEnd();
  };

  return (
    <div style={pageWrapper}>
      <QCSummaryBar />
      <h2 style={{ marginTop: 10 }}>Tag Mapping</h2>

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

        {/* ---------------- CENTER ---------------- */}
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

                    return (
                      <div
                        key={tag}
                        style={{
                          display: "flex",
                          gap: 8,
                          marginBottom: 8,
                        }}
                      >
                        <code>&lt;{tag}&gt;</code>

                        <select
                          value={value}
                          onChange={(e) =>
                            setTagMapping(
                              selectedPageHref,
                              tag,
                              e.target.value
                            )
                          }
                        >
                          {ACCESSIBILITY_OPTIONS.map((opt) => (
                            <option key={opt}>{opt}</option>
                          ))}
                        </select>
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

        {/* ---------------- RIGHT ---------------- */}
        <section style={card}>
          <div style={cardTitle}>Error List</div>

          {unmappedTags.length > 0 ? (
            <ul>
              {unmappedTags.map((tag) => (
                <li key={tag} style={{ color: "#dc2626" }}>
                  &lt;{tag}&gt;
                </li>
              ))}
            </ul>
          ) : (
            <div style={{ color: "#16a34a" }}>
              No issues found for this section ✔
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
