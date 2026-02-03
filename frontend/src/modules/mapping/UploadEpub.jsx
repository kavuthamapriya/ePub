// UploadEpub.jsx
import React, { useState } from "react";
import TagMappingTool from "./TagMappingTool";

export default function UploadEpub() {
  const [generatedId, setGeneratedId] = useState(null);

  const uploadEpub = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("http://127.0.0.1:8000/api/qc/epub", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    setGeneratedId(data.bookId);   // backend returns bookId, example: 5eafa61c-dde4-488e-a451-8dd4665bc593

  };

  return (
    <div>
      <h2>Upload EPUB</h2>

      <input
        type="file"
        accept=".epub"
        onChange={(e) => uploadEpub(e.target.files[0])}
      />

      {generatedId && (
        <TagMappingTool bookId={generatedId} />
      )}
    </div>
  );
}
