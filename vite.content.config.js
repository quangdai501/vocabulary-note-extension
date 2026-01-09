import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: false,
    rollupOptions: {
      input: {
        content: "src/content/content.jsx",
      },
      output: {
        entryFileNames: "content.js",
        format: "iife",
        inlineDynamicImports: true,
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith(".css")) {
            return "content.css";
          }
          return "[name]-[hash].[ext]";
        },
      },
    },
  },
});