// src/modules/mapping/MappingPage.jsx
import React from "react";
import { useConversionStore } from "../../store/useConversionStore";
import TagRow from "./TagRow";

const wrapperStyle = {
  display: "flex",
  gap: 20,
  padding: 16,
  backgroundColor: "#f3f4f6",
};

const leftStyle = {
  width: "22%",
  minWidth: 260,
  backgroundColor: "#ffffff",
  padding: "12px",
  borderRadius: 8,
  boxSizing: "border-box",
  border: "1px solid #e5e7eb",
};

const middleStyle = {
  flex: 1,
  backgroundColor: "#ffffff",
  padding: "12px",
  borderRadius: 8,
  boxSizing: "border-box",
  border: "1px solid #e5e7eb",
  maxHeight: "60vh",
  overflowY: "auto",
};

const rightStyle = {
  width: "26%",
  minWidth: 260,
  backgroundColor: "#ffffff",
  padding: "12px",
  borderRadius: 8,
  boxSizing: "border-box",
  border: "1px solid #e5e7eb",
};

export default function MappingPage() {
  const { htmlTags = [], tagMappings = {} } = useConversionStore();

  const total = htmlTags.length || 0;
  const mappedCount = htmlTags.filter((t) => !!tagMappings[t]).length;
  const completion = total === 0 ? 0 : Math.round((mappedCount / total) * 100);

  return (
    <div style={wrapperStyle}>
      {/* LEFT: plain tag list */}
      <section style={leftStyle}>
        <h3 style={{ marginTop: 0 }}>HTML Tags</h3>
        {total === 0 ? (
          <p style={{ color: "#6b7280", fontSize: 14 }}>
            Run <strong>Convert</strong> first to load tags from the EPUB
            content.
          </p>
        ) : (
          <ul style={{ listStyle: "none", paddingLeft: 0, fontSize: 14 }}>
            {htmlTags.map((tag) => (
              <li key={tag} style={{ fontFamily: "monospace" }}>
                &lt;{tag}&gt;
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* MIDDLE: mapping controls */}
      <section style={middleStyle}>
        <h3 style={{ marginTop: 0 }}>Accessible Tags / Mapping</h3>
        {total === 0 ? (
          <p style={{ color: "#6b7280", fontSize: 14 }}>
            No tags available yet.
          </p>
        ) : (
          htmlTags.map((tag) => <TagRow key={tag} tag={tag} />)
        )}
      </section>

      {/* RIGHT: progress */}
      <section style={rightStyle}>
        <h3 style={{ marginTop: 0 }}>Progress</h3>

        <p style={{ marginBottom: 8, fontSize: 14 }}>
          <strong>{mappedCount}</strong> of <strong>{total}</strong> tags
          mapped.
        </p>

        <div
          style={{
            height: 14,
            backgroundColor: "#e5e7eb",
            borderRadius: 999,
            overflow: "hidden",
            marginBottom: 6,
          }}
        >
          <div
            style={{
              width: `${completion}%`,
              height: "100%",
              backgroundColor: "#10b981",
            }}
          />
        </div>
        <div style={{ fontSize: 13, color: "#374151" }}>
          {completion}% complete
        </div>

        <button
          type="button"
          style={{
            marginTop: 16,
            padding: "8px 14px",
            width: "100%",
            borderRadius: 6,
            border: "none",
            backgroundColor: "#1d4ed8",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
          onClick={() => {
            alert(
              "In the next step you can use these mappings to drive auto-fixes / accessible HTML generation."
            );
          }}
        >
          COMPLETE
        </button>
      </section>
    </div>
  );
}
