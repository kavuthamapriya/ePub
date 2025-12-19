import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default {
  server: {
    proxy: {
      "/xhtml": "http://localhost:8000",
    },
  },
};

