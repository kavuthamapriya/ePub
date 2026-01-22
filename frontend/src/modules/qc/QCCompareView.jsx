// import React from "react";

// function QCCompareView({ html, pdfFile }) {
//   return (
//     <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
//       <h3>EPUB / PDF Comparison</h3>

//       <div
//         style={{
//           flex: 1,
//           overflow: "auto",
//           marginBottom: "6px",
//           border: "1px solid #d1d5db",
//         }}
//       >
//         <iframe
//           srcDoc={html}
//           style={{ width: "100%", height: "100%", border: "none" }}
//         ></iframe>
//       </div>

//       <div style={{ flex: 1, border: "1px solid #d1d5db", overflow: "auto" }}>
//         {pdfFile ? (
//           <iframe
//             src={URL.createObjectURL(pdfFile)}
//             style={{ width: "100%", height: "100%" }}
//           ></iframe>
//         ) : (
//           <p style={{ color: "#777", padding: "6px" }}>No PDF Uploaded</p>
//         )}
//       </div>
//     </div>
//   );
// }

// export default QCCompareView;
