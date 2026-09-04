#!/usr/bin/env node
/* sync-all.js – regenerate every derived artifact after a content change.

   Chain: gen-seo -> gen-feed -> gen-search-index -> gen-og-images ->
   gen-benchmarks -> build.js sync. Safe to re-run (idempotent).

   Usage: node tools/sync-all.js
*/

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const TOOLS = path.join(__dirname, "..", "tools");

const STEPS = [
  { name: "SEO meta + sitemap", cmd: "node", args: ["gen-seo.js"] },
  { name: "Atom feed", cmd: "node", args: ["gen-feed.js"] },
  { name: "search index", cmd: "node", args: ["gen-search-index.js"] },
  { name: "OG images", cmd: "python3", args: ["gen-og-images.py"], optional: true },
  { name: "benchmark pages", cmd: "node", args: ["gen-benchmarks.js"] },
  { name: "boilerplate + versions", cmd: "node", args: ["build.js", "sync"] },
];

let failed = false;
for (const s of STEPS) {
  if (s.optional && !fs.existsSync(path.join(TOOLS, "gen-og-images.py"))) {
    console.log(`skip  ${s.name} (tool missing)`);
    continue;
  }
  if (s.optional) {
    const probe = spawnSync("python3", ["-c", "import PIL"], { encoding: "utf8" });
    if (probe.status !== 0) {
      console.warn(`WARN  ${s.name} skipped – python3 Pillow not installed (pip install pillow)`);
      continue;
    }
  }
  const r = spawnSync(s.cmd, s.args, { cwd: TOOLS, stdio: "inherit", encoding: "utf8" });
  if (r.status !== 0) {
    console.error(`FAIL  ${s.name} (${s.cmd} ${s.args.join(" ")})`);
    failed = true;
    break;
  }
  console.log(`ok    ${s.name}`);
}

if (!failed) {
  const guard = spawnSync("node", ["check-article-sync.js"], { cwd: TOOLS, stdio: "inherit" });
  if (guard.status !== 0) {
    console.error("\nsync complete, but the article-sync guard found problems (above).");
    process.exit(1);
  }
  console.log("\nall artifacts regenerated and in sync.");
} else {
  process.exit(1);
}
