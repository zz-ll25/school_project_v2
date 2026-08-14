import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// dev 代理：/api → 后端 8000（同源免 CORS，SSE 流式原生透传）
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true
      }
    }
  }
});
