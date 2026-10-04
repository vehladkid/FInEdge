// Renders real command output (evidence/logs/*.txt) as terminal-style screenshots.
// The text is the unedited output of the command; only a head/tail window is shown for long logs.
import { chromium } from "playwright";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const logs = path.join(root, "evidence", "logs");
const out = path.join(root, "screenshots", "evidence");
await mkdir(out, { recursive: true });

// [output file, log file, window]  window: {head:n} | {tail:n} | {grep:RegExp context lines}
export const SHOTS = JSON.parse(await readFile(path.join(root, "tools", "evidence-shots.json"), "utf8"));

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const browser = await chromium.launch();
for (const s of SHOTS) {
  let text = (await readFile(path.join(logs, s.log), "utf8")).replace(/\x1b\[[0-9;]*[A-Za-z]/g, "");
  let lines = text.split("\n");
  const first = lines[0];
  if (s.tail) lines = [first, "…", ...lines.slice(-s.tail)];
  else if (s.head) lines = lines.slice(0, s.head);
  else if (s.from) {
    const i = lines.findIndex((l) => l.includes(s.from));
    lines = [first, "…", ...lines.slice(Math.max(0, i), i + (s.count ?? 40))];
  }
  const html = `<html><body style="margin:0;background:#0b1220"><div style="display:inline-block;min-width:900px;box-sizing:border-box;padding:0;background:#0b1220;font:13px/1.45 'DejaVu Sans Mono',monospace;color:#d6e2f0">
  <div style="background:#16213a;padding:8px 14px;color:#93a4bf;font:12px sans-serif">${esc(s.title)}</div>
  <pre id="t" style="margin:0;padding:14px 16px;white-space:pre-wrap;word-break:break-all;max-width:1150px">${esc(lines.join("\n"))}</pre></div></body></html>`;
  const page = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: 1200, height: 600 } });
  await page.setContent(html);
  await (await page.$("div")).screenshot({ path: path.join(out, s.out) });
  await page.close();
  console.log("rendered", s.out);
}
await browser.close();
