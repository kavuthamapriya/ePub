import React, { useState } from "react";
import { useTagMappingStore } from "./TagMappingStore";

function AISuggestButton({ tag, contextHTML }) {
  const setMapping = useTagMappingStore((s) => s.setMapping);
  const [loading, setLoading] = useState(false);

  async function handleSuggest() {
    setLoading(true);
    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html_tag: tag, context_html: contextHTML }),
      });
      const data = await res.json();
      const suggestion = data.suggested_tag || data.tag || "";
      if (suggestion) setMapping(tag, suggestion);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleSuggest}
      disabled={loading}
      style={{
        padding: "4px 8px",
        backgroundColor: loading ? "#9CA3AF" : "#374151",
        color: "white",
        border: "none",
        borderRadius: "4px",
        marginLeft: "6px",
      }}
    >
      {loading ? "..." : "AI Suggest"}
    </button>
  );
}

export default AISuggestButton;
