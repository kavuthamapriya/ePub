import React, { useState } from "react";
import EPUBViewer from "../epub/EPUBViewer";
import PDFViewer from "../pdf/PDFViewer";


const pageContainer = {
  display: "flex",
  height: "calc(100vh - 56px)", // full height minus top nav
  backgroundColor: "#f3f4f6",
  overflow: "hidden",
};
const cardBase = {
  padding: "16px",
  boxSizing: "border-box",
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
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


const panelBase = {
  padding: "0.75rem",
  boxSizing: "border-box",
  backgroundColor: "#ffffff",
  borderRight: "1px solid #e1e4e8",
};

const middlePanelStyle = {
  ...panelBase,
  width: "40%",
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

const columnContainer = {
  display: "flex",
  flex: 1,
  minHeight: 0,
};

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
    return; // let browser handle normally
  }

  // Block EPUB-internal file links (like "cover.xhtml")
  e.preventDefault();
});
</script>`;

  // If the HTML already has a </body>, inject script before it
  if (raw.includes("</body>")) {
    return raw.replace("</body>", script + "</body>");
  }

  // Otherwise just append script
  return raw + script;
}


function ConvertPage() {
  const [epubFile, setEpubFile] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [publisher, setPublisher] = useState("");
  const [accessibleHtml, setAccessibleHtml] = useState("");

  async function handleConvert() {
  if (!epubFile) {
    alert("Upload an EPUB first");
    return;
  }

  try {
    let form = new FormData();
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
const safeHtml = enhanceAccessibleHtml(rawHtml);  // 👈 sanitise links
setAccessibleHtml(safeHtml);



  } catch (err) {
    console.error("ConvertPage: unexpected error during convert", err);
    alert("Unexpected error during convert (see console)");
  }
}


  return (
    <div style={columnContainer}>
      <section style={leftPanelStyle}>
        <h3>Controls</h3>

        <label>Publisher</label>
        <input
          style={{ width: "100%", marginBottom: "8px" }}
          value={publisher}
          onChange={(e) => {
    const f = e.target.files[0];
    console.log("ConvertPage: selected EPUB:", f);
    setEpubFile(f);
  }}
        />

        <label>EPUB File</label>
        <input
          type="file"
          accept=".epub"
          onChange={(e) => setEpubFile(e.target.files[0])}
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

      <section style={middlePanelStyle}>
        <h3>EPUB Preiew</h3>
        {epubFile ? (
          <EPUBViewer file={epubFile} />
        ) : (
          <p style={{ color: "#777" }}>Upload an EPUB to preview it</p>
        )}
      </section>

      <section style={rightPanelStyle}>
        <h3>PDF / Accessible HTML</h3>
        {pdfFile ? (
          <PDFViewer file={pdfFile} />
        ) : (
          <p style={{ color: "#777" }}>Upload a PDF to preview it</p>
        )}
        <div style={{ marginTop: "8px", height: "40%" }}>
          <h4 style={{ marginBottom: "4px" }}>Accessible HTML Preview</h4>
          <iframe
            style={{
              width: "100%",
              height: "100%",
              border: "1px solid #d1d5db",
              backgroundColor: "white",
            }}
            srcDoc={accessibleHtml}
          />
        </div>
      </section>
    </div>
  );
}

export default ConvertPage;
