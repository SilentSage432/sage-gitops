import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],

  // IMPORTANT — UI will be hosted at root in dev
  base: "/",

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  define: {
    "process.env.VITE_API_BASE": JSON.stringify(process.env.VITE_API_BASE),
    "process.env.VITE_WS_BASE": JSON.stringify(process.env.VITE_WS_BASE),
  },

  server: {
    host: true,
    port: 8080,

    // Local Arc Bridge proxy (7070)
    proxy: {
      "/api": {
        target: process.env.VITE_API_BASE,
        changeOrigin: true,
        secure: false,
      },
      "/v1": {
        target: process.env.VITE_API_BASE,
        changeOrigin: true,
        secure: false,
      },
      "/stream": {
        target: process.env.VITE_WS_BASE?.replace("ws://", "http://").replace("wss://", "https://") || "http://localhost:7070",
        ws: true,
        changeOrigin: true,
      },
    },
  },

  preview: {
    host: true,
    port: 8080,
  },

  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
