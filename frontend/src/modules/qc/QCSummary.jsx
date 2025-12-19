// import React from "react";
// import QCItem from "./QCItem";

// function QCSummary({ report }) {
//   if (!report) return <p>No QC run yet</p>;

//   const { status, errors, warnings } = report;

//   return (
//     <div>
//       <h3>QC Summary</h3>
//       <p>
//         <strong>Status:</strong>{" "}
//         <span style={{ color: status === "pass" ? "green" : "red" }}>
//           {status}
//         </span>
//       </p>

//       <h4>Errors</h4>
//       <div style={{ backgroundColor: "#fff" }}>
//         {errors.map((e, i) => (
//           <QCItem key={i} text={e} type="error" />
//         ))}
//       </div>

//       <h4 style={{ marginTop: "10px" }}>Warnings</h4>
//       <div style={{ backgroundColor: "#fff" }}>
//         {warnings.map((w, i) => (
//           <QCItem key={i} text={w} type="warning" />
//         ))}
//       </div>
//     </div>
//   );
// }

// export default QCSummary;
