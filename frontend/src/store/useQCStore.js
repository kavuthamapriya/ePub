import { create } from "zustand";

export const useQCStore = create((set, get) => ({
  /* ---------- QC run status ---------- */
  qcStatus: "idle",

  /* ---------- Summary counts ---------- */
  qcSummary: {
    errors: 0,
    warnings: 0,
    passes: 0,
  },

  /* ---------- Detailed ACE issues ---------- */
  qcIssues: {
    errors: [],
    warnings: [],
    passes: [],
  },

  /* ---------- Current issue selection ---------- */
  selectedIssue: null,
  selectedHtml: "",

  /* ---------- Track last edited XHTML ---------- */
  lastEditedFile: null,

  /* ---------- Latest DAISY Report (ZIP Base64) ---------- */
  reportZipB64: null,

  /* ---------- SETTERS ---------- */
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

  setLastEditedFile: (file) => set({ lastEditedFile: file }),
  setReportZipB64: (b64) => set({ reportZipB64: b64 }),

  /* ==========================================================
     1️⃣ LOAD XHTML FILE FROM BACKEND
  ========================================================== */
  loadDocHtml: async (bookId, docPath) => {
    const form = new FormData();
    form.append("book_id", bookId);
    form.append("doc_path", docPath);

    const res = await fetch("http://localhost:8000/api/qc/doc_html", {
      method: "POST",
      body: form,
    });

    if (!res.ok) throw new Error("Failed to load XHTML");

    const data = await res.json();
    set({ selectedHtml: data.html });
  },

  /* ==========================================================
     2️⃣ SAVE XHTML INTO EPUB & RERUN QC
  ========================================================== */
  saveDocHtml: async (bookId, docPath, html) => {
    const form = new FormData();
    form.append("book_id", bookId);
    form.append("doc_path", docPath);
    form.append("html", html);

    const res = await fetch("http://localhost:8000/api/qc/fix", {
      method: "POST",
      body: form,
    });

    if (!res.ok) throw new Error("Save failed");

    const data = await res.json();

    set({
      qcSummary: {
        errors: data.summary.errors,
        warnings: data.summary.warnings,
        passes: data.summary.passes,
      },
      reportZipB64: data.report, // Updated ZIP
    });
  },

  /* ==========================================================
     3️⃣ RERUN QC WITHOUT CHANGING ANYTHING
  ========================================================== */
  rerunQC: async (bookId) => {
    const form = new FormData();
    form.append("book_id", bookId);

    const res = await fetch("http://localhost:8000/api/qc/rerun", {
      method: "POST",
      body: form,
    });

    if (!res.ok) throw new Error("Rerun QC failed");

    const data = await res.json();

    set({
      qcSummary: {
        errors: data.summary.errors,
        warnings: data.summary.warnings,
        passes: data.summary.passes,
      },
      reportZipB64: data.report, // update report
    });
  },
}));
