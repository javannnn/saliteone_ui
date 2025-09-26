import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@/components": path.resolve(__dirname, "src/components"),
      "@/pages": path.resolve(__dirname, "src/pages"),
      "@/lib": path.resolve(__dirname, "src/lib"),
      "@/stores": path.resolve(__dirname, "src/stores")
    }
  },
  server: {
    port: 5173,
    allowedHosts: [
      "17acfe6bbf6b.ngrok-free.app" // 👈 slap your ngrok host in here
    ],
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: "localhost"
      }
    }
  }
});
