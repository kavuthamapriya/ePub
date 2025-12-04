import React from "react";
import { useConversionStore } from "../../store/useConversionStore";
import TagRow from "./TagRow";

const wrapperStyle = {
  display: "flex",
  height: "70vh",
  backgroundColor: "#f3f4f6",
};

const leftStyle = {
  width: "25%",
  borderRight: "1px solid #e1e4e8",
  padding: "0.75rem",
  backgroundColor: "#ffffff",
};

const middleStyle = {
  width: "45%",
  borderRight: "1px solid #e1e4e8",
  padding: "0.75rem",
  backgroundColor: "#ffffff",
  overflowY: "auto",
};

const rightStyle = {
  flex: 1,
  padding: "0.75rem",
  backgroundColor: "#ffffff",
};

function MappingPage() {
  const accessibleHtml = useConversionStore((s) => s.accessibleHtml || "");
  const htmlTags = useConversionStore((s) => s.htmlTags || []);
  const tagMappings = useConversionStore((s) => s.tagMappings || {});

  const mappedCount = Object.keys(tagMappings).length;
  const total = htmlTags.length || 1;
  const completion = Math.round((mappedCount / total) * 100);

  return (
    <div style={wrapperStyle}>
      {/* LEFT: tag list */}
      <section style={leftStyle}>
        <h3>HTML Tags</h3>
        {htmlTags.length === 0 ? (
          <p style={{ color: "#6b7280" }}>
            Run <strong>Convert</strong> first to load tags.
          </p>
        ) : (
          <ul style={{ listStyle: "none", paddingLeft: 0 }}>
            {htmlTags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        )}
      </section>

      {/* MIDDLE: mapping rows */}
      <section style={middleStyle}>
        <h3 style={{ marginBottom: "8px" }}>Accessible Tags</h3>
        {htmlTags.length === 0 ? (
          <p style={{ color: "#6b7280" }}>No tags available yet.</p>
        ) : (
          htmlTags.map((tag) => (
            <TagRow key={tag} tag={tag} contextHTML={accessibleHtml} />
          ))
        )}
      </section>

      {/* RIGHT: progress */}
      <section style={rightStyle}>
        <h3>Progress</h3>
        <div
          style={{
            height: "20px",
            backgroundColor: "#e5e7eb",
            borderRadius: "4px",
            marginBottom: "10px",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${completion}%`,
              backgroundColor: "#10b981",
              borderRadius: "4px",
            }}
          ></div>
        </div>
        <p>{completion}% Complete</p>

        <button
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            backgroundColor: "#1d4ed8",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontWeight: "600",
          }}
        >
          COMPLETE
        </button>
      </section>
    </div>
  );
}

export default MappingPage;
