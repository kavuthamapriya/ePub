import { create } from "zustand";

export const useQCStore = create((set) => ({
  qcStatus: "idle", // idle | running | done | error
  qcSummary: {
    errors: 0,
    warnings: 0,
    passes: 0,
  },

  setQcStatus: (status) => set({ qcStatus: status }),
  setQcSummary: (summary) => set({ qcSummary: summary }),
}));
