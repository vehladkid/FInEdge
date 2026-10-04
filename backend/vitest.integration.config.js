import { defineConfig } from "vitest/config";

// Integration tests run the real Express app against a real PostgreSQL database
// named *_test (tests/integration/setup.js refuses to run against anything else).
export default defineConfig({
  test: {
    include: ["tests/integration/**/*.test.js"],
    setupFiles: ["tests/integration/setup.js"],
    fileParallelism: false,
    testTimeout: 20000,
    env: {
      NODE_ENV: "test",
      DATABASE_URL: process.env.TEST_DATABASE_URL || "postgresql://finedge:finedge@localhost:5433/finedge_test",
      JWT_SECRET: "test-secret",
      BCRYPT_ROUNDS: "4",
      AI_API_KEY: "",
    },
    coverage: {
      provider: "v8",
      include: ["src/**"],
      exclude: ["src/server.js", "src/db/migrate.js"],
      reportsDirectory: "coverage/integration",
      reporter: ["text", "json-summary", "html"],
    },
  },
});
