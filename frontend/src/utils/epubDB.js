// utils/epubDB.js

const BASE_URL = "http://localhost:8000/api/epub2pdf_storage";

export async function uploadEPUB(file) {
  const fd = new FormData();
  fd.append("epub", file);

  const res = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    body: fd,
  });

  if (!res.ok) throw new Error("Upload failed");
  return await res.json(); // { id, uploaded: true }
}

export async function getAllEPUBs() {
  const res = await fetch(`${BASE_URL}/all`);
  if (!res.ok) throw new Error("Failed to load epubs");
  return await res.json(); // [{id, filename, cover_base64}]
}

export async function getEPUB(id) {
  const res = await fetch(`${BASE_URL}/${id}`);

  const blob = await res.blob();

  console.log("📦 getEPUB Blob size:", blob.size);

  return blob;
}


export async function deleteEPUB(id) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Delete failed");
  return await res.json();
}
