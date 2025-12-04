import React, { useState } from "react";
import QCSummary from "./QCSummary";
import QCCompareView from "./QCCompareView";
import { runQC } from "./qcUtils";

const wrapperStyle = {
  display: "flex",
  flex: 1,
};

const leftStyle = {
  width: "25%",
  padding: "0.75rem",
  borderRight: "1px solid #e1e4e8",
  backgroundColor: "#ffffff",
};

const middleStyle = {
  width: "35%",
  padding: "0.75rem",
  borderRight: "1px solid #e1e4e8",
  backgroundColor: "#ffffff",
  overflowY: "auto",
};

const rightStyle = {
  flex: 1,
  padding: "0.75rem",
  backgroundColor: "#ffffff",
  overflow: "auto",
};

function QCPage() {
  const [epubHTML, setEpubHTML] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [qcReport, setQcReport] = useState(null);

  async function handleRunQC() {
    if (!epubHTML) {
      alert("Load accessible HTML first");
      return;
    }
    const report = await runQC(epubHTML);
    setQcReport(report);
  }

  return (
    <div style={wrapperStyle}>
      <section style={leftStyle}>
        <h3>Load Files</h3>

        <label>Accessible EPUB HTML</label>
        <textarea
          style={{ width: "100%", height: "140px" }}
          placeholder="Paste accessible HTML here"
          onChange={(e) => setEpubHTML(e.target.value)}
        ></textarea>

        <label style={{ marginTop: "8px" }}>Reference PDF</label>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setPdfFile(e.target.files[0])}
        />

        <button
          onClick={handleRunQC}
          style={{
            marginTop: "10px",
            padding: "8px 12px",
            backgroundColor: "#374151",
            color: "white",
            border: "none",
            borderRadius: "4px",
            width: "100%",
          }}
        >
          Run QC
        </button>
      </section>

      <section style={middleStyle}>
        <QCSummary report={qcReport} />
      </section>

      <section style={rightStyle}>
        <QCCompareView html={epubHTML} pdfFile={pdfFile} />
      </section>
    </div>
  );
}

export default QCPage;
