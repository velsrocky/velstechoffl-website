#!/usr/bin/env node
/*
 * stage-pages.js – build a clean deploy directory for Cloudflare Pages.
 *
 * `wrangler pages deploy` does NOT honour .assetsignore (that is a Workers
 * static-assets feature), so deploying the repo root would serve build
 * scripts, tests, docs, and the Worker source at public URLs. This script
 * copies everything EXCEPT the denylist below into .dist/ and the workflow
 * deploys that directory instead.
 *
 * Run: node tools/stage-pages.js            (writes .dist/)
 * CI:  deploy-pages.yml stages then deploys .dist
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, ".dist");

// Exact top-level names to skip.
const SKIP_DIRS = new Set([".git", ".github", ".wrangler", ".dist", "node_modules", "tools", "tests"]);
const SKIP_FILES = new Set([
  ".gitignore",
  ".assetsignore",
  "wrangler.toml",
  "lighthouserc.json",
  "velstech.pws",
  "chat-proxy.js", // Worker source – deployed separately via `wrangler deploy`
  "chat-proxy-core.js",
  "README.md",
  "CHANGELOG.md",
]);

// Keep these even though they look like docs (search-engine verification + custom domain).
const KEEP = new Set(["CNAME", "BingSiteAuth.xml", ".nojekyll"]);

function isSkipped(rel) {
  if (KEEP.has(rel)) return false;
  const top = rel.split(path.sep)[0];
  if (SKIP_DIRS.has(top) || SKIP_FILES.has(rel)) return true;
  if (rel.endsWith(".md")) return true; // all markdown is repo docs, never a page
  return false;
}

function walk(dir, cb) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(ROOT, full);
    if (isSkipped(rel)) continue;
    if (entry.isDirectory()) walk(full, cb);
    else if (entry.isFile()) cb(full, rel);
  }
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

let count = 0;
walk(ROOT, (full, rel) => {
  const dest = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(full, dest);
  count++;
});

console.log(`staged ${count} files to .dist/`);
