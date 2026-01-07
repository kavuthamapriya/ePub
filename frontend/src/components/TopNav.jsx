import React from "react";
import { NavLink } from "react-router-dom";

const navStyle = {
  display: "flex",
  alignItems: "center",
  padding: "0.5rem 1rem",
  backgroundColor: "#1f2933",
  color: "#fff",
  gap: "1rem",
  fontSize: "0.95rem",
};

const linkStyle = {
  color: "#cbd2d9",
  textDecoration: "none",
  padding: "0.35rem 0.75rem",
  borderRadius: "4px",
};

const activeStyle = {
  ...linkStyle,
  backgroundColor: "#3e4c59",
  color: "#f9fafb",
};

function TopNav() {
  return (
    <header style={navStyle}>
      <div style={{ fontWeight: "600" }}>Accessible EPUB Convertor</div>
      <NavLink
        to="/convert"
        style={({ isActive }) => (isActive ? activeStyle : linkStyle)}
      >
        Convert
      </NavLink>
      {/* <NavLink
        to="/mapping"
        style={({ isActive }) => (isActive ? activeStyle : linkStyle)}
      >
        Tag Mapping
      </NavLink> */}
      <NavLink
        to="/qc"
        style={({ isActive }) => (isActive ? activeStyle : linkStyle)}
      >
        QC
      </NavLink>
    </header>
  );
}

export default TopNav;
