import React, { useState, useEffect, useRef } from "react";
import EPUBViewer from "../epub/EPUBViewer";
import PDFViewer from "../pdf/PDFViewer";
import { useConversionStore } from "../../store/useConversionStore";
import { useQCStore } from "../../store/useQCStore";

const headerHeight = 88;

/* ---------- Layout styles ---------- */

const controlCard = {
  background: "#ffffff",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
  display: "flex",
  flexDirection: "column",
  gap: 20,
};

const sectionTitle = {
  fontSize: 18,
  fontWeight: 700,
  color: "#111827",
};

const inputGroup = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const label = {
  fontSize: 13,
  fontWeight: 600,
  color: "#374151",
};

const fileBox = {
  border: "1px dashed #c7d2fe",
  borderRadius: 10,
  padding: "10px 12px",
  background: "#f8fafc",
  cursor: "pointer",
};

const fileName = {
  fontSize: 12,
  color: "#2563eb",
  marginTop: 4,
  wordBreak: "break-all",
};

const accessibleBtn = (enabled) => ({
  marginTop: 10,
  padding: "14px",
  borderRadius: 999,
  border: "none",
  fontSize: 15,
  fontWeight: 700,
  background: enabled
    ? "linear-gradient(135deg,#059669,#047857)"
    : "#9ca3af",
  color: "#fff",
  cursor: enabled ? "pointer" : "not-allowed",
});

const pageLayout = {
  display: "flex",
  gap: 20,
  padding: 20,
  height: `calc(100vh - ${headerHeight}px)`,
  background: "#f3f4f6",
};

const cardBase = {
  background: "#ffffff",
  borderRadius: 12,
  padding: 16,
  boxShadow: "0 1px 3px rgba(15,23,42,0.08)",
};

const middlePanel = {
  ...cardBase,
  flex: 1,
  display: "flex",
  flexDirection: "column",
};

const rightPanel = {
  ...cardBase,
  width: "32%",
  minWidth: 340,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

const hintText = { fontSize: 11, color: "#6b7280" };

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
  const textareaRef = useRef(null);

  const [localEpub, setLocalEpub] = useState(epubFile);
  const [localPdf, setLocalPdf] = useState(pdfFile);

  const [accessibleLoading, setAccessibleLoading] = useState(false);

  const [previewMode, setPreviewMode] = useState("pdf");

  /* 🔥 SAME FILE FOR PREVIEW + DOWNLOAD */
  const [accessibleEpubBlob, setAccessibleEpubBlob] = useState(null);
  const [accessibleEpubUrl, setAccessibleEpubUrl] = useState(null);

  /* cleanup blob URL */
  useEffect(() => {
    return () => {
      if (accessibleEpubUrl) URL.revokeObjectURL(accessibleEpubUrl);
    };
  }, [accessibleEpubUrl]);

  useEffect(() => {
    setLocalEpub(epubFile);
    setLocalPdf(pdfFile);
  }, [epubFile, pdfFile]);

  /* ---------- upload ---------- */
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

  /* ---------- ACCESSIBLE EPUB ---------- */
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
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      const blob = new Blob([bytes], {
        type: "application/epub+zip",
      });

      const url = URL.createObjectURL(blob);

      setAccessibleEpubBlob(blob); // ✅ SAME FILE
      setAccessibleEpubUrl(url);   // ✅ SAME FILE
      setPreviewMode("accessible");

    } catch (e) {
      console.error(e);
      alert("Accessible EPUB conversion failed");
    } finally {
      setAccessibleLoading(false);
    }
  }

  return (
    <div style={pageLayout}>
      {/* LEFT */}
      <aside style={controlCard}>
        <div style={sectionTitle}>Controls</div>

        <div style={inputGroup}>
          <label style={label}>EPUB File</label>
          <label style={fileBox}>
            <input hidden type="file" accept=".epub"
              onChange={(e) => handleEpubUpload(e.target.files[0])} />
            Choose EPUB file
          </label>
          {localEpub && <div style={fileName}>{localEpub.name}</div>}
        </div>

        <div style={inputGroup}>
          <label style={label}>Reference PDF</label>
          <label style={fileBox}>
            <input hidden type="file" accept="application/pdf"
              onChange={(e) => {
                setLocalPdf(e.target.files[0] || null);
                setPdfFile(e.target.files[0] || null);
              }} />
            Choose PDF file (optional)
          </label>
          {localPdf && <div style={fileName}>{localPdf.name}</div>}
        </div>

        <button
          onClick={handleConvertAccessible}
          disabled={!localEpub || accessibleLoading}
          style={accessibleBtn(!!localEpub)}
        >
          {accessibleLoading
            ? "⏳ Processing…"
            : "Convert EPUB to Accessible EPUB"}
        </button>
      </aside>

      {/* MIDDLE */}
      <main style={middlePanel}>
        <h3>EPUB Preview</h3>
        <div style={{ flex: 1, overflow: "auto" }}>
          {localEpub ? <EPUBViewer file={localEpub} /> : "No EPUB selected"}
        </div>
      </main>

      {/* RIGHT */}
      {/* RIGHT */}
<aside style={rightPanel}>
  {/* HEADER + TOGGLES */}
  <div style={{ display: "flex", justifyContent: "space-between" }}>
    <h3>
      {previewMode === "pdf" ? "PDF Preview" : "Accessible EPUB"}
    </h3>

    <div style={{ display: "flex", gap: 6 }}>
      <button
        onClick={() => setPreviewMode("pdf")}
        style={{
          padding: "6px 12px",
          borderRadius: 6,
          border: "1px solid #d1d5db",
          background: previewMode === "pdf" ? "#2563eb" : "#fff",
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
          borderRadius: 6,
          border: "1px solid #d1d5db",
          background: previewMode === "accessible" ? "#2563eb" : "#fff",
          color: previewMode === "accessible" ? "#fff" : "#111",
          fontWeight: 600,
        }}
      >
        ACCESSIBLE EPUB
      </button>
    </div>
  </div>

  {/* BODY (SCROLLABLE) */}
  <div
    style={{
      flex: 1,
      marginTop: 8,
      overflowY: "auto",        // 🔥 ENABLE SCROLL
      paddingRight: 6,
    }}
  >
    {/* 📄 PDF PREVIEW */}
    {previewMode === "pdf" &&
      (localPdf ? (
        <PDFViewer file={localPdf} />
      ) : (
        <div style={hintText}>No PDF uploaded</div>
      ))}

    {/* 📘 ACCESSIBLE EPUB PREVIEW */}
    {previewMode === "accessible" &&
      (accessibleEpubBlob ? (
        <EPUBViewer
          key={accessibleEpubUrl}
          file={accessibleEpubBlob}
        />
      ) : (
        <div style={hintText}>
          Convert EPUB to preview here
        </div>
      ))}
  </div>

  {/* 🔥 STICKY DOWNLOAD FOOTER */}
  {previewMode === "accessible" && accessibleEpubBlob && (
    <div
      style={{
        borderTop: "1px solid #e5e7eb",
        paddingTop: 10,
        marginTop: 8,
        textAlign: "center",
      }}
    >
      <a
        href={accessibleEpubUrl}
        download="accessible.epub"
        style={{
          padding: "10px 18px",
          background: "#059669",
          color: "#fff",
          borderRadius: 8,
          textDecoration: "none",
          fontWeight: 600,
          display: "inline-block",
        }}
      >
        Download Accessible EPUB
      </a>
    </div>
  )}
</aside>

    </div>
  );
}
