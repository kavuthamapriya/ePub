import React, { useEffect, useRef } from "react";

function EPUBViewer({ file }) {
  const viewerRef = useRef(null);

  useEffect(() => {
    if (!file) {
      console.log("EPUBViewer: no file yet");
      return;
    }

    if (!window.ePub) {
      console.error("EPUBViewer: window.ePub not found – EPUB.js not loaded");
      return;
    }

    const container = viewerRef.current;
    if (!container) {
      console.error("EPUBViewer: viewerRef is null");
      return;
    }

    console.log("EPUBViewer: received file:", file.name, file.type, file.size);

    container.innerHTML = "";

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const arrayBuffer = reader.result;
        console.log(
          "EPUBViewer: FileReader loaded, size:",
          arrayBuffer.byteLength
        );

        const book = window.ePub(arrayBuffer);

        const width = container.clientWidth || 600;
        const height = container.clientHeight || 800;
        console.log("EPUBViewer: renderTo width/height:", width, height);

        const rendition = book.renderTo(container, {
          width,
          height,
          flow: "scrolled-doc",
          spread: "none",
          manager: "continuous",
          allowScriptedContent: true,
        });

        rendition
          .display()
          .then(() => console.log("EPUBViewer: rendition displayed"))
          .catch((err) => console.error("EPUBViewer: render error", err));
      } catch (err) {
        console.error("EPUBViewer: error creating book/rendition", err);
      }
    };

    reader.onerror = (err) => {
      console.error("EPUBViewer: FileReader error", err);
    };

    reader.readAsArrayBuffer(file);
  }, [file]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: "600px",
        border: "1px solid #d1d5db",
        borderRadius: "4px",
        overflow: "auto",
        backgroundColor: "#ffffff",
      }}
    >
      <div
        ref={viewerRef}
        id="epub-viewer"
        style={{
          width: "100%",
          height: "100%",
          minHeight: "600px",
        }}
      ></div>
    </div>
  );
}

export default EPUBViewer;
