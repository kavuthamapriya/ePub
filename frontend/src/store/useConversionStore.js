import { create } from "zustand";

export const useConversionStore = create((set) => ({
  publisher: "",
  epubFile: null,
  pdfFile: null,
  accessibleHtml: "",
  htmlTags: [],          // unique tags extracted from HTML
  tagMappings: {},       // { tagName: "H1" | "P" | ... }

  setPublisher: (publisher) => set({ publisher }),
  setEpubFile: (file) => set({ epubFile: file }),
  setPdfFile: (file) => set({ pdfFile: file }),
  setAccessibleHtml: (html) => set({ accessibleHtml: html }),

  setHtmlTags: (tags) => set({ htmlTags: tags }),

  setTagMapping: (tag, mapped) =>
    set((state) => ({
      tagMappings: { ...state.tagMappings, [tag]: mapped },
    })),
}));
