import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: [
      "@ai-sdk/react",
      "@durable-streams/aisdk-transport",
      "effect",
      "iconoir-react",
      "motion/react",
      "streamdown",
    ],
  },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:8787",
      "/streams": {
        target: "http://127.0.0.1:4437",
        rewrite: (path) => path.replace(/^\/streams/, ""),
      },
    },
  },
});
