import { create } from "zustand";

export const useConversionStore = create((set) => ({
  /* ---------- Convert / EPUB ---------- */
  epubFile: null,
  bookId: null,
  accessibleHtml: "",

  /* ---------- TOC ---------- */
  epubToc: [],
  selectedTocItem: null,

  /* ---------- Tag Mapping ---------- */
  selectedPageHref: null,
  selectedPageHtml: "",
  selectedPageTags: [],
  tagMappings: {},

  /* ---------- Setters ---------- */
  setEpubFile: (file) => set({ epubFile: file }),
  setBookId: (id) => set({ bookId: id }),

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

  resetAfterConvert: () =>
    set({
      selectedTocItem: null,
      selectedPageHref: null,
      selectedPageHtml: "",
      selectedPageTags: [],
      tagMappings: {},
    }),
}));
