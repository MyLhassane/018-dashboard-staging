import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "firebase-auth-side-effects",
      transform(code, id) {
        if (id.includes("@firebase/auth") && id.endsWith(".js")) {
          return { moduleSideEffects: true };
        }
      },
    },
  ],
  optimizeDeps: {
    include: ["firebase/app", "firebase/auth", "firebase/database"],
  },
  build: {
    chunkSizeWarningLimit: 600,
    rolldownOptions: {
      output: {
        strictExecutionOrder: true,
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    css: true,
    exclude: ["e2e/**", "node_modules/**"],
  },
});
