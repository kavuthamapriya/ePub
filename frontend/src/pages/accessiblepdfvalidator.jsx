// src/pages/AccessiblePDFValidator.jsx
import React, { useState } from "react";
import {
  FiUpload,
  FiTrash2,
  FiArrowLeft,
  FiFileText,
  FiX,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import S4C_Logo from "/src/assets/S4C_Logo.png";

export default function AccessiblePDFValidator() {
  const navigate = useNavigate();

  const [pdfFiles, setPdfFiles] = useState([]);
  const [modalPdf, setModalPdf] = useState(null);
  const [loading, setLoading] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  /* ===================== UPLOAD PDF ===================== */
  const handleUpload = (file) => {
    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Please upload a valid PDF file");
      return;
    }

    const exists = pdfFiles.some(
      (pdf) => pdf.name.toLowerCase() === file.name.toLowerCase()
    );

    if (exists) {
      alert("⚠ This PDF is already uploaded!");
      return;
    }

    setPdfFiles((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) + " MB",
        url: URL.createObjectURL(file),
        file,
      },
    ]);
  };

  /* ===================== DELETE PDF ===================== */
  const deletePdf = (id) => {
    setPdfFiles((prev) => prev.filter((pdf) => pdf.id !== id));
  };

  /* ===================== VALIDATE PDF ===================== */
  const validatePdf = async (pdf) => {
    setLoading(true);
    setValidationResult(null);

    const fd = new FormData();
    fd.append("pdf", pdf.file);

    try {
      const res = await fetch("http://localhost:8000/api/pac/validate", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      setValidationResult(data);
    } catch (err) {
      setValidationResult({
        status: "ERROR",
        summary: "PAC Validation Failed. Check backend logs.",
      });
    }

    setLoading(false);
  };

  /* ===================== RENDER ===================== */
  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh" }}>
      {/* NAV BAR */}
      <nav
        style={{
          width: "100%",
          background: "#020617",
          padding: "14px 28px",
          display: "flex",
          alignItems: "center",
          gap: "18px",
        }}
      >
        <img src={S4C_Logo} style={{ height: "55px" }} />
        <h2 style={{ color: "white", margin: 0, fontWeight: 700 }}>
          Ninja <span style={{ color: "#f97316" }}>Accessible PDF</span>{" "}
          Validator
        </h2>
      </nav>

      {/* PAGE CONTENT */}
      <div style={{ padding: "28px" }}>
        {/* BACK BUTTON */}
        <div
          onClick={() => navigate("/dashboard")}
          style={{
            color: "#f97316",
            fontWeight: 600,
            cursor: "pointer",
            marginBottom: "18px",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <FiArrowLeft /> Back to Dashboard
        </div>

        <h1 style={{ fontSize: "28px", fontWeight: 700 }}>Uploaded PDFs</h1>

        {/* UPLOAD BUTTON */}
        <label
          style={{
            background: "#f97316",
            padding: "12px 22px",
            color: "white",
            borderRadius: "10px",
            cursor: "pointer",
            float: "right",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontWeight: 600,
          }}
        >
          <FiUpload /> Upload PDF
          <input
            hidden
            type="file"
            accept=".pdf"
            onChange={(e) => handleUpload(e.target.files?.[0])}
          />
        </label>

        <div style={{ clear: "both", marginBottom: "20px" }} />

        {/* PDF GRID */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "28px",
          }}
        >
          {pdfFiles.map((pdf) => (
            <div
              key={pdf.id}
              style={{
                background: "white",
                borderRadius: "14px",
                border: "1px solid #e5e7eb",
                padding: "18px",
                boxShadow: "0 4px 18px rgba(0,0,0,0.08)",
              }}
            >
              {/* PDF THUMBNAIL */}
              <div
                onClick={() => setModalPdf(pdf)}
                style={{
                  height: "280px",
                  overflow: "hidden",
                  borderRadius: "10px",
                  cursor: "pointer",
                }}
              >
                <iframe
                  src={`${pdf.url}#page=1&zoom=150`}
                  style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                  }}
                ></iframe>
              </div>

              <p style={{ fontWeight: 600, marginTop: "14px" }}>{pdf.name}</p>
              <p style={{ fontSize: "13px", color: "#64748b" }}>{pdf.size}</p>

              {/* BUTTONS STACKED */}
              <button
                onClick={() => validatePdf(pdf)}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "#0ea5e9",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  marginTop: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Validate
              </button>

              <button
                onClick={() => deletePdf(pdf.id)}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  marginTop: "10px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <FiTrash2 /> Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* FLOATING MODAL VIEWER */}
      {modalPdf && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.65)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
          onClick={() => setModalPdf(null)}
        >
          <div
            style={{
              width: "65%",
              height: "85%",
              background: "white",
              borderRadius: "12px",
              overflow: "hidden",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* CLOSE BUTTON */}
            <button
              onClick={() => setModalPdf(null)}
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                background: "white",
                borderRadius: "50%",
                border: "none",
                padding: "8px",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
              }}
            >
              <FiX size={20} />
            </button>

            <iframe
              src={`${modalPdf.url}#zoom=page-width`}
              style={{ width: "100%", height: "100%", border: "none" }}
            ></iframe>
          </div>
        </div>
      )}

      {/* VALIDATION RESULT MODAL */}
      {validationResult && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.60)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 99999,
          }}
          onClick={() => setValidationResult(null)}
        >
          <div
            style={{
              width: "450px",
              padding: "30px",
              background: "white",
              borderRadius: "14px",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                color:
                  validationResult.status === "PASS" ? "green" : "red",
              }}
            >
              {validationResult.status === "PASS"
                ? "✔ Accessible PDF"
                : "⚠ Accessibility Issues Found"}
            </h2>

            <p style={{ marginTop: "16px", color: "#374151" }}>
              {validationResult.summary}
            </p>

            <button
              style={{
                marginTop: "20px",
                padding: "10px 22px",
                background: "#0ea5e9",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: 600,
              }}
              onClick={() => setValidationResult(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* LOADING OVERLAY */}
      {loading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(255,255,255,0.8)",
            backdropFilter: "blur(4px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 999999,
            flexDirection: "column",
          }}
        >
          <div
            style={{
              width: "60px",
              height: "60px",
              border: "6px solid #d1d5db",
              borderTopColor: "#0ea5e9",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          ></div>

          <p
            style={{
              marginTop: "18px",
              color: "#0ea5e9",
              fontWeight: 600,
              fontSize: "18px",
            }}
          >
            Validating PDF…
          </p>

          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
