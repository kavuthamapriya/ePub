import React from "react";

export default function TopNav({ goConvert, goTagMapping, goQC, goReport }) {
  const navBtn = {
    padding: "8px 18px",
    borderRadius: "8px",
    cursor: "pointer",
    color: "#fff",
    fontWeight: 600,
    transition: "0.2s ease",
  };

  return (
    <header
      style={{
        width: "100%",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 1000,
        background: "#000",
        padding: "14px 0",
        boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 28px",
        }}
      >
        {/* LEFT LOGO + TEXT */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "130px",
            fontSize: "28px",
            fontWeight: "700",
            color: "white",
            cursor: "pointer",
          }}
        >
          <img
            src="/src/assets/S4C_Logo.png"
            alt="logo"
            style={{
              width: "180px",
              height: "60px",
              objectFit: "contain",
            }}
          />

          <span>
            Accessible <span style={{ color: "#FFA500" }}>EPUB</span> Convertor
          </span>
        </div>

        {/* RIGHT NAV BUTTONS */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "25px",
          }}
        >
          {/* Convert */}
          <span
            onClick={goConvert}
            style={navBtn}
            onMouseEnter={(e) => (e.target.style.background = "#FFA500")}
            onMouseLeave={(e) => (e.target.style.background = "transparent")}
          >
            Convert
          </span>

          {/* Tag Mapping */}
          <span
            onClick={goTagMapping}
            style={navBtn}
            onMouseEnter={(e) => (e.target.style.background = "#FFA500")}
            onMouseLeave={(e) => (e.target.style.background = "transparent")}
          >
            Tag Mapping
          </span>

          {/* Validation */}
          <span
            onClick={goQC}
            style={navBtn}
            onMouseEnter={(e) => (e.target.style.background = "#FFA500")}
            onMouseLeave={(e) => (e.target.style.background = "transparent")}
          >
            Validation
          </span>

          {/* Report */}
          <span
            onClick={goReport}
            style={navBtn}
            onMouseEnter={(e) => (e.target.style.background = "#FFA500")}
            onMouseLeave={(e) => (e.target.style.background = "transparent")}
          >
            Report
          </span>
        </div>
      </div>
    </header>
  );
}
