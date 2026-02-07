import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import OldAppContainer from "./pages/OldAppContainer";
import EpubToAccessible from "./pages/EpubToAccessible";
import PDFTransformerPage from "./pages/PDFTransformerPage";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>

        {/* 1. Login */}
        <Route path="/" element={<Login />} />

        {/* 2. Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* 3. EPUB → Accessible EPUB tool */}
        <Route path="/epub-accessible" element={<EpubToAccessible />} />

        {/* 4. EPUB → PDF Transformer */}
        <Route path="/epub-to-pdf" element={<PDFTransformerPage />} />   {/* ⭐ ADD THIS */}

        {/* 5. Old App */}
        <Route path="/app" element={<OldAppContainer />} />

      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
