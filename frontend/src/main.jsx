import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import OldAppContainer from "./pages/OldAppContainer";
import EpubToAccessible from "./pages/EpubToAccessible";   // ✅ Added

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

        {/* 4. Old App */}
        <Route path="/app" element={<OldAppContainer />} />

      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
