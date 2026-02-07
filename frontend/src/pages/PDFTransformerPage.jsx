import React, { useEffect, useState } from "react";
import { FiUpload, FiDownload, FiArrowLeft } from "react-icons/fi";
import EPUBViewer from "../modules/epub/EPUBViewer";
import JSZip from "jszip";
import S4C_Logo from "/src/assets/S4C_Logo.png";

import {
  saveEPUB,
  loadEPUB,
  loadAllEPUBs,
  deleteEPUB,
} from "../utils/epubDB";

/* Extract EPUB Cover */
async function extractCover(file) {
  try {
    const zip = await JSZip.loadAsync(file);
    const container = await zip.file("META-INF/container.xml")?.async("string");

    if (!container) return null;

    const dom = new DOMParser().parseFromString(container, "text/xml");
    const opfPath = dom.getElementsByTagName("rootfile")[0]?.getAttribute("full-path");
    if (!opfPath) return null;

    const opfXml = await zip.file(opfPath).async("string");
    const opfDom = new DOMParser().parseFromString(opfXml, "text/xml");
    const items = opfDom.getElementsByTagName("item");

    let imgHref = null;

    for (let item of items) {
      const props = item.getAttribute("properties");
      const type = item.getAttribute("media-type");
      const href = item.getAttribute("href");

      if (props?.includes("cover-image")) imgHref = href;
      if (!imgHref && type?.startsWith("image/")) imgHref = href;
    }

    if (!imgHref) return null;

    const folder = opfPath.split("/").slice(0, -1).join("/");
    const finalPath = folder ? `${folder}/${imgHref}` : imgHref;

    const imgFile = zip.file(finalPath);
    if (!imgFile) return null;

    const base64 = await imgFile.async("base64");
    return `data:image/jpeg;base64,${base64}`;
  } catch {
    return null;
  }
}

export default function PDFTransformerPage() {
  const [epubFiles, setEpubFiles] = useState([]);
  const [selectedEpub, setSelectedEpub] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("grid");

  /* Load EPUBs */
  useEffect(() => {
    (async () => {
      const metadata = JSON.parse(localStorage.getItem("persist_epubs") || "[]");
      const storedFiles = await loadAllEPUBs();

      const merged = metadata.map(m => ({
        ...m,
        file: storedFiles.find(s => s.id === m.id)?.file || null,
      }));

      setEpubFiles(merged);
    })();
  }, []);

  /* Save metadata */
  useEffect(() => {
    const metadata = epubFiles.map(({ id, name, cover }) => ({ id, name, cover }));
    localStorage.setItem("persist_epubs", JSON.stringify(metadata));
  }, [epubFiles]);

  /* Upload EPUB */
  const handleUpload = async (file) => {
    const id = Date.now();
    const cover = await extractCover(file);

    await saveEPUB(id, file);

    setEpubFiles(prev => [{ id, name: file.name, cover, file }, ...prev]);
  };

  /* Delete EPUB */
  const handleDelete = async (id) => {
    await deleteEPUB(id);
    setEpubFiles(prev => prev.filter(ep => ep.id !== id));
  };

  /* Open Viewer */
  const openViewer = async (epub) => {
    let file = epub.file;

    if (!file) file = await loadEPUB(epub.id);

    setSelectedEpub({ ...epub, file });
    setView("viewer");
  };

  /* Back */
  const goBack = () => {
    setSelectedEpub(null);
    setPdfUrl(null);
    setView("grid");
  };

  /* Convert EPUB to PDF */
  const handleConvert = async () => {
    setLoading(true);

    const fd = new FormData();
    fd.append("epub", selectedEpub.file);

    const res = await fetch("http://localhost:8000/api/epub2pdf/epub-to-pdf", {
      method: "POST",
      body: fd,
    });

    const blob = await res.blob();
    setPdfUrl(URL.createObjectURL(blob));

    setLoading(false);
  };

  /* Download PDF */
  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = selectedEpub.name.replace(".epub", "") + ".pdf";
    a.click();
  };

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh" }}>
      
      {/* NAVBAR */}
      <nav
        style={{
          width: "100%",
          background: "black",
          padding: "14px 28px",
          display: "flex",
          alignItems: "center",
          gap: "18px",
        }}
      >
        <img src={S4C_Logo} style={{ height: "55px" }} />
        <h2 style={{ color: "white", margin: 0, fontWeight: 700 }}>
          Ninja <span style={{ color: "#fbbf24" }}>PDF</span> Transformer
        </h2>
      </nav>

      <div style={{ padding: "25px" }}>
        
        {/* GRID MODE */}
        {view === "grid" && (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "20px",
              }}
            >
              <h1 style={{ fontSize: "28px", fontWeight: "700" }}>
                Uploaded EPUBs
              </h1>

              <label
                style={{
                  background: "#4f46e5",
                  padding: "12px 22px",
                  color: "white",
                  borderRadius: "10px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <FiUpload /> Upload EPUB
                <input
                  hidden
                  type="file"
                  accept=".epub"
                  onChange={(e) => handleUpload(e.target.files[0])}
                />
              </label>
            </div>

            {/* EPUB GRID */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: "20px",
              }}
            >
              {epubFiles.map((epub) => (
                <div
                  key={epub.id}
                  style={{
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    padding: "12px",
                    position: "relative",
                    cursor: "pointer",
                  }}
                >
                  {/* DELETE BUTTON */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(epub.id);
                    }}
                    style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      background: "#ef4444",
                      color: "white",
                      border: "none",
                      borderRadius: "50%",
                      width: "28px",
                      height: "28px",
                      fontSize: "16px",
                      cursor: "pointer",
                    }}
                  >
                    ×
                  </button>

                  {/* EPUB Cover */}
                  <div onClick={() => openViewer(epub)}>
                    <img
                      src={epub.cover}
                      style={{
                        width: "100%",
                        height: "360px",
                        objectFit: "contain",
                        background: "#f5f5f5",
                        borderRadius: "8px",
                      }}
                    />
                    <p
                      style={{
                        marginTop: "10px",
                        fontSize: "13px",
                        fontWeight: 600,
                        textAlign: "center",
                      }}
                    >
                      {epub.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* VIEWER MODE */}
        {view === "viewer" && selectedEpub && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "420px 1fr 500px",  /* ⭐ WIDER LEFT PANEL */
              gap: "20px",
              height: "85vh",
            }}
          >
            {/* BACK BUTTON */}
            <button
              onClick={goBack}
              style={{
                gridColumn: "1 / span 3",
                marginBottom: "10px",
                background: "transparent",
                border: "none",
                color: "#4f46e5",
                fontSize: "17px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              <FiArrowLeft /> Back to EPUBs
            </button>

            {/* EPUB VIEWER */}
            <div
              style={{
                background: "white",
                borderRadius: "12px",
                padding: "12px",
                border: "1px solid #e5e7eb",
                overflow: "hidden",
              }}
            >
              <EPUBViewer file={selectedEpub.file} />
            </div>

            {/* PDF PANEL */}
            <div
              style={{
                background: "white",
                borderRadius: "12px",
                padding: "20px",
                border: "1px solid #e5e7eb",
              }}
            >
              {!pdfUrl ? (
                <>
                  <h2>Ready to Convert</h2>
                  <button
                    onClick={handleConvert}
                    disabled={loading}
                    style={{
                      marginTop: "20px",
                      width: "100%",
                      padding: "14px",
                      background: "#4f46e5",
                      color: "white",
                      borderRadius: "10px",
                      border: "none",
                      fontWeight: 600,
                    }}
                  >
                    {loading ? "Converting..." : "Convert to PDF"}
                  </button>
                </>
              ) : (
                <>
                  <h2>Converted PDF</h2>
                  <iframe
                    src={pdfUrl}
                    style={{
                      width: "100%",
                      height: "70%",
                      border: "none",
                      marginTop: "15px",
                    }}
                  />
                  <button
                    onClick={handleDownload}
                    style={{
                      marginTop: "15px",
                      width: "100%",
                      padding: "14px",
                      background: "#f97316",
                      color: "white",
                      borderRadius: "10px",
                      border: "none",
                      fontWeight: 600,
                    }}
                  >
                    <FiDownload /> Download PDF
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
