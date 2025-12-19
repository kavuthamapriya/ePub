import { create } from "zustand";

export const useQCStore = create((set) => ({
  issues: [],
  selectedIssue: null,

  setIssues: (issues) => set({ issues }),
  setSelectedIssue: (issue) => set({ selectedIssue: issue }),
}));
