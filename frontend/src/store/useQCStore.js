import { create } from "zustand";

export const useQCStore = create((set) => ({
  // QC run state
  qcStatus: "idle", // idle | running | done | error

  // Summary counts (top boxes)
  qcSummary: {
    errors: 0,
    warnings: 0,
    passes: 0,
  },

  // ✅ Detailed Daisy ACE issues
  qcIssues: {
    errors: [],
    warnings: [],
    passes: [],
  },

  // Optional selection (used later)
  selectedIssue: null,
  selectedHtml: "",

  // -------- setters --------
  setQcStatus: (status) => set({ qcStatus: status }),

  setQcSummary: (summary) =>
    set({
      qcSummary: {
        errors: summary?.errors ?? 0,
        warnings: summary?.warnings ?? 0,
        passes: summary?.passes ?? 0,
      },
    }),

  setQcIssues: (issues) =>
    set({
      qcIssues: {
        errors: issues?.errors ?? [],
        warnings: issues?.warnings ?? [],
        passes: issues?.passes ?? [],
      },
    }),

  setSelectedIssue: (issue) => set({ selectedIssue: issue }),
  setSelectedHtml: (html) => set({ selectedHtml: html }),
}));
