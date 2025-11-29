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
    port: 5173, // Changed from 8080 to avoid conflict with onboarding backend

    // Proxy configuration
    proxy: {
      // Go onboarding backend (port 8080) for auth endpoints - must come before /api
      "/api/federation/auth": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },
      // Node.js federation backend (port 7070) for other /api routes
      "/api": {
        target: process.env.VITE_API_BASE || "http://localhost:7070",
        changeOrigin: true,
        secure: false,
      },
      "/v1": {
        target: process.env.VITE_API_BASE || "http://localhost:7070",
        changeOrigin: true,
        secure: false,
      },
      // Federation routes go to Node.js backend (7070)
      "/federation": {
        target: process.env.VITE_API_BASE || "http://localhost:7070",
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
    port: 5173, // Changed to match dev server
  },

  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
