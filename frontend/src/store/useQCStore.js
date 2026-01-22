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

  // Detailed Daisy ACE issues
  qcIssues: {
    errors: [],
    warnings: [],
    passes: [],
  },

  // Selection
  selectedIssue: null,
  selectedHtml: "",

  // 🔥 Track last edited XHTML
  lastEditedFile: null,

  // 🔥 NEW — The latest DAISY ACE report (Base64 ZIP)
  reportZipB64: null,

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

  // Track last edited XHTML file
  setLastEditedFile: (file) => set({ lastEditedFile: file }),

  // 🔥 NEW — store latest DAISY report (auto QC + rerun QC will use this)
  setReportZipB64: (b64) => set({ reportZipB64: b64 }),
}));
