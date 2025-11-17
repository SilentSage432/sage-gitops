import { defineConfig } from "vite";
import react from '@vitejs/plugin-react'
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: "/ui/",
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env.VITE_API_BASE': JSON.stringify(process.env.VITE_API_BASE || 'http://api.sage'),
    'process.env.VITE_WS_BASE': JSON.stringify(process.env.VITE_WS_BASE || 'ws://api.sage'),
  },
  server: {
    host: true, // Allow external connections
    port: 8080,
    proxy: {
      "/v1": { target: process.env.VITE_API_BASE || "http://api.sage", changeOrigin: true },
      "/api": { 
        target: process.env.VITE_API_BASE || "http://sage-enterprise-ui:8081", 
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    host: true,       // "0.0.0.0"
    port: 8080,
    strictPort: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})