#!/usr/bin/env node
/* check-og-images.js – fail CI if any article in articles.js lacks og/*.png.
 * Run: node tools/check-og-images.js
 */
const fs = require("fs");
const path = require("path");

const ARTICLES = require("../articles.js");
const ROOT = path.join(__dirname, "..");

let missing = 0;
for (const a of ARTICLES) {
  const base = a.url.replace(/\.html$/, "");
  const og = path.join(ROOT, "og", base + ".png");
  if (!fs.existsSync(og)) {
    console.error(`MISSING og image for ${a.url} -> og/${base}.png`);
    missing++;
  }
}

// Also check the site-wide fallback
if (!fs.existsSync(path.join(ROOT, "og-image.png"))) {
  console.error("MISSING og-image.png (site fallback)");
  missing++;
}

if (missing) {
  console.error(`\n${missing} missing OG image(s) – run: python3 tools/gen-og-images.py`);
  process.exit(1);
}
console.log(`OK: ${ARTICLES.length} articles have og images + fallback present`);
