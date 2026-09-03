#!/usr/bin/env node
/* check-links.js – fail CI if any internal href/src points to a missing file.
 * No deps, built-ins only. Skips external, mailto, tel, hash-only, data:.
 * Run: node tools/check-links.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const files = [];

function collect(dir, rel) {
  for (const e of fs.readdirSync(path.join(ROOT, rel), { withFileTypes: true })) {
    if (e.name.startsWith(".")) continue;
    if (e.name === "node_modules" || e.name === ".git" || e.name === ".wrangler" || e.name === "pdf-to-image") continue;
    const fp = path.join(rel, e.name);
    if (e.isDirectory()) collect(dir, fp);
    else if (e.name.endsWith(".html")) files.push(fp);
  }
}
collect(ROOT, "");

const hrefRe = /(?:href|src)\s*=\s*["']([^"']+)["']/gi;

let broken = 0;
for (const file of files) {
  const html = fs.readFileSync(path.join(ROOT, file), "utf8");
  const dir = path.dirname(file);
  let m;
  hrefRe.lastIndex = 0;
  while ((m = hrefRe.exec(html))) {
    let url = m[1].trim();
    if (!url || url.startsWith("#") || url.startsWith("mailto:") || url.startsWith("tel:") || url.startsWith("data:") || url.startsWith("javascript:")) continue;
    if (url.includes("${") || url.includes("{{")) continue;
    if (/^(https?:)?\/\//i.test(url)) continue;
    // strip hash + query
    url = url.split("#")[0].split("?")[0].trim();
    if (!url) continue;
    // "/" -> index.html
    if (url === "/") url = "index.html";
    // absolute "/foo.html" -> "foo.html"
    else if (url.startsWith("/")) url = url.slice(1);
    if (!url) continue;
    // only check file-like targets (html, css, js, png, svg, woff2, json, xml, ico)
    // skip anchors like "feed.xml", but DO check html; ignore bare fragments
    if (!/\.(html|css|js|png|svg|woff2?|json|xml|ico|webmanifest|txt)$/i.test(url) && !url.includes(".")) continue;

    const target = path.normalize(path.join(dir, url));
    // normalize removes leading ./, keep relative
    const abs = path.join(ROOT, target);
    if (!fs.existsSync(abs)) {
      console.error(`BROKEN ${file} -> ${m[1]} (resolved: ${target})`);
      broken++;
    }
  }
}

if (broken) {
  console.error(`\n${broken} broken internal link(s)`);
  process.exit(1);
}
console.log(`OK: checked ${files.length} pages, no broken internal links`);
