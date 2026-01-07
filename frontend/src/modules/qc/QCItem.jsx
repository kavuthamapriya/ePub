import React from "react";
import { useQCStore } from "../../store/useQCStore";

function QCItem({ issue, type }) {
  const setSelectedIssue = useQCStore((s) => s.setSelectedIssue);

  const color = type === "error" ? "#dc2626" : "#d97706";

  return (
    <div
      onClick={() => setSelectedIssue(issue)}
      style={{
        padding: "6px 8px",
        borderBottom: "1px solid #e5e7eb",
        color,
        fontSize: "0.9rem",
        cursor: "pointer",
      }}
    >
      {issue.message}
      <div style={{ fontSize: 12, opacity: 0.7 }}>
        {issue.file}:{issue.line}
      </div>
    </div>
  );
}

export default QCItem;
