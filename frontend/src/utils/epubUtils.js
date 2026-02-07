// utils/epubUtils.js
import JSZip from "jszip";

export async function extractEPUBCover(file) {
  const zip = await JSZip.loadAsync(file);

  // Read container.xml
  const containerXml = await zip.file("META-INF/container.xml").async("string");
  const container = new DOMParser().parseFromString(containerXml, "application/xml");

  const opfPath = container
    .getElementsByTagName("rootfile")[0]
    .getAttribute("full-path");

  // Read OPF
  const opfXml = await zip.file(opfPath).async("string");
  const opf = new DOMParser().parseFromString(opfXml, "application/xml");
  const manifest = [...opf.getElementsByTagName("item")];

  let coverHref = null;

  // 1. Look for cover id
  let coverItem = manifest.find((m) =>
    (m.getAttribute("id") || "").toLowerCase().includes("cover")
  );
  if (coverItem) coverHref = coverItem.getAttribute("href");

  // 2. meta[name=cover]
  if (!coverHref) {
    const meta = [...opf.getElementsByTagName("meta")];
    for (let m of meta) {
      if (m.getAttribute("name") === "cover") {
        const id = m.getAttribute("content");
        const it = manifest.find((i) => i.getAttribute("id") === id);
        if (it) coverHref = it.getAttribute("href");
      }
    }
  }

  // 3. fallback: first image item
  if (!coverHref) {
    const imgItem = manifest.find((m) =>
      (m.getAttribute("media-type") || "").startsWith("image/")
    );
    if (imgItem) coverHref = imgItem.getAttribute("href");
  }

  if (!coverHref) return null;

  const baseDir = opfPath.split("/").slice(0, -1).join("/");
  const resolved = baseDir + "/" + coverHref;

  const imgFile = zip.file(resolved);
  if (!imgFile) return null;

  const base64 = await imgFile.async("base64");
  return "data:image/jpeg;base64," + base64;
}
