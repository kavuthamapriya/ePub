// src/modules/convert/ConvertPage.jsx
import React, { useState, useEffect } from "react";
import EPUBViewer from "../epub/EPUBViewer";
import PDFViewer from "../pdf/PDFViewer";
import { useConversionStore } from "../../store/useConversionStore";

const headerHeight = 88;

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
  transition: "background-color 0.15s ease",
});

// ---------- Helper: extract unique semantic tags from HTML ----------
function extractSemanticTagsFromHtml(htmlString) {
  if (!htmlString) return [];

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");

    const skipTags = new Set([
      "html",
      "head",
      "body",
      "meta",
      "link",
      "script",
      "style",
      "title",
    ]);

    const tagSet = new Set();

    doc.querySelectorAll("*").forEach((el) => {
      const name = el.tagName.toLowerCase();
      if (!skipTags.has(name)) {
        tagSet.add(name);
      }
    });

    return Array.from(tagSet).sort();
  } catch (err) {
    console.error("extractSemanticTagsFromHtml failed:", err);
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
    setHtmlTags,      // <-- from your store
    resetMappings,    // <-- from your store
  } = useConversionStore();

  const [localEpub, setLocalEpub] = useState(epubFile);
  const [localPdf, setLocalPdf] = useState(pdfFile);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLocalEpub(epubFile);
    setLocalPdf(pdfFile);
  }, [epubFile, pdfFile]);

  async function handleConvert() {
    if (!localEpub || loading) {
      alert("Upload an EPUB file first.");
      return;
    }

    try {
      setLoading(true);

      const form = new FormData();
      form.append("publisher", publisher || "Unknown");
      form.append("epub_file", localEpub);
      if (localPdf) form.append("pdf_file", localPdf);

      console.log("ConvertPage: POST http://localhost:8000/api/convert");
      const res = await fetch("http://localhost:8000/api/convert", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const txt = await res.text();
        console.error("Convert failed. HTTP", res.status, txt);
        alert(`Convert failed: HTTP ${res.status} — see console for details.`);
        return;
      }

      const data = await res.json();
      console.log("ConvertPage: Convert success payload:", data);

      const rawHtml = data?.accessible?.accessible_html ?? "";
      setAccessibleHtml(rawHtml);

      // 🔁 reset old mapping + extract tags for Tag Mapping page
      resetMappings();
      const tags = extractSemanticTagsFromHtml(rawHtml);
      console.log("ConvertPage: extracted semantic tags:", tags);
      setHtmlTags(tags);

      alert("Convert succeeded");
    } catch (err) {
      console.error("ConvertPage: error (network or JS):", err);
      alert("Convert failed: unexpected error (see console).");
    } finally {
      setLoading(false);
    }
  }

  const canConvert = !!localEpub;

  return (
    <div style={pageLayout}>
      {/* LEFT: Controls */}
      <aside style={leftPanel}>
        <div>
          <h3 style={{ margin: 0, marginBottom: 4 }}>Controls</h3>
          <p style={{ ...hintText, marginTop: 2 }}>
            Upload an EPUB (and optional reference PDF), then run Convert.
          </p>
        </div>

        <div style={fieldGroup}>
          <label style={labelStyle}>Publisher</label>
          <input
            style={textInput}
            value={publisher}
            onChange={(e) => setPublisher(e.target.value)}
            placeholder="e.g. Boydell & Brewer"
          />
        </div>

        <div style={fieldGroup}>
          <label style={labelStyle}>EPUB File</label>
          <input
            type="file"
            accept=".epub"
            style={fileInput}
            onChange={(e) => {
              const file = e.target.files[0];
              setLocalEpub(file || null);
              setEpubFile(file || null);
            }}
          />
          <span style={hintText}>
            Required. This EPUB will be analyzed and converted.
          </span>
        </div>

        <div style={fieldGroup}>
          <label style={labelStyle}>Reference PDF (optional)</label>
          <input
            type="file"
            accept="application/pdf"
            style={fileInput}
            onChange={(e) => {
              const file = e.target.files[0];
              setLocalPdf(file || null);
              setPdfFile(file || null);
            }}
          />
          <span style={hintText}>
            Optional visual reference only — shown on the right.
          </span>
        </div>

        <button
          onClick={handleConvert}
          disabled={!canConvert || loading}
          style={convertButton(loading, canConvert)}
        >
          {loading ? "Converting…" : "Convert"}
        </button>

        {!canConvert && (
          <div style={{ ...hintText, marginTop: 4 }}>
            Upload an EPUB file above to enable Convert.
          </div>
        )}
      </aside>

      {/* MIDDLE: EPUB preview */}
      <main style={middlePanel}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <h3 style={{ margin: 0 }}>EPUB Preview</h3>
          {localEpub && (
            <span style={hintText}>
              {localEpub.name} · {(localEpub.size / 1024 / 1024).toFixed(2)} MB
            </span>
          )}
        </div>

        <div
          style={{
            flex: 1,
            minHeight: 420,
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            padding: 8,
            overflow: "auto",
            background: "#f9fafb",
          }}
        >
          {localEpub ? (
            <EPUBViewer file={localEpub} mode="scrolled" />
          ) : (
            <div style={{ color: "#6b7280", fontSize: 13 }}>
              No EPUB selected. Choose an EPUB file in the Controls panel to
              see a live preview here.
            </div>
          )}
        </div>
      </main>

      {/* RIGHT: PDF + Accessible HTML source */}
      <aside style={rightPanel}>
        <h3 style={{ margin: 0 }}>PDF Preview</h3>

        {/* PDF preview */}
        <div
          style={{
            height: 220,
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            overflow: "hidden",
            background: "#f9fafb",
            padding: 6,
          }}
        >
          {localPdf ? (
            <PDFViewer file={localPdf} />
          ) : (
            <div style={{ ...hintText, padding: 10 }}>
              Upload a reference PDF in the Controls panel to preview it here.
            </div>
          )}
        </div>

        {/* HTML source box */}
        <div
          style={{
            flex: 1,
            minHeight: 260,
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            padding: 8,
            overflow: "auto",
            background: "#0b1120",
          }}
        >
          {accessibleHtml ? (
            <textarea
              value={accessibleHtml}
              readOnly
              style={{
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
                border: "none",
                background: "transparent",
                color: "#e5e7eb",
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                fontSize: 12,
                lineHeight: 1.4,
                resize: "none",
              }}
            />
          ) : (
            <div style={{ ...hintText, color: "#9ca3af" }}>
              Accessible HTML will appear here after you run <b>Convert</b>.
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
