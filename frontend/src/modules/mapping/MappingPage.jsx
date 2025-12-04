import React, { useEffect } from "react";
import HTMLTagList from "./HTMLTagList";
import TagRow from "./TagRow";
import { useTagMappingStore } from "./TagMappingStore";

const wrapperStyle = {
  display: "flex",
  flex: 1,
};

const leftStyle = {
  width: "25%",
  borderRight: "1px solid #e1e4e8",
  padding: "0.75rem",
  backgroundColor: "#ffffff",
};

const middleStyle = {
  width: "45%",
  borderRight: "1px solid #e1e4e8",
  padding: "0.75rem",
  backgroundColor: "#ffffff",
  overflowY: "auto",
};

const rightStyle = {
  flex: 1,
  padding: "0.75rem",
  backgroundColor: "#ffffff",
};

function MappingPage() {
  const htmlTags = ["Ahead", "Dhead", "Par", "P.", "List", "ListItem"];
  const setHTMLTags = useTagMappingStore((s) => s.setHTMLTags);
  const completion = useTagMappingStore((s) => s.completion);

  useEffect(() => {
    setHTMLTags(htmlTags);
  }, []);

  return (
    <div style={wrapperStyle}>
      <section style={leftStyle}>
        <HTMLTagList />
      </section>

      <section style={middleStyle}>
        <h3 style={{ marginBottom: "8px" }}>Accessible Tags</h3>
        {htmlTags.map((tag) => (
          <TagRow key={tag} tag={tag} contextHTML={"<mock epub html>"} />
        ))}
      </section>

      <section style={rightStyle}>
        <h3>Progress</h3>
        <div
          style={{
            height: "20px",
            backgroundColor: "#e5e7eb",
            borderRadius: "4px",
            marginBottom: "10px",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${completion}%`,
              backgroundColor: "#10b981",
              borderRadius: "4px",
            }}
          ></div>
        </div>
        <p>{completion}% Complete</p>
        <button
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            backgroundColor: "#1d4ed8",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontWeight: "600",
          }}
        >
          COMPLETE
        </button>
      </section>
    </div>
  );
}

export default MappingPage;
