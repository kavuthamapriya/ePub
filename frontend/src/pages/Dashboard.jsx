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
  FiRepeat,
  FiZap,
  FiCheckCircle,
  FiShield,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div style={styles.page}>
      {/* ================= SIDEBAR ================= */}
      <aside style={styles.sidebar}>
        <div style={styles.logoBox}>
          <img src="/src/assets/S4C_Logo.png" alt="logo" style={styles.logo} />
        </div>

        <SidebarItem icon={<FiHome />} title="Dashboard" active />
        <SidebarItem
          icon={<FiBookOpen />}
          title="Home"
          onClick={() => navigate("/")}
        />
        <SidebarItem icon={<FiUser />} title="Profile" />
        <SidebarItem icon={<FiSettings />} title="Settings" />
        <SidebarItem icon={<FiHelpCircle />} title="Help" />
        <SidebarItem icon={<FiInfo />} title="About" />

        <div style={{ flexGrow: 1 }} />

        <SidebarItem
          icon={<FiLogOut />}
          title="Logout"
          danger
          onClick={() => navigate("/")}
        />
      </aside>

      {/* ================= MAIN ================= */}
      <main style={styles.main}>
        <TopNavbar />

        <section style={styles.content}>
          <p style={styles.intro}>
            Our Ninja series of AI-driven tools operates within the digital ecosystem
            to handle the heavy lifting of your data transformation.
          </p>

          <h2 style={styles.sectionTitle}>Platforms</h2>

          <div style={styles.grid}>
            {/* 1 */}
            <ToolCard
              icon={<FiZap />}
              title="Ninja PDF Accelerator"
              subtitle="PDF → Accessible PDF"
              description="Rapidly transforms raw PDFs into WCAG, ADA, and Section 508-compliant assets."
              link="https://app.pdfxt.com"
            />

            {/* 2 */}
            <ToolCard
              icon={<FiBookOpen />}
              title="Ninja EPUB Accelerator"
              subtitle="PDF → EPUB"
              description="Converts static layouts into high-fidelity, reflowable EPUBs."
            />

            {/* 3 */}
            <ToolCard
              icon={<FiCheckCircle />}
              title="Ninja EPUB Authenticator"
              subtitle="EPUB → Accessible EPUB"
              description="Automated QA engine ensuring 100% compliance before distribution."
              onClick={() => navigate("/epub-accessible")}
            />

            {/* 4 */}
            <ToolCard
              icon={<FiLayers />}
              title="Ninja XML Generator"
              subtitle="EPUB → XML"
              description="Creates structured JATS/BITS XML for multi-channel publishing."
            />

            {/* 5 */}
            <ToolCard
              icon={<FiRepeat />}
              title="Ninja PDF Transformer"
              subtitle="EPUB → PDF"
              description="High-speed creation of digital-first PDFs."
              onClick={() => navigate("/epub-to-pdf")}
            />

            {/* 6 ✅ NEW */}
            <ToolCard
              icon={<FiShield />}
              title="Ninja Accessible PDF Validator"
              subtitle="Accessible PDF Validation"
              description="Validates accessible PDFs against WCAG, PDF/UA, and accessibility standards."
              onClick={() => navigate("/accessiblepdfvalidator")}
            />
          </div>
        </section>
      </main>
    </div>
  );
}

/* ================= COMPONENTS ================= */

function SidebarItem({ icon, title, active, danger, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        ...styles.sidebarItem,
        ...(active && styles.sidebarActive),
        ...(danger && styles.sidebarDanger),
      }}
    >
      {icon}
      <span>{title}</span>
    </div>
  );
}

function ToolCard({ icon, title, subtitle, description, link, onClick }) {
  return (
    <div
      style={styles.card}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-8px)";
        e.currentTarget.style.boxShadow =
          "0 20px 40px rgba(249,115,22,0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow =
          "0 10px 30px rgba(0,0,0,0.08)";
      }}
    >
      {/* ICON + TITLE */}
      <div style={styles.cardHeader}>
        <div style={styles.iconBadge}>{icon}</div>
        <h3 style={styles.cardTitle}>{title}</h3>
      </div>

      <p style={styles.cardSubtitle}>{subtitle}</p>
      <p style={styles.cardDesc}>{description}</p>

      {link && (
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          style={styles.link}
          onClick={(e) => e.stopPropagation()}
        >
          Visit Tool →
        </a>
      )}
    </div>
  );
}

function TopNavbar() {
  return (
    <header style={styles.topbar}>
      <h1 style={styles.topTitle}>Ninja Data Bridge</h1>
      <p style={styles.topSub}>A Platform for Accessible Formats</p>
    </header>
  );
}

/* ================= STYLES ================= */

const styles = {
  page: {
    display: "flex",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f8fafc, #eef2ff)",
    fontFamily: "'Poppins', sans-serif",
  },

  sidebar: {
    width: 240,
    background: "#020617",
    color: "#fff",
    padding: "20px 0",
    display: "flex",
    flexDirection: "column",
  },

  logoBox: {
    textAlign: "center",
    marginBottom: 30,
  },

  logo: {
    width: 140,
  },

  sidebarItem: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "14px 24px",
    cursor: "pointer",
    opacity: 0.85,
  },

  sidebarActive: {
    background: "#111827",
    borderLeft: "4px solid #f97316",
    opacity: 1,
  },

  sidebarDanger: {
    color: "#ef4444",
  },

  main: {
    flexGrow: 1,
  },

  topbar: {
    padding: "28px 40px",
    background: "linear-gradient(90deg, #020617, #0f172a)",
    color: "#fff",
  },

  topTitle: {
    margin: 0,
    color: "#f97316",
    fontSize: 30,
  },

  topSub: {
    marginTop: 6,
    opacity: 0.85,
  },

  content: {
    padding: "50px 60px",
  },

  intro: {
    maxWidth: 700,
    lineHeight: 1.7,
    color: "#334155",
  },

  sectionTitle: {
    marginTop: 40,
    marginBottom: 30,
    fontSize: 26,
    borderLeft: "5px solid #f97316",
    paddingLeft: 12,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 30,
  },

  card: {
    background: "rgba(255,255,255,0.92)",
    borderRadius: 18,
    padding: 26,
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    transition: "all 0.35s ease",
    cursor: "pointer",
  },

  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 6,
  },

  iconBadge: {
    width: 46,
    height: 46,
    borderRadius: 12,
    background: "#fff7ed",
    color: "#f97316",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22,
  },

  cardTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 600,
    color: "#0f172a",
  },

  cardSubtitle: {
    fontSize: 13,
    fontWeight: 600,
    opacity: 0.7,
  },

  cardDesc: {
    fontSize: 14,
    lineHeight: 1.6,
    marginTop: 10,
    color: "#475569",
  },

  link: {
    display: "inline-block",
    marginTop: 14,
    color: "#f97316",
    fontWeight: 600,
    textDecoration: "none",
  },
};
