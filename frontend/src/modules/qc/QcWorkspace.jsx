import { useState } from "react";
import QCReport from "./QCReport";
import HtmlPreview from "./HtmlPreview";

export default function QcWorkspace({ summary, qcReport, currentHtml }) {
  const [selectedIssue, setSelectedIssue] = useState(null);

  return (
    <div style={{ display: "flex", height: "100%" }}>
      {/* LEFT: Issues list */}
      <div style={{ width: "40%", borderRight: "1px solid #ddd" }}>
        <QCReport
          summary={summary}
          rawReport={qcReport}
          selectedIssue={selectedIssue}
          onSelectIssue={setSelectedIssue}
        />
      </div>

      {/* RIGHT: HTML Preview */}
      <div style={{ width: "60%" }}>
        <HtmlPreview
          html={currentHtml}
          selectedIssue={selectedIssue}
        />
      </div>
    </div>
  );
}
