// src/components/EPUBMiniViewer.jsx
import React from "react";

export default function EPUBMiniViewer({ pages, selectedPage, onSelect }) {
  return (
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        paddingRight: "5px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      {pages.map((pageSrc, index) => (
        <div
          key={index}
          onClick={() => onSelect(index)}
          style={{
            border: index === selectedPage ? "2px solid #4f46e5" : "1px solid #ddd",
            borderRadius: "10px",
            padding: "6px",
            cursor: "pointer",
            background: "#fff",
            transition: "0.2s ease",
          }}
        >
          <img
            src={pageSrc}
            alt={`Page ${index + 1}`}
            style={{
              width: "100%",
              borderRadius: "8px",
              objectFit: "contain",
              background: "#f3f4f6",
            }}
          />
        </div>
      ))}
    </div>
  );
}
