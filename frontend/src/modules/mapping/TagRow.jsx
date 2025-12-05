// src/modules/mapping/TagRow.jsx
import React from "react";
import { useConversionStore } from "../../store/useConversionStore";

const rowStyle = { display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid #f1f5f9" };

const ACCESSIBLE_OPTIONS = [
  "", "P", "H1", "H2", "H3", "H4", "H5", "H6", "FIGURE", "FIGCAPTION", "UL", "OL", "LI", "BLOCKQUOTE", "IMG", "ASIDE", "NAV", "SECTION"
];

export default function TagRow({ tag }) {
  const tagMappings = useConversionStore((s) => s.tagMappings);
  const setTagMapping = useConversionStore((s) => s.setTagMapping);

  const current = tagMappings ? tagMappings[tag] || "" : "";

  function onChange(e) {
    setTagMapping(tag, e.target.value);
  }

  return (
    <div style={rowStyle}>
      <div style={{ width: "36%", color: "#111827", fontWeight: 600 }}>{tag}</div>

      <div style={{ flex: 1 }}>
        <select value={current} onChange={onChange} style={{ width: "240px", padding: 8 }}>
          {ACCESSIBLE_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt || "(choose)"}</option>)}
        </select>
      </div>

      <div>
        <button onClick={() => {
          // simple suggestion heuristics:
          // if tag contains 'h' or 'title' suggest H2; if contains 'cover' suggest IMG or P.
          const t = (tag || "").toLowerCase();
          let suggestion = "P";
          if (t.includes("title") || t.includes("head") || t.includes("h1") || t.includes("h2")) suggestion = "H2";
          if (t.includes("cover") || t.includes("img") || t.includes("figure")) suggestion = "IMG";
          setTagMapping(tag, suggestion);
        }} style={{ padding: "6px 10px" }}>AI Suggest</button>
      </div>
    </div>
  );
}
