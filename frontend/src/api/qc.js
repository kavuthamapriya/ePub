// frontend/src/api/qc.js

export async function rerunQC(bookId) {
  const res = await fetch(
    `http://localhost:8000/api/qc/run/${bookId}`,
    { method: "POST" }
  );

  if (!res.ok) {
    throw new Error("Failed to re-run QC");
  }

  return res.json();
}
