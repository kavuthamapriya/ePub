import React, { useEffect, useRef } from "react";

function EPUBViewer({ file }) {
  const viewerRef = useRef(null);
  const bookRef = useRef(null); // keep track of current book

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

    // Clean up any previous book/rendition
    if (bookRef.current) {
      try {
        bookRef.current.destroy && bookRef.current.destroy();
      } catch (e) {
        console.warn("EPUBViewer: error destroying previous book", e);
      }
      container.innerHTML = "";
      bookRef.current = null;
    }

    console.log(
      "EPUBViewer: received file:",
      file.name,
      file.type,
      file.size
    );

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const arrayBuffer = reader.result;
        console.log(
          "EPUBViewer: FileReader loaded, size:",
          arrayBuffer.byteLength
        );

        const book = window.ePub(arrayBuffer);
        bookRef.current = book;

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

    // Cleanup when component unmounts or file changes
    return () => {
      if (bookRef.current) {
        try {
          bookRef.current.destroy && bookRef.current.destroy();
        } catch (e) {
          console.warn("EPUBViewer: error destroying book on cleanup", e);
        }
        bookRef.current = null;
      }
      if (container) {
        container.innerHTML = "";
      }
    };
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
