// TagMappingTool.jsx
import React, { useState, useEffect } from "react";

const ASP_URL = "http://accessibletagmap.s4carlisle.com/";
const PROCESS_TOKEN = "INTERNAL_REACT_CALL";

export default function TagMappingTool({ bookId }) {
  const [jobId, setJobId] = useState(null);

  useEffect(() => {
    if (!bookId) return;

    // REQUIRED by ASP mapping tool
    window.processStore = window.processStore || {};
    window.processStore[bookId] = {
      epub: bookId,
      pdf: "original.pdf",   // always original.pdf
    };

    setJobId(bookId);
  }, [bookId]);

  if (!bookId) return null;

  // This URL gives LIVE PDF from backend
  const localPdfUrl = `http://localhost:8000/api/pdf/${bookId}/preview`;

  return (
    <div
      style={{
        width: "100%",
        height: "700px",
        borderRadius: "14px",
        overflow: "hidden",
        border: "1px solid #e5e7eb",
        boxShadow: "0 5px 20px rgba(0,0,0,0.15)",
        marginTop: "20px",
      }}
    >
      <iframe
        title="Tag Mapping Tool"
        src={`${ASP_URL}?token=${PROCESS_TOKEN}&jobId=${jobId}&pdfUrl=${encodeURIComponent(localPdfUrl)}`}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
        }}
      />
    </div>
  );
}
