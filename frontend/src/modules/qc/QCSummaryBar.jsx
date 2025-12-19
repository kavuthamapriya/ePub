import React from "react";
import { useQCStore } from "../../store/useQCStore";

export default function QCSummaryBar() {
  const { issues } = useQCStore();

  const errors = issues.filter(i => i.impact === "fail").length;
  const total = issues.length;

  // return (
  //   <div style={{ display: "flex", gap: 16 }}>
  //     <div>❌ Errors: {errors}</div>
  //     <div>📊 Total: {total}</div>
  //   </div>
  // );
}
