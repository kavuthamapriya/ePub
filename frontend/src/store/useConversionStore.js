// frontend/src/store/useConversionStore.js
import { create } from "zustand";

export const useConversionStore = create((set) => ({
  publisher: "",
  epubFile: null,
  pdfFile: null,
  accessibleHtml: "",

  setPublisher: (publisher) => set({ publisher }),
  setEpubFile: (file) => set({ epubFile: file }),
  setPdfFile: (file) => set({ pdfFile: file }),
  setAccessibleHtml: (html) => set({ accessibleHtml: html }),
}));
