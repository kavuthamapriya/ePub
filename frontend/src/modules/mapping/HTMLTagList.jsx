import React from "react";
import { useTagMappingStore } from "./TagMappingStore";

const htmlTagItem = {
  padding: "6px 10px",
  borderBottom: "1px solid #e1e4e8",
};

function HTMLTagList() {
  const htmlTags = useTagMappingStore((s) => s.htmlTags);

  return (
    <div>
      <h3>HTML Tags</h3>
      <div>
        {htmlTags.map((tag, idx) => (
          <div key={idx} style={htmlTagItem}>
            {tag}
          </div>
        ))}
      </div>
    </div>
  );
}

export default HTMLTagList;
