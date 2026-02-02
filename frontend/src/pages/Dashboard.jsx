import React from "react";
import {
  FiHome,
  FiUser,
  FiSettings,
  FiHelpCircle,
  FiInfo,
  FiLogOut,
  FiBookOpen,
  FiLayers,
  FiFileText,
} from "react-icons/fi";

export default function Dashboard() {
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        minHeight: "100vh",
        fontFamily: "'Poppins', sans-serif",
        background: "#f1f5f9",
      }}
    >
     {/* ============================================= */}
{/*                LEFT SIDEBAR                   */}
{/* ============================================= */}
<div
  style={{
    width: "260px",
    background: "#0f172a",
    color: "white",
    display: "flex",
    flexDirection: "column",
    paddingTop: "20px",
    borderRight: "1px solid #1e293b",
    boxShadow: "4px 0 12px rgba(0,0,0,0.5)",
    alignItems: "center",
  }}
>
  {/* LOGO BLOCK */}
  <div
    style={{
      width: "100%",
      textAlign: "center",
      marginBottom: "25px",
      paddingBottom: "20px",
      borderBottom: "1px solid #1e293b",
    }}
  >
    <img
      src="/src/assets/S4C_Logo.png"
      alt="logo"
      style={{
        width: "150px",
        height: "auto",
        objectFit: "contain",
        filter: "drop-shadow(0px 2px 3px rgba(0,0,0,0.5))",
      }}
    />
  </div>

  {/* MENU ITEMS */}
  <SidebarItem icon={<FiHome />} title="Dashboard" active />
  <SidebarItem
    icon={<FiBookOpen />}
    title="Home"
    onClick={() => (window.location.href = "/")}
  />
  <SidebarItem
    icon={<FiUser />}
    title="Profile"
    onClick={() => alert("Profile Coming Soon!")}
  />
  <SidebarItem
    icon={<FiSettings />}
    title="Settings"
    onClick={() => alert("Settings Coming Soon!")}
  />
  <SidebarItem
    icon={<FiHelpCircle />}
    title="Help"
    onClick={() => alert("Help Coming Soon!")}
  />
  <SidebarItem
    icon={<FiInfo />}
    title="About"
    onClick={() => alert("About Coming Soon!")}
  />

  <div style={{ flexGrow: 1 }}></div>

  <SidebarItem
    icon={<FiLogOut />}
    title="Logout" 
    danger
    onClick={() => (window.location.href = "/")}
  />
</div>


      {/* ============================================= */}
      {/*               MAIN CONTENT AREA               */}
      {/* ============================================= */}
      <div style={{ flexGrow: 1, marginTop: "-20px" }}>
        {/* TOP NAV */}
        <TopNavbar />

        {/* MAIN SECTION */}
        <div style={{ padding: "50px 60px" }}>
          {/* Paragraph */}
          <p
            style={{
              fontSize: "17px",
              color: "#1e293b",
              maxWidth: "80%",
              lineHeight: "1.7",
              marginBottom: "25px",
              fontWeight: 400,
            }}
          >
            Our Ninja series of AI-driven tools operates within the digital ecosystem
            to handle the heavy lifting of your data transformation.
          </p>

          {/* Section Title */}
          <h2
            style={{
              fontSize: "28px",
              fontWeight: "700",
              marginBottom: "30px",
              color: "#0f172a",
              borderLeft: "5px solid #FFA500",
              paddingLeft: "10px",
            }}
          >
            Platforms
          </h2>

          {/* TOOL GRID */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "35px",
              flexWrap: "wrap",
              alignItems: "stretch",
            }}
          >
            <ToolCard
              icon={<FiFileText size={28} color="#f97316"/>}
              title="Ninja PDF Accelerator"
              subtitle="PDF → Accessible PDF"
              description="Rapidly transforms raw PDFs into WCAG, ADA, and Section 508-compliant assets."
              link="https://app.pdfxt.com"
            />

            <ToolCard
              icon={<FiFileText size={28} />}
              title="Ninja EPUB Accelerator"
              subtitle="PDF → EPUB"
              description="Converts static layouts into high-fidelity, reflowable, and fully accessible EPUBs."
            />
             <ToolCard
              icon={<FiFileText size={28} color="#f97316" />}
              title="Ninja EPUB Authenticator"
              subtitle="EPUB → Accessible EPUB"
              description="The final checkpoint; an automated QA engine ensuring 100% compliance before distribution."
              onClick={() => (window.location.href = "/epub-accessible")}
            />

            <ToolCard
              icon={<FiLayers size={28} />}
              title="Ninja XML Generator"
              subtitle="EPUB → XML"
              description="Extracts and structures data into 'Single Source of Truth' XML (JATS/BITS) for multi-channel use."
            />
          
            <ToolCard
              icon={<FiFileText size={28} />}
              title="Ninja PDF Transformer"
              subtitle="EPUB → PDF"
              description="High-speed creation of digital-first PDFs from ePUB."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========================================================= */
/*                        SIDEBAR ITEM                       */
/* ========================================================= */
function SidebarItem({ icon, title, active, disabled, danger, onClick }) {
  return (
    <div
      onClick={!disabled && onClick ? onClick : undefined}
      style={{
        padding: "14px 25px",
        display: "flex",
        alignItems: "center",
        gap: "15px",
        cursor: disabled ? "not-allowed" : "pointer",
        marginBottom: "4px",
        color: danger
          ? "#ef4444"
          : active
          ? "#FFA500"
          : disabled
          ? "#94a3b8"
          : "white",
        background: active ? "#1e293b" : "transparent",
        fontWeight: active ? "700" : "500",
        transition: "0.2s",
        borderLeft: active ? "4px solid #FFA500" : "4px solid transparent",
      }}
      onMouseOver={(e) => {
        if (!disabled) {
          if (danger) {
            e.currentTarget.style.background = "#FFA500";
            e.currentTarget.style.color = "white";
          } else {
            e.currentTarget.style.background = "#1e293b";
            e.currentTarget.style.color = "#FFA500";
          }
        }
      }}
      onMouseOut={(e) => {
        if (!active) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = danger ? "#ef4444" : "white";
        }
      }}
    >
      <div style={{ fontSize: "18px" }}>{icon}</div>
      <div>{title}</div>
    </div>
  );
}

/* ========================================================= */
/*                         TOOL CARD                         */
/* ========================================================= */
function ToolCard({ icon, title, subtitle, description, link, linkText, onClick }) {
  const cardStyle = {
    width: "300px",
    padding: "25px",
    borderRadius: "14px",
    background: "#fff7e6",
    boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
    border: "1px solid #fcd34d",
    transition: "all 0.28s ease",
    cursor: onClick || link ? "pointer" : "default",
  };

  const hoverStyle = {
    transform: "translateY(-6px) scale(1.03)",
    boxShadow: "0 10px 25px rgba(0,0,0,0.18)",
    border: "1px solid #f97316",
  };

  const [style, setStyle] = React.useState(cardStyle);

  return (
    <div
      style={style}
      onMouseEnter={() => setStyle({ ...cardStyle, ...hoverStyle })}
      onMouseLeave={() => setStyle(cardStyle)}
      onClick={onClick}
    >
      {/* ICON + TITLE ROW */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "8px",
        }}
      >
        <div>{icon}</div>

        <h3
          style={{
            fontWeight: "700",
            fontSize: "18px",
            margin: 0,
            color: "#000",
          }}
        >
          {title}
        </h3>
      </div>

      {/* SUBTITLE */}
      <p
        style={{
          margin: "0 0 10px 0",
          fontSize: "14px",
          fontWeight: "600",
          color: "#444",
        }}
      >
        {subtitle}
      </p>

      {/* DESCRIPTION */}
      <p style={{ margin: 0, color: "#555", lineHeight: "1.5" }}>
        {description}
      </p>

      {/* CLICKABLE URL */}
      {link && (
        <p
          style={{
            marginTop: "12px",
            fontSize: "14px",
            fontWeight: "600",
          }}
          onClick={(e) => {
            e.stopPropagation();
            window.open(link, "_blank");
          }}
        >
          🔗{" "}
          <span
            style={{
              color: "#f97316",
              textDecoration: "none",
            }}
          >
            {linkText || link}
          </span>
        </p>
      )}
    </div>
  );
}
/* ========================================================= */
/*                        TOP NAVBAR                         */
function TopNavbar() {
  return (
    <div
      style={{
        width: "100%",
        padding: "20px 30px",
        background: "#0f172a",
        boxShadow: "0 3px 10px rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      {/* LEFT LOGO */}
    
      {/* CENTER TEXT BLOCK */}
      <div style={{ textAlign: "center" }}>
        {/* Main Title */}
        <div
          style={{
            fontSize: "32px",
            fontWeight: "600",
            color: "#FFA500",
            letterSpacing: "1px",
            marginTop:"15px",
          }}
        >
          Ninja Data Bridge
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "20px",
            color: "white",
            opacity: 0.9,
            fontWeight: "400",
            marginTop: "6px",
          }}
        >
          A Platform for Accessible Formats
        </div>
      </div>
    </div>
  );
}
