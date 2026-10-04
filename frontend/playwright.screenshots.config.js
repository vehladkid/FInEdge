import base from "./playwright.config.js";
import { defineConfig } from "@playwright/test";

// Same real stack as the e2e suite; captures the figures used in the DA3 documents.
export default defineConfig({
  ...base,
  testDir: "tests/screenshots",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } },
  ],
});
