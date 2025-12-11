// src/modules/qc/QCPage.jsx
import React, { useState } from "react";
import QCReport from "./QCReport";
import { useConversionStore } from "../../store/useConversionStore";

/* Styles and URLs (keep same backend URLs if required) */
const pageWrapper = { display: "flex", gap: 16, padding: 16, backgroundColor: "#f3f4f6", boxSizing: "border-box" };
const leftPanel = { width: "22%", minWidth: 260, background: "#fff", borderRadius: 8, padding: 16, boxSizing: "border-box", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" };
const middlePanel = { flex: 1, background: "#fff", borderRadius: 8, padding: 16, boxSizing: "border-box", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" };
const rightPanel = { width: "32%", minWidth: 340, background: "#fff", borderRadius: 8, padding: 16, boxSizing: "border-box", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", gap: 10 };

const DOC_HTML_URL = "http://localhost:8000/api/qc/doc_html"; // adjust if backend differs
const QC_EPUB_URL = "http://localhost:8000/api/qc/epub";

export default function QCPage() {
  const { epubFile } = useConversionStore();
  const [loading, setLoading] = useState(false);
  const [qcSummary, setQcSummary] = useState(null);
  const [qcRaw, setQcRaw] = useState(null);
  const [reportZipB64, setReportZipB64] = useState(null);
  const [reportFilename, setReportFilename] = useState(null);

  const [selectedIssue, setSelectedIssue] = useState(null);
  const [issueDocPath, setIssueDocPath] = useState(null);
  const [issueHtml, setIssueHtml] = useState(null);
  const [issueLoading, setIssueLoading] = useState(false);
  const [issueEditValue, setIssueEditValue] = useState("");
  const [issueMessage, setIssueMessage] = useState(""); // show helpful messages instead of blocking alerts

  async function runQc() {
    if (!epubFile) {
      alert("Please upload an EPUB in the Convert section before running QC.");
      return;
    }
    try {
      setLoading(true);
      setQcSummary(null);
      setQcRaw(null);
      setReportZipB64(null);
      setReportFilename(null);
      setSelectedIssue(null);
      setIssueDocPath(null);
      setIssueHtml(null);
      setIssueEditValue("");
      setIssueMessage("");

      const form = new FormData();
      form.append("epub_file", epubFile);

      const res = await fetch(QC_EPUB_URL, { method: "POST", body: form });
      if (!res.ok) {
        const text = await res.text();
        console.error("QC failed. HTTP", res.status, text);
        alert(`QC failed. HTTP ${res.status} – see console for details.`);
        return;
      }

      const data = await res.json();
      console.log("QC success payload:", data);
      setQcSummary(data.summary || null);
      // Some servers return raw_report, some return raw_report as string; store as object when possible
      setQcRaw(data.raw_report || (data.rawReport ? data.rawReport : { html_report: data.html_report || null }));
      setReportZipB64(data.report_zip_b64 || null);
      setReportFilename(data.report_filename || "ace-report.zip");
    } catch (err) {
      console.error("QC error:", err);
      alert("QC failed (network or JS error). See console for details.");
    } finally {
      setLoading(false);
    }
  }

  /**
   * Robust attempt to infer a document path from an assertion.
   * Tries common fields, then falls back to regex scanning of the assertion content.
   */
  function inferDocumentFromAssertion(a) {
    if (!a) return null;
    const tryVals = [];

    // subject may be string or object
    const subj = a.subject || a["earl:subject"] || null;
    if (typeof subj === "string") tryVals.push(subj);
    if (subj && typeof subj === "object") {
      if (subj.source) tryVals.push(subj.source);
      if (subj["@id"]) tryVals.push(subj["@id"]);
      if (subj.id) tryVals.push(subj.id);
    }

    const res = a.result || a["earl:result"] || {};
    if (res.pointer) tryVals.push(res.pointer);
    if (res.selector) {
      // selector could be object or string; stringify if object
      if (typeof res.selector === "string") tryVals.push(res.selector);
      else tryVals.push(JSON.stringify(res.selector));
    }
    if (res.node) tryVals.push(res.node);

    if (a.location) tryVals.push(a.location);
    if (a.path) tryVals.push(a.path);
    if (a.document) tryVals.push(a.document);

    // direct fields sometimes used in Ace variants
    if (a.source) tryVals.push(a.source);
    if (a["@id"]) tryVals.push(a["@id"]);
    if (a.target) tryVals.push(a.target);

    // inspect collected candidate strings for .xhtml/.html and OEBPS patterns
    for (const v of tryVals) {
      if (!v || typeof v !== "string") continue;
      const cleaned = v.split("#")[0].trim();
      if (cleaned.toLowerCase().endsWith(".xhtml") || cleaned.toLowerCase().endsWith(".html") || /\/?oebps\//i.test(cleaned) || /xhtml\//i.test(cleaned)) {
        return cleaned;
      }
    }

    // fallback: scan the whole assertion object for anything that looks like a path/filename
    try {
      const s = JSON.stringify(a);
      // look for /OEBPS/... or xhtml/... or any token that ends with .xhtml/.html
      const rx = /(?:[A-Za-z0-9_\/\-\:\.]*)(?:OEBPS\/|oebps\/|xhtml\/)?[A-Za-z0-9_\-\/\.]+?\.(?:xhtml|html)/gi;
      const matches = s.match(rx);
      if (matches && matches.length > 0) {
        // prefer matches that contain OEBPS or xhtml/ else return first
        const prefer = matches.find(m => /oebps/i.test(m) || /xhtml\//i.test(m));
        return (prefer || matches[0]).replace(/^\.\/+/, "").split("#")[0];
      }

      // another fallback: bare filenames like "nav.xhtml"
      const rx2 = /\b[A-Za-z0-9_\-]+?\.(?:xhtml|html)\b/gi;
      const matches2 = s.match(rx2);
      if (matches2 && matches2.length > 0) {
        return matches2[0];
      }
    } catch (e) {
      console.warn("inferDocumentFromAssertion fallback regex failed:", e);
    }

    // Give up
    return null;
  }

  async function handleSelectIssue(assertion) {
    try {
      setSelectedIssue(assertion);
      setIssueHtml(null);
      setIssueEditValue("");
      setIssueLoading(true);
      setIssueMessage("");

      const docPath = inferDocumentFromAssertion(assertion);
      setIssueDocPath(docPath);

      if (!docPath) {
        // don't block with alert — show a friendly message and allow manual inspection
        setIssueMessage("Could not determine a stable document path for this issue. You may need to open the referenced XHTML file directly in an editor. See console for assertion details.");
        console.warn("Could not infer doc path for assertion:", assertion);
        setIssueLoading(false);
        return;
      }

      // ask backend for the HTML for this document
      const res = await fetch(DOC_HTML_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc_path: docPath }),
      });

      if (!res.ok) {
        const txt = await res.text();
        console.error("doc_html failed. HTTP", res.status, txt);
        setIssueHtml(null);
        setIssueEditValue("");
        setIssueMessage(`Could not fetch document HTML for '${docPath}'. HTTP ${res.status}. See console.`);
        setIssueLoading(false);
        return;
      }

      const data = await res.json();
      const html = data.html ?? null;
      if (!html) {
        setIssueMessage(`Backend returned no HTML for '${docPath}'.`);
        setIssueHtml(null);
        setIssueEditValue("");
      } else {
        setIssueHtml(html);
        setIssueEditValue(html);
        setIssueMessage("");
      }
    } catch (err) {
      console.error("handleSelectIssue error:", err);
      setIssueMessage("Failed to load document HTML due to a network or server error. See console.");
    } finally {
      setIssueLoading(false);
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
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
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
      console.error("Download failed:", e);
      alert("Could not download DAISY Ace report. See console.");
    }
  }

  function handleLocalApplyEdits() {
    setIssueHtml(issueEditValue);
    alert("Edits applied locally in the browser. To persist changes to the EPUB you need a backend endpoint that writes the edited HTML into the EPUB and re-runs QC.");
  }

  return (
    <div style={pageWrapper}>
      <section style={leftPanel}>
        <h3>QC Controls</h3>
        <p style={{ fontSize: 13, color: "#4b5563" }}>Runs the DAISY Ace EPUB accessibility checker (WCAG / EPUB Accessibility).</p>

        <button onClick={runQc} disabled={loading} style={{ width: "100%", marginTop: 8, padding: "10px 12px", borderRadius: 6, border: "none", backgroundColor: loading ? "#9ca3af" : "#16a34a", color: "#fff", fontWeight: 600, cursor: loading ? "default" : "pointer" }}>
          {loading ? "Running QC..." : "Run QC on current EPUB"}
        </button>

        <hr style={{ margin: "16px 0" }} />

        <button onClick={downloadFullReport} disabled={!reportZipB64} style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "none", backgroundColor: reportZipB64 ? "#2563eb" : "#9ca3af", color: "#fff", fontWeight: 600, cursor: reportZipB64 ? "pointer" : "default" }}>
          Download full DAISY Ace report
        </button>
      </section>

      <section style={middlePanel}>
        <QCReport summary={qcSummary} rawReport={qcRaw} onSelectIssue={handleSelectIssue} selectedIssue={selectedIssue} />
      </section>

      <section style={rightPanel}>
        <h3>DAISY Ace HTML Report</h3>
        <p style={{ fontSize: 13, color: "#4b5563" }}>This is the full DAISY Ace HTML report for the current EPUB.</p>

        <div style={{ height: 220, border: "1px solid #e5e7eb", borderRadius: 6, overflow: "auto", padding: 8 }}>
          {qcRaw && qcRaw["html_report"] ? <div dangerouslySetInnerHTML={{ __html: qcRaw["html_report"] }} /> : <div style={{ color: "#6b7280" }}>Run QC to view the full DAISY Ace HTML report here.</div>}
        </div>

        <hr />

        <h4>Issue HTML editor</h4>
        <p style={{ fontSize: 12, color: "#6b7280" }}>Click an issue in the middle panel to load its context HTML here. Changes are local to the browser only.</p>

        <div style={{ border: "1px solid #e6e8eb", borderRadius: 8, padding: 10, background: "#fafafa" }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>{selectedIssue ? `Issue selected` : "No issue selected yet."}</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>{selectedIssue ? `Document: ${issueDocPath || "unknown"}` : ""}</div>

          {issueMessage && <div style={{ marginBottom: 8, color: "#92400e", background: "#fff7ed", padding: 8, borderRadius: 6 }}>{issueMessage}</div>}

          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, marginBottom: 6, fontWeight: 600 }}>HTML Source</div>
              <textarea value={issueEditValue} onChange={(e) => setIssueEditValue(e.target.value)} placeholder={issueLoading ? "Loading..." : "Select an issue to load its HTML here."} style={{ width: "100%", height: 300, boxSizing: "border-box", border: "1px solid #e5e7eb", borderRadius: 6, padding: 8, fontFamily: "monospace", fontSize: 12, resize: "vertical" }} />
            </div>

            <div style={{ width: 220, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Actions</div>

              <button onClick={handleLocalApplyEdits} disabled={!selectedIssue} style={{ width: "100%", padding: 8, borderRadius: 6, border: "none", background: selectedIssue ? "#2563eb" : "#9ca3af", color: "#fff", cursor: selectedIssue ? "pointer" : "default" }}>
                Apply edits (local only)
              </button>

              <button onClick={() => {
                if (!issueEditValue) return alert("Nothing to download.");
                const blob = new Blob([issueEditValue], { type: "text/html" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = (issueDocPath ? issueDocPath.split("/").pop() : "doc.xhtml");
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
              }} style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff", color: "#111827", cursor: "pointer" }}>
                Download HTML snippet
              </button>

              <div style={{ fontSize: 12, color: "#6b7280" }}>Note: edits here are only in the browser. To actually fix the EPUB you'll need a backend endpoint that writes the edited HTML back into the EPUB and re-runs QC.</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
