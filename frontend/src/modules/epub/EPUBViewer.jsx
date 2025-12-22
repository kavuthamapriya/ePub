// src/modules/epub/EPUBViewer.jsx
import React, { useEffect, useRef } from "react";
import ePub from "epubjs";
import { useConversionStore } from "../../store/useConversionStore";

export default function EPUBViewer({ file }) {
  const viewerRef = useRef(null);
  const renditionRef = useRef(null);

  const {
    setEpubToc,
    selectedTocItem,
    setSelectedPageTags,
    setSelectedPageHref,
  } = useConversionStore();

  useEffect(() => {
    if (!file || !viewerRef.current) return;

    viewerRef.current.innerHTML = "";

    const book = ePub(file);

    const rendition = book.renderTo(viewerRef.current, {
      width: "100%",
      height: "100%",
      flow: "scrolled-doc",
      manager: "continuous",
      spread: "none",
    });

    rendition.display();
    renditionRef.current = rendition;

    /* -------- TOC -------- */
    book.loaded.navigation.then((nav) => {
      setEpubToc(
        nav.toc.map((item) => ({
          label: item.label,
          href: item.href,
        }))
      );
    });

    /* -------- TAG EXTRACTION (RENDERED XHTML ONLY) -------- */
    rendition.on("rendered", (section) => {
      const iframe = viewerRef.current.querySelector("iframe");
      if (!iframe) return;

      const doc = iframe.contentDocument;
      if (!doc) return;

      const skip = new Set([
        "html",
        "head",
        "body",
        "meta",
        "link",
        "script",
        "style",
        "title",
      ]);

      const tags = new Set();

      doc.querySelectorAll("*").forEach((el) => {
        const tag = el.tagName.toLowerCase();
        if (!skip.has(tag)) tags.add(tag);
      });

      // ✅ Store context for Tag Mapping
      setSelectedPageHref(section.href);
      setSelectedPageTags(Array.from(tags).sort());
    });

    return () => {
      rendition.destroy();
      book.destroy();
    };
  }, [file]);

  /* -------- Jump when TOC clicked in TagMapping -------- */
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
