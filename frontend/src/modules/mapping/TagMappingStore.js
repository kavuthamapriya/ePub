import { create } from "zustand";

export const useTagMappingStore = create((set, get) => ({
  // selected section
  selectedSection: null,
  sectionHtml: "",
  sectionTags: [],

  tagMappings: {},

  setSelectedSection: async (section) => {
    set({ selectedSection: section, sectionHtml: "", sectionTags: [] });

    if (!section?.href) return;

    try {
      const res = await fetch(
        `http://localhost:8000/api/epub/xhtml?href=${encodeURIComponent(section.href)}`
      );

      if (!res.ok) throw new Error("XHTML not found");

      const html = await res.text();

      // parse tags from SAME html
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "application/xhtml+xml");
      const tags = [...new Set(
        [...doc.querySelectorAll("*")].map(el => el.tagName.toLowerCase())
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

    set(state => ({
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
