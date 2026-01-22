// // Rule-specific diagnosis logic

// export function analyzeIssue(issue, html) {
//   const ruleId = issue?.["earl:test"]?.["@id"] || "";

//   // Default fallback
//   const result = {
//     highlight: null,
//     message: "Accessibility issue detected."
//   };

//   // epub-pagelist-broken
//   if (ruleId === "epub-pagelist-broken") {
//     // find page break id
//     const match = html.match(/<a[^>]+id="([^"]+)"/i);

//     if (match) {
//       const pageId = match[1];

//       return {
//         highlight: pageId,
//         message: `❌ Page break "${pageId}" is not linked from nav.xhtml page-list.
// Fix: Add a corresponding <a href="...#${pageId}"> entry inside the <nav epub:type="page-list">.`
//       };
//     }

//     return {
//       highlight: null,
//       message:
//         "❌ Page list is broken. Page break anchors are missing or not linked from nav.xhtml."
//     };
//   }

//   return result;
// }
