import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  root: resolve(__dirname),
  plugins: [react()],
  resolve: { alias: { "shadcn-virtualized-tree": resolve(__dirname, "../src/index.ts") } },
  build: { outDir: resolve(__dirname, "../playground-dist"), emptyOutDir: true },
});
