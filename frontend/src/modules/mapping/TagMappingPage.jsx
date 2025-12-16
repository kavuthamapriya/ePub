// src/modules/tagMapping/TagMapping.jsx
import React from "react";
import { useConversionStore } from "../../store/useConversionStore";

// ---------- Layout styles ----------
const pageWrapper = {
  padding: 20,
};

const titleStyle = {
  fontSize: 22,
  fontWeight: 700,
  marginBottom: 6,
};

const subtitleStyle = {
  fontSize: 13,
  color: "#6b7280",
  marginBottom: 20,
};

const grid = {
  display: "grid",
  gridTemplateColumns: "280px 1fr 280px",
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

// ---------- Component ----------
export default function TagMapping() {
  const {
    epubToc,
    selectedTocItem,
    setSelectedTocItem,
    selectedPageTags,
    selectedPageHref,
  } = useConversionStore();

  return (
    <div style={pageWrapper}>
      {/* <div style={titleStyle}>Tag Mapping</div> */}
      <div style={subtitleStyle}>
        Select a section from the EPUB Table of Contents to start mapping tags.
      </div>

      <div style={grid}>
        {/* LEFT — EPUB TOC */}
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

        {/* CENTER — TAGS FOR SELECTED PAGE */}
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

              {(!selectedPageTags || selectedPageTags.length === 0) ? (
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

        {/* RIGHT — ERROR LIST (placeholder) */}
        <section style={card}>
          <div style={cardTitle}>Error List</div>
          <div style={{ fontSize: 13, color: "#6b7280" }}>
            Accessibility issues for this section will appear here.
          </div>
        </section>
      </div>
    </div>
  );
}
