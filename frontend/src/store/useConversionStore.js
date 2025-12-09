// src/store/useConversionStore.js
import { create } from "zustand";

export const useConversionStore = create((set) => ({
  // Files & metadata
  publisher: "",
  epubFile: null,
  pdfFile: null,

  // HTML from backend (accessible_html)
  accessibleHtml: "",

  // Tag mapping data
  htmlTags: [],          // ["p","h1","span",...]
  tagMappings: {},       // { p: "P", span: "P", ... }

  // setters
  setPublisher: (publisher) => set({ publisher }),
  setEpubFile: (file) => set({ epubFile: file }),
  setPdfFile: (file) => set({ pdfFile: file }),
  setAccessibleHtml: (html) => set({ accessibleHtml: html }),

  setHtmlTags: (tags) => set({ htmlTags: tags }),

  setTagMapping: (tag, mapped) =>
    set((state) => ({
      tagMappings: { ...state.tagMappings, [tag]: mapped },
    })),

  resetMappings: () =>
    set({
      htmlTags: [],
      tagMappings: {},
    }),
}));
