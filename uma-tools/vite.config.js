import { defineConfig } from "vite";

export default defineConfig({
  root: '.',
  server: { host: true, port: 5173 },
  build: {
    target: "es2018",
    outDir: "dist",
    assetsInlineLimit: 0
  }
});