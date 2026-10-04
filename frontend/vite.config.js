import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 5173 },
  test: {
    environment: "jsdom",
    globals: false,
    setupFiles: ["tests/setup.js"],
    include: ["tests/unit/**/*.test.{js,jsx}"],
    coverage: { provider: "v8", include: ["src/utils/**", "src/services/**", "src/components/**", "src/contexts/**", "src/hooks/**"], reporter: ["text", "json-summary"], reportsDirectory: "coverage" },
  },
});
