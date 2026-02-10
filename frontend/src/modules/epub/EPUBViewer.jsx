import React, { useEffect, useRef } from "react";
import ePub from "epubjs";
import { useConversionStore } from "../../store/useConversionStore";

export default function EPUBViewer({ file }) {
  const viewerRef = useRef(null);
  const renditionRef = useRef(null);
  const bookRef = useRef(null);

  const { setEpubToc, selectedTocItem, setSelectedPageTags, setSelectedPageHref } =
    useConversionStore();

  useEffect(() => {
    if (!file || !viewerRef.current) return;

    viewerRef.current.innerHTML = "";

    try {
      const book = ePub(file);  // <-- Pass URL directly
      bookRef.current = book;

      const rendition = book.renderTo(viewerRef.current, {
        width: "100%",
        height: "100%",
        flow: "scrolled-doc",
        manager: "continuous",
        spread: "none",
      });

      renditionRef.current = rendition;

      // Display first page
      rendition.display();

      // Load TOC
      book.loaded.navigation.then((nav) => {
        if (!nav) return;
        setEpubToc(
          nav.toc.map((item) => ({
            label: item.label,
            href: item.href,
          }))
        );
      });

      // Extract tags
      rendition.on("rendered", (section) => {
        const iframe = viewerRef.current.querySelector("iframe");
        if (!iframe) return;
        const doc = iframe.contentDocument;
        if (!doc) return;

        const skip = new Set(["html", "head", "body", "meta", "link", "script", "style", "title"]);
        const tags = new Set();
        doc.querySelectorAll("*").forEach((el) => {
          const t = el.tagName.toLowerCase();
          if (!skip.has(t)) tags.add(t);
        });

        setSelectedPageHref(section.href);
        setSelectedPageTags([...tags].sort());
      });
    } catch (err) {
      console.error("EPUBViewer failed:", err);
    }
  }, [file]);

  // Jump to TOC selection
  useEffect(() => {
    if (selectedTocItem && renditionRef.current) {
      renditionRef.current.display(selectedTocItem.href);
    }
  }, [selectedTocItem]);

  return (
    <div
      ref={viewerRef}
      style={{
        width: "100%",
        height: "100%",
        overflow: "auto",
        background: "#fff",
      }}
    />
  );
}
