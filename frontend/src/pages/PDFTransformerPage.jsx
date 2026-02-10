// src/pages/PDFTransformerPage.jsx
import React, { useEffect, useState } from "react";
import { FiUpload, FiDownload, FiArrowLeft } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import EPUBViewer from "../modules/epub/EPUBViewer";
import S4C_Logo from "/src/assets/S4C_Logo.png";

import {
  uploadEPUB,
  getAllEPUBs,
  getEPUB,
  deleteEPUB,
} from "../utils/epubDB";

export default function PDFTransformerPage() {
  const navigate = useNavigate();

  const [epubFiles, setEpubFiles] = useState([]);
  const [selectedEpub, setSelectedEpub] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("grid");

  /* ===================== Load EPUB List ===================== */
  const loadEpubList = async () => {
    try {
      const rows = await getAllEPUBs();

      const mapped = rows.map((row) => ({
        id: row.id,
        name: row.filename,
        cover: row.cover_base64,
      }));

      setEpubFiles(mapped);
    } catch (err) {
      console.error("Error loading EPUB list:", err);
    }
  };

  useEffect(() => {
    loadEpubList();
  }, []);

  /* ===================== Upload EPUB ===================== */
  const handleUpload = async (file) => {
    if (!file) return;
    await uploadEPUB(file);
    await loadEpubList();
  };

  /* ===================== Delete EPUB ===================== */
  const handleDelete = async (id) => {
    await deleteEPUB(id);
    setEpubFiles((prev) => prev.filter((ep) => ep.id !== id));
  };

  /* ===================== Open EPUB Viewer ===================== */
  const openViewer = async (epub) => {
    const blob = await getEPUB(epub.id);
    const arrayBuffer = await blob.arrayBuffer();

    setSelectedEpub({
      ...epub,
      file: arrayBuffer,
    });

    setView("viewer");
  };

  /* ===================== Convert EPUB → PDF ===================== */
  const handleConvert = async () => {
    if (!selectedEpub) return;

    setLoading(true);

    const fd = new FormData();
    fd.append(
      "epub",
      new Blob([selectedEpub.file], { type: "application/epub+zip" }),
      selectedEpub.name
    );

    const res = await fetch("http://localhost:8000/api/epub2pdf/epub-to-pdf", {
      method: "POST",
      body: fd,
    });

    const blob = await res.blob();
    setPdfUrl(URL.createObjectURL(blob));

    setLoading(false);
  };

  /* ===================== Download PDF ===================== */
  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = selectedEpub.name.replace(".epub", "") + ".pdf";
    a.click();
  };

  /* ===================== GO BACK ===================== */
  const goBack = () => {
    setSelectedEpub(null);
    setPdfUrl(null);
    setView("grid");
  };

  /* ===================== LOADING OVERLAY (Animated) ===================== */
  const LoadingOverlay = () => (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(255, 255, 255, 0.85)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        backdropFilter: "blur(6px)",
        animation: "fadeIn 0.3s ease",
      }}
    >
      {/* SPINNER */}
      <div
        style={{
          width: "80px",
          height: "80px",
          border: "8px solid #d1d5db",
          borderTopColor: "#4f46e5",
          borderRadius: "50%",
          animation: "spin 1s infinite linear",
        }}
      ></div>

      {/* ANIMATED TEXT */}
      <p
        style={{
          marginTop: "22px",
          fontSize: "22px",
          fontWeight: 700,
          color: "#4f46e5",
          animation: "pulse 1.5s infinite ease-in-out",
        }}
      >
        Converting… Please wait
      </p>

      {/* CSS KEYFRAMES */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          @keyframes pulse {
            0% { opacity: 0.4; transform: scale(0.98); }
            50% { opacity: 1; transform: scale(1); }
            100% { opacity: 0.4; transform: scale(0.98); }
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}
      </style>
    </div>
  );

  /* ===================== RENDER ===================== */
  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh" }}>
      {/* SHOW LOADING OVERLAY */}
      {loading && <LoadingOverlay />}

      {/* NAV BAR */}
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
        {/* ===================== GRID VIEW ===================== */}
        {view === "grid" && (
          <>
            <div
              onClick={() => navigate("/dashboard")}
              style={{
                color: "#4f46e5",
                fontWeight: 600,
                cursor: "pointer",
                marginBottom: "10px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <FiArrowLeft /> Back to Dashboard
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "20px",
                alignItems: "center",
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
                  onChange={(e) => handleUpload(e.target.files?.[0])}
                />
              </label>
            </div>

            {/* GRID */}
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
                      cursor: "pointer",
                    }}
                  >
                    ×
                  </button>

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

        {/* ===================== VIEWER ===================== */}
        {view === "viewer" && selectedEpub && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "450px 1fr 190px",
              gap: "20px",
              height: "88vh",
            }}
          >
            <button
              onClick={goBack}
              style={{
                gridColumn: "1 / span 3",
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

            {/* LEFT PANEL: EPUB VIEWER */}
            <div
              style={{
                background: "white",
                borderRadius: "12px",
                padding: "0",
                border: "1px solid #e5e7eb",
                height: "100%",
                overflow: "hidden",
              }}
            >
              <EPUBViewer file={selectedEpub.file} />
            </div>

            {/* RIGHT PANEL: PDF VIEWER */}
            <div
              style={{
                background: "white",
                borderRadius: "12px",
                padding: "20px",
                border: "1px solid #e5e7eb",
                overflow: "auto",
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
                  
                  <div
  style={{
    width: "100%",
    height: "100%",
    borderRadius: "12px",
    overflow: "hidden",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f3f4f6",
    padding: "0",
  }}
>
  <iframe
    src={`${pdfUrl}#zoom=page-width`}
    style={{
      width: "100%",
      height: "100%",
      border: "none",
    }}
  ></iframe>
</div>

                  
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
