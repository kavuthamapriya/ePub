import React, { useEffect, useRef } from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import TopNav from "./components/TopNav";
import ToastHost from "./components/ToastHost";
import ConvertPage from "./modules/convert/ConvertPage";
import TagMappingTool from "./modules/mapping/TagMappingTool";
import TagMappingPage from "./modules/mapping/TagMappingPage";
import QCPage from "./modules/qc/QCPage";
import { useConversionStore } from "./store/useConversionStore";


const pageWrapper = {
  background: "linear-gradient(180deg,#f9fafb,#f3f4f6)",
  minHeight: "100vh",
  paddingTop: "92px",
  paddingLeft: "20px",
  paddingRight: "20px",
  paddingBottom: "40px",
};

function scrollTo(ref) {
  if (ref.current) {
    ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

export default function App() {
  const location = useLocation();
  const bookId = useConversionStore((s) => s.bookId); // ⭐ FIX: pass bookId from Zustand

  const convertRef = useRef(null);
  const tagMapRef = useRef(null);
  const qcRef = useRef(null);
  const reportRef = useRef(null);

  useEffect(() => {
    if (location.pathname.endsWith("/convert")) scrollTo(convertRef);
    if (location.pathname.endsWith("/tagmapping")) scrollTo(tagMapRef);
    if (location.pathname.endsWith("/qc")) scrollTo(qcRef);
    if (location.pathname.endsWith("/report")) scrollTo(reportRef);
  }, [location.pathname]);

  return (
    <ToastHost>
    <div style={pageWrapper}>
      <TopNav
        goConvert={() => scrollTo(convertRef)}
        goTagMapping={() => scrollTo(tagMapRef)}
        goQC={() => scrollTo(qcRef)}
        goReport={() => scrollTo(reportRef)}
      />

      {/* Convert Section */}
      <div ref={convertRef} style={{ marginTop: "40px" }}>
        <h1
          style={{
            background: "linear-gradient(135deg,#f97316,#ea580c)",
            WebkitBackgroundClip: "text",
            color: "transparent",
            fontSize: "2rem",
            fontWeight: 700,
            marginBottom: "20px",
          }}
        >
          {/* Convert EPUB */}
        </h1>

        <ConvertPage />
      </div>

      {/* Tag Mapping Section */}
      <div ref={tagMapRef} style={{ marginTop: "80px" }}>
        <h1
          style={{
            background: "linear-gradient(135deg,#f97316,#ea580c)",
            WebkitBackgroundClip: "text",
            color: "transparent",
            fontSize: "2rem",
            fontWeight: 700,
            marginBottom: "20px",
          }}
        >
          Tag Mapping
        </h1>

        {/* ⭐ THIS FIXES TAG MAPPING LOADING */}
        <TagMappingTool bookId={bookId} />
      </div>

      {/* Validation Section */}
      <div ref={qcRef} style={{ marginTop: "80px" }}>
        <h1
          style={{
            background: "linear-gradient(135deg,#f97316,#ea580c)",
            WebkitBackgroundClip: "text",
            color: "transparent",
            fontSize: "2rem",
            fontWeight: 700,
            marginBottom: "20px",
          }}
        >
          Validation
        </h1>

        <TagMappingPage />
      </div>

      {/* Report Section */}
      <div ref={reportRef} style={{ marginTop: "80px" }}>
        <h1
          style={{
            background: "linear-gradient(135deg,#f97316,#ea580c)",
            WebkitBackgroundClip: "text",
            color: "transparent",
            fontSize: "2rem",
            fontWeight: 700,
            marginBottom: "20px",
          }}
        >
          DAISY Ace Report
        </h1>

        <QCPage />
      </div>

      {/* Hidden route triggers */}
      <Routes>
        <Route path="convert" element={<div />} />
        <Route path="tagmapping" element={<div />} />
        <Route path="qc" element={<div />} />
        <Route path="report" element={<div />} />
      </Routes>
    </div>
    </ToastHost>
  );
}
