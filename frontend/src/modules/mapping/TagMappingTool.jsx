// TagMappingTool.jsx
import React, { useEffect, useState } from "react";
import { FiExternalLink, FiShield, FiPlayCircle } from "react-icons/fi";

const ASP_URL = "http://accessibletagmap.s4carlisle.com/";
const PROCESS_TOKEN = "INTERNAL_REACT_CALL";

export default function TagMappingTool({ bookId }) {
  const [jobId, setJobId] = useState(null);
  const [loadIframe, setLoadIframe] = useState(false);

  useEffect(() => {
    if (!bookId) return;
    window.processStore = window.processStore || {};
    window.processStore[bookId] = { epub: bookId, pdf: "original.pdf" };
    setJobId(bookId);
  }, [bookId]);

  if (!bookId) {
    return (
      <EmptyState
        title="Upload an EPUB to begin tag mapping"
        body="The Tag Mapping tool activates after the EPUB has been uploaded and validated."
      />
    );
  }

  const localPdfUrl = `http://localhost:8000/api/pdf/${bookId}/preview`;
  const iframeSrc = `${ASP_URL}?token=${PROCESS_TOKEN}&jobId=${jobId}&pdfUrl=${encodeURIComponent(localPdfUrl)}`;

  if (loadIframe) {
    return (
      <div style={frame}>
        <div style={frameToolbar}>
          <span style={{ fontSize: 13, color: "#475569" }}>
            Embedded tool: <code style={{ color: "#0f172a" }}>{ASP_URL}</code>
          </span>
          <button onClick={() => setLoadIframe(false)} style={linkBtn}>
            Hide
          </button>
        </div>
        <iframe
          title="Tag Mapping Tool"
          src={iframeSrc}
          style={{ width: "100%", height: "100%", border: "none" }}
        />
      </div>
    );
  }

  return (
    <div style={card}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div style={iconBadge}>
          <FiShield size={22} />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
            Tag Mapping tool requires the office network
          </h3>
          <p style={{ margin: "4px 0 0", color: "#475569", fontSize: 14 }}>
            This is an internal S4Carlisle web tool embedded into the workflow.
          </p>
        </div>
      </div>

      <div style={infoBox}>
        <div style={{ fontSize: 13, color: "#475569", marginBottom: 4 }}>Tool URL</div>
        <code style={{ fontSize: 13, color: "#0f172a", wordBreak: "break-all" }}>
          {ASP_URL}
        </code>
      </div>

      <ol style={steps}>
        <li>Connect to the S4Carlisle corporate VPN (or be on the office network).</li>
        <li>Verify the host resolves from a terminal: <code>dig accessibletagmap.s4carlisle.com</code></li>
        <li>Click <strong>Load Tool</strong> below to embed it here.</li>
      </ol>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button onClick={() => setLoadIframe(true)} style={primaryBtn}>
          <FiPlayCircle size={16} /> Load Tool
        </button>
        <a href={ASP_URL} target="_blank" rel="noreferrer" style={secondaryBtn}>
          <FiExternalLink size={16} /> Open in new tab
        </a>
      </div>

      <p style={{ marginTop: 14, fontSize: 12, color: "#64748b" }}>
        If the embedded view shows a DNS error, you are not on the internal network. The
        Validation and DAISY Ace Report sections below still work independently.
      </p>
    </div>
  );
}

function EmptyState({ title, body }) {
  return (
    <div style={{ ...card, textAlign: "center" }}>
      <h3 style={{ margin: 0, color: "#0f172a", fontSize: 17 }}>{title}</h3>
      <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: 14 }}>{body}</p>
    </div>
  );
}

const card = {
  marginTop: 20,
  padding: 24,
  borderRadius: 14,
  border: "1px solid #e5e7eb",
  background: "rgba(255,255,255,0.85)",
  boxShadow: "0 5px 20px rgba(0,0,0,0.06)",
};

const frame = {
  marginTop: 20,
  borderRadius: 14,
  overflow: "hidden",
  border: "1px solid #e5e7eb",
  boxShadow: "0 5px 20px rgba(0,0,0,0.12)",
  display: "flex",
  flexDirection: "column",
  height: 720,
  background: "#fff",
};

const frameToolbar = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "10px 14px",
  background: "#f8fafc",
  borderBottom: "1px solid #e5e7eb",
};

const iconBadge = {
  width: 46,
  height: 46,
  borderRadius: 12,
  background: "#fff7ed",
  color: "#f97316",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const infoBox = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 10,
  padding: "10px 14px",
  marginBottom: 14,
};

const steps = {
  margin: "0 0 16px",
  paddingLeft: 22,
  color: "#334155",
  fontSize: 14,
  lineHeight: 1.7,
};

const primaryBtn = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 16px",
  borderRadius: 10,
  border: "none",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 14,
  color: "#fff",
  background: "linear-gradient(135deg,#f97316,#ea580c)",
};

const secondaryBtn = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 16px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  background: "#fff",
  color: "#0f172a",
  fontWeight: 600,
  fontSize: 14,
  textDecoration: "none",
};

const linkBtn = {
  background: "transparent",
  border: "none",
  color: "#2563eb",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 13,
};
