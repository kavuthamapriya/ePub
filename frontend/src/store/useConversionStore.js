import { create } from "zustand";

export const useConversionStore = create((set) => ({
  /* ---------- EPUB ---------- */
  epubFile: null,
  bookId: null,

  /* ---------- TOC ---------- */
  epubToc: [],
  selectedTocItem: null,

  /* ---------- Selected Page ---------- */
  selectedPageHref: null,
  selectedPageHtml: "",
  selectedPageTags: [],

  /* ---------- Tag Mapping ---------- */
  tagMappings: {},

  /* ---------- Setters ---------- */
  setEpubFile: (epubFile) => set({ epubFile }),
  setBookId: (bookId) => set({ bookId }),

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

  reset: () =>
    set({
      epubFile: null,
      bookId: null,
      epubToc: [],
      selectedTocItem: null,
      selectedPageHref: null,
      selectedPageHtml: "",
      selectedPageTags: [],
      tagMappings: {},
    }),
}));
