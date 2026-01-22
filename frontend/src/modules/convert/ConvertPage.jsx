import React, { useState, useEffect, useRef } from "react";
import { FiUpload, FiFile, FiBookOpen, FiDownload } from "react-icons/fi";
import EPUBViewer from "../epub/EPUBViewer";
import PDFViewer from "../pdf/PDFViewer";
import { useConversionStore } from "../../store/useConversionStore";
import { useQCStore } from "../../store/useQCStore";

const headerHeight = 88;

/* --------------------------------------------------
   Orange Theme Button
-------------------------------------------------- */
const orangeButton = (enabled) => ({
  marginTop: 10,
  padding: "14px 16px",
  borderRadius: 12,
  border: "none",
  fontSize: 15,
  fontWeight: 700,
  background: enabled
    ? "linear-gradient(135deg,#f97316,#ea580c)"
    : "#9ca3af",
  color: "#fff",
  cursor: enabled ? "pointer" : "not-allowed",
  display: "flex",
  alignItems: "center",
  gap: 8,
  justifyContent: "center",
});

/* --------------------------------------------------
   Layout Styles
-------------------------------------------------- */
const pageLayout = {
  display: "flex",
  gap: 20,
  padding: 20,
  height: `calc(100vh - ${headerHeight}px)`,
  background: "#f3f4f6",
};

const controlCard = {
  background: "#ffffff",
  borderRadius: 16,
  padding: 22,
  boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
  display: "flex",
  flexDirection: "column",
  gap: 22,
  width: 300,
};

const card = {
  background: "#ffffff",
  borderRadius: 14,
  padding: 18,
  boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
};

const label = {
  fontSize: 13,
  fontWeight: 600,
  color: "#374151",
};

const fileBox = {
  border: "2px dashed #fb923c",
  borderRadius: 10,
  padding: "12px 14px",
  background: "#fff7ed",
  cursor: "pointer",
  textAlign: "center",
  fontWeight: 600,
  color: "#ea580c",
  display: "flex",
  justifyContent: "center",
  gap: 8,
};

const fileName = {
  fontSize: 12,
  color: "#d97706",
  marginTop: 6,
  wordBreak: "break-all",
};

const hintText = { fontSize: 12, color: "#6b7280" };

export default function ConvertPage() {
  const {
    epubFile,
    pdfFile,
    accessibleHtml,
    setEpubFile,
    setPdfFile,
    setAccessibleHtml,
    resetAfterConvert,
    setBookId,
    setEpubToc,
  } = useConversionStore();

  const selectedIssue = useQCStore((s) => s.selectedIssue);

  const [localEpub, setLocalEpub] = useState(epubFile);
  const [localPdf, setLocalPdf] = useState(pdfFile);
  const [accessibleLoading, setAccessibleLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState("pdf");

  const [accessibleEpubBlob, setAccessibleEpubBlob] = useState(null);
  const [accessibleEpubUrl, setAccessibleEpubUrl] = useState(null);

  /* Cleanup blob URL */
  useEffect(() => {
    return () => {
      if (accessibleEpubUrl) URL.revokeObjectURL(accessibleEpubUrl);
    };
  }, [accessibleEpubUrl]);

  useEffect(() => {
    setLocalEpub(epubFile);
    setLocalPdf(pdfFile);
  }, [epubFile, pdfFile]);

  /* --------------------------------------------------
     Upload EPUB
  -------------------------------------------------- */
  async function handleEpubUpload(file) {
    if (!file) return;

    setLocalEpub(file);
    setEpubFile(file);

    const fd = new FormData();
    fd.append("epub", file);

    const res = await fetch("http://localhost:8000/api/epub/upload", {
      method: "POST",
      body: fd,
    });

    const data = await res.json();
    if (data.book_id) setBookId(data.book_id);
    if (Array.isArray(data.toc)) setEpubToc(data.toc);
  }

  /* --------------------------------------------------
     Convert to Accessible EPUB
  -------------------------------------------------- */
  async function handleConvertAccessible() {
    if (!localEpub) return;

    setAccessibleLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/qc/auto-fix", {
        method: "POST",
      });

      if (!res.ok) throw new Error("Auto-fix failed");

      const data = await res.json();
      if (!data.epub_b64) throw new Error("No epub_b64");

      const binary = atob(data.epub_b64);
      const bytes = new Uint8Array([...binary].map((x) => x.charCodeAt(0)));

      const blob = new Blob([bytes], {
        type: "application/epub+zip",
      });

      const url = URL.createObjectURL(blob);

      setAccessibleEpubBlob(blob);
      setAccessibleEpubUrl(url);

      useConversionStore.getState().setAccessibleEpubBlob(blob);

      setPreviewMode("accessible");
    } catch (e) {
      console.error(e);
      alert("Conversion failed ❌");
    } finally {
      setAccessibleLoading(false);
    }
  }

  return (
    <div style={pageLayout}>
      {/* LEFT SIDE */}
      <aside style={controlCard}>
        <h3 style={{ fontSize: 18, fontWeight: 700 }}>Controls</h3>

        {/* EPUB Upload */}
        <div>
          <label style={label}>EPUB File</label>
          <label style={fileBox}>
            <FiUpload size={18} />
            <input
              hidden
              type="file"
              accept=".epub"
              onChange={(e) => handleEpubUpload(e.target.files[0])}
            />
            Select EPUB
          </label>
          {localEpub && (
            <div style={fileName}>
              <FiFile /> {localEpub.name}
            </div>
          )}
        </div>

        {/* PDF Upload */}
        <div>
          <label style={label}>Reference PDF</label>
          <label style={fileBox}>
            <FiUpload size={18} />
            <input
              hidden
              type="file"
              accept="application/pdf"
              onChange={(e) => {
                setLocalPdf(e.target.files[0]);
                setPdfFile(e.target.files[0]);
              }}
            />
            Select PDF
          </label>
          {localPdf && (
            <div style={fileName}>
              <FiFile /> {localPdf.name}
            </div>
          )}
        </div>

        {/* Convert Button */}
        <button
          onClick={handleConvertAccessible}
          disabled={!localEpub || accessibleLoading}
          style={orangeButton(!!localEpub)}
        >
          <FiBookOpen size={18} />
          {accessibleLoading ? "Processing…" : "Convert to Accessible EPUB"}
        </button>
      </aside>

      {/* MIDDLE PREVIEW */}
      <main style={{ ...card, flex: 1, overflow: "hidden" }}>
        <h3 style={{ marginBottom: 8 }}>EPUB Preview</h3>
        <div style={{ flex: 1, overflow: "auto" }}>
          {localEpub ? <EPUBViewer file={localEpub} /> : "No EPUB selected"}
        </div>
      </main>

      {/* RIGHT PANEL */}
      <aside style={{ ...card, width: "32%", minWidth: 340, display: "flex", flexDirection: "column" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h3>{previewMode === "pdf" ? "PDF Preview" : "Accessible EPUB"}</h3>

          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => setPreviewMode("pdf")}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                background: previewMode === "pdf" ? "#f97316" : "#fff",
                color: previewMode === "pdf" ? "#fff" : "#111",
                fontWeight: 600,
              }}
            >
              PDF
            </button>

            <button
              onClick={() => setPreviewMode("accessible")}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                background: previewMode === "accessible" ? "#f97316" : "#fff",
                color: previewMode === "accessible" ? "#fff" : "#111",
                fontWeight: 600,
              }}
            >
              Accessible
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, marginTop: 10, overflowY: "auto", paddingRight: 6 }}>
          {previewMode === "pdf" ? (
            localPdf ? (
              <PDFViewer file={localPdf} />
            ) : (
              <div style={hintText}>No PDF uploaded</div>
            )
          ) : accessibleEpubBlob ? (
            <EPUBViewer key={accessibleEpubUrl} file={accessibleEpubBlob} />
          ) : (
            <div style={hintText}>Convert EPUB to preview</div>
          )}
        </div>

        {/* Footer Download */}
        {previewMode === "accessible" && accessibleEpubBlob && (
          <div
            style={{
              borderTop: "1px solid #e5e7eb",
              paddingTop: 10,
              textAlign: "center",
              marginTop: 8,
            }}
          >
            <a
              href={accessibleEpubUrl}
              download="accessible.epub"
              style={{
                padding: "10px 18px",
                background: "linear-gradient(135deg,#f97316,#ea580c)",
                color: "#fff",
                borderRadius: 8,
                textDecoration: "none",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <FiDownload /> Download Accessible EPUB
            </a>
          </div>
        )}
      </aside>
    </div>
  );
}
