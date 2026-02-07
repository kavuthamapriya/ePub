import React, { useState, useEffect } from "react";
import {
  FiUpload,
  FiFile,
  FiBookOpen,
  FiDownload,
  FiLayers,
} from "react-icons/fi";

import EPUBViewer from "../epub/EPUBViewer";
import PDFViewer from "../pdf/PDFViewer";

import { useConversionStore } from "../../store/useConversionStore";

/* Shared glossy card */
const card = {
  background: "rgba(255,255,255,0.7)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  padding: "20px",
  borderRadius: "16px",
  boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
  border: "1px solid rgba(255,255,255,0.6)",
};

export default function ConvertPage() {
  const {
    epubFile,
    pdfFile,
    setEpubFile,
    setPdfFile,
    setBookId,
    setPdfId,
    setEpubToc,
  } = useConversionStore();

  const [localEpub, setLocalEpub] = useState(epubFile);
  const [localPdf, setLocalPdf] = useState(pdfFile);

  const [accessibleLoading, setAccessibleLoading] = useState(false);
  const [accessibleEpubBlob, setAccessibleEpubBlob] = useState(null);
  const [accessibleEpubUrl, setAccessibleEpubUrl] = useState(null);

  const [previewMode, setPreviewMode] = useState("pdf");

  /* Cleanup Blob URL */
  useEffect(() => {
    return () => {
      if (accessibleEpubUrl) URL.revokeObjectURL(accessibleEpubUrl);
    };
  }, [accessibleEpubUrl]);

  /* Sync Zustand -> Local state */
  useEffect(() => {
    setLocalEpub(epubFile);
    setLocalPdf(pdfFile);
  }, [epubFile, pdfFile]);

  // ======================================================
  //  📘 EPUB Upload
  // ======================================================
  async function handleEpubUpload(file) {
  if (!file) return;

  setLocalEpub(file);
  setEpubFile(file);

  const fd = new FormData();
  fd.append("epub", file);   // ✅ FIXED

  const res = await fetch("http://localhost:8000/api/epub/upload", {
    method: "POST",
    body: fd,
  });

  const data = await res.json();

  if (!data.book_id) {
    alert("EPUB upload failed");
    return;
  }

  setBookId(data.book_id);

  // Now send to QC
  await handleQcUpload(file, data.book_id);
}

  // ======================================================
  //  📕 PDF Upload
  // ======================================================
  async function handlePdfUpload(file) {
    if (!file) return;

    const { bookId } = useConversionStore.getState();
    if (!bookId) {
      alert("Upload EPUB first — bookId missing.");
      return;
    }

    setLocalPdf(file);
    setPdfFile(file);

    const fd = new FormData();
    fd.append("pdf", file);
    fd.append("book_id", bookId);

    const res = await fetch("http://localhost:8000/api/pdf/upload", {
      method: "POST",
      body: fd,
    });

    const data = await res.json();
    if (data.pdf_id) setPdfId(data.pdf_id);
  }

  // ======================================================
  //  ♿ QC EPUB Upload (required for AutoFix)
  // ======================================================
  async function handleQcUpload(epubFile, bookId) {
  const fd = new FormData();

  fd.append("book_id", bookId);     // ✔ Required
  fd.append("epub_file", epubFile); // ✔ REQUIRED field name

  const res = await fetch("http://localhost:8000/api/qc/epub", {
    method: "POST",
    body: fd,
  });

  if (!res.ok) {
    console.error("QC upload failed", await res.text());
    throw new Error("QC upload failed");
  }

  return await res.json();
}

  // ======================================================
  //  ♿ Convert to Accessible EPUB
  // ======================================================
  async function handleConvertAccessible() {
    const { bookId } = useConversionStore.getState();
    if (!bookId) {
      alert("Upload EPUB first — no bookId.");
      return;
    }

    setAccessibleLoading(true);

    try {
      const fd = new FormData();
      fd.append("book_id", bookId);

      const res = await fetch("http://localhost:8000/api/qc/auto-fix", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) throw new Error("Auto-fix failed");

      const data = await res.json();
      if (!data.epub_b64) throw new Error("No epub_b64 returned");

      const binary = atob(data.epub_b64);
      const bytes = new Uint8Array([...binary].map((c) => c.charCodeAt(0)));

      const blob = new Blob([bytes], { type: "application/epub+zip" });
      const url = URL.createObjectURL(blob);

      setAccessibleEpubBlob(blob);
      setAccessibleEpubUrl(url);

      setPreviewMode("accessible");
    } catch (err) {
      console.error(err);
      alert("Conversion failed ❌");
    } finally {
      setAccessibleLoading(false);
    }
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "300px 1fr 380px",
        gap: "20px",
      }}
    >
      {/* LEFT PANEL */}
      <aside style={card}>
        <h2
          style={{
            background: "black",
            WebkitBackgroundClip: "text",
            color: "transparent",
            fontSize: "1.3rem",
            fontWeight: 800,
            marginBottom: "16px",
          }}
        >
          Controls
        </h2>

        {/* EPUB Upload */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontWeight: 600, marginBottom: 6, display: "block" }}>
            EPUB File
          </label>

          <label
            style={{
              border: "2px dashed #bfdbfe",
              padding: "12px",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
              background: "#eff6ff",
            }}
          >
            <FiUpload />
            <input
              hidden
              type="file"
              accept=".epub"
              onChange={(e) => handleEpubUpload(e.target.files[0])}
            />
            Choose EPUB
          </label>

          {localEpub && (
            <div
              style={{
                marginTop: "8px",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: "#2563eb",
              }}
            >
              <FiFile />
              {localEpub.name}
            </div>
          )}
        </div>

        {/* PDF Upload */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontWeight: 600, marginBottom: 6, display: "block" }}>
            Reference PDF (optional)
          </label>

          <label
            style={{
              border: "2px dashed #fecaca",
              padding: "12px",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
              background: "#fef2f2",
            }}
          >
            <FiUpload />
            <input
              hidden
              type="file"
              accept="application/pdf"
              onChange={(e) => handlePdfUpload(e.target.files[0])}
            />
            Choose PDF
          </label>

          {localPdf && (
            <div
              style={{
                marginTop: "8px",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: "#dc2626",
              }}
            >
              <FiFile />
              {localPdf.name}
            </div>
          )}
        </div>

        {/* Convert Button */}
        <button
          onClick={handleConvertAccessible}
          disabled={!localEpub || accessibleLoading}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "12px",
            border: "none",
            fontWeight: 700,
            background: localEpub
              ? "linear-gradient(135deg,#f97316,#ea580c)"
              : "#9ca3af",
            color: "#fff",
            cursor: localEpub ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            fontSize: "15px",
          }}
        >
          <FiBookOpen size={18} />
          {accessibleLoading ? "Processing…" : "Convert to Accessible EPUB"}
        </button>
      </aside>

      {/* CENTER PANEL */}
      <main style={{ ...card, height: "85vh", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <FiLayers size={20} color="#2563eb" />
          <h3 style={{ margin: 0 }}>EPUB Preview</h3>
        </div>

        <div
          style={{
            marginTop: "14px",
            borderRadius: "12px",
            overflow: "auto",
            height: "100%",
            border: "1px solid #e5e7eb",
          }}
        >
          {localEpub ? (
            <EPUBViewer file={localEpub} />
          ) : (
            <div
              style={{
                padding: "20px",
                color: "#6b7280",
                textAlign: "center",
              }}
            >
              No EPUB selected
            </div>
          )}
        </div>
      </main>

      {/* RIGHT PANEL */}
      <aside style={{ ...card, height: "85vh", overflow: "hidden" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "10px",
          }}
        >
          <h3 style={{ margin: 0 }}>
            {previewMode === "pdf" ? "PDF Preview" : "Accessible EPUB"}
          </h3>

          {/* Toggle */}
          <div
            style={{
              background: "#e5e7eb",
              padding: "4px",
              borderRadius: "999px",
              display: "flex",
              gap: "4px",
            }}
          >
            <button
              onClick={() => setPreviewMode("pdf")}
              style={{
                padding: "6px 12px",
                borderRadius: "999px",
                border: "none",
                background: previewMode === "pdf" ? "#2563eb" : "transparent",
                color: previewMode === "pdf" ? "#fff" : "#374151",
                cursor: "pointer",
              }}
            >
              PDF
            </button>

            <button
              onClick={() => setPreviewMode("accessible")}
              style={{
                padding: "6px 12px",
                borderRadius: "999px",
                border: "none",
                background:
                  previewMode === "accessible" ? "#2563eb" : "transparent",
                color: previewMode === "accessible" ? "#fff" : "#374151",
                cursor: "pointer",
              }}
            >
              EPUB
            </button>
          </div>
        </div>

        {/* Preview Body */}
        <div
          style={{
            marginTop: "8px",
            overflowY: "auto",
            height: "calc(100% - 120px)",
            paddingRight: "6px",
          }}
        >
          {previewMode === "pdf" ? (
            localPdf ? (
              <PDFViewer key={localPdf.name} file={localPdf} />
            ) : (
              <div style={{ color: "#6b7280" }}>No PDF uploaded.</div>
            )
          ) : accessibleEpubBlob ? (
            <EPUBViewer key={accessibleEpubUrl} file={accessibleEpubBlob} />
          ) : (
            <div style={{ color: "#6b7280" }}>
              Convert EPUB to preview here.
            </div>
          )}
        </div>

        {/* Download Button */}
        {previewMode === "accessible" && accessibleEpubBlob && (
          <div
            style={{
              borderTop: "1px solid #e5e7eb",
              paddingTop: "10px",
              marginTop: "8px",
              textAlign: "center",
            }}
          >
            <a
              href={accessibleEpubUrl}
              download="accessible.epub"
              style={{
                padding: "10px 18px",
                background: "linear-gradient(135deg,#f97316,#ea580c)",
                borderRadius: "12px",
                color: "#fff",
                textDecoration: "none",
                display: "inline-flex",
                gap: "8px",
                alignItems: "center",
              }}
            >
              <FiDownload />
              Download Accessible EPUB
            </a>
          </div>
        )}
      </aside>
    </div>
  );
}
