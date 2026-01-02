export const dark = {
  page: {
    minHeight: "calc(100vh - 88px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#2f2f2f",
  },

  card: {
    width: 520,
    background: "#3a3a3a",
    borderRadius: 10,
    padding: 24,
    boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
    color: "#fff",
  },

  title: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 16,
    textAlign: "center",
  },

  uploadBox: {
    border: "2px dashed #6b7280",
    borderRadius: 6,
    padding: 20,
    textAlign: "center",
    cursor: "pointer",
    marginBottom: 16,
    background: "#444",
  },

  fileName: {
    fontSize: 13,
    marginTop: 6,
    color: "#d1d5db",
  },

  progressWrap: {
    height: 14,
    background: "#555",
    borderRadius: 999,
    overflow: "hidden",
    margin: "16px 0",
  },

  progressBar: (pct) => ({
    width: `${pct}%`,
    height: "100%",
    background: "#fb923c",
    transition: "width 0.3s",
  }),

  convertBtn: {
    width: "100%",
    background: "#fb923c",
    color: "#1f2933",
    border: "none",
    borderRadius: 6,
    padding: "12px 0",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
  },
};
