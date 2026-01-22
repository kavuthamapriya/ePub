import React from "react";
import { NavLink } from "react-router-dom";
import { FiBookOpen } from "react-icons/fi";

export default function TopNav() {
  return (
    <header
      style={{
        width: "100%",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 1000,
        background: "#000",        // FULL black
        padding: "14px 0",         // remove white side gaps
        boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 28px",       // inner spacing only
        }}
      >
        {/* LEFT: LOGO */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "15px",
            color: "white",
            fontSize: "28px",
            fontWeight: "700",
          }}
        >
          <FiBookOpen size={30} color="#FFA500" />   
          Accessible EPUB Convertor
        </div>

        {/* RIGHT NAVIGATION */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "25px",
          }}
        >
          <NavLink
            to="/convert"
            style={({ isActive }) => ({
              padding: "8px 16px",
              borderRadius: "8px",
              textDecoration: "none",
              color: isActive ? "#fff" : "#e5e5e5",
              background: isActive ? "#FFA500" : "transparent",
              transition: "0.2s ease",
              fontWeight: 600,
            })}
          >
            Convert
          </NavLink>

          <NavLink
            to="/qc"
            style={({ isActive }) => ({
              padding: "8px 16px",
              borderRadius: "8px",
              textDecoration: "none",
              color: isActive ? "#fff" : "#e5e5e5",
              background: isActive ? "#FFA500" : "transparent",
              transition: "0.2s ease",
              fontWeight: 600,
            })}
          >
            QC Validation
          </NavLink>

          <NavLink
            to="/report"
            style={({ isActive }) => ({
              padding: "8px 16px",
              borderRadius: "8px",
              textDecoration: "none",
              color: isActive ? "#fff" : "#e5e5e5",
              background: isActive ? "#FFA500" : "transparent",
              transition: "0.2s ease",
              fontWeight: 600,
            })}
          >
            Report
          </NavLink>
        </div>
      </div>
    </header>
  );
}
