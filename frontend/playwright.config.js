import { defineConfig } from "@playwright/test";

const API = "http://127.0.0.1:5100";
const WEB = "http://127.0.0.1:5174";
const DB = process.env.E2E_DATABASE_URL || "postgresql://finedge:finedge@localhost:5433/finedge_e2e";
const CI = Boolean(process.env.CI);

// The suite drives the real stack: React app -> Express API -> PostgreSQL (finedge_e2e).
// Every test registers its own user, so tests are isolated without resetting the database.
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: true,
  workers: CI ? 2 : 4,
  retries: CI ? 1 : 0,
  forbidOnly: CI,
  reporter: [["list"], ["html", { open: "never" }], ["json", { outputFile: "test-results/e2e.json" }]],
  use: { baseURL: WEB, trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    { name: "desktop-1440x900", use: { viewport: { width: 1440, height: 900 } } },
    { name: "laptop-1280x800", use: { viewport: { width: 1280, height: 800 } } },
    { name: "mobile-390x844", use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  webServer: [
    {
      command: "node scripts/ensure-db.js && node src/db/migrate.js && node src/server.js",
      cwd: "../backend",
      url: `${API}/`,
      reuseExistingServer: !CI,
      timeout: 60_000,
      env: { PORT: "5100", DATABASE_URL: DB, JWT_SECRET: "e2e-secret", BCRYPT_ROUNDS: "4", NODE_ENV: "test", AI_API_KEY: "" },
    },
    {
      command: "npx vite --host 127.0.0.1 --port 5174 --strictPort",
      url: WEB,
      reuseExistingServer: !CI,
      timeout: 60_000,
      env: { VITE_API_URL: API },
    },
  ],
});
