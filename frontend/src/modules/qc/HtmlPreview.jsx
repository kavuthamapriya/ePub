import React, { useMemo } from "react";

export default function HtmlPreview({ html }) {
  const processedHtml = useMemo(() => {
    if (!html) return "";

    let out = html;

    // 🔥 IMPORTANT: remove comments, wrap content
    out = out.replace(
      /<!--\s*HIGHLIGHT START\s*-->/g,
      `<span class="qc-error">`
    );
    out = out.replace(
      /<!--\s*HIGHLIGHT END\s*-->/g,
      `</span>`
    );

    return out;
  }, [html]);

  return (
    <iframe
      title="HTML Preview"
      style={{
        width: "100%",
        height: "100%",
        border: "1px solid #ddd"
      }}
      srcDoc={`
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 16px;
          }
          .qc-error {
            outline: 3px solid red;
            background: rgba(255, 0, 0, 0.15);
            display: inline-block;
            padding: 4px;
          }
        </style>
        ${processedHtml}
      `}
    />
  );
}
