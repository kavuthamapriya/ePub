import React from "react";
import { useConversionStore } from "../../store/useConversionStore";

export default function UploadEpub() {
  const {
    setEpubFile,
    setBookId,
    setEpubToc,
    reset,
  } = useConversionStore();

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log("📘 Uploading EPUB:", file.name);

    // 🔄 Reset old state before new upload
    reset();

    setEpubFile(file);

    const formData = new FormData();
    formData.append("epub", file);

    let res;
    try {
      res = await fetch("http://localhost:8000/api/epub/upload", {
        method: "POST",
        body: formData,
      });
    } catch (err) {
      console.error("❌ Network error while uploading EPUB", err);
      return;
    }

    if (!res.ok) {
      const errText = await res.text();
      console.error("❌ Upload failed:", errText);
      return;
    }

    const data = await res.json();
    console.log("✅ Upload response:", data);

    if (!data.book_id) {
      console.error("❌ book_id missing from backend response");
      return;
    }

    // ✅ THIS IS THE MOST IMPORTANT PART
    setBookId(data.book_id);
    console.log("🔥 STORED bookId in store:", data.book_id);

    if (Array.isArray(data.toc)) {
      setEpubToc(data.toc);
      console.log("📑 TOC loaded:", data.toc.length);
    } else {
      console.warn("⚠️ TOC not returned from backend");
    }
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ fontWeight: 600 }}>
        Upload EPUB:
        <input
          type="file"
          accept=".epub"
          onChange={handleUpload}
          style={{ display: "block", marginTop: 8 }}
        />
      </label>
    </div>
  );
}
