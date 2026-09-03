#!/usr/bin/env node
/* Generate search-index.json – prebuilt fuzzy-search index for the site.
 * Covers articles (articles.js) + tools / hubs / static pages (gen-seo.js).
 * Run: node tools/gen-search-index.js
 */
const fs = require("fs");
const path = require("path");

const ARTICLES = require("../articles.js");
let TOOLS_META = {}, STATIC_META = {}, CATEGORY_META = {};
try {
  const seo = require("./gen-seo.js");
  TOOLS_META = seo.TOOLS_META || {};
  STATIC_META = seo.STATIC_META || {};
  CATEGORY_META = seo.CATEGORY_META || {};
} catch (e) {
  console.error("Could not load gen-seo metas:", e.message);
}

const index = [];
const seen = new Set();

function push(entry) {
  if (seen.has(entry.url)) return;
  seen.add(entry.url);
  index.push(entry);
}

for (const a of ARTICLES) {
  push({
    title: a.title,
    url: a.url,
    desc: a.description || "",
    category: a.category || "",
    tags: a.tags || [],
    kind: "article",
    date: a.date || "",
  });
}

for (const [file, meta] of Object.entries(TOOLS_META)) {
  push({
    title: meta.title.replace(/\s*\|\s*VelsTech\s*$/, ""),
    url: file,
    desc: meta.desc || "",
    category: "Tools",
    tags: ["Tool"],
    kind: "tool",
  });
}

for (const [file, meta] of Object.entries(CATEGORY_META)) {
  push({
    title: meta.title.replace(/\s*\|\s*VelsTech\s*$/, ""),
    url: file,
    desc: meta.desc || "",
    category: meta.title.split("|")[0].trim(),
    tags: [],
    kind: "hub",
  });
}

for (const [file, meta] of Object.entries(STATIC_META)) {
  push({
    title: meta.title.replace(/\s*\|\s*VelsTech\s*$/, ""),
    url: file,
    desc: meta.desc || "",
    category: "",
    tags: [],
    kind: "page",
  });
}

const out = path.join(__dirname, "..", "search-index.json");
fs.writeFileSync(out, JSON.stringify(index, null, 2) + "\n");
console.log(`search-index.json: ${index.length} entries`);
