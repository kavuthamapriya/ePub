// src/modules/convert/ConvertPage.jsx
import React, { useState, useEffect } from "react";
import EPUBViewer from "../epub/EPUBViewer";
import PDFViewer from "../pdf/PDFViewer";
import { useConversionStore } from "../../store/useConversionStore";

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

// const leftPanel = {
//   ...cardBase,
//   width: 280,
//   minWidth: 260,
//   display: "flex",
//   flexDirection: "column",
//   gap: 16,
// };

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

const fieldGroup = { display: "flex", flexDirection: "column", gap: 6 };
const labelStyle = { fontSize: 13, fontWeight: 600 };
const hintText = { fontSize: 11, color: "#6b7280" };
const fileInput = { width: "100%", fontSize: 13 };

const convertButton = (loading, enabled) => ({
  width: "100%",
  padding: "10px",
  borderRadius: 999,
  border: "none",
  fontSize: 14,
  fontWeight: 600,
  color: "#fff",
  backgroundColor: !enabled ? "#9ca3af" : loading ? "#1d4ed8" : "#2563eb",
  cursor: !enabled ? "not-allowed" : loading ? "wait" : "pointer",
});

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

  const [localEpub, setLocalEpub] = useState(epubFile);
  const [localPdf, setLocalPdf] = useState(pdfFile);
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState("pdf"); 

  useEffect(() => {
    setLocalEpub(epubFile);
    setLocalPdf(pdfFile);
  }, [epubFile, pdfFile]);

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
    console.log("📘 EPUB upload:", data);

    if (data.book_id) setBookId(data.book_id);
    if (Array.isArray(data.toc)) setEpubToc(data.toc);
  }

  /* ---------------- CONVERT ---------------- */
  async function handleConvert() {
  if (!localEpub) {
    alert("Upload EPUB first");
    return;
  }

  setLoading(true);

  let data;

  try {
    const fd = new FormData();
    fd.append("epub_file", localEpub);
    if (localPdf) fd.append("pdf_file", localPdf);

    const res = await fetch("http://localhost:8000/api/convert", {
      method: "POST",
      body: fd,
    });

    if (!res.ok) {
      throw new Error(`Convert API failed: ${res.status}`);
    }

    data = await res.json();
  } catch (apiError) {
    console.error("Convert API error:", apiError);
    alert("Convert failed (backend error)");
    setLoading(false);
    return;
  }

  try {
    const html = data?.accessible?.accessible_html ?? "";

    setAccessibleHtml(html);
    resetAfterConvert(); 
    setHtmlTags(extractSemanticTagsFromHtml(html));
    setPreviewMode("html");

    alert("Convert succeeded");
  } catch (uiError) {
    console.error("UI post-process error:", uiError);
    alert("Convert succeeded");
  } finally {
    setLoading(false);
  }
}

  return (
    <div style={pageLayout}>
      {/* LEFT */}
      <aside style={controlCard}>
  <div style={sectionTitle}>Controls</div>

  {/* EPUB */}
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
    {localEpub && (
      <div style={fileName}>{localEpub.name}</div>
    )}
  </div>

  {/* PDF */}
  <div style={inputGroup}>
    <label style={label}> Reference PDF</label>
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
    {localPdf && (
      <div style={fileName}>{localPdf.name}</div>
    )}
  </div>

  {/* Convert */}
  <button
    onClick={handleConvert}
    disabled={!localEpub || loading}
    style={convertBtn(!!localEpub, loading)}
  >
    {loading ? "⏳ Converting…" : " Convert EPUB"}
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
        {/* TOGGLE */}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h3>{previewMode === "pdf" ? "PDF Preview" : "HTML Source"}</h3>
          <div style={{ display: "flex", gap: 6 }}>
            {["pdf", "html"].map((m) => (
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
                {m.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* PREVIEW */}
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
          {previewMode === "pdf" &&
            (localPdf ? (
              <PDFViewer file={localPdf} />
            ) : (
              <div style={hintText}>No PDF uploaded</div>
            ))}

          {previewMode === "html" &&
            (accessibleHtml ? (
              <textarea
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
                }}
              />
            ) : (
              <div style={{ color: "#9ca3af" }}>
                Run Convert to see HTML
              </div>
            ))}
        </div>
      </aside>
    </div>
  );
}
