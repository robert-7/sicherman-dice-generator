/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      // With `include` set, Vitest counts every matching source file (not just
      // those a test imports), so a new untested module fails the gate instead
      // of being silently ignored. Runtime source only: excludes the app
      // bootstrap (main.tsx), ambient type declarations, type-only modules, and
      // the tests/setup themselves.
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/main.tsx",
        "src/vite-env.d.ts",
        "src/types.ts",
        "src/test/**",
        "src/**/*.test.{ts,tsx}",
      ],
      reporter: ["text", "text-summary"],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
});
