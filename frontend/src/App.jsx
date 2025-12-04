import React from "react";
import ConvertPage from "./modules/convert/ConvertPage";
import MappingPage from "./modules/mapping/MappingPage";
import QCPage from "./modules/qc/QCPage";

function App() {
  return (
    <div
      style={{
        backgroundColor: "#f3f4f6",
        minHeight: "100vh",
        padding: "16px",
        boxSizing: "border-box",
      }}
    >
      {/* Title */}
      <header
        style={{
          marginBottom: "16px",
          padding: "12px 16px",
          backgroundColor: "#111827",
          color: "white",
          borderRadius: "8px",
          fontSize: "18px",
          fontWeight: 600,
        }}
      >
        Accessible EPUB System
      </header>

      {/* Convert Section */}
      <section style={{ marginBottom: "24px" }}>
        <h2 style={{ margin: "0 0 8px 0", color: "#111827" }}>Convert</h2>
        <ConvertPage />
      </section>

      {/* Tag Mapping Section */}
      <section style={{ marginBottom: "24px" }}>
        <h2 style={{ margin: "0 0 8px 0", color: "#111827" }}>Tag Mapping</h2>
        <MappingPage />
      </section>

      {/* QC Section */}
      <section>
        <h2 style={{ margin: "0 0 8px 0", color: "#111827" }}>QC</h2>
        <QCPage />
      </section>
    </div>
  );
}

export default App;
