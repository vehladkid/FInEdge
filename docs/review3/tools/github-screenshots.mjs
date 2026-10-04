// Captures public GitHub pages (repository, branches, tags, CI run) as evidence screenshots.
import { chromium } from "playwright";
import path from "node:path";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const repo = process.argv[2] ?? "https://github.com/vehladkid/FInEdge";
const runUrl = process.argv[3];
const out = path.join(path.dirname(fileURLToPath(import.meta.url)), "../screenshots/github");
await mkdir(out, { recursive: true });
const pages = [
  ["repository.png", repo],
  ["branches.png", `${repo}/branches/all`],
  ["tags.png", `${repo}/tags`],
  ["actions.png", `${repo}/actions`],
  ["commits.png", `${repo}/commits/main`],
  ...(runUrl ? [["ci-run.png", runUrl]] : []),
];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1.5 });
for (const [file, url] of pages) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(out, file), fullPage: file === "ci-run.png" || file === "branches.png" });
  console.log("captured", file, page.url());
}
await browser.close();
