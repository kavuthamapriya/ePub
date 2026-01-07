// src/modules/convert/ConvertPage.jsx
import React, { useState, useEffect, useRef } from "react";
import EPUBViewer from "../epub/EPUBViewer";
import PDFViewer from "../pdf/PDFViewer";
import { useConversionStore } from "../../store/useConversionStore";
import { useQCStore } from "../../store/useQCStore";

const headerHeight = 88;
const PREVIEW_HEIGHT = 520;

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

const convertBtn = (enabled, loading) => ({
  marginTop: 10,
  padding: "14px",
  borderRadius: 999,
  border: "none",
  fontSize: 15,
  fontWeight: 700,
  background: enabled
    ? "linear-gradient(135deg,#2563eb,#1d4ed8)"
    : "#9ca3af",
  color: "#fff",
  cursor: enabled ? "pointer" : "not-allowed",
  boxShadow: enabled ? "0 8px 20px rgba(37,99,235,0.35)" : "none",
  transition: "all 0.2s ease",
});

const accessibleBtn = (enabled, loading) => ({
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
  boxShadow: enabled ? "0 8px 20px rgba(5,150,105,0.35)" : "none",
  transition: "all 0.2s ease",
});

const pageLayout = {
  display: "flex",
  gap: 20,
  padding: 20,
  boxSizing: "border-box",
  height: `calc(100vh - ${headerHeight}px)`,
  background: "#f3f4f6",
};

const cardBase = {
  background: "#ffffff",
  borderRadius: 12,
  padding: 16,
  boxSizing: "border-box",
  boxShadow: "0 1px 3px rgba(15,23,42,0.08)",
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

const hintText = { fontSize: 11, color: "#6b7280" };

/* ---------- helper ---------- */
function extractSemanticTagsFromHtml(html) {
  if (!html) return [];
  const doc = new DOMParser().parseFromString(html, "text/html");
  const skip = new Set(["html","head","body","meta","link","script","style"]);
  const tags = new Set();
  doc.querySelectorAll("*").forEach(el => {
    const t = el.tagName.toLowerCase();
    if (!skip.has(t)) tags.add(t);
  });
  return [...tags];
}

export default function ConvertPage() {
  const {
    epubFile,
    pdfFile,
    accessibleHtml,
    setEpubFile,
    setPdfFile,
    setAccessibleHtml,
    setHtmlTags,
    resetAfterConvert,
    setBookId,
    setEpubToc,
  } = useConversionStore();

  /*  QC selected issue */
  const selectedIssue = useQCStore((s) => s.selectedIssue);

  const textareaRef = useRef(null);

  const [localEpub, setLocalEpub] = useState(epubFile);
  const [localPdf, setLocalPdf] = useState(pdfFile);
const [htmlLoading, setHtmlLoading] = useState(false);
const [accessibleLoading, setAccessibleLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState("pdf");
  const [accessibleEpubUrl, setAccessibleEpubUrl] = useState(null);


  useEffect(() => {
    setLocalEpub(epubFile);
    setLocalPdf(pdfFile);
  }, [epubFile, pdfFile]);

  /* ---------- 🔥 HIGHLIGHT QC ERROR LINE ---------- */
  useEffect(() => {
    if (
      previewMode !== "html" ||
      !selectedIssue ||
      !selectedIssue.line ||
      !textareaRef.current ||
      !accessibleHtml
    )
      return;

    const textarea = textareaRef.current;
    const lines = accessibleHtml.split("\n");
    const lineIndex = selectedIssue.line - 1;

    if (!lines[lineIndex]) return;

    let start = 0;
    for (let i = 0; i < lineIndex; i++) {
      start += lines[i].length + 1;
    }

    const end = start + lines[lineIndex].length;

    textarea.focus();
    textarea.setSelectionRange(start, end);

    const lineHeight = 18; // approx monospace
    textarea.scrollTop = lineIndex * lineHeight;
  }, [selectedIssue, previewMode, accessibleHtml]);

  /* ---------------- EPUB UPLOAD ---------------- */
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

  /* ---------------- CONVERT ---------------- */
  async function handleConvert() {
  if (!localEpub) return;

  setHtmlLoading(true);
  try {
    const fd = new FormData();
    fd.append("epub_file", localEpub);
    if (localPdf) fd.append("pdf_file", localPdf);

    const res = await fetch("http://localhost:8000/api/convert", {
      method: "POST",
      body: fd,
    });

    const data = await res.json();
    const html = data?.accessible?.accessible_html ?? "";

    setAccessibleHtml(html);
    resetAfterConvert();
    setPreviewMode("html");

  } catch (e) {
    console.error(e);
    alert("Convert failed");
  } finally {
    setHtmlLoading(false);
  }
}


  /* ---------- convert to Accessible EPUB ---------- */
  async function handleConvertAccessible() {
  if (!localEpub) return;

  setAccessibleLoading(true);
  try {
    const res = await fetch("http://localhost:8000/api/qc/auto-fix", {
      method: "POST",
    });

    if (!res.ok) throw new Error("Auto-fix failed");

    const data = await res.json();

    // 🔥 decode base64 → Blob
    const binary = atob(data.epub_b64);
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: "application/epub+zip" });

    const url = URL.createObjectURL(blob);
    setAccessibleEpubUrl(url);

    setPreviewMode("accessible");
    alert("Accessible EPUB generated successfully");

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
            <input
              type="file"
              accept=".epub"
              hidden
              onChange={(e) => handleEpubUpload(e.target.files[0])}
            />
            Choose EPUB file
          </label>
          {localEpub && <div style={fileName}>{localEpub.name}</div>}
        </div>

        <div style={inputGroup}>
          <label style={label}>Reference PDF</label>
          <label style={fileBox}>
            <input
              type="file"
              accept="application/pdf"
              hidden
              onChange={(e) => {
                setLocalPdf(e.target.files[0] || null);
                setPdfFile(e.target.files[0] || null);
              }}
            />
            Choose PDF file (optional)
          </label>
          {localPdf && <div style={fileName}>{localPdf.name}</div>}
        </div>

        <button
  onClick={handleConvert}
  disabled={!localEpub || htmlLoading || accessibleLoading}
  style={convertBtn(!!localEpub, htmlLoading)}
>
  {htmlLoading ? "⏳ Converting…" : "Convert EPUB to HTML"}
</button>

        <button
  onClick={handleConvertAccessible}
  disabled={!localEpub || htmlLoading || accessibleLoading}
  style={accessibleBtn(!!localEpub, accessibleLoading)}
>
  {accessibleLoading ? "⏳ Processing…" : "Convert EPUB to Accessible EPUB"}
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
<aside style={rightPanel}>
  <div style={{ display: "flex", justifyContent: "space-between" }}>
    <h3>
      {previewMode === "pdf"
        ? "PDF Preview"
        : previewMode === "html"
        ? "HTML Source"
        : "Accessible EPUB"}
    </h3>

    <div style={{ display: "flex", gap: 6 }}>
      {["pdf", "html", "accessible"].map((m) => (
        <button
          key={m}
          onClick={() => setPreviewMode(m)}
          style={{
            padding: "6px 12px",
            borderRadius: 6,
            border: "1px solid #d1d5db",
            background: previewMode === m ? "#2563eb" : "#fff",
            color: previewMode === m ? "#fff" : "#111",
          }}
        >
          {m === "accessible" ? "ACCESSIBLE EPUB" : m.toUpperCase()}
        </button>
      ))}
    </div>
  </div>

  <div
    style={{
      height: PREVIEW_HEIGHT,
      border: "1px solid #e5e7eb",
      borderRadius: 10,
      overflow: "auto",
      background: previewMode === "html" ? "#0b1120" : "#f9fafb",
      padding: 8,
    }}
  >
    {/* PDF */}
    {previewMode === "pdf" &&
      (localPdf ? (
        <PDFViewer file={localPdf} />
      ) : (
        <div style={hintText}>No PDF uploaded</div>
      ))}

    {/* HTML */}
    {previewMode === "html" &&
      (accessibleHtml ? (
        <textarea
          ref={textareaRef}
          readOnly
          value={accessibleHtml}
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            background: "transparent",
            color: "#e5e7eb",
            fontFamily: "monospace",
            resize: "none",
            caretColor: "transparent",
          }}
        />
      ) : (
        <div style={{ color: "#9ca3af" }}>Run Convert to see HTML</div>
      ))}

    {/* 🔥 ACCESSIBLE EPUB */}
    {previewMode === "accessible" && (
      accessibleEpubUrl ? (
        <div style={{ textAlign: "center", marginTop: 40 }}>
          <p style={{ marginBottom: 12 }}>Accessible EPUB ready ✅</p>
          <a
            href={accessibleEpubUrl}
            download="accessible.epub"
            style={{
              padding: "10px 16px",
              background: "#059669",
              color: "#fff",
              borderRadius: 8,
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Download Accessible EPUB
          </a>
        </div>
      ) : (
        <div style={{ color: "#6b7280" }}>
          Convert EPUB to Accessible EPUB to view here
        </div>
      )
    )}
  </div>
</aside>

    </div>
  );
}
