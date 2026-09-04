#!/usr/bin/env node
/* check-article-sync.js – CI guard: every article must be fully wired.

   Fails (exit 1) when, for any entry in articles.js:
     - the EN / .hi / .ta files are missing
     - the hreflang cluster (en+hi+ta+x-default) is missing in any variant
     - og/<slug>.png is missing
     - the article is absent from feed.xml, sitemap.xml or search-index.json
   And for benchmarks/data.json:
     - a source_article that does not exist as a file or is not in articles.js

   Run: node tools/check-article-sync.js   (also runs at the end of sync-all.js)
*/

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const ARTICLES = require(path.join(ROOT, "articles.js"));

const problems = [];
const read = (f) => { try { return fs.readFileSync(path.join(ROOT, f), "utf8"); } catch { return null; } };

const feed = read("feed.xml") || "";
const sitemap = read("sitemap.xml") || "";
let searchUrls = new Set();
try {
  searchUrls = new Set(JSON.parse(read("search-index.json")).map((e) => e.url));
} catch { problems.push("search-index.json: missing or unreadable"); }

for (const a of ARTICLES) {
  const slug = a.url.replace(/\.html$/, "");
  const variants = [a.url, slug + ".hi.html", slug + ".ta.html"];
  for (const v of variants) {
    const html = read(v);
    if (html === null) { problems.push(`${a.url}: missing file ${v}`); continue; }
    for (const lang of ["en", "hi", "ta", "x-default"]) {
      if (!html.includes(`hreflang="${lang}"`)) {
        problems.push(`${v}: hreflang cluster incomplete (missing ${lang}) – run gen-seo.js`);
      }
    }
  }
  if (!fs.existsSync(path.join(ROOT, "og", slug + ".png"))) {
    problems.push(`${a.url}: missing og/${slug}.png – run gen-og-images.py`);
  }
  if (!feed.includes(`<id>https://velstech.net/${a.url}</id>`)) {
    problems.push(`${a.url}: not in feed.xml – run gen-feed.js`);
  }
  if (!sitemap.includes(`/${a.url}`)) {
    problems.push(`${a.url}: not in sitemap.xml – run gen-seo.js`);
  }
  if (!searchUrls.has(a.url)) {
    problems.push(`${a.url}: not in search-index.json – run gen-search-index.js`);
  }
}

try {
  const bench = JSON.parse(read(path.join("benchmarks", "data.json"))).benchmarks;
  const urls = new Set(ARTICLES.map((a) => a.url));
  for (const b of bench) {
    const sa = b.source_article;
    if (!sa) continue;
    if (!fs.existsSync(path.join(ROOT, sa))) problems.push(`benchmark ${b.id}: source_article ${sa} does not exist`);
    else if (!urls.has(sa)) problems.push(`benchmark ${b.id}: source_article ${sa} is not registered in articles.js`);
  }
} catch { problems.push("benchmarks/data.json: missing or unreadable"); }

if (problems.length) {
  console.error(`article-sync guard: ${problems.length} problem(s)`);
  for (const p of problems) console.error("  - " + p);
  process.exit(1);
}
console.log(`OK: ${ARTICLES.length} articles fully synced (EN/HI/TA + hreflang + og + feed + sitemap + search) + benchmark links valid.`);
