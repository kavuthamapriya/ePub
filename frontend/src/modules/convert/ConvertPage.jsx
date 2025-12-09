// src/modules/convert/ConvertPage.jsx
import React, { useState, useEffect } from "react";
import EPUBViewer from "../epub/EPUBViewer";
// PDFViewer removed – no longer used
import { useConversionStore } from "../../store/useConversionStore";

const headerHeight = 88;

const containerStyle = {
  display: "flex",
  gap: 20,
  padding: 16,
  boxSizing: "border-box",
  height: `calc(100vh - ${headerHeight}px)`,
  alignItems: "stretch",
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

// ---- helper: extract unique semantic tags from HTML ----
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
    pdfFile, // still kept in store, but not previewed here
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

  useEffect(() => {
    setLocalEpub(epubFile);
    setLocalPdf(pdfFile);
  }, [epubFile, pdfFile]);

  async function handleConvert() {
    if (!localEpub) {
      alert("Upload EPUB first");
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
        alert(`Convert failed: HTTP ${res.status} — see console for details`);
        return;
      }

      const data = await res.json();
      console.log("ConvertPage: Convert success payload:", data);

      const rawHtml = data?.accessible?.accessible_html ?? "";
      setAccessibleHtml(rawHtml);

      // reset old mappings & extract new tags
      resetMappings();
      const tags = extractSemanticTagsFromHtml(rawHtml);
      console.log("ConvertPage: extracted semantic tags:", tags);
      setHtmlTags(tags);

      alert("Convert succeeded");
    } catch (err) {
      console.error("ConvertPage: error (network or JS):", err);
      alert("Convert failed: unexpected error (see console)");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={containerStyle}>
      {/* LEFT: controls */}
      <aside style={leftPanel}>
        <h3>Controls</h3>

        <label>Publisher</label>
        <input
          value={publisher}
          onChange={(e) => setPublisher(e.target.value)}
          style={{ width: "100%", marginBottom: 8 }}
        />

        <label>EPUB File</label>
        <input
          type="file"
          accept=".epub"
          onChange={(e) => {
            const f = e.target.files[0];
            setLocalEpub(f);
            setEpubFile(f);
          }}
        />

        <label style={{ marginTop: 10 }}>Reference PDF</label>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => {
            const f = e.target.files[0];
            setLocalPdf(f);
            setPdfFile(f);
          }}
        />

        <button
          onClick={handleConvert}
          style={{
            marginTop: 14,
            padding: 10,
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            width: "100%",
          }}
        >
          {loading ? "Converting..." : "Convert"}
        </button>
      </aside>

      {/* MIDDLE: EPUB preview */}
      <main style={middlePanel}>
        <h3 style={{ margin: 0 }}>EPUB Preview</h3>

        {/* Single-scroll EPUB container */}
        <div
          style={{
            flex: 1,
            minHeight: 500,
            border: "1px solid #e6e8eb",
            borderRadius: 6,
            overflow: "hidden", // hide extra nested scrollbars
          }}
        >
          {localEpub ? (
            <div
              style={{
                width: "100%",
                height: "100%",
                overflow: "auto", // one visible scrollbar only
              }}
            >
              <EPUBViewer file={localEpub} mode="scrolled" />
            </div>
          ) : (
            <div style={{ padding: 16, color: "#777" }}>
              Upload EPUB to preview
            </div>
          )}
        </div>
      </main>

      {/* RIGHT: Accessible HTML source ONLY (PDF preview removed) */}
      <aside style={rightPanel}>
        <h3 style={{ margin: 0 }}>Accessible HTML (Source)</h3>

        <div
          style={{
            flex: 1,
            minHeight: 260,
            border: "1px solid #e6e8eb",
            borderRadius: 6,
            padding: 8,
            overflow: "auto",
            background: "#fafafa",
          }}
        >
          <textarea
            value={accessibleHtml}
            readOnly
            style={{
              width: "100%",
              height: "100%",
              boxSizing: "border-box",
              border: "none",
              background: "transparent",
              resize: "none",
              fontFamily: "monospace",
              fontSize: 12,
              lineHeight: 1.4,
            }}
          />
        </div>
      </aside>
    </div>
  );
}
