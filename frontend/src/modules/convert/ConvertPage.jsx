// src/modules/convert/ConvertPage.jsx
import React, { useState, useEffect } from "react";
import EPUBViewer from "../epub/EPUBViewer";
import PDFViewer from "../pdf/PDFViewer";
import { useConversionStore } from "../../store/useConversionStore";

const headerHeight = 88;

const containerStyle = {
  display: "flex",
  gap: 20,
  padding: 16,
  boxSizing: "border-box",
  height: `calc(100vh - ${headerHeight}px)`,
  alignItems: "stretch"
};

const leftPanel = {
  width: "22%",
  minWidth: 240,
  background: "#fff",
  padding: 18,
  borderRadius: 8,
  boxSizing: "border-box",
  overflow: "auto",
};

const middlePanel = {
  flex: 1,
  background: "#fff",
  padding: 12,
  borderRadius: 8,
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const rightPanel = {
  width: "32%",
  minWidth: 340,
  background: "#fff",
  padding: 12,
  borderRadius: 8,
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

export default function ConvertPage() {
  const {
    epubFile, pdfFile, accessibleHtml,
    setEpubFile, setPdfFile, setAccessibleHtml,
    setPublisher, publisher
  } = useConversionStore();

  const [localEpub, setLocalEpub] = useState(epubFile);
  const [localPdf, setLocalPdf] = useState(pdfFile);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // sync store -> local
    setLocalEpub(epubFile);
    setLocalPdf(pdfFile);
  }, [epubFile, pdfFile]);

  async function handleConvert() {
    if (!localEpub) { alert("Upload EPUB first"); return; }

    try {
      setLoading(true);
      const form = new FormData();
      form.append("publisher", publisher || "Unknown");
      form.append("epub_file", localEpub);
      if (localPdf) form.append("pdf_file", localPdf);

      const res = await fetch("/api/convert", { method: "POST", body: form });
      if (!res.ok) {
        const txt = await res.text();
        console.error("Convert failed:", res.status, txt);
        alert(`Convert failed: HTTP ${res.status}`);
        setLoading(false);
        return;
      }
      const data = await res.json();
      const raw = data?.accessible?.accessible_html ?? "";
      setAccessibleHtml(raw); // store -> mapping page will see this
      alert("Convert succeeded");
    } catch (e) {
      console.error("Convert error:", e);
      alert("Convert failed (see console)");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={containerStyle}>
      <aside style={leftPanel}>
        <h3>Controls</h3>

        <label>Publisher</label>
        <input value={publisher} onChange={(e) => setPublisher(e.target.value)} style={{ width: "100%", marginBottom: 8 }} />

        <label>EPUB File</label>
        <input type="file" accept=".epub" onChange={(e)=> { const f = e.target.files[0]; setLocalEpub(f); setEpubFile(f); }} />

        <label style={{ marginTop: 10 }}>Reference PDF</label>
        <input type="file" accept="application/pdf" onChange={(e)=> { const f = e.target.files[0]; setLocalPdf(f); setPdfFile(f); }} />

        <button onClick={handleConvert} style={{ marginTop: 14, padding: 10, background: "#2563eb", color: "#fff", border: "none", borderRadius: 6 }}>
          {loading ? "Converting..." : "Convert"}
        </button>
      </aside>

      <main style={middlePanel}>
        <h3 style={{ margin: 0 }}>EPUB Preview</h3>
        <div style={{ flex: 1, minHeight: 400, border: "1px solid #e6e8eb", borderRadius: 6, padding: 8, overflow: "auto" }}>
          {localEpub ? <EPUBViewer file={localEpub} mode="scrolled" /> : <div style={{ color: "#777" }}>Upload EPUB to preview</div>}
        </div>
      </main>

      <aside style={rightPanel}>
        <h3 style={{ margin: 0 }}>Accessible HTML (Source)</h3>

        {/* PDF preview box */}
        <div style={{ height: 220, border: "1px solid #e6e8eb", borderRadius: 6, overflow: "hidden", padding: 6 }}>
          {localPdf ? <PDFViewer file={localPdf} /> : <div style={{ color: "#777" }}>Upload a PDF to preview</div>}
        </div>

        {/* Accessible HTML source - MUCH larger now */}
        <div style={{ flex: 1, minHeight: 260, border: "1px solid #e6e8eb", borderRadius: 6, padding: 8, overflow: "auto", background: "#fafafa" }}>
          <textarea value={accessibleHtml} readOnly style={{ width: "100%", height: "100%", boxSizing: "border-box", border: "none", background: "transparent", resize: "none" }} />
        </div>
      </aside>
    </div>
  );
}
