import React, { useEffect } from "react";
import usePDF from "./usePDF";

const wrapperStyle = {
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
};

const toolsStyle = {
  display: "flex",
  gap: "8px",
  marginBottom: "8px",
  alignItems: "center",
};

const canvasWrapper = {
  flex: 1,
  overflow: "auto",
  border: "1px solid #d1d5db",
  borderRadius: "4px",
  backgroundColor: "#fff",
};

function PDFViewer({ file }) {
  const {
    canvasRef,
    pageNum,
    loadPDF,
    nextPage,
    prevPage,
    zoomIn,
    zoomOut,
  } = usePDF();

  useEffect(() => {
    if (file && window.pdfjsLib) {
      loadPDF(file);
    }
  }, [file]);

  return (
    <div style={wrapperStyle}>
      <div style={toolsStyle}>
        <button onClick={prevPage}>Prev</button>
        <button onClick={nextPage}>Next</button>
        <button onClick={zoomOut}>-</button>
        <button onClick={zoomIn}>+</button>
        <span style={{ fontSize: "0.9rem" }}>Page: {pageNum}</span>
      </div>
      <div style={canvasWrapper}>
        <canvas ref={canvasRef}></canvas>
      </div>
    </div>
  );
}

export default PDFViewer;
