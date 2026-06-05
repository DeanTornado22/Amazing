import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (
            id.includes("three") ||
            id.includes("@react-three/fiber") ||
            id.includes("@react-three/drei") ||
            id.includes("@react-three/postprocessing") ||
            id.includes("/postprocessing/")
          ) {
            return "three";
          }
          if (id.includes("gsap")) return "gsap";
          return undefined;
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
});
