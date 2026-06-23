import React, { useEffect } from "react";
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX, FiAlertTriangle } from "react-icons/fi";

const PALETTE = {
  success: { bg: "#10b981", icon: <FiCheckCircle size={18} /> },
  error:   { bg: "#ef4444", icon: <FiAlertCircle size={18} /> },
  warning: { bg: "#f59e0b", icon: <FiAlertTriangle size={18} /> },
  info:    { bg: "#3b82f6", icon: <FiInfo size={18} /> },
};

export default function Toast({ message, type = "info", duration = 3500, onClose }) {
  useEffect(() => {
    if (!duration) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [duration, onClose]);

  const palette = PALETTE[type] || PALETTE.info;

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      background: palette.bg,
      color: "#fff",
      padding: "10px 14px",
      borderRadius: 10,
      fontSize: 14,
      fontWeight: 600,
      boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
      minWidth: 240,
      maxWidth: 380,
      pointerEvents: "auto",
    }}>
      {palette.icon}
      <span style={{ flex: 1, lineHeight: 1.4 }}>{message}</span>
      <button
        onClick={onClose}
        aria-label="Close"
        style={{
          background: "transparent",
          border: "none",
          color: "#fff",
          cursor: "pointer",
          padding: 2,
          display: "flex",
          opacity: 0.85,
        }}
      >
        <FiX size={16} />
      </button>
    </div>
  );
}
