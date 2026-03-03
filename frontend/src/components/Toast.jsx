import React, { useEffect } from "react";

export default function Toast({ message, type = "warning", onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={styles.container(type)}>
      <span>{message}</span>
    </div>
  );
}

const styles = {
  container: (type) => ({
    position: "fixed",
    top: "20px",
    right: "20px",
    background: type === "error" ? "#ef4444" : "#f59e0b",
    color: "white",
    padding: "12px 20px",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "600",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
    animation: "slideIn 0.4s ease-out",
    zIndex: 99999,
  }),
};
