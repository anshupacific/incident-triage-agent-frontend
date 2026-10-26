import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// Local dev: requests to /api and /health go to the backend (default http://localhost:8000),
// so no CORS setup is needed. Set VITE_DEV_API_TARGET to use the deployed backend instead.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const target = env.VITE_DEV_API_TARGET || "http://localhost:8000";
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "/api": { target, changeOrigin: true },
        "/health": { target, changeOrigin: true },
      },
    },
    test: {
      environment: "node",
      include: ["tests/**/*.test.ts"],
    },
  };
});
