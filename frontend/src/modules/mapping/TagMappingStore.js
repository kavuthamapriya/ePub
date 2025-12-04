import { create } from "zustand";

export const useTagMappingStore = create((set) => ({
  htmlTags: [],
  mappings: {},
  completion: 0,

  setHTMLTags: (tags) =>
    set(() => ({
      htmlTags: tags,
      mappings: tags.reduce((acc, tag) => {
        acc[tag] = "";
        return acc;
      }, {}),
    })),

  setMapping: (tag, accessibleTag) =>
    set((state) => {
      const updated = { ...state.mappings, [tag]: accessibleTag };
      const total = Object.keys(updated).length || 1;
      const filled = Object.values(updated).filter(Boolean).length;
      const pct = Math.round((filled / total) * 100);
      return { mappings: updated, completion: pct };
    }),
}));
