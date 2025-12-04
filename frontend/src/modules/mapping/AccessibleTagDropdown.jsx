import React from "react";
import { useTagMappingStore } from "./TagMappingStore";

const dropdown = {
  width: "100%",
  padding: "5px",
};

const accessibleOptions = [
  "H1",
  "H2",
  "H3",
  "P",
  "List",
  "ListItem",
  "Image",
  "Figure",
  "Table",
  "Quote",
];

function AccessibleTagDropdown({ tag }) {
  const setMapping = useTagMappingStore((s) => s.setMapping);
  const current = useTagMappingStore((s) => s.mappings[tag]);

  return (
    <select
      style={dropdown}
      value={current || ""}
      onChange={(e) => setMapping(tag, e.target.value)}
    >
      <option value="">-- Select --</option>
      {accessibleOptions.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

export default AccessibleTagDropdown;
