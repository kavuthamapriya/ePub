import React from "react";
import AccessibleTagDropdown from "./AccessibleTagDropdown";
import AISuggestButton from "./AISuggestButton";

const rowStyle = {
  display: "flex",
  alignItems: "center",
  padding: "6px 8px",
  borderBottom: "1px solid #e1e4e8",
  gap: "10px",
};

function TagRow({ tag, contextHTML }) {
  return (
    <div style={rowStyle}>
      <div style={{ width: "30%", fontWeight: 500 }}>{tag}</div>
      <div style={{ width: "50%" }}>
        <AccessibleTagDropdown tag={tag} />
      </div>
      <AISuggestButton tag={tag} contextHTML={contextHTML} />
    </div>
  );
}

export default TagRow;
