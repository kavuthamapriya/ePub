import React from "react";
import { FiBookOpen, FiTool, FiFileText } from "react-icons/fi";

/* Main Navbar Container */
const navStyle = {
  display: "flex",
  alignItems: "center",
  padding: "12px 20px",
  background: "#111827", 
  color: "#fff",
  borderRadius: "10px",
  gap: "1.5rem",
  marginBottom: "20px",
  boxShadow: "0 3px 8px rgba(0,0,0,0.25)",
};

/* Brand / Title */
const brandStyle = {
  fontWeight: 700,
  fontSize: "1.05rem",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginRight: "20px",
};

/* Normal Link */
const linkStyle = {
  color: "#cbd2d9",
  textDecoration: "none",
  padding: "8px 14px",
  borderRadius: "8px",
  fontSize: "0.95rem",
  fontWeight: 500,
  display: "flex",
  alignItems: "center",
  gap: "6px",
  transition: "0.2s ease",
};

/* Link Hover */
const hoverStyle = {
  background: "rgba(255,255,255,0.08)",
  color: "#fff",
};

/* Active Link */
const activeStyle = {
  ...linkStyle,
  background: "linear-gradient(135deg,#f97316,#ea580c)",
  color: "#fff",
  boxShadow: "0 4px 10px rgba(249,115,22,0.4)",
};

export default function TopNav() {
  return (
    <header style={navStyle}>
      {/* Brand */}
      <div style={brandStyle}>
        <FiBookOpen size={25} color="#f97316" />
        Accessible EPUB Converter
      </div>
    </header>
  );
}
