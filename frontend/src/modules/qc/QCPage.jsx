// src/modules/qc/QCPage.jsx
import React, { useState } from "react";
import { useConversionStore } from "../../store/useConversionStore";
import QCReport from "./QCReport";

const pageWrapper = {
  display: "flex",
  gap: 16,
  padding: 16,
  backgroundColor: "#f3f4f6",
  boxSizing: "border-box",
};

const leftPanel = {
  width: "22%",
  minWidth: 260,
  background: "#fff",
  borderRadius: 8,
  padding: 16,
  boxSizing: "border-box",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
};

const middlePanel = {
  flex: 1,
  background: "#fff",
  borderRadius: 8,
  padding: 16,
  boxSizing: "border-box",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
};

const rightPanel = {
  width: "38%",
  minWidth: 420,
  background: "#fff",
  borderRadius: 8,
  padding: 16,
  boxSizing: "border-box",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  display: "flex",
  flexDirection: "column",
};

export default function QCPage() {
  const { epubFile, accessibleHtml } = useConversionStore();

  const [loading, setLoading] = useState(false);
  const [qcSummary, setQcSummary] = useState(null);
  const [qcRaw, setQcRaw] = useState(null);

  const [reportZipB64, setReportZipB64] = useState(null);
  const [reportFilename, setReportFilename] = useState(null);

  // Full DAISY Ace HTML report (from backend)
  const [aceHtmlReport, setAceHtmlReport] = useState("");

  // Issue-specific editor state
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [issueHtml, setIssueHtml] = useState("");
  const [issueHtmlOriginal, setIssueHtmlOriginal] = useState("");

  // ---- helpers ----
  function getInitialHtmlForIssue(issue) {
    // You can change this strategy later:
    //  - ask backend for specific XHTML
    //  - map issue.docUrl / pointers to a file, etc.
    // For now we use accessibleHtml if available; otherwise fall back to Ace report.
    if (accessibleHtml && accessibleHtml.trim()) {
      return accessibleHtml;
    }
    if (aceHtmlReport && aceHtmlReport.trim()) {
      return aceHtmlReport;
    }
    return "<!-- No HTML available for this issue yet -->";
  }

  async function runQc() {
    if (!epubFile) {
      alert("Please upload an EPUB in the Convert section before running QC.");
      return;
    }

    try {
      setLoading(true);

      const form = new FormData();
      form.append("epub_file", epubFile);

      console.log("QCPage: POST http://localhost:8000/api/qc/epub");
      const res = await fetch("http://localhost:8000/api/qc/epub", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("QC failed. HTTP", res.status, text);
        alert(`QC failed. HTTP ${res.status} – see console for details.`);
        return;
      }

      const data = await res.json();
      console.log("QCPage: QC success payload:", data);

      setQcSummary(data.summary || null);
      setQcRaw(data.raw_report || null);
      setReportZipB64(data.report_zip_b64 || null);
      setReportFilename(data.report_filename || "ace-report.zip");
      setAceHtmlReport(data.html_report || "");

      // Clear any previously selected issue/editor
      setSelectedIssue(null);
      setIssueHtml("");
      setIssueHtmlOriginal("");
    } catch (err) {
      console.error("QC error:", err);
      alert("QC failed (network or JS error). See console for details.");
    } finally {
      setLoading(false);
    }
  }

  function downloadFullReport() {
    if (!reportZipB64) {
      alert("No DAISY Ace report available yet. Run QC first.");
      return;
    }

    try {
      const binary = atob(reportZipB64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = reportFilename || "ace-report.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download full report failed:", e);
      alert("Could not download DAISY Ace report. See console for details.");
    }
  }

  // Called by QCReport when user clicks an issue card
  function handleIssueSelect(issue) {
    setSelectedIssue(issue);
    const initial = getInitialHtmlForIssue(issue);
    setIssueHtml(initial);
    setIssueHtmlOriginal(initial);
  }

  function handleResetIssueHtml() {
    if (!issueHtmlOriginal) return;
    setIssueHtml(issueHtmlOriginal);
  }

  return (
    <div style={pageWrapper}>
      {/* LEFT: controls */}
      <section style={leftPanel}>
        <h3>QC Controls</h3>
        <p style={{ fontSize: 13, color: "#4b5563" }}>
          Runs the DAISY Ace EPUB accessibility checker (WCAG / EPUB
          Accessibility).
        </p>

        <button
          onClick={runQc}
          disabled={loading}
          style={{
            width: "100%",
            marginTop: 8,
            padding: "10px 12px",
            borderRadius: 6,
            border: "none",
            backgroundColor: loading ? "#9ca3af" : "#16a34a",
            color: "#fff",
            fontWeight: 600,
            cursor: loading ? "default" : "pointer",
          }}
        >
          {loading ? "Running QC..." : "Run QC on current EPUB"}
        </button>

        <hr style={{ margin: "16px 0" }} />

        <button
          onClick={downloadFullReport}
          disabled={!reportZipB64}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 6,
            border: "none",
            backgroundColor: reportZipB64 ? "#2563eb" : "#9ca3af",
            color: "#fff",
            fontWeight: 600,
            cursor: reportZipB64 ? "pointer" : "default",
          }}
        >
          Download full DAISY Ace report
        </button>

        {/* If you still want a "Generate Accessible PDF" button you can keep it
            here and let it just trigger a download (no preview panel anymore). */}
      </section>

      {/* MIDDLE: QC summary + issues */}
      <section style={middlePanel}>
        <QCReport
          summary={qcSummary}
          rawReport={qcRaw}
          onIssueSelect={handleIssueSelect}
        />
      </section>

      {/* RIGHT: DAISY HTML report + Issue HTML editor/preview */}
      <section style={rightPanel}>
        {/* Full DAISY HTML report (top) */}
        <h3 style={{ marginBottom: 4 }}>DAISY Ace HTML Report</h3>
        <p style={{ fontSize: 13, color: "#4b5563" }}>
          This is the full DAISY Ace HTML report for the current EPUB.
        </p>

        <div
          style={{
            marginTop: 8,
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            height: 220,
            overflow: "hidden",
            background: "#f9fafb",
          }}
        >
          {aceHtmlReport ? (
            <iframe
              title="DAISY Ace HTML report"
              srcDoc={aceHtmlReport}
              sandbox="allow-same-origin allow-forms allow-scripts"
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                background: "#ffffff",
              }}
            />
          ) : (
            <div
              style={{
                padding: 16,
                color: "#6b7280",
                fontSize: 13,
              }}
            >
              Run QC to view the full DAISY Ace HTML report here.
            </div>
          )}
        </div>

        {/* Issue-specific HTML editor + preview (bottom) */}
        <h4 style={{ marginTop: 16, marginBottom: 4 }}>
          Issue HTML editor & preview
        </h4>
        <p style={{ fontSize: 13, color: "#4b5563" }}>
          Click an issue in the middle panel to load its context HTML here.
          Changes are local to the browser only.
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minHeight: 260,
            gap: 8,
            marginTop: 4,
          }}
        >
          {/* little header with metadata */}
          <div
            style={{
              fontSize: 13,
              color: "#374151",
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              padding: 8,
              background: "#f9fafb",
            }}
          >
            {selectedIssue ? (
              <>
                <div>
                  <strong>Issue #{selectedIssue.id}:</strong>{" "}
                  {selectedIssue.title}
                </div>
                {selectedIssue.docTitle && (
                  <div>Document: {selectedIssue.docTitle}</div>
                )}
                {selectedIssue.pointers?.length > 0 && (
                  <div style={{ marginTop: 4 }}>
                    Location pointer(s):{" "}
                    {selectedIssue.pointers
                      .map((p) => `${p.type}: ${p.value}`)
                      .join(" | ")}
                  </div>
                )}
              </>
            ) : (
              <span>No issue selected yet.</span>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, flex: 1, minHeight: 220 }}>
            {/* Textarea editor */}
            <div
              style={{
                flex: 1,
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  padding: "4px 8px",
                  fontSize: 12,
                  background: "#f3f4f6",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                HTML Source
              </div>
              <textarea
                value={issueHtml}
                onChange={(e) => setIssueHtml(e.target.value)}
                disabled={!selectedIssue}
                style={{
                  flex: 1,
                  width: "100%",
                  border: "none",
                  padding: 8,
                  fontFamily: "monospace",
                  fontSize: 12,
                  lineHeight: 1.4,
                  resize: "none",
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />
              <div
                style={{
                  padding: 6,
                  borderTop: "1px solid #e5e7eb",
                  textAlign: "right",
                  background: "#f9fafb",
                }}
              >
                <button
                  type="button"
                  onClick={handleResetIssueHtml}
                  disabled={!selectedIssue}
                  style={{
                    padding: "4px 10px",
                    fontSize: 12,
                    borderRadius: 6,
                    border: "1px solid #d1d5db",
                    background: "#ffffff",
                    cursor: selectedIssue ? "pointer" : "default",
                  }}
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Live preview */}
            <div
              style={{
                flex: 1,
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  padding: "4px 8px",
                  fontSize: 12,
                  background: "#f3f4f6",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                Preview
              </div>
              <div style={{ flex: 1 }}>
                {selectedIssue ? (
                  <iframe
                    title="Issue HTML preview"
                    srcDoc={issueHtml}
                    sandbox="allow-same-origin allow-forms allow-scripts"
                    style={{
                      width: "100%",
                      height: "100%",
                      border: "none",
                      background: "#ffffff",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      padding: 12,
                      fontSize: 13,
                      color: "#6b7280",
                    }}
                  >
                    Select an issue to preview its HTML here.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
