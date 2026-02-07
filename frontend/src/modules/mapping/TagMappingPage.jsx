import React, { useState, useRef, useEffect } from "react";
import { FiSave } from "react-icons/fi";
import { useQCStore } from "../../store/useQCStore";
import { useConversionStore } from "../../store/useConversionStore";
import QCSummaryBar from "../qc/QCSummaryBar.jsx";

/* Glassy card */
const card = {
  background: "rgba(255,255,255,0.7)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  padding: "20px",
  borderRadius: "16px",
  boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
  border: "1px solid rgba(255,255,255,0.5)",
};

function groupIssuesByRule(issues = []) {
  const map = {};
  issues.forEach((issue) => {
    const key = issue.rule || "Unknown";
    if (!map[key]) map[key] = { ...issue, count: 1 };
    else map[key].count++;
  });
  return Object.values(map);
}

export default function TagMappingPage() {
  const [activeType, setActiveType] = useState("errors");
  const [isSaving, setIsSaving] = useState(false);

  const {
    qcIssues,
    qcSummary,
    selectedHtml,
    setSelectedHtml,
    selectedIssue,
    setSelectedIssue,
    lastEditedFile,
    setLastEditedFile,
    setQcSummary,
    setQcIssues,
  } = useQCStore();

  const { bookId } = useConversionStore();
  const textareaRef = useRef(null);

  /* List of issues */
  const getActiveList = () => {
    if (activeType === "passes") return [];
    const list =
      activeType === "errors"
        ? qcIssues.errors
        : activeType === "warnings"
        ? qcIssues.warnings
        : [];
    return groupIssuesByRule(list);
  };

  /* Load XHTML / OPF */
  async function handleIssueClick(issue) {
    if (!bookId) {
      alert("bookId missing. Upload EPUB first.");
      return;
    }

    setSelectedIssue(issue);
    setSelectedHtml("Loading…");

    const docPath =
      !issue.file ||
      issue.file.toLowerCase().endsWith(".opf") ||
      issue.file.includes("package")
        ? "content.opf"
        : issue.file;

    setLastEditedFile(docPath);

    try {
      const form = new FormData();
      form.append("book_id", bookId);
      form.append("doc_path", docPath);

      const res = await fetch("http://localhost:8000/api/qc/doc_html", {
        method: "POST",
        body: form,
      });

      if (!res.ok) throw new Error("Load failed");

      const data = await res.json();
      setSelectedHtml(data.html || "");
    } catch {
      setSelectedHtml("Failed to load document");
    }
  }

  /* Highlight error line on load */
  useEffect(() => {
    if (!selectedIssue || !selectedIssue.line || !selectedHtml) return;

    const textarea = textareaRef.current;
    const lines = selectedHtml.split("\n");
    const idx = selectedIssue.line - 1;

    if (!lines[idx]) return;

    let start = 0;
    for (let i = 0; i < idx; i++) start += lines[i].length + 1;
    const end = start + lines[idx].length;

    textarea.focus();
    textarea.setSelectionRange(start, end);
    textarea.scrollTop = idx * 20;
  }, [selectedIssue, selectedHtml]);

  /* SAVE XHTML + RERUN QC */
  async function handleSave() {
    if (!lastEditedFile || !bookId) {
      alert("Missing bookId or file path");
      return;
    }

    setIsSaving(true);

    try {
      const form = new FormData();
      form.append("book_id", bookId);
      form.append("doc_path", lastEditedFile);
      form.append("html", selectedHtml);

      const res = await fetch("http://localhost:8000/api/qc/fix", {
        method: "POST",
        body: form,
      });

      if (!res.ok) throw new Error("Save failed");

      const data = await res.json();

      // Update QC state
      setQcSummary(data.summary);
      setQcIssues(data.issues);

      alert("Saved & QC Re-run Successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to save ❌");
    }

    setIsSaving(false);
  }

  return (
    <div>
      <QCSummaryBar
        onErrorsClick={() => setActiveType("errors")}
        onWarningsClick={() => setActiveType("warnings")}
        onPassesClick={() => setActiveType("passes")}
      />

      <div
        style={{
          marginTop: "20px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
        }}
      >
        {/* LEFT SIDE — ISSUE LIST */}
        <div style={{ ...card, height: "85vh", overflowY: "auto" }}>
          <h3
            style={{
              margin: 0,
              paddingBottom: "10px",
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            {activeType === "errors"
              ? "Errors"
              : activeType === "warnings"
              ? "Warnings"
              : "Passes"}
          </h3>

          {activeType === "passes" ? (
            <p style={{ marginTop: "10px" }}>
              Total Passes: <strong>{qcSummary?.passes}</strong>
            </p>
          ) : getActiveList().length === 0 ? (
            <p>No issues found.</p>
          ) : (
            getActiveList().map((issue, i) => (
              <div
                key={i}
                onClick={() => handleIssueClick(issue)}
                style={{
                  cursor: "pointer",
                  padding: "12px",
                  borderRadius: "10px",
                  marginBottom: "8px",
                  borderLeft:
                    activeType === "errors"
                      ? "4px solid #ef4444"
                      : "4px solid #2563eb",
                  background: "rgba(255,255,255,0.6)",
                  transition: "0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.9)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.6)")
                }
              >
                <strong style={{ color: "#2563eb", fontSize: "15px" }}>
                  {issue.rule}
                  {issue.count > 1 && (
                    <span style={{ color: "#6b7280" }}>
                      {" (" + issue.count + ")"}
                    </span>
                  )}
                </strong>
                <div>{issue.message}</div>
                <div
                  style={{
                    fontSize: "13px",
                    marginTop: "4px",
                    color: "#2563eb",
                    fontFamily: "monospace",
                  }}
                >
                  {issue.file}
                </div>
              </div>
            ))
          )}
        </div>

        {/* RIGHT SIDE — TEXT EDITOR */}
        <div
          style={{
            ...card,
            height: "85vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Source Editor</h3>

          {!selectedHtml ? (
            <p>Select an issue to load source</p>
          ) : (
            <>
              <textarea
                ref={textareaRef}
                value={selectedHtml}
                onChange={(e) => setSelectedHtml(e.target.value)}
                style={{
                  flex: 1,
                  fontFamily: `"Fira Code", monospace`,
                  fontSize: "14px",
                  border: "1px solid #cbd5e1",
                  background: "#f8fafc",
                  borderRadius: "12px",
                  padding: "14px",
                  resize: "none",
                  lineHeight: "1.5",
                }}
              />

              <div
                style={{
                  marginTop: "12px",
                  padding: "10px",
                  borderTop: "1px solid #e5e7eb",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  style={{
                    padding: "10px 18px",
                    background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "12px",
                    display: "flex",
                    gap: "8px",
                    alignItems: "center",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  <FiSave />
                  {isSaving ? "Saving…" : "Save & Re-run"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
