// src/modules/mapping/MappingPage.jsx
import React from "react";
import { useConversionStore } from "../../store/useConversionStore";
import TagRow from "./TagRow";

const wrapper = { display: "flex", gap: 12, padding: 16 };
const left = { width: "28%", background: "#fff", padding: 12, borderRadius: 8, boxSizing: "border-box", minHeight: 200 };
const middle = { flex: 1, background: "#fff", padding: 12, borderRadius: 8, boxSizing: "border-box", minHeight: 200 };
const right = { width: 260, background: "#fff", padding: 12, borderRadius: 8, boxSizing: "border-box", minHeight: 200 };

export default function MappingPage() {
  const { htmlTags, tagMappings } = useConversionStore();

  const mappedCount = Object.keys(tagMappings || {}).length;
  const total = (htmlTags && htmlTags.length) || 0;
  const completion = total === 0 ? 0 : Math.round((mappedCount / total) * 100);

  return (
    <div style={wrapper}>
      <section style={left}>
        <h3>HTML Tags</h3>
        {htmlTags.length === 0 ? (
          <p style={{ color: "#6b7280" }}>Run Convert first to load tags.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {htmlTags.map((t) => <li key={t} style={{ padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>{t}</li>)}
          </ul>
        )}
      </section>

      <section style={middle}>
        <h3>Accessible Tags / Mapping</h3>
        {htmlTags.length === 0 ? (
          <p style={{ color: "#6b7280" }}>No tags available yet.</p>
        ) : (
          htmlTags.map((t) => <TagRow key={t} tag={t} />)
        )}
      </section>

      <section style={right}>
        <h3>Progress</h3>
        <div style={{ height: 12, background: "#eef2f7", borderRadius: 6, overflow: "hidden", marginTop: 6 }}>
          <div style={{ height: "100%", width: `${completion}%`, background: "#10b981" }} />
        </div>
        <p style={{ marginTop: 8 }}>{completion}% Complete</p>
      </section>
    </div>
  );
}
