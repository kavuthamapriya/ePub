// src/modules/epub/extractPages.js

import ePub from "epubjs";
import html2canvas from "html2canvas";

export async function extractPages(epubBlobUrl) {
  return new Promise(async (resolve, reject) => {
    try {
      const book = ePub(epubBlobUrl);
      await book.ready;

      const pages = [];

      for (let item of book.spine.items) {
        const html = await item.load(book.load.bind(book));

        const iframe = document.createElement("iframe");
        iframe.style.width = "800px";
        iframe.style.height = "1100px";
        iframe.style.position = "absolute";
        iframe.style.visibility = "hidden";

        document.body.appendChild(iframe);

        const doc = iframe.contentDocument;
        doc.open();
        doc.write(html);
        doc.close();

        await new Promise((res) => setTimeout(res, 200));

        // FIX: use html2canvas
        const canvas = await html2canvas(doc.body, {
          scale: 0.25,
        });

        pages.push(canvas.toDataURL("image/png"));
        iframe.remove();
      }

      resolve(pages);
    } catch (err) {
      console.error("Thumbnail Extraction Error:", err);
      reject(err);
    }
  });
}
