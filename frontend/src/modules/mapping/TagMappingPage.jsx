import React, { useState, useRef, useEffect } from "react";
import {
  FiAlertTriangle,
  FiFileText,
  FiCheckCircle,
  FiSave,
  FiLoader,
} from "react-icons/fi";
import { useQCStore } from "../../store/useQCStore";
import QCSummaryBar from "../qc/QCSummaryBar";

/* --------------------------------
   Group repeated rules
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

  const textareaRef = useRef(null);

  /* --------------------------------
     Get current list
  --------------------------------- */
  const getActiveList = () => {
    let list = [];
    if (activeType === "errors") list = qcIssues.errors || [];
    if (activeType === "warnings") list = qcIssues.warnings || [];
    if (activeType === "passes") return [];
    return groupIssuesByRule(list);
  };

  /* --------------------------------
     Load HTML for issue
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
     Highlight line
  --------------------------------- */
  useEffect(() => {
    if (!selectedIssue || !selectedIssue.line) return;
    if (!selectedHtml || !textareaRef.current) return;

    const textarea = textareaRef.current;
    const lines = selectedHtml.split("\n");
    const index = selectedIssue.line - 1;

    if (!lines[index]) return;

    let start = 0;
    for (let i = 0; i < index; i++) start += lines[i].length + 1;

    const end = start + lines[index].length;

    textarea.focus();
    textarea.setSelectionRange(start, end);
    textarea.scrollTop = index * 20;
  }, [selectedIssue, selectedHtml]);

  /* --------------------------------
     Save & Rerun QC
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
    <div style={{ padding: 22 }}>
      <QCSummaryBar
        onErrorsClick={() => setActiveType("errors")}
        onWarningsClick={() => setActiveType("warnings")}
        onPassesClick={() => setActiveType("passes")}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginTop: 20,
        }}
      >
        {/* LEFT LIST */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: 18,
            height: 600,
            overflowY: "auto",
            boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
          }}
        >
          <h3 style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            {activeType === "errors" && <FiAlertTriangle color="#dc2626" />}
            {activeType === "warnings" && <FiAlertTriangle color="#f59e0b" />}
            {activeType === "passes" && <FiCheckCircle color="#16a34a" />}
            {activeType.charAt(0).toUpperCase() + activeType.slice(1)}
          </h3>

          {/* Passes */}
          {activeType === "passes" ? (
            <p style={{ fontSize: 14 }}>
              Passing checks are hidden.<br />
              Total passes:{" "}
              <strong style={{ color: "#16a34a" }}>
                {qcSummary?.passes}
              </strong>
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
                  padding: "12px 0",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <strong style={{ fontSize: 15 }}>{issue.rule}</strong>

                {issue.count > 1 && (
                  <span style={{ color: "#6b7280", marginLeft: 6 }}>
                    ({issue.count})
                  </span>
                )}

                <div style={{ marginTop: 4 }}>{issue.message}</div>

                <div
                  style={{
                    fontSize: 13,
                    marginTop: 4,
                    color: "#f97316",
                    fontFamily: "monospace",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <FiFileText /> {issue.file}
                </div>
              </div>
            ))
          )}
        </div>

        {/* RIGHT EDITOR */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: 18,
            height: 600,
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
          }}
        >
          <h3 style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
            <FiFileText />
            Source Editor
          </h3>

          {!selectedHtml ? (
            <p>Select an issue to load its source.</p>
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
                  border: "1px solid #d1d5db",
                  borderRadius: 8,
                  resize: "none",
                  background: "#fff7ed",
                  outline: "none",
                }}
              />

              <button
                onClick={handleSaveAndRerun}
                disabled={isSaving}
                style={{
                  marginTop: 12,
                  padding: "10px 16px",
                  background: "linear-gradient(135deg,#f97316,#ea580c)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  alignSelf: "flex-end",
                }}
              >
                {isSaving ? (
                  <>
                    <FiLoader className="spin" /> Saving…
                  </>
                ) : (
                  <>
                    <FiSave /> Save & Re-run QC
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
