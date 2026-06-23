import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import Toast from "./Toast";

const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastHost>");
  return ctx;
}

export default function ToastHost({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((message, options = {}) => {
    const id = ++idRef.current;
    const toast = {
      id,
      message,
      type: options.type || "info",
      duration: options.duration ?? 3500,
    };
    setToasts((list) => [...list, toast]);
    return id;
  }, []);

  const api = {
    push,
    dismiss,
    success: (msg, opts) => push(msg, { ...opts, type: "success" }),
    error:   (msg, opts) => push(msg, { ...opts, type: "error" }),
    warning: (msg, opts) => push(msg, { ...opts, type: "warning" }),
    info:    (msg, opts) => push(msg, { ...opts, type: "info" }),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        style={{
          position: "fixed",
          top: 90,
          right: 20,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          zIndex: 99999,
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => (
          <Toast
            key={t.id}
            message={t.message}
            type={t.type}
            duration={t.duration}
            onClose={() => dismiss(t.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
