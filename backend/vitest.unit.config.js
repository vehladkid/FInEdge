import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/unit/**/*.test.js"],
    coverage: {
      provider: "v8",
      include: ["src/utils/**", "src/validators/**", "src/services/*Calc.js", "src/services/insightRules.js", "src/services/aiClient.js", "src/middleware/errorHandler.js", "src/errors/**"],
      reportsDirectory: "coverage/unit",
      reporter: ["text", "json-summary", "html"],
    },
  },
});
