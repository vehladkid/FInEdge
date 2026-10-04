// Renders every diagrams/*.mmd to a PNG using the real Mermaid library in headless Chromium.
import { chromium } from "playwright";
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(here, "..", "diagrams");
const mermaidJs = await readFile(path.join(here, "node_modules/mermaid/dist/mermaid.min.js"), "utf8");

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: 1400, height: 900 } });
await page.setContent('<html><body style="margin:0;background:#fff"><div id="out" style="display:inline-block;padding:16px;background:#fff"></div></body></html>');
await page.addScriptTag({ content: mermaidJs });
await page.evaluate(() => mermaid.initialize({ startOnLoad: false, theme: "neutral", securityLevel: "loose", flowchart: { htmlLabels: true, useMaxWidth: false }, sequence: { useMaxWidth: false } }));

for (const file of (await readdir(dir)).filter((f) => f.endsWith(".mmd")).sort()) {
  const src = await readFile(path.join(dir, file), "utf8");
  const svg = await page.evaluate(async ({ src, id }) => (await mermaid.render(id, src)).svg, { src, id: `d${file.replace(/\W/g, "")}` });
  await page.evaluate((s) => (document.getElementById("out").innerHTML = s), svg);
  const png = path.join(dir, file.replace(/\.mmd$/, ".png"));
  await (await page.$("#out")).screenshot({ path: png });
  console.log("rendered", path.relative(process.cwd(), png));
}
await browser.close();
