import React from "react";
import ConvertPage from "./modules/convert/ConvertPage";
import EpubWorkspace from "./modules/epub/EpubWorkspace";
import QCPage from "./modules/qc/QCPage";
import TopNav from "./components/TopNav";

function App() {
  return (
    <div
      style={{
        backgroundColor: "#f3f4f6",
        minHeight: "100vh",
        padding: "16px",
      }}
    >
      {/* Global Top Navbar */}
      <TopNav />

      {/* Convert Section */}
      <section style={{ marginTop: "24px", marginBottom: "24px" }}>
        <h2 style={{ margin: "0 0 8px 0", color: "#111827" }}>Convert</h2>
        <ConvertPage />
      </section>

      {/* Tag Mapping */}
      <section style={{ marginBottom: "24px" }}>
        <h2 style={{ margin: "0 0 8px 0", color: "#111827" }}>
          QC Validation
        </h2>
        <EpubWorkspace />
      </section>

      {/* QC */}
      <section>
        <QCPage />
      </section>
    </div>
  );
}

export default App;
