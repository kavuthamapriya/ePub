// src/modules/convert/ConvertPage.jsx
import React, { useState, useEffect } from "react";
import EPUBViewer from "../epub/EPUBViewer";
import PDFViewer from "../pdf/PDFViewer";
import { useConversionStore } from "../../store/useConversionStore";
import { useQCStore } from "../../store/useQCStore";



const headerHeight = 88;
const PREVIEW_HEIGHT = 520;

// ---------- Layout styles ----------
const pageLayout = {
  display: "flex",
  gap: 20,
  padding: 20,
  boxSizing: "border-box",
  height: `calc(100vh - ${headerHeight}px)`,
  background: "#f3f4f6",
  alignItems: "stretch",
};

const cardBase = {
  background: "#ffffff",
  borderRadius: 12,
  padding: 16,
  boxSizing: "border-box",
  boxShadow: "0 1px 3px rgba(15,23,42,0.08)",
};

const leftPanel = {
  ...cardBase,
  width: 280,
  minWidth: 260,
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

const middlePanel = {
  ...cardBase,
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const rightPanel = {
  ...cardBase,
  width: "32%",
  minWidth: 340,
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const fieldGroup = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const labelStyle = {
  fontSize: 13,
  fontWeight: 600,
  color: "#111827",
};

const hintText = {
  fontSize: 11,
  color: "#6b7280",
};

const textInput = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
};

const fileInput = {
  width: "100%",
  fontSize: 13,
};

const convertButton = (loading, enabled) => ({
  width: "100%",
  padding: "10px 12px",
  borderRadius: 999,
  border: "none",
  fontSize: 14,
  fontWeight: 600,
  color: "#ffffff",
  backgroundColor: !enabled ? "#9ca3af" : loading ? "#1d4ed8" : "#2563eb",
  cursor: !enabled ? "not-allowed" : loading ? "wait" : "pointer",
});

// ---------- Helper ----------
function extractSemanticTagsFromHtml(htmlString) {
  if (!htmlString) return [];
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");
    const skip = new Set(["html", "head", "body", "meta", "link", "script", "style", "title"]);
    const tags = new Set();
    doc.querySelectorAll("*").forEach(el => {
      const name = el.tagName.toLowerCase();
      if (!skip.has(name)) tags.add(name);
    });
    return [...tags].sort();
  } catch {
    return [];
  }
}

export default function ConvertPage() {
  const {
    epubFile,
    pdfFile,
    accessibleHtml,
    publisher,
    setPublisher,
    setEpubFile,
    setPdfFile,
    setAccessibleHtml,
    setHtmlTags,
    resetMappings,
  } = useConversionStore();

  const [localEpub, setLocalEpub] = useState(epubFile);
  const [localPdf, setLocalPdf] = useState(pdfFile);
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState("pdf"); 
  

  useEffect(() => {
    setLocalEpub(epubFile);
    setLocalPdf(pdfFile);
  }, [epubFile, pdfFile]);

  async function handleConvert() {
    if (!localEpub || loading) return alert("Upload an EPUB file first.");

    try {
      setLoading(true);
      const form = new FormData();
      form.append("publisher", publisher || "Unknown");
      form.append("epub_file", localEpub);
      if (localPdf) form.append("pdf_file", localPdf);

      const res = await fetch("http://localhost:8000/api/convert", {
        method: "POST",
        body: form,
      });

      if (!res.ok) throw new Error("Convert failed");

      const data = await res.json();
      const rawHtml = data?.accessible?.accessible_html ?? "";
      setAccessibleHtml(rawHtml);

      resetMappings();
      setHtmlTags(extractSemanticTagsFromHtml(rawHtml));

      setPreviewMode("html"); // auto-switch after convert
      alert("Convert succeeded");
    } catch (e) {
      console.error(e);
      alert("Convert failed. See console.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={pageLayout}>
      {/* LEFT */}
      <aside style={leftPanel}>
        <h3>Controls</h3>

        {/* <div style={fieldGroup}>
          <label style={labelStyle}>Publisher</label>
          <input style={textInput} value={publisher} onChange={e => setPublisher(e.target.value)} />
        </div> */}

        <div style={fieldGroup}>
          <label style={labelStyle}>EPUB File</label>
          <input type="file" accept=".epub" style={fileInput}
            onChange={e => {
              setLocalEpub(e.target.files[0] || null);
              setEpubFile(e.target.files[0] || null);
            }} />
        </div>

        <div style={fieldGroup}>
          <label style={labelStyle}>Reference PDF</label>
          <input type="file" accept="application/pdf" style={fileInput}
            onChange={e => {
              setLocalPdf(e.target.files[0] || null);
              setPdfFile(e.target.files[0] || null);
            }} />
        </div>

        <button onClick={handleConvert} disabled={!localEpub || loading}
          style={convertButton(loading, !!localEpub)}>
          {loading ? "Converting…" : "Convert"}
        </button>
      </aside>

      {/* MIDDLE */}
      <main style={middlePanel}>
        <h3>EPUB Preview</h3>
        <div style={{ flex: 1, border: "1px solid #e5e7eb", borderRadius: 10, padding: 8, overflow: "auto" }}>
          {localEpub ? <EPUBViewer file={localEpub} mode="scrolled" /> : "No EPUB selected"}
        </div>
      </main>

      {/* RIGHT */}
      <aside style={rightPanel}>
        {/* Toggle */}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h3>{previewMode === "pdf" ? "PDF Preview" : "HTML Source"}</h3>
          <div style={{ display: "flex", gap: 6 }}>
            {["pdf", "html"].map(m => (
              <button key={m} onClick={() => setPreviewMode(m)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "1px solid #d1d5db",
                  background: previewMode === m ? "#2563eb" : "#fff",
                  color: previewMode === m ? "#fff" : "#111",
                }}>
                {m.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div style={{
          height: PREVIEW_HEIGHT,
          border: "1px solid #e5e7eb",
          borderRadius: 10,
          overflow: "auto",
          background: previewMode === "html" ? "#0b1120" : "#f9fafb",
          padding: 8,
        }}>
          {previewMode === "pdf" && (
            localPdf ? <PDFViewer file={localPdf} /> : <div style={hintText}>No PDF uploaded</div>
          )}
          {previewMode === "html" && (
            accessibleHtml ? (
              <textarea readOnly value={accessibleHtml}
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                  background: "transparent",
                  color: "#e5e7eb",
                  fontFamily: "monospace",
                  resize: "none",
                }} />
            ) : <div style={{ color: "#9ca3af" }}>Run Convert to see HTML</div>
          )}
        </div>
      </aside>
    </div>
  );
}