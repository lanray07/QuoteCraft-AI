import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist/widget",
    emptyOutDir: false,
    manifest: true,
    rollupOptions: {
      input: resolve(__dirname, "src/components/app.tsx")
    }
  }
});
