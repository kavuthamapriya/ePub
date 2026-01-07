import React, { useState, useRef, useEffect } from "react";
import { useQCStore } from "../../store/useQCStore";
import QCSummaryBar from "../qc/QCSummaryBar";

/* --------------------------------
   Helper: group repeated issues
--------------------------------- */
function groupIssuesByRule(issues = []) {
  const map = {};

  issues.forEach((issue) => {
    const key = issue.rule || "Unknown rule";
    if (!map[key]) {
      map[key] = { ...issue, count: 1 };
    } else {
      map[key].count += 1;
    }
  });

  return Object.values(map);
}

export default function TagMappingPage() {
  const [activeType, setActiveType] = useState("errors");
  const [isSaving, setIsSaving] = useState(false);

  const {
    qcIssues = { errors: [], warnings: [], passes: [] },
    qcSummary,
    selectedHtml,
    setSelectedHtml,
    selectedIssue,
    setSelectedIssue,
    lastEditedFile,
    setLastEditedFile,
  } = useQCStore();

  /* 🔴 textarea ref */
  const textareaRef = useRef(null);

  /* --------------------------------
     Active issue list
  --------------------------------- */
  const getActiveList = () => {
    let list = [];

    if (activeType === "errors") list = qcIssues.errors || [];
    if (activeType === "warnings") list = qcIssues.warnings || [];
    if (activeType === "passes") return [];

    return groupIssuesByRule(list);
  };

  /* --------------------------------
     Issue click handler
  --------------------------------- */
  const handleIssueClick = async (issue) => {
    setSelectedIssue(issue);
    setSelectedHtml("Loading…");

    const isOPF =
      !issue.file ||
      issue.file.toLowerCase().endsWith(".opf") ||
      issue.file.toLowerCase().includes("package");

    const docPath = isOPF ? "content.opf" : issue.file;

    setLastEditedFile(docPath);

    try {
      const res = await fetch("http://localhost:8000/api/qc/doc_html", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc_path: docPath }),
      });

      if (!res.ok) throw new Error("Document not found");

      const data = await res.json();
      setSelectedHtml(data.html || "");
    } catch {
      setSelectedHtml("Failed to load document");
    }
  };

  /* --------------------------------
     🔥 HIGHLIGHT ERROR LINE
  --------------------------------- */
  useEffect(() => {
    if (
      !selectedIssue ||
      !selectedIssue.line ||
      !selectedHtml ||
      !textareaRef.current
    )
      return;

    const textarea = textareaRef.current;
    const lines = selectedHtml.split("\n");
    const lineIndex = selectedIssue.line - 1;

    if (!lines[lineIndex]) return;

    let start = 0;
    for (let i = 0; i < lineIndex; i++) {
      start += lines[i].length + 1;
    }

    const end = start + lines[lineIndex].length;

    textarea.focus();
    textarea.setSelectionRange(start, end);

    const lineHeight = 18; // approx for monospace
    textarea.scrollTop = lineIndex * lineHeight;
  }, [selectedIssue, selectedHtml]);

  /* --------------------------------
     SAVE + RE-RUN QC
  --------------------------------- */
  const handleSaveAndRerun = async () => {
    if (!lastEditedFile) return;

    try {
      setIsSaving(true);

      const form = new FormData();
      form.append("doc_path", lastEditedFile);
      form.append("html", selectedHtml);

      const res = await fetch("http://localhost:8000/api/qc/fix", {
        method: "POST",
        body: form,
      });

      if (!res.ok) throw new Error("Save failed");

      const data = await res.json();

      alert("Saved & QC re-run successfully ✅");

      useQCStore.getState().setQcSummary(data.summary);
      useQCStore.getState().setQcIssues(data.issues);
    } catch (err) {
      console.error(err);
      alert("Failed to save ❌");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <QCSummaryBar
        onErrorsClick={() => setActiveType("errors")}
        onWarningsClick={() => setActiveType("warnings")}
        onPassesClick={() => setActiveType("passes")}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginTop: 20,
        }}
      >
        {/* LEFT */}
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 16,
            height: 600,
            overflowY: "auto",
          }}
        >
          <h3>
            {activeType === "passes"
              ? "Passes (count only)"
              : activeType.charAt(0).toUpperCase() + activeType.slice(1)}
          </h3>

          {activeType === "passes" ? (
            <p>
              Passing checks are not listed.
              <br />
              Total passes: <strong>{qcSummary?.passes}</strong>
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
                  padding: "10px 0",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <strong>
                  {issue.rule}
                  {issue.count > 1 && (
                    <span style={{ color: "#6b7280", marginLeft: 6 }}>
                      ({issue.count})
                    </span>
                  )}
                </strong>
                <div>{issue.message}</div>
                <div
  style={{
    fontSize: 15,
    marginTop: 4,
    color: "#2563eb",
    fontFamily: "monospace",
    wordBreak: "break-all",
  }}
>
  {issue.file}
</div>

              </div>
            ))
          )}
        </div>

        {/* RIGHT */}
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 16,
            height: 600,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <h3>Source Editor (XHTML / OPF)</h3>

          {!selectedHtml ? (
            <p>Select an issue to load source</p>
          ) : (
            <>
              <textarea
                ref={textareaRef}
                value={selectedHtml}
                onChange={(e) => setSelectedHtml(e.target.value)}
                style={{
                  width: "100%",
                  height: "100%",
                  fontFamily: "monospace",
                  fontSize: 13,
                  padding: 12,
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  resize: "none",
                  whiteSpace: "pre",
                  background: "#fafafa",
                  caretColor: "transparent",
                }}
              />

              <button
                onClick={handleSaveAndRerun}
                disabled={isSaving}
                style={{
                  marginTop: 12,
                  padding: "10px 16px",
                  background: "#2563eb",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  alignSelf: "flex-end",
                }}
              >
                {isSaving ? "Saving…" : "Save & Re-run QC"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
