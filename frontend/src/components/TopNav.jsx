import React from "react";
import { FiUpload, FiCheckCircle, FiEdit3, FiShield, FiCheck } from "react-icons/fi";
import { useConversionStore } from "../store/useConversionStore";

const STEPS = [
  { key: "convert",    label: "Upload",   icon: FiUpload },
  { key: "qc",         label: "Validate", icon: FiCheckCircle },
  { key: "tagmapping", label: "Edit",     icon: FiEdit3 },
  { key: "report",     label: "Report",   icon: FiShield },
];

export default function TopNav({ goConvert, goTagMapping, goQC, goReport }) {
  const bookId = useConversionStore((s) => s.bookId);
  const qcStatus = useConversionStore((s) => s.qcStatus);
  const accessibleBlob = useConversionStore((s) => s.accessibleEpubBlob);

  const stepHandler = {
    convert: goConvert,
    tagmapping: goTagMapping,
    qc: goQC,
    report: goReport,
  };

  function statusFor(key) {
    if (key === "convert") return bookId ? "done" : "active";
    if (key === "qc") {
      if (qcStatus === "done") return "done";
      if (qcStatus === "running") return "active";
      return bookId ? "active" : "pending";
    }
    if (key === "tagmapping") return bookId ? "available" : "pending";
    if (key === "report") return accessibleBlob ? "done" : (bookId ? "available" : "pending");
    return "pending";
  }

  return (
    <header
      style={{
        width: "100%",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 1000,
        background: "#0b0f1a",
        boxShadow: "0 2px 12px rgba(0,0,0,0.35)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 28px",
          gap: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, minWidth: 0 }}>
          <img
            src="/src/assets/S4C_Logo.png"
            alt="S4Carlisle"
            style={{ width: 130, height: 44, objectFit: "contain" }}
          />
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
            <span style={{ color: "#fff", fontSize: 17, fontWeight: 700 }}>
              Ninja EPUB <span style={{ color: "#f97316" }}>Authenticator</span>
            </span>
            <span style={{ color: "#94a3b8", fontSize: 11, fontWeight: 500 }}>
              EPUB → Accessible EPUB workflow
            </span>
          </div>
        </div>

        <nav
          aria-label="Workflow progress"
          style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "nowrap" }}
        >
          {STEPS.map((step, idx) => {
            const status = statusFor(step.key);
            return (
              <React.Fragment key={step.key}>
                <StepPill
                  index={idx + 1}
                  label={step.label}
                  Icon={step.icon}
                  status={status}
                  onClick={stepHandler[step.key]}
                />
                {idx < STEPS.length - 1 && <Connector active={status === "done"} />}
              </React.Fragment>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

function StepPill({ index, label, Icon, status, onClick }) {
  const palette = {
    done:      { bg: "#10b981", text: "#fff",     border: "transparent" },
    active:    { bg: "#f97316", text: "#fff",     border: "transparent" },
    available: { bg: "#1e293b", text: "#e2e8f0",  border: "#334155"     },
    pending:   { bg: "transparent", text: "#64748b", border: "#334155"  },
  }[status];

  const clickable = status !== "pending";

  return (
    <button
      onClick={clickable ? onClick : undefined}
      disabled={!clickable}
      title={label}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 14px",
        borderRadius: 999,
        background: palette.bg,
        color: palette.text,
        border: `1px solid ${palette.border}`,
        fontWeight: 600,
        fontSize: 13,
        cursor: clickable ? "pointer" : "not-allowed",
        opacity: clickable ? 1 : 0.7,
        transition: "all .2s",
      }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: status === "done" ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.12)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        {status === "done" ? <FiCheck size={13} /> : index}
      </span>
      <Icon size={14} />
      <span>{label}</span>
    </button>
  );
}

function Connector({ active }) {
  return (
    <span
      aria-hidden
      style={{
        width: 18,
        height: 2,
        background: active ? "#10b981" : "#334155",
        borderRadius: 2,
      }}
    />
  );
}
