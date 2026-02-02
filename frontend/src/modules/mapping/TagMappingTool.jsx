import React, { useState, useEffect } from "react";

const ASP_URL = "http://accessibletagmap.s4carlisle.com/";
const PROCESS_TOKEN = "INTERNAL_REACT_CALL";

export default function TagMappingTool() {
  const [jobId, setJobId] = useState(null);
  const [pdfId, setPdfId] = useState(null);

  // Auto-load the ASP iframe on component mount
  useEffect(() => {
    const id = "e23c1bff-e8b5-47fd-8af4-2962511592b1";

    // Store payload in window (your original logic)
    window.processStore = window.processStore || {};
    window.processStore[id] = {
      epub: id,
      pdf: id,
    };

    setJobId(id);
    setPdfId(id);
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "700px",
        borderRadius: "14px",
        overflow: "hidden",
        border: "1px solid #e5e7eb",
        boxShadow: "0 5px 20px rgba(0,0,0,0.15)",
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
