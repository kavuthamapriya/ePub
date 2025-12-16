// src/modules/qc/QCPage.jsx
import React, { useState } from "react";
import QCReport from "./QCReport";
import { useConversionStore } from "../../store/useConversionStore";
import { Await } from "react-router-dom";

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
  const [issueMessage, setIssueMessage] = useState("");
  const [issueType, setIssueType] = useState("unknown");

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
      setIssueType("unknown");

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

  // --- helper: try to extract a friendly issue type from an assertion object
  const ISSUE_TYPE_MAP = {
    // common ACE rule IDs -> friendly description
    "epub-pagelist-broken": "EPUB page list breaks / pagination issue",
    "epub-nav-inconsistency": "Navigation document inconsistency",
    "duplicate-id": "Duplicate ID in document",
    "img-alt-missing": "Missing image alt text",
    "heading-order": "Incorrect heading order",
    "epub-nav-not-found": "Navigation document not found",
    "epub-ro-flack": "Reading order / structure issue",
    // add more mappings you know from your Ace outputs...
  };

  function getIssueType(assertion) {
  if (!assertion) return "unknown";

  const test = assertion["earl:test"] || assertion.test || null;

  if (test) {
    const ruleId = test["@id"] || test.id;
    const title = test["dct:title"];

    if (ruleId) {
      for (const key of Object.keys(ISSUE_TYPE_MAP)) {
        if (ruleId.toLowerCase().includes(key)) {
          return ISSUE_TYPE_MAP[key];
        }
      }
      return ruleId.split("/").pop(); // fallback readable id
    }

    if (title) return title;
  }

  // ⬇️ keep your existing fallback logic BELOW this
    // check many possible fields where a rule id might live
    const tryVals = [];

    if (typeof assertion === "string") tryVals.push(assertion);
    if (assertion.test) tryVals.push(assertion.test);
    if (assertion.rule) tryVals.push(assertion.rule);
    if (assertion.name) tryVals.push(assertion.name);
    if (assertion.title) tryVals.push(assertion.title);
    if (assertion["@id"]) tryVals.push(assertion["@id"]);
    if (assertion["@type"]) tryVals.push(assertion["@type"]);
    if (assertion["earl:assertedBy"]) tryVals.push(assertion["earl:assertedBy"]);
    if (assertion.result && assertion.result.pointer) tryVals.push(assertion.result.pointer);
    if (assertion.result && assertion.result.selector) tryVals.push(assertion.result.selector);
    if (assertion["dct:description"]) tryVals.push(assertion["dct:description"]);
    if (assertion["dct:title"]) tryVals.push(assertion["dct:title"]);
    if (assertion.assertions && assertion.assertions.length > 0) {
      // if this container assertion wraps children, try child fields too
      assertion.assertions.forEach(child => {
        if (child.test) tryVals.push(child.test);
        if (child.rule) tryVals.push(child.rule);
        if (child["dct:description"]) tryVals.push(child["dct:description"]);
      });
    }

    // scan values for a known rule id token or known keywords
    for (const v of tryVals) {
      if (!v) continue;
      const s = (typeof v === "string") ? v : JSON.stringify(v);
      // rule id like 'epub-pagelist-broken'
      const m = s.match(/[A-Za-z0-9_\-\.]*epub[A-Za-z0-9_\-\.]*/i) || s.match(/[A-Za-z0-9_\-]+/i);
      // attempt to find one of our map keys inside string
      for (const key of Object.keys(ISSUE_TYPE_MAP)) {
        if (s.toLowerCase().includes(key.toLowerCase())) return ISSUE_TYPE_MAP[key];
      }
      // direct match: some tests might be exact rule id
      if (ISSUE_TYPE_MAP[s]) return ISSUE_TYPE_MAP[s];
    }

    // fallback: use a short excerpt of the description if available
    const desc = assertion["dct:description"] || (assertion.result && assertion.result.description) || assertion.description || assertion.test || assertion.name || null;
    if (desc) {
      const short = (typeof desc === "string") ? desc.trim().slice(0, 80) : JSON.stringify(desc).slice(0, 80);
      return short + (short.length >= 80 ? "…" : "");
    }

    return "unknown";
  }

  /**
   * Best-effort snippet extractor (same as before) — returns an element outerHTML snippet
   * with highlight comment markers, or null if not found.
   */
  function extractSnippetFromHtml(fullHtml, assertion) {
    if (!fullHtml) return null;
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(fullHtml, "application/xhtml+xml");
      const wrap = (el) => {
        if (!el) return null;
        const outer = el.outerHTML || new XMLSerializer().serializeToString(el);
        return `<!-- HIGHLIGHT START -->\n${outer}\n<!-- HIGHLIGHT END -->`;
      };

      const subj = assertion?.subject || assertion?.["earl:subject"] || {};
      const res = assertion?.result || assertion?.["earl:result"] || {};
      const candidates = [];

      if (typeof subj === "string") candidates.push(subj);
      if (subj && subj.source) candidates.push(subj.source);
      if (subj && subj["@id"]) candidates.push(subj["@id"]);
      if (res && res.pointer) candidates.push(res.pointer);
      if (res && res.selector) {
        if (typeof res.selector === "string") candidates.push(res.selector);
        else candidates.push(JSON.stringify(res.selector));
      }
      if (assertion?.location) candidates.push(assertion.location);
      if (assertion?.path) candidates.push(assertion.path);
      if (assertion?.document) candidates.push(assertion.document);

      for (const c of candidates) {
        if (!c || typeof c !== "string") continue;
        const fragIndex = c.indexOf("#");
        if (fragIndex >= 0) {
          const frag = c.slice(fragIndex + 1).trim();
          if (frag) {
            const elById = doc.getElementById(frag);
            if (elById) return wrap(elById);
          }
        }
      }

      if (typeof res.selector === "string") {
        try {
          const sel = res.selector.replace(/^\s*(css:|xpath:)\s*/i, "").trim();
          const el = doc.querySelector ? doc.querySelector(sel) : null;
          if (el) return wrap(el);
        } catch (e) {}
      }

      const maybeXPath = (s) => typeof s === "string" && /^\s*(\/|\/\/)/.test(s);
      const xpathCandidate = (typeof res.selector === "string" && maybeXPath(res.selector)) ? res.selector : null;
      if (xpathCandidate) {
        try {
          const xpath = xpathCandidate;
          const nsResolver = doc.createNSResolver(doc);
          const result = doc.evaluate(xpath, doc, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
          if (result && result.singleNodeValue) return wrap(result.singleNodeValue);
        } catch (e) {}
      }

      const texts = [];
      if (assertion?.test) texts.push(assertion.test);
      if (assertion?.title) texts.push(assertion.title);
      if (assertion?.name) texts.push(assertion.name);
      if (res?.description) texts.push(res.description);

      const findTextInNode = (text) => {
        if (!text || typeof text !== "string") return null;
        const trimmed = text.trim().slice(0, 200);
        const treeWalker = doc.createTreeWalker(doc.body || doc, NodeFilter.SHOW_TEXT, null, false);
        let node;
        while ((node = treeWalker.nextNode())) {
          if (node.nodeValue && node.nodeValue.includes(trimmed)) {
            return node.parentElement;
          }
        }
        return null;
      };

      for (const t of texts) {
        const el = findTextInNode(t);
        if (el) return wrap(el);
      }

      const body = doc.querySelector && (doc.querySelector("body") || doc.documentElement);
      if (body && body.firstElementChild) {
        return `<!-- HIGHLIGHT START -->\n${body.firstElementChild.outerHTML}\n<!-- HIGHLIGHT END -->`;
      }

      return null;
    } catch (e) {
      console.warn("extractSnippetFromHtml failed:", e);
      return null;
    }
  }

  /**
   * Attempt to infer a document path from Ace assertion object.
   */
  function inferDocumentFromAssertion(a) {
    if (!a) return null;
    const tryVals = [];

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
      if (typeof res.selector === "string") tryVals.push(res.selector);
      else tryVals.push(JSON.stringify(res.selector));
    }
    if (res.node) tryVals.push(res.node);

    if (a.location) tryVals.push(a.location);
    if (a.path) tryVals.push(a.path);
    if (a.document) tryVals.push(a.document);

    // other possible fields
    if (a.source) tryVals.push(a.source);
    if (a["@id"]) tryVals.push(a["@id"]);
    if (a.target) tryVals.push(a.target);

    for (const v of tryVals) {
      if (!v || typeof v !== "string") continue;
      const cleaned = v.split("#")[0].trim();
      if (cleaned.toLowerCase().endsWith(".xhtml") || cleaned.toLowerCase().endsWith(".html") || /\/?oebps\//i.test(cleaned) || /xhtml\//i.test(cleaned)) {
        return cleaned;
      }
    }

    try {
      const s = JSON.stringify(a);
      const rx = /(?:[A-Za-z0-9_\/\-\:\.]*)(?:OEBPS\/|oebps\/|xhtml\/)?[A-Za-z0-9_\-\/\.]+?\.(?:xhtml|html)/gi;
      const matches = s.match(rx);
      if (matches && matches.length > 0) {
        const prefer = matches.find(m => /oebps/i.test(m) || /xhtml\//i.test(m));
        return (prefer || matches[0]).replace(/^\.\/+/, "").split("#")[0];
      }
      const rx2 = /\b[A-Za-z0-9_\-]+?\.(?:xhtml|html)\b/gi;
      const matches2 = s.match(rx2);
      if (matches2 && matches2.length > 0) return matches2[0];
    } catch (e) {
      console.warn("inferDocumentFromAssertion fallback regex failed:", e);
    }
    return null;
  }

  async function handleSelectIssue(assertion) {
    try {
      setSelectedIssue(assertion);
      setIssueHtml(null);
      setIssueEditValue("");
      setIssueLoading(true);
      setIssueMessage("");
      setIssueType("unknown");

      const docPath = inferDocumentFromAssertion(assertion);
      setIssueDocPath(docPath);

      const friendly = getIssueType(assertion);
      setIssueType(friendly);

      if (!docPath) {
        setIssueMessage("Could not determine a stable document path for this issue. You may need to open the referenced XHTML file directly in an editor. See console for assertion details.");
        console.warn("Could not infer doc path for assertion:", assertion);
        setIssueLoading(false);
        return;
      }

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
        const snippet = extractSnippetFromHtml(html, assertion);
        if (snippet) {
          setIssueHtml(html);
          setIssueEditValue(snippet);
          setIssueMessage("");
        } else {
          setIssueHtml(html);
          setIssueEditValue(html);
          setIssueMessage("No specific snippet could be located for this issue — the full document is loaded. Edit the highlighted part manually if you can identify it.");
        }
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
{/* 
        <h4>Issue HTML editor</h4>
        <p style={{ fontSize: 12, color: "#6b7280" }}>Click an issue in the middle panel to load its context HTML here. Changes are local to the browser only.</p>

        <div style={{ border: "1px solid #e6e8eb", borderRadius: 8, padding: 10, background: "#fafafa" }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>{selectedIssue ? `Issue selected` : "No issue selected yet."}</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>{selectedIssue ? `Document: ${issueDocPath || "unknown"}` : ""}</div>
          <div style={{ fontSize: 12, color: "#111827", marginBottom: 8, fontWeight: 700 }}>{selectedIssue ? `Issue type: ${issueType || "unknown"}` : ""}</div>

          {issueMessage && <div style={{ marginBottom: 8, color: "#92400e", background: "#fff7ed", padding: 8, borderRadius: 6 }}>{issueMessage}</div>}

          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, marginBottom: 6, fontWeight: 600 }}>HTML Source</div>
              <textarea value={issueEditValue} onChange={(e) => setIssueEditValue(e.target.value)} placeholder={issueLoading ? "Loading..." : "Select an issue to load its HTML here."} style={{ width: "100%", height: 380, boxSizing: "border-box", border: "1px solid #e5e7eb", borderRadius: 6, padding: 8, fontFamily: "monospace", fontSize: 12, resize: "vertical" }} />
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
          </div> */}
          </section>
        </div>
  );
}
