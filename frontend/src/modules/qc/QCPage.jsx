// src/modules/qc/QCPage.jsx
import React, { useState } from "react";
import { useConversionStore } from "../../store/useConversionStore";
import QCReport from "./QCReport";

const wrapperStyle = {
  display: "flex",
  gap: 16,
  backgroundColor: "#f3f4f6",
  padding: 16,
  borderRadius: 8,
  marginTop: 8,
};

const leftStyle = {
  width: "23%",
  minWidth: 260,
  background: "#ffffff",
  padding: 16,
  borderRadius: 8,
  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.06)",
};

const middleStyle = {
  flex: 1,
  background: "#ffffff",
  padding: 16,
  borderRadius: 8,
  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.06)",
};

const rightStyle = {
  width: "30%",
  minWidth: 340,
  background: "#ffffff",
  padding: 16,
  borderRadius: 8,
  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.06)",
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

export default function QCPage() {
  const { epubFile, accessibleHtml } = useConversionStore();

  const [qcLoading, setQcLoading] = useState(false);
  const [qcResult, setQcResult] = useState(null);

  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);

  async function runQc() {
    if (!epubFile) {
      alert("Upload an EPUB and click Convert first.");
      return;
    }

    try {
      setQcLoading(true);
      const form = new FormData();
      form.append("epub_file", epubFile);

      console.log("QCPage: POST http://localhost:8000/api/qc/epub");
      const res = await fetch("http://localhost:8000/api/qc/epub", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("QC failed. HTTP", res.status, text);
        alert(`QC failed. HTTP ${res.status}`);
        return;
      }

      const data = await res.json();
      console.log("QCPage: QC success payload:", data);
      setQcResult(data);
    } catch (e) {
      console.error("QC error:", e);
      alert("QC failed");
    } finally {
      setQcLoading(false);
    }
  }

  async function generatePdf() {
    if (!accessibleHtml) {
      alert("Run Convert first – no accessible HTML available.");
      return;
    }

    try{
      setPdfLoading(true);
      console.log("QCPage: POST http://localhost:8000/api/pdf/generate");
      const res = await fetch("http://localhost:8000/api/pdf/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: accessibleHtml }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("PDF generation failed. HTTP", res.status, text);
        alert(`PDF generation failed. HTTP ${res.status}`);
        return;
      }

      const data = await res.json();
      const hex = data.pdf_hex;

      // hex -> Uint8Array
      const bytes = new Uint8Array(hex.length / 2);
      for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
      }

      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (e) {
      console.error("PDF generation error:", e);
      alert("PDF generation failed");
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <div style={wrapperStyle}>
      {/* LEFT: controls */}
      <section style={leftStyle}>
        <h3 style={{ marginTop: 0 }}>QC Controls</h3>
        <p style={{ fontSize: 13, color: "#4b5563", marginBottom: 12 }}>
          Runs the DAISY Ace EPUB accessibility checker (WCAG / EPUB
          Accessibility).
        </p>

        <button
          onClick={runQc}
          disabled={qcLoading || !epubFile}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 6,
            border: "none",
            backgroundColor: qcLoading ? "#9ca3af" : "#16a34a",
            color: "#fff",
            fontWeight: 600,
            cursor: qcLoading ? "default" : "pointer",
            marginBottom: 8,
          }}
        >
          {qcLoading ? "Running QC..." : "Run QC on current EPUB"}
        </button>

        {!epubFile && (
          <p style={{ color: "#b91c1c", fontSize: 12, marginTop: 6 }}>
            No EPUB loaded yet. Please upload an EPUB in the Convert section
            above.
          </p>
        )}

        <hr style={{ margin: "16px 0" }} />

        <button
          onClick={generatePdf}
          disabled={pdfLoading || !accessibleHtml}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 6,
            border: "none",
            backgroundColor: pdfLoading ? "#9ca3af" : "#1d4ed8",
            color: "#fff",
            fontWeight: 600,
            cursor: pdfLoading ? "default" : "pointer",
          }}
        >
          {pdfLoading ? "Generating PDF..." : "Generate Accessible PDF"}
        </button>

        {!accessibleHtml && (
          <p style={{ color: "#6b7280", fontSize: 12, marginTop: 6 }}>
            Accessible HTML will be available after a successful Convert.
          </p>
        )}
      </section>

      {/* MIDDLE: QC summary & issues */}
      <section style={middleStyle}>
        <h3 style={{ marginTop: 0 }}>QC Summary</h3>
        <QCReport
          summary={qcResult?.summary || null}
          rawReport={qcResult?.raw_report || null}
        />
      </section>

      {/* RIGHT: PDF preview */}
      <section style={rightStyle}>
        <h3 style={{ marginTop: 0 }}>Accessible PDF Preview</h3>
        {pdfUrl ? (
          <iframe
            title="Accessible PDF Preview"
            src={pdfUrl}
            style={{
              flex: 1,
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              width: "100%",
              minHeight: 360,
            }}
          />
        ) : (
          <p style={{ color: "#6b7280", fontSize: 13 }}>
            Generate the accessible PDF after QC to preview it here.
          </p>
        )}
      </section>
    </div>
  );
}
