// src/modules/mapping/TagRow.jsx
import React, { useState } from "react";
import { useConversionStore } from "../../store/useConversionStore";

const rowStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: 6,
  padding: "8px 10px",
  marginBottom: 6,
  backgroundColor: "#fff",
};

const labelStyle = { fontSize: 13, color: "#4b5563" };

const currentMappingStyle = { fontSize: 14, fontWeight: 600 };

const buttonStyle = {
  marginTop: 6,
  padding: "4px 8px",
  fontSize: 12,
  borderRadius: 4,
  border: "1px solid #2563eb",
  background: "#eff6ff",
  color: "#1d4ed8",
  cursor: "pointer",
};

// All accessible tag options you want to allow
const ACCESSIBLE_TAG_OPTIONS = [
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
  "FIGURE",
  "FIGCAPTION",
  "BLOCKQUOTE",
  "SPAN",
  "STRONG",
  "EM",
];

export default function TagRow({ tag }) {
  const { tagMappings, setTagMapping } = useConversionStore();
  const [showPicker, setShowPicker] = useState(false);

  const current = tagMappings?.[tag] || "";

  function handleChange(e) {
    const value = e.target.value;
    setTagMapping(tag, value);
  }

  return (
    <div style={rowStyle}>
      <div style={labelStyle}>Original HTML tag</div>
      <div style={{ fontFamily: "monospace", fontSize: 14 }}>
        <code>&lt;{tag}&gt;</code>
      </div>

      <div style={{ marginTop: 6 }}>
        <span style={labelStyle}>Accessible tag:&nbsp;</span>
        <span style={currentMappingStyle}>
          {current ? current : "Not mapped"}
        </span>
      </div>

      <button
        type="button"
        style={buttonStyle}
        onClick={() => setShowPicker((prev) => !prev)}
      >
        {showPicker ? "Hide options" : "Choose accessible tag"}
      </button>

      {showPicker && (
        <div style={{ marginTop: 6 }}>
          <select
            value={current}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "4px 6px",
              borderRadius: 4,
              border: "1px solid #d1d5db",
              fontSize: 13,
            }}
          >
            <option value="">(no mapping)</option>
            {ACCESSIBLE_TAG_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
