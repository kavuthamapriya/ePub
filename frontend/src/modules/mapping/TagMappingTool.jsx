// TagMappingTool.jsx
import React, { useState, useEffect } from "react";

const ASP_URL = "http://accessibletagmap.s4carlisle.com/";
const PROCESS_TOKEN = "INTERNAL_REACT_CALL";

export default function TagMappingTool({ bookId }) {
  const [jobId, setJobId] = useState(null);
  const [pdfId, setPdfId] = useState(null);

  useEffect(() => {
    if (!bookId) return;

    // Store payload
    window.processStore = window.processStore || {};
    window.processStore[bookId] = {
      epub: bookId,
      pdf: bookId,
    };

    setJobId(bookId);
    setPdfId(bookId);
  }, [bookId]);

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
      {jobId && (
        <iframe
          title="Tag Mapping Tool"
          src={`${ASP_URL}?token=${PROCESS_TOKEN}&jobId=${jobId}&pdfId=${pdfId}`}
          style={{
            width: "100%",
            height: "100%",
            border: "none",
          }}
        />
      )}
    </div>
  );
}
