// src/store/useConversionStore.js
import create from "zustand";

export const useConversionStore = create((set, get) => ({
  // files / data
  publisher: "",
  epubFile: null,         // File object selected in the UI
  pdfFile: null,          // File object selected in the UI
  accessibleHtml: "",     // converted accessible HTML (string)

  // Tag mapping
  htmlTags: [],           // array of unique tag identifiers extracted from accessibleHtml
  tagMappings: {},        // { tagIdentifier: mappedTag }

  // QC results
  qcReport: null,
  qcLoading: false,
  qcError: null,

  // setters
  setPublisher: (p) => set({ publisher: p }),
  setEpubFile: (file) => set({ epubFile: file }),
  setPdfFile: (file) => set({ pdfFile: file }),
  setAccessibleHtml: (html) => {
    set({ accessibleHtml: html });
    // whenever accessibleHtml is set, auto-extract tags
    const tags = extractTagsFromHtml(html);
    set({ htmlTags: tags });
  },

  setHtmlTags: (tags) => set({ htmlTags: tags }),
  setTagMapping: (tag, mapped) => set((s) => ({ tagMappings: { ...s.tagMappings, [tag]: mapped } })),

  setQcReport: (report) => set({ qcReport: report }),
  setQcLoading: (v) => set({ qcLoading: v }),
  setQcError: (e) => set({ qcError: e }),

  reset: () => set({
    publisher: "",
    epubFile: null,
    pdfFile: null,
    accessibleHtml: "",
    htmlTags: [],
    tagMappings: {},
    qcReport: null,
    qcLoading: false,
    qcError: null,
  }),
}));

// Helper: browser-side HTML -> unique tag identifiers.
// Strategy:
//  - Parse accessibleHtml into DOM
//  - For each element in body, decide an identifier:
//      1) If element has epub:type attribute -> use that (common in EPUBs)
//      2) Else if element has data-* attribute 'data-original-tag' use that
//      3) Else if element has classList -> use TAG.CLASS1 (first class) to make it informative
//      4) Else use plain tagName (like P, H1, SPAN, DIV)
// Deduplicate preserving insertion order.
export function extractTagsFromHtml(htmlString) {
  if (!htmlString) return [];
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");
    // select body children (descendants)
    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT);
    const seen = new Set();
    const out = [];
    let node;
    while ((node = walker.nextNode())) {
      // skip empty nodes
      const el = node;
      let id = null;
      // prefer epub:type (used in some epub files)
      const epubType = el.getAttribute && (el.getAttribute("epub:type") || el.getAttribute("data-epub-type"));
      if (epubType) {
        id = epubType;
      } else if (el.hasAttribute && el.hasAttribute("data-original-tag")) {
        id = el.getAttribute("data-original-tag");
      } else if (el.classList && el.classList.length > 0) {
        id = `${el.tagName.toLowerCase()}.${el.classList[0]}`;
      } else {
        id = el.tagName.toLowerCase();
      }
      if (!seen.has(id)) {
        seen.add(id);
        out.push(id);
      }
    }
    return out;
  } catch (e) {
    console.warn("extractTagsFromHtml failed:", e);
    return [];
  }
}
