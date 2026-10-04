// Builds FinEdge-DA3-Report.pdf and FinEdge-DA3-Evidence.pdf from the repository's own
// Markdown, diagrams, screenshots and logs (Chromium print-to-PDF).
import { chromium } from "playwright";
import { marked } from "marked";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const docs = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = path.join(docs, "../..");
const meta = JSON.parse(await readFile(path.join(docs, "report-meta.json"), "utf8"));
const md = async (f) => marked.parse(await readFile(path.join(docs, f), "utf8"));
const img = async (rel) => `data:image/png;base64,${(await readFile(path.join(docs, rel))).toString("base64")}`;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const demote = (html, by = 1) => html.replace(/<(\/?)h([1-5])>/g, (_, s, n) => `<${s}h${Math.min(6, +n + by)}>`);

const css = `
@page { size: A4; margin: 18mm 16mm 18mm 16mm; }
* { box-sizing: border-box; }
body { font: 10.5pt/1.5 'DejaVu Sans', 'Segoe UI', Arial, sans-serif; color: #1b2433; }
h1 { font-size: 20pt; border-bottom: 2px solid #4f46e5; padding-bottom: 4pt; margin: 0 0 10pt; page-break-before: always; }
h1.first { page-break-before: avoid; }
h2 { font-size: 14pt; margin: 16pt 0 6pt; color: #312e81; }
h3 { font-size: 11.5pt; margin: 12pt 0 4pt; }
h4 { font-size: 10.5pt; margin: 10pt 0 3pt; }
p, li { orphans: 3; widows: 3; }
table { border-collapse: collapse; width: 100%; margin: 8pt 0; font-size: 8.8pt; page-break-inside: auto; }
tr { page-break-inside: avoid; }
th, td { border: 1px solid #c9d0de; padding: 3.5pt 5pt; vertical-align: top; text-align: left; }
th { background: #eef0fb; }
code { font: 8.6pt 'DejaVu Sans Mono', monospace; background: #f1f3f9; padding: 0 2pt; border-radius: 2pt; }
pre { font: 7.8pt/1.35 'DejaVu Sans Mono', monospace; background: #f6f7fb; border: 1px solid #dde1ee; padding: 7pt; white-space: pre-wrap; word-break: break-word; page-break-inside: avoid; }
pre code { background: none; padding: 0; font-size: inherit; }
blockquote { border-left: 3px solid #4f46e5; margin: 8pt 0; padding: 2pt 10pt; color: #374151; background: #f8f9ff; }
figure { margin: 10pt 0; text-align: center; page-break-inside: avoid; }
figure img { max-width: 100%; max-height: 215mm; border: 1px solid #dde1ee; }
figcaption { font-size: 9pt; color: #374151; margin-top: 4pt; text-align: left; }
.title { height: 245mm; display: flex; flex-direction: column; justify-content: center; }
.title .kicker { color: #4f46e5; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; font-size: 10pt; }
.title h1 { border: 0; font-size: 34pt; margin: 6pt 0; page-break-before: avoid; }
.title .sub { font-size: 15pt; color: #374151; margin-bottom: 36pt; }
.title table { width: auto; font-size: 10.5pt; }
.title td { border: 0; padding: 3pt 18pt 3pt 0; }
.toc li { margin: 2pt 0; } .toc { font-size: 10.5pt; }
.note { border: 1px solid #f59e0b; background: #fffbeb; padding: 6pt 10pt; font-size: 9.5pt; margin: 8pt 0; }
.fig { page-break-inside: avoid; }
`;

async function pdf(browser, html, file, footer) {
  const page = await browser.newPage();
  await page.setContent(`<html><head><meta charset="utf-8"><style>${css}</style></head><body>${html}</body></html>`, { waitUntil: "load" });
  await page.pdf({
    path: path.join(docs, file), format: "A4", printBackground: true,
    displayHeaderFooter: true, headerTemplate: "<span></span>",
    footerTemplate: `<div style="font:8px sans-serif;color:#6b7280;width:100%;padding:0 16mm;display:flex;justify-content:space-between"><span>${footer}</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
    margin: { top: "18mm", bottom: "18mm", left: "16mm", right: "16mm" },
  });
  await page.close();
  console.log("wrote", file);
}

const titleBlock = (kind) => `<div class="title"><div class="kicker">${esc(meta.assignment)}</div><h1>${esc(meta.project)}</h1><div class="sub">${esc(meta.subtitle)}<br/>${kind}</div>
<table><tr><td><b>Course</b></td><td>${esc(meta.course)}</td></tr><tr><td><b>Author</b></td><td>${esc(meta.author)}</td></tr>${meta.registration ? `<tr><td><b>Registration no.</b></td><td>${esc(meta.registration)}</td></tr>` : ""}<tr><td><b>Repository</b></td><td>${esc(meta.repository)}</td></tr><tr><td><b>Release</b></td><td>${esc(meta.release)}</td></tr></table></div>`;

const figure = (src, caption, style = "") => `<figure><img src="${src}" ${style ? `style="${style}"` : ""}/><figcaption>${caption}</figcaption></figure>`;
const diagram = async (name, caption, maxh = "205mm") => figure(await img(`diagrams/${name}.png`), caption, `max-height:${maxh}`);

async function listing(file, from, to, caption) {
  const lines = (await readFile(path.join(root, file), "utf8")).split("\n");
  const body = lines.slice(from - 1, to).join("\n");
  return `<h4><code>${esc(file)}</code> — ${esc(caption)} <small>(lines ${from}–${to})</small></h4><pre><code>${esc(body)}</code></pre>`;
}

const browser = await chromium.launch();

/* ---------------- Report ---------------- */
{
  let h = titleBlock("Project Report");
  h += `<h1 class="first" style="page-break-before:always">Contents</h1><ol class="toc"><li>Problem Statement</li><li>User Stories</li><li>System Architecture and System Design</li><li>Design of Tests</li><li>Appendix<ul><li>A. Software Requirements Specification (SRS)</li><li>B. Data Flow Diagrams (DFD)</li><li>C. Entity-Relationship Diagram (ERD)</li><li>D. UML diagrams</li><li>E. Code listing / GitHub link</li></ul></li></ol>`;
  h += `<h1>1. Problem Statement</h1>${demote((await md("problem-statement.md")).replace(/^<h1>.*?<\/h1>/, ""))}`;
  h += `<h1>2. User Stories</h1>${demote((await md("user-stories.md")).replace(/^<h1>.*?<\/h1>/, ""))}`;
  h += `<h1>3. System Architecture and System Design</h1>${demote((await md("architecture.md")).replace(/^<h1>.*?<\/h1>/, ""))}`;
  h += await diagram("uml-component", "Figure 3.1 — Component view of the implemented system (see also Appendix D).", "190mm");
  h += figure(await img("screenshots/app/desktop-04-dashboard.png"), "Figure 3.2 — The implemented dashboard (real data from PostgreSQL).");
  h += figure(await img("screenshots/app/desktop-09-budgets.png"), "Figure 3.3 — Budgets with backend-calculated spent, remaining and status.");
  h += `<h1>4. Design of Tests</h1>${demote((await md("design-of-tests.md")).replace(/^<h1>.*?<\/h1>/, ""))}<h2>4.6 Results (v1.0.0)</h2>${demote((await md("TESTING.md")).replace(/^<h1>.*?<\/h1>/, ""))}`;
  h += `<h1>Appendix</h1><h2>A. Software Requirements Specification</h2>${demote((await md("srs.md")).replace(/^<h1>.*?<\/h1>/, ""), 1)}`;
  h += `<h2 style="page-break-before:always">B. Data Flow Diagrams</h2><p>Level 0 shows FinEdge as one process with the user, the PostgreSQL database and the optional AI provider. Level 1 decomposes it into the six processes implemented by the API (authenticate, manage categories, manage transactions, manage budgets, dashboard &amp; analytics, generate insights) and the four data stores, which are the four database tables.</p>`;
  h += await diagram("dfd-level-0", "Figure B.1 — DFD level 0 (context diagram).", "120mm");
  h += await diagram("dfd-level-1", "Figure B.2 — DFD level 1.", "200mm");
  h += `<h2 style="page-break-before:always">C. Entity-Relationship Diagram</h2><p>The ERD mirrors <code>backend/src/db/migrations/001_init.sql</code>. PostgreSQL is the only datastore.</p>`;
  h += await diagram("erd", "Figure C.1 — ERD of the implemented schema.", "120mm");
  h += await listing("backend/src/db/migrations/001_init.sql", 5, 60, "schema (excerpt)");
  h += `<h2 style="page-break-before:always">D. UML Diagrams</h2>`;
  h += await diagram("uml-use-case", "Figure D.1 — Use case diagram.", "175mm");
  h += await diagram("uml-component", "Figure D.2 — Component diagram.", "235mm");
  h += await diagram("uml-class", "Figure D.3 — Class diagram (entities, services and pure calculation modules).", "200mm");
  h += await diagram("uml-sequence-login", "Figure D.4 — Sequence diagram: login.", "235mm");
  h += await diagram("uml-sequence-transaction", "Figure D.5 — Sequence diagram: adding a transaction.", "235mm");
  h += await diagram("uml-activity", "Figure D.6 — Activity diagram: recording a transaction and its effect on budgets.", "240mm");
  h += `<h2 style="page-break-before:always">E. Code Listing / GitHub Link</h2><p>Full source: <b>${esc(meta.repository)}</b> (release tag <code>${esc(meta.release)}</code>). Representative listings follow; they are extracted from the repository at build time.</p>`;
  h += await listing("backend/src/services/budgetCalc.js", 1, 20, "budget status calculation");
  h += await listing("backend/src/repositories/budgets.js", 1, 17, "budget spend computed by the database");
  h += await listing("backend/src/services/authService.js", 22, 56, "registration and login");
  h += await listing("backend/src/middleware/auth.js", 1, 15, "JWT guard");
  h += await listing("backend/tests/integration/budgets.test.js", 63, 82, "integration test — budget boundaries");
  await pdf(browser, h, "FinEdge-DA3-Report.pdf", `${esc(meta.project)} — Project Report — ${esc(meta.release)}`);
}

/* ---------------- Evidence ---------------- */
{
  const figures = JSON.parse(await readFile(path.join(docs, "tools/figures.json"), "utf8"));
  let n = 0;
  let h = titleBlock("Evidence of Testing, Version Management, System Building and Developed Functionality");
  h += `<h1 class="first" style="page-break-before:always">About this document</h1><p>Every figure is a screenshot of the running application or of the unedited output of a command run on the project at release <b>${esc(meta.release)}</b>. Terminal figures show the first line (the command) and, for long outputs, the relevant window; the complete outputs are in <code>docs/review3/evidence/logs/</code> and can be regenerated with <code>docs/review3/tools/run-evidence.sh</code>. Application figures are captured by <code>frontend/tests/screenshots/capture.spec.js</code> using Playwright against the real stack (React → Express → PostgreSQL) with a seeded demo user.</p>
  <div class="note"><b>GitHub-hosted evidence.</b> The repository <code>${esc(meta.repository)}</code> was pushed after the local validation run; the repository, branches, tags, commit history, and the GitHub Actions run (CI #1, all four jobs green) are shown in Sections 4 and 5 as screenshots of the public pages. No pull requests were opened — the branches were merged locally with <code>--no-ff</code> — so there are no pull-request screenshots, and none have been fabricated.</div>
  <ol class="toc">${figures.map((s) => `<li>${esc(s.section)}</li>`).join("")}</ol>`;
  for (const s of figures) {
    h += `<h1>${esc(s.section)}</h1>`;
    for (const f of s.figures) {
      n++;
      const style = f.width ? `max-width:${f.width};` : "";
      h += `<div class="fig"><h4>Figure ${n} — ${esc(f.title)}</h4>${figure(await img(f.img), `<b>Fig. ${n}.</b> ${esc(f.caption)}${f.context ? ` <i>${esc(f.context)}</i>` : ""}`, style + "max-height:205mm")}</div>`;
    }
  }
  h += `<h1>Tools and technologies (summary)</h1>${demote((await md("tools-and-technologies.md")).replace(/^<h1>.*?<\/h1>/, ""))}`;
  await pdf(browser, h, "FinEdge-DA3-Evidence.pdf", `${esc(meta.project)} — DA3 Evidence — ${esc(meta.release)}`);
  console.log("figures:", n);
}
await browser.close();
