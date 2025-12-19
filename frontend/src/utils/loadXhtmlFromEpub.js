import JSZip from "jszip";

export async function loadXhtmlFromEpub(epubFile, href) {
  if (!epubFile || !href) return "";

  const zip = await JSZip.loadAsync(epubFile);

  // EPUB paths are relative — normalize
  const normalizedPath = href.startsWith("/")
    ? href.slice(1)
    : href;

  const file = zip.file(normalizedPath);
  if (!file) return "";

  return await file.async("text");
}
