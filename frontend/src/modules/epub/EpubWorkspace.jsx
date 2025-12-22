// frontend/src/modules/epub/EpubWorkspace.jsx

import React from "react";
import UploadEpub from "./UploadEpub";
import TagMappingPage from "../mapping/TagMappingPage";

export default function EpubWorkspace() {
  return (
    <div style={{ padding: 20 }}>
      {/* <UploadEpub /> */}
      <TagMappingPage />
    </div>
  );
}
