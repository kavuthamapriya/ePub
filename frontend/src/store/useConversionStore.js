import { create } from "zustand";

export const useConversionStore = create((set) => ({
  /* ---------- Files ---------- */
  publisher: "",
  epubFile: null,
  pdfFile: null,

  /* ---------- EPUB-wide HTML ---------- */
  accessibleHtml: "",

  /* ---------- TOC ---------- */
  epubToc: [],
  selectedTocItem: null,

  /* ---------- Selected page context ---------- */
  selectedPageHref: null,
  selectedPageHtml: "",
  selectedPageTags: [],

  /* ---------- Tag mapping (per page) ---------- */
  tagMappings: {}, // { [href]: { tag: value } }

  /* ---------- Setters ---------- */
  setPublisher: (publisher) => set({ publisher }),
  setEpubFile: (epubFile) => set({ epubFile }),
  setPdfFile: (pdfFile) => set({ pdfFile }),
  setAccessibleHtml: (html) => set({ accessibleHtml: html }),

  setEpubToc: (toc) => set({ epubToc: toc }),
  setSelectedTocItem: (item) => set({ selectedTocItem: item }),

  setSelectedPageHref: (href) => set({ selectedPageHref: href }),
  setSelectedPageHtml: (html) => set({ selectedPageHtml: html }),
  setSelectedPageTags: (tags) => set({ selectedPageTags: tags }),

  setTagMapping: (href, tag, value) =>
    set((state) => ({
      tagMappings: {
        ...state.tagMappings,
        [href]: {
          ...(state.tagMappings[href] || {}),
          [tag]: value,
        },
      },
    })),

  resetMappings: () =>
    set({
      selectedTocItem: null,
      selectedPageHref: null,
      selectedPageHtml: "",
      selectedPageTags: [],
      tagMappings: {},
    }),
}));
