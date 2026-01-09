import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: false,
    rollupOptions: {
      input: {
        options: "src/options/main.jsx",
        popup: "src/popup/mainPopup.jsx",
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === "options"
            ? "options.js"
            : chunkInfo.name === "mainPopup"
            ? "popup.js"
            : "[name].js";
        },
        chunkFileNames: "[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith(".css")) {
            return assetInfo.name.includes("options")
              ? "options.css"
              : assetInfo.name.includes("popup")
              ? "popup.css"
              : "[name].[ext]";
          }
          return "[name]-[hash].[ext]";
        },
      },
    },
  },
});
