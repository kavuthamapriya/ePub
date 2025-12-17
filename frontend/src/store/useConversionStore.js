import { create } from "zustand";

export const useConversionStore = create((set) => ({
  
  // ---------------- Existing state ----------------
  publisher: "",
  epubFile: null,
  pdfFile: null,
  accessibleHtml: "",

  htmlTags: [],
  tagMappings: {},

  // ---------------- NEW: Page context ----------------
  currentTocItem: null,      // { label, href }
  currentPageHtml: "",       // HTML of selected TOC page

  // ---------------- Setters ----------------
  selectedPageTags: [],
selectedPageHref: null,

setSelectedPageTags: (tags) => set({ selectedPageTags: tags }),
setSelectedPageHref: (href) => set({ selectedPageHref: href }),

  setPublisher: (publisher) => set({ publisher }),
  setEpubFile: (epubFile) => set({ epubFile }),
  setPdfFile: (pdfFile) => set({ pdfFile }),
  setAccessibleHtml: (html) => set({ accessibleHtml: html }),

  // Tag mapping
  setHtmlTags: (tags) => set({ htmlTags: tags }),
  setTagMapping: (tag, accessibleTag) =>
    set((state) => ({
      tagMappings: {
        ...state.tagMappings,
        [tag]: accessibleTag,
      },
    })),

    

  resetMappings: () =>
    set({
      htmlTags: [],
      tagMappings: {},
    }),

    
 tagMappings: {},

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



  // ---------------- NEW setters ----------------
  setCurrentTocItem: (item) =>
    set({
      currentTocItem: item,
    }),

  setCurrentPageHtml: (html) =>
    set({
      currentPageHtml: html,
    }),
     /* ---------- NEW: EPUB TOC ---------- */
  epubToc: [],
  setEpubToc: (toc) => set({ epubToc: toc }),

  

  /* ---------- NEW: selected page ---------- */
  selectedTocItem: null,
  setSelectedTocItem: (item) => set({ selectedTocItem: item }),
}));
