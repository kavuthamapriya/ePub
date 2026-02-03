import React, { useEffect, useRef } from "react";

const wrapperStyle = {
  width: "100%",
  height: "100%",
  overflowY: "auto",
  border: "1px solid #d1d5db",
  borderRadius: "4px",
  backgroundColor: "#fff",
  padding: "8px",
};

let renderLock = false; // 🛑 Prevent double-render in React Strict Mode

function PDFViewer({ file }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!file || !window.pdfjsLib) return;

    if (renderLock) {
      // Stop duplicate rendering
      return;
    }
    renderLock = true;

    const container = containerRef.current;
    container.innerHTML = ""; // Clear previous pages

    const reader = new FileReader();

    reader.onload = async function () {
      const typedArray = new Uint8Array(this.result);
      const pdf = await window.pdfjsLib.getDocument(typedArray).promise;

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.2 });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.display = "block";
        canvas.style.margin = "0 auto 16px";

        container.appendChild(canvas);

        await page.render({
          canvasContext: context,
          viewport,
        }).promise;
      }

      renderLock = false; // Unlock after rendering
    };

    reader.readAsArrayBuffer(file);
  }, [file]);

  return <div ref={containerRef} style={wrapperStyle}></div>;
}

export default PDFViewer;
