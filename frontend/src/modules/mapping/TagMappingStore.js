import { create } from "zustand";
import { useConversionStore } from "./useConversionStore";

export const useTagMappingStore = create((set, get) => ({
  selectedSection: null,
  sectionHtml: "",
  sectionTags: [],

  tagMappings: {},

  setSelectedSection: async (section) => {
    set({ selectedSection: section, sectionHtml: "", sectionTags: [] });

    if (!section?.href) return;

    try {
      // 🔥 Get bookId from global conversion store
      const { bookId } = useConversionStore.getState();
      if (!bookId) {
        console.error("bookId missing for XHTML fetch");
        return;
      }

      // 🔥 FIXED — book_id added
      const res = await fetch(
        `http://localhost:8000/api/epub/xhtml?book_id=${bookId}&href=${encodeURIComponent(section.href)}`
      );

      if (!res.ok) throw new Error("XHTML not found");

      const html = await res.text();

      // Extract tags
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "application/xhtml+xml");
      const tags = [...new Set(
        [...doc.querySelectorAll("*")].map((el) => el.tagName.toLowerCase())
      )];

      set({
        sectionHtml: html,
        sectionTags: tags,
      });
    } catch (e) {
      console.error("Failed to load XHTML", e);
      set({
        sectionHtml: "",
        sectionTags: [],
      });
    }
  },

  setTagMapping: (tag, value) => {
    const section = get().selectedSection;
    if (!section) return;

    set((state) => ({
      tagMappings: {
        ...state.tagMappings,
        [section.href]: {
          ...(state.tagMappings[section.href] || {}),
          [tag]: value,
        },
      },
    }));
  },
}));
