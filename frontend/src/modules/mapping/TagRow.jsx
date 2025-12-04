import React from "react";
import { useConversionStore } from "../../store/useConversionStore";

const ACCESSIBLE_OPTIONS = [
  "P",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "UL",
  "OL",
  "LI",
  "BLOCKQUOTE",
  "FIGURE",
  "FIGCAPTION",
  "IGNORE",
];

function TagRow({ tag, contextHTML }) {
  const tagMappings = useConversionStore((s) => s.tagMappings || {});
  const setTagMapping = useConversionStore((s) => s.setTagMapping);

  const value = tagMappings?.[tag] ?? "";

  const handleChange = (e) => {
    setTagMapping(tag, e.target.value);
  };

  function handleSuggest() {
    console.log("AI Suggest for tag:", tag, "context length:", contextHTML?.length);
    // later: call /suggest with { tag, html: contextHTML }
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1.5fr auto",
        gap: "8px",
        alignItems: "center",
        marginBottom: "8px",
      }}
    >
      <div>{tag}</div>

      <select
        value={value}
        onChange={handleChange}
        style={{
          padding: "4px 6px",
          borderRadius: "4px",
          border: "1px solid #d1d5db",
        }}
      >
        <option value="">(choose)</option>
        {ACCESSIBLE_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={handleSuggest}
        style={{
          padding: "4px 8px",
          borderRadius: "4px",
          border: "none",
          backgroundColor: "#111827",
          color: "#fff",
          fontSize: "12px",
          cursor: "pointer",
        }}
      >
        AI Suggest
      </button>
    </div>
  );
}

export default TagRow;
