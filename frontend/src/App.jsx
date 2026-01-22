import React, { useEffect, useRef } from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import TopNav from "./components/TopNav";

import ConvertPage from "./modules/convert/ConvertPage";
import TagMappingPage from "./modules/mapping/TagMappingPage";
import QCPage from "./modules/qc/QCPage";


const pageWrapper = {
  background: "linear-gradient(180deg,#f9fafb,#f3f4f6)",
  minHeight: "100vh",
  paddingTop: "100px", 
  paddingLeft: "20px",
  paddingRight: "20px",
  paddingBottom: "40px",
};

// Smooth selector
function scrollTo(ref) {
  if (ref.current) {
    ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

export default function App() {
  const location = useLocation();

  // Refs for sections
  const convertRef = useRef(null);
  const qcRef = useRef(null);
  const reportRef = useRef(null);

  // Route scroll logic
  useEffect(() => {
    if (location.pathname === "/convert") scrollTo(convertRef);
    if (location.pathname === "/qc") scrollTo(qcRef);
    if (location.pathname === "/report") scrollTo(reportRef);
  }, [location.pathname]);

  return (
    <div style={pageWrapper}>
      <TopNav />

      <div ref={convertRef} style={{ marginTop: "40px" }}>
        <h1
          style={{
            background: "linear-gradient(135deg,#f97316,#ea580c)",
            WebkitBackgroundClip: "text",
            color: "transparent",
            fontSize: "2rem",
            fontWeight: 800,
            marginBottom: "20px",
          }}
        >
          Convert EPUB
        </h1>

        <ConvertPage />
      </div>

      <div ref={qcRef} style={{ marginTop: "80px" }}>
        <h1
          style={{
            background: "linear-gradient(135deg,#f97316,#ea580c)",
            WebkitBackgroundClip: "text",
            color: "transparent",
            fontSize: "2rem",
            fontWeight: 800,
            marginBottom: "20px",
          }}
        >
          QC Validation 
        </h1>

        <TagMappingPage />
      </div>

      <div ref={reportRef} style={{ marginTop: "80px" }}>
        <h1
          style={{
            background: "linear-gradient(135deg,#f97316,#ea580c)",
            WebkitBackgroundClip: "text",
            color: "transparent",
            fontSize: "2rem",
            fontWeight: 800,
            marginBottom: "20px",
          }}
        >
          DAISY Ace Report
        </h1>

        <QCPage />
      </div>

      {/* Hidden router (needed for navigation) */}
      <Routes>
        <Route path="/convert" />
        <Route path="/qc" />
        <Route path="/report" />
      </Routes>
    </div>
  );
}
