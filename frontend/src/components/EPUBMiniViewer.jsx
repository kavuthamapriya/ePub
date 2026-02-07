// components/EPUBMiniViewer.jsx
import React from "react";

export default function EPUBMiniViewer({ pages, selectedPage, onSelect }) {
  return (
    <div style={{ height: "100%", overflowY: "auto", paddingRight: "5px" }}>
      {pages.map((p, i) => (
        <div
          key={i}
          onClick={() => onSelect(i)}
          style={{
            border: i === selectedPage ? "2px solid #4f46e5" : "1px solid #ddd",
            borderRadius: "8px",
            marginBottom: "10px",
            padding: "5px",
            cursor: "pointer",
          }}
        >
          <img
            src={p}
            style={{ width: "100%", borderRadius: "6px" }}
          />
        </div>
      ))}
    </div>
  );
}
