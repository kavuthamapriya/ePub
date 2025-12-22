import { create } from "zustand";

export const useConversionStore = create((set, get) => ({
   /* ---------- EPUB ---------- */
  epubFile: null,
  bookId: null,

    /* ---------- QC ---------- */
  qcStatus: "idle", // idle | running | done | error
  qcSummary: {
    errors: 0,
    warnings: 0,
    passes: 0,
  },

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


/* ---------- AUTO QC ---------- */
  autoRunQC: async (epubFile) => {
    if (!epubFile) return;

    try {
      set({
        qcStatus: "running",
        qcSummary: { errors: 0, warnings: 0, passes: 0 },
      });

      const form = new FormData();
      form.append("epub_file", epubFile);

      const res = await fetch("http://localhost:8000/api/qc/epub", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        throw new Error(`QC failed: ${res.status}`);
      }

      const data = await res.json();

      set({
        qcStatus: "done",
        qcSummary: {
          errors: data?.summary?.errors ?? 0,
          warnings: data?.summary?.warnings ?? 0,
          passes: data?.summary?.passes ?? 0,
        },
      });
    } catch (err) {
      console.error("Auto QC failed:", err);
      set({ qcStatus: "error" });
    }
  },

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
