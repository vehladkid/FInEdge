// Turns backend/reports/mutation/mutation.json into evidence/mutation-summary.md
// (per-file scores + every surviving mutant with its source text).
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const report = JSON.parse(await readFile(path.join(root, "backend/reports/mutation/mutation.json"), "utf8"));
const rows = [];
const survivors = [];
const total = { Killed: 0, Timeout: 0, Survived: 0, NoCoverage: 0, other: 0 };
for (const [file, data] of Object.entries(report.files)) {
  const src = (await readFile(path.join(root, "backend", file), "utf8")).split("\n");
  const c = { Killed: 0, Timeout: 0, Survived: 0, NoCoverage: 0 };
  for (const m of data.mutants) {
    if (m.status in c) c[m.status]++;
    else total.other++;
    if (m.status === "Survived") {
      const { start, end } = m.location;
      const original = start.line === end.line ? src[start.line - 1].slice(start.column - 1, end.column - 1) : "(multi-line expression)";
      survivors.push({ file, line: start.line, mutator: m.mutatorName, original: original.trim(), replacement: String(m.replacement).replace(/\s+/g, " ") });
    }
  }
  for (const k of Object.keys(c)) total[k] += c[k];
  const detected = c.Killed + c.Timeout;
  rows.push({ file, ...c, score: ((detected / (detected + c.Survived + c.NoCoverage)) * 100).toFixed(2) });
}
const detected = total.Killed + total.Timeout;
const score = ((detected / (detected + total.Survived + total.NoCoverage)) * 100).toFixed(2);
const esc = (s) => s.replace(/\|/g, "\\|").replace(/`/g, "'").slice(0, 90);
let md = `# Mutation testing summary (generated)\n\nTool: StrykerJS ${JSON.parse(await readFile(path.join(root, "backend/node_modules/@stryker-mutator/core/package.json"), "utf8")).version} with the Vitest runner. **Mutation score: ${score}%** — ${total.Killed} killed, ${total.Timeout} timed out (counted as detected), ${total.Survived} survived, ${total.NoCoverage} without coverage.\n\n| File | Killed | Timeout | Survived | Score |\n|---|---:|---:|---:|---:|\n`;
for (const r of rows.sort((a, b) => a.file.localeCompare(b.file))) md += `| \`${r.file}\` | ${r.Killed} | ${r.Timeout} | ${r.Survived} | ${r.score}% |\n`;
md += `\n## Surviving mutants (${survivors.length})\n\n| Location | Mutator | Original | Mutated to |\n|---|---|---|---|\n`;
for (const s of survivors) md += `| \`${s.file}:${s.line}\` | ${s.mutator} | \`${esc(s.original)}\` | \`${esc(s.replacement)}\` |\n`;
await writeFile(path.join(root, "docs/review3/evidence/mutation-summary.md"), md);
console.log(md.split("\n").slice(0, 6).join("\n"));
