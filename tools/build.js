#!/usr/bin/env node
/* build.js – single source of truth for page boilerplate + cache-busting versions.

   Why: ~325 static pages duplicate the same asset versions (styles.css?v=42,
   articles.js?v=14, i18n.js?v=2, script.js?v=49) and the same head/tail
   boilerplate. Until now, bumping a version meant a manual perl one-liner
   across every file, and boilerplate drifted silently.

   Commands:
     node tools/build.js check        Verify every page matches canonical boilerplate/versions (CI guard, exit 1 on drift)
     node tools/build.js sync         Rewrite pages to match canonical boilerplate/versions
     node tools/build.js bump <file>  Bump ?v=N on <file> (e.g. script.js) in versions.json, update script.js injections if needed, then sync
     node tools/build.js status       Show canonical versions + drift summary

   Canonical versions live in tools/versions.json.

   Managed per page:
     - head: favicon links + stylesheet link (contiguous block containing rel="stylesheet")
     - tail: articles.js / i18n.js / script.js tags before </body>
     - script.js runtime-injected asset versions (chat/glossary/define)
   Not managed (owned by gen-seo.js): canonical, OG/Twitter meta, JSON-LD, hreflang, sitemap.
   Pages outside the template system (never touched): pdf-to-image/, newsletter/.
*/

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const VERSIONS_FILE = path.join(__dirname, "versions.json");

/* Assets whose ?v=N strings live inside script.js (runtime-injected). */
const SCRIPT_INJECTED = ["chat.css", "chat.js", "glossary.css", "glossary.js", "define.js"];

function loadVersions() {
  return JSON.parse(fs.readFileSync(VERSIONS_FILE, "utf8"));
}
function saveVersions(v) {
  fs.writeFileSync(VERSIONS_FILE, JSON.stringify(v, null, 2) + "\n");
}

/* Managed pages: root *.html + benchmarks/*.html. offline.html is excluded –
   it is the SW offline fallback and intentionally self-contained (inline styles). */
function managedPages() {
  const pages = fs
    .readdirSync(ROOT)
    .filter((f) => f.endsWith(".html") && f !== "offline.html")
    .map((f) => ({ rel: f, pre: "" }));
  for (const f of fs.readdirSync(path.join(ROOT, "benchmarks"))) {
    if (f.endsWith(".html")) pages.push({ rel: `benchmarks/${f}`, pre: "../" });
  }
  return pages;
}

/* Canonical head block: full favicon set + stylesheet (improves on the old
   logo.svg-only blocks and fixes ../ prefixing in benchmarks/). */
function headBoilerplate(pre, V) {
  return [
    `  <link rel="manifest" href="${pre}manifest.json" />`,
    `  <link rel="preload" href="${pre}fonts/InterVariable.woff2" as="font" type="font/woff2" crossorigin />`,
    `  <link rel="icon" href="${pre}favicon.ico" sizes="48x48" />`,
    `  <link rel="icon" type="image/png" sizes="32x32" href="${pre}favicon-32x32.png" />`,
    `  <link rel="icon" type="image/png" sizes="16x16" href="${pre}favicon-16x16.png" />`,
    `  <link rel="icon" type="image/svg+xml" href="${pre}logo.svg" />`,
    `  <link rel="apple-touch-icon" sizes="180x180" href="${pre}apple-touch-icon.png" />`,
    `  <link rel="stylesheet" href="${pre}styles.css?v=${V["styles.css"]}" />`,
  ].join("\n");
}

function tailBoilerplate(pre, V) {
  return [
    `  <script src="${pre}articles.js?v=${V["articles.js"]}"></script>`,
    `  <script src="${pre}i18n.js?v=${V["i18n.js"]}"></script>`,
    `  <script src="${pre}whatsnew-core.js?v=${V["whatsnew-core.js"]}"></script>`,
    `  <script src="${pre}script.js?v=${V["script.js"]}"></script>`,
  ].join("\n");
}

/* The contiguous run of font-preload/icon/stylesheet links that contains rel="stylesheet".
   Matches any attribute order and both ">"/"/>"/"" link styles. */
function findHeadBlock(html) {
  const re = /(?:^[ \t]*<link\b(?=[^>]*rel="(?:manifest|preload|icon|apple-touch-icon|stylesheet)")[^>]*>\n)+/gm;
  const matches = [...html.matchAll(re)];
  return matches.find((m) => m[0].includes('rel="stylesheet"'));
}

/* The contiguous run of articles/i18n/script script tags (with page prefix). */
function findTailBlock(html, pre) {
  const escPre = pre.replace(/[/.]/g, "\\$&");
  const re = new RegExp(
    `(?:^[ \\t]*<script src="${escPre}(?:articles|i18n|whatsnew-core|script)\\.js\\?v=\\d+"></script>\\n)+`,
    "gm"
  );
  return [...html.matchAll(re)].pop() || null;
}

/* Process one page. fix=false: report issues; fix=true: rewrite. */
function processPage(fp, pre, V, fix) {
  const html = fs.readFileSync(fp, "utf8");
  const issues = [];
  let out = html;

  const head = findHeadBlock(html);
  if (!head) {
    issues.push("no favicon/stylesheet link block in head");
  } else if (head[0] !== headBoilerplate(pre, V) + "\n") {
    issues.push("head favicon/stylesheet block differs from canonical");
    if (fix) out = out.slice(0, head.index) + headBoilerplate(pre, V) + "\n" + out.slice(head.index + head[0].length);
  }

  const tail = findTailBlock(html, pre);
  if (!tail) {
    issues.push("no articles/i18n/script tags before </body>");
    if (fix) out = out.replace("</body>", tailBoilerplate(pre, V) + "\n</body>");
  } else if (tail[0] !== tailBoilerplate(pre, V) + "\n") {
    const found = tail[0].trim().split("\n").map((l) => l.trim()).join(" | ");
    issues.push(`tail script tags differ (found: ${found})`);
    if (fix) {
      // Re-find the tail in `out` – the head fix may have shifted offsets.
      const tail2 = findTailBlock(out, pre) || tail;
      out = out.slice(0, tail2.index) + tailBoilerplate(pre, V) + "\n" + out.slice(tail2.index + tail2[0].length);
    }
  }

  return { out, issues, changed: out !== html };
}

/* Keep script.js runtime-injected versions in sync with versions.json. */
function processScriptJs(V, fix) {
  const fp = path.join(ROOT, "script.js");
  const src = fs.readFileSync(fp, "utf8");
  const issues = [];
  let out = src;
  for (const asset of SCRIPT_INJECTED) {
    const re = new RegExp(`(${asset.replace(/\./g, "\\.")}\\?v=)(\\d+)`);
    const m = out.match(re);
    if (!m) {
      issues.push(`cannot find ${asset} version string in script.js`);
      continue;
    }
    const want = String(V[asset]);
    if (m[2] !== want) {
      issues.push(`script.js injects ${asset}?v=${m[2]}, canonical is ${want}`);
      if (fix) out = out.replace(re, `$1${want}`);
    }
  }
  return { out, issues, changed: out !== src };
}

function cmdCheck() {
  const V = loadVersions();
  let bad = 0;
  const pages = managedPages();
  for (const { rel, pre } of pages) {
    const { issues } = processPage(path.join(ROOT, rel), pre, V, false);
    if (issues.length) {
      bad++;
      console.log(`DRIFT ${rel}:`);
      for (const i of issues) console.log(`  - ${i}`);
    }
  }
  const s = processScriptJs(V, false);
  if (s.issues.length) {
    bad++;
    console.log("DRIFT script.js:");
    for (const i of s.issues) console.log(`  - ${i}`);
  }
  if (bad) {
    console.log(`\n${bad} file(s) drifted. Run: node tools/build.js sync`);
    process.exit(1);
  }
  console.log(`OK: ${pages.length} pages + script.js match canonical versions.`);
}

function cmdSync() {
  const V = loadVersions();
  const pages = managedPages();
  let changed = 0;
  for (const { rel, pre } of pages) {
    const fp = path.join(ROOT, rel);
    const { out, changed: ch } = processPage(fp, pre, V, true);
    if (ch) {
      fs.writeFileSync(fp, out);
      changed++;
      console.log(`synced ${rel}`);
    }
  }
  const s = processScriptJs(V, true);
  if (s.changed) {
    fs.writeFileSync(path.join(ROOT, "script.js"), s.out);
    changed++;
    console.log("synced script.js");
  }
  console.log(`\n${changed ? `${changed} file(s) updated.` : "All pages already canonical."}`);
}

function cmdBump(asset) {
  if (!asset) {
    console.error("Usage: node tools/build.js bump <file>   e.g. bump script.js");
    process.exit(1);
  }
  const V = loadVersions();
  if (!(asset in V)) {
    console.error(`Unknown asset "${asset}". Managed: ${Object.keys(V).join(", ")}`);
    process.exit(1);
  }
  V[asset] += 1;
  saveVersions(V);
  console.log(`Bumped ${asset} to v${V[asset]}`);
  cmdSync();
}

function cmdStatus() {
  const V = loadVersions();
  console.log("Canonical versions (tools/versions.json):");
  for (const [k, v] of Object.entries(V))
    console.log(`  ${k}?v=${v}${SCRIPT_INJECTED.includes(k) ? "  (injected by script.js)" : ""}`);
  const pages = managedPages();
  let drift = 0;
  for (const { rel, pre } of pages) {
    const { issues } = processPage(path.join(ROOT, rel), pre, V, false);
    if (issues.length) drift++;
  }
  const s = processScriptJs(V, false);
  if (s.issues.length) drift++;
  console.log(
    drift
      ? `\n${drift} file(s) drifted. Run: node tools/build.js sync`
      : `\nAll ${pages.length} pages + script.js canonical.`
  );
}

const cmd = process.argv[2];
if (cmd === "check") cmdCheck();
else if (cmd === "sync") cmdSync();
else if (cmd === "bump") cmdBump(process.argv[3]);
else if (cmd === "status") cmdStatus();
else {
  console.log(`Usage: node tools/build.js <check|sync|bump|status> [args]

  check          Verify every page matches canonical boilerplate/versions (CI)
  sync           Rewrite pages to canonical boilerplate/versions
  bump <file>    Bump ?v=N on a managed asset, then sync
  status         Show canonical versions + drift summary`);
  process.exit(cmd ? 1 : 0);
}
