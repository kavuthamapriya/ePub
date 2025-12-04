import React from "react";
import TopNav from "../components/TopNav";

const layoutStyle = {
  display: "flex",
  flexDirection: "column",
  height: "100vh",
};

const contentStyle = {
  flex: 1,
  minHeight: 0,
  display: "flex",
  backgroundColor: "#f5f5f5",
};

function MainLayout({ children }) {
  return (
    <div style={layoutStyle}>
      <TopNav />
      <main style={contentStyle}>{children}</main>
    </div>
  );
}

export default MainLayout;
