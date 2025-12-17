import { create } from "zustand";

export const useQCStore = create((set) => ({
  qcStatus: "idle", // idle | running | done | error
  qcSummary: {
    errors: 0,
    warnings: 0,
    passes: 0,
  },
  qcIssues: [],

  setQCRunning: () =>
    set({
      qcStatus: "running",
      qcIssues: [],
      qcSummary: { errors: 0, warnings: 0, passes: 0 },
    }),

  setQCResult: (issues = []) => {
    let errors = 0;
    let warnings = 0;
    let passes = 0;

    issues.forEach((issue) => {
      const outcome =
        issue?.["earl:outcome"] ||
        issue?.outcome ||
        "";

      if (outcome.includes("fail")) errors++;
      else if (outcome.includes("warning")) warnings++;
      else passes++;
    });

    set({
      qcStatus: "done",
      qcIssues: issues,
      qcSummary: { errors, warnings, passes },
    });
  },

  setQCError: () =>
    set({
      qcStatus: "error",
    }),
}));
