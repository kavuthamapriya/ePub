import React from "react";
import EPUBViewer from "../epub/EPUBViewer";
import PDFViewer from "../pdf/PDFViewer";
import { useConversionStore } from "../../store/useConversionStore";

// Layout styles
const pageContainer = {
  display: "flex",
  height: "70vh",
  backgroundColor: "#f3f4f6",
  overflow: "hidden",
};

const cardBase = {
  padding: "16px",
  boxSizing: "border-box",
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.12)",
};

const leftPanelStyle = {
  ...cardBase,
  width: "22%",
  minWidth: "260px",
  margin: "16px",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const middlePanelStyle = {
  ...cardBase,
  flex: 1,
  margin: "16px 8px",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

const rightPanelStyle = {
  ...cardBase,
  width: "32%",
  minWidth: "360px",
  margin: "16px",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

// We still keep this for safety in case you later want a live iframe preview.
function enhanceAccessibleHtml(raw) {
  if (!raw) return "";

  const script = `
<script>
document.addEventListener('click', function(e) {
  var link = e.target.closest('a');
  if (!link) return;

  var href = link.getAttribute('href') || '';
  if (!href) return;

  // Allow external links and in-page anchors
  if (href.startsWith('http') || href.startsWith('https') ||
      href.startsWith('#') || href.startsWith('mailto:')) {
    return;
  }

  // Block EPUB-internal file links (like "cover.xhtml")
  e.preventDefault();
});
</script>`;

  if (raw.includes("</body>")) {
    return raw.replace("</body>", script + "</body>");
  }
  return raw + script;
}

// Extract unique tag names from HTML for Tag Mapping
function extractUniqueTags(html) {
  if (!html) return [];
  const div = document.createElement("div");
  div.innerHTML = html;
  const elements = div.querySelectorAll("*");
  const tags = new Set();
  elements.forEach((el) => tags.add(el.tagName.toLowerCase()));
  return Array.from(tags).sort();
}

function ConvertPage() {
  const {
    publisher,
    epubFile,
    pdfFile,
    accessibleHtml,
    setPublisher,
    setEpubFile,
    setPdfFile,
    setAccessibleHtml,
    setHtmlTags,
  } = useConversionStore();

  async function handleConvert() {
    if (!epubFile) {
      alert("Upload an EPUB first");
      return;
    }

    try {
      const form = new FormData();
      form.append("publisher", publisher || "Unknown");
      form.append("epub_file", epubFile);
      if (pdfFile) form.append("pdf_file", pdfFile);

      console.log("ConvertPage: sending /api/convert request...");

      const res = await fetch("/api/convert", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("ConvertPage: /api/convert failed", res.status, text);
        alert(`Convert failed: HTTP ${res.status}`);
        return;
      }

      const data = await res.json();
      console.log("ConvertPage: /api/convert response", data);

      const rawHtml = data?.accessible?.accessible_html ?? "";

      // 1) Store HTML in state (we'll show it as source)
      // If you later want the safe iframe version, use enhanceAccessibleHtml(rawHtml)
      setAccessibleHtml(rawHtml);

      // 2) Extract tags for Tag Mapping
      const tags = extractUniqueTags(rawHtml);
      setHtmlTags(tags);
    } catch (err) {
      console.error("ConvertPage: unexpected error during convert", err);
      alert("Unexpected error during convert (see console)");
    }
  }

  return (
    <div style={pageContainer}>
      {/* LEFT – controls */}
      <section style={leftPanelStyle}>
        <h3>Controls</h3>

        <label>Publisher</label>
        <input
          style={{
            width: "100%",
            marginBottom: "8px",
            padding: "8px",
            borderRadius: "6px",
            border: "1px solid #d1d5db",
          }}
          value={publisher}
          onChange={(e) => setPublisher(e.target.value)}
        />

        <label>EPUB File</label>
        <input
          type="file"
          accept=".epub"
          onChange={(e) => {
            const f = e.target.files[0];
            console.log("ConvertPage: selected EPUB:", f);
            setEpubFile(f);
          }}
        />

        <label style={{ marginTop: "10px" }}>Reference PDF</label>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setPdfFile(e.target.files[0])}
        />

        <button
          onClick={handleConvert}
          style={{
            marginTop: "14px",
            padding: "10px",
            width: "100%",
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "15px",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Convert
        </button>
      </section>

      {/* MIDDLE – EPUB preview */}
      <section style={middlePanelStyle}>
        <h3>EPUB Preview</h3>
        <div
          style={{
            flex: 1,
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            overflow: "auto",
            backgroundColor: "#ffffff",
          }}
        >
          {epubFile ? (
            <EPUBViewer file={epubFile} />
          ) : (
            <p style={{ padding: "10px", color: "#777" }}>
              Upload an EPUB to preview it
            </p>
          )}
        </div>
      </section>

      {/* RIGHT – PDF + Accessible HTML (SOURCE CODE) */}
      <section style={rightPanelStyle}>
        <h3>PDF / Accessible HTML</h3>
        <div style={{ flex: 1, overflow: "hidden" }}>
          {pdfFile ? (
            <PDFViewer file={pdfFile} />
          ) : (
            <p style={{ color: "#777" }}>Upload a PDF to preview it</p>
          )}
        </div>

        <div style={{ marginTop: "8px", height: "40%", display: "flex", flexDirection: "column" }}>
          <h4 style={{ marginBottom: "4px" }}>Accessible HTML (Source)</h4>
          <textarea
            readOnly
            value={accessibleHtml}
            style={{
              width: "100%",
              height: "100%",
              border: "1px solid #d1d5db",
              backgroundColor: "#f9fafb",
              borderRadius: "4px",
              fontFamily: "monospace",
              fontSize: "12px",
              padding: "8px",
              whiteSpace: "pre",
              overflow: "auto",
            }}
          />
        </div>
      </section>
    </div>
  );
}

export default ConvertPage;
