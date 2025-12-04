export async function runQC(html) {
  const res = await fetch("/api/qc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ html }),
  });
  return await res.json();
}
