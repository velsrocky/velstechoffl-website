#!/usr/bin/env node
/* new-article.js – scaffold a new article the site's way.

   Creates the EN page from the canonical skeleton, registers it in
   articles.js (newest first), then prints the remaining checklist
   (translations + sync-all). CI (tools/check-article-sync.js) refuses
   to go green until every step is done.

   Usage:
     node tools/new-article.js <slug> --title "…" --category AI [--desc "…"] [--tags "A,B,C"]

   <slug> is the filename base, e.g. "my-new-guide" -> my-new-guide.html
   Categories: AI | Hardware | Operating Systems | Networking | Security & Privacy | Programming & Web | Tutorials
*/

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const CAT_URL = {
  "AI": "ai.html", "Hardware": "hardware.html", "Operating Systems": "os.html",
  "Linux": "os.html", "Software": "os.html", "Networking": "networking.html",
  "Networking & Self-hosting": "networking.html", "Security & Privacy": "security.html",
  "Security": "security.html", "Programming & Web": "programming.html",
  "Development": "programming.html", "Tutorials": "tutorials.html",
};
const CAT_COLORS = {
  "AI": "#a78bfa", "Hardware": "#fb923c", "Operating Systems": "#3ddc97",
  "Linux": "#3ddc97", "Software": "#3ddc97", "Networking": "#4cc2ff",
  "Networking & Self-hosting": "#4cc2ff", "Security & Privacy": "#f472b6",
  "Security": "#f472b6", "Programming & Web": "#facc15", "Development": "#facc15",
  "Tutorials": "#38bdf8",
};

function arg(name, fallback) {
  const i = process.argv.indexOf("--" + name);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const slug = process.argv[2];
if (!slug || slug.startsWith("--")) {
  console.error("usage: node tools/new-article.js <slug> --title \"…\" --category AI [--desc \"…\"] [--tags \"A,B,C\"]");
  process.exit(1);
}
if (!SLUG_RE.test(slug)) {
  console.error(`slug "${slug}" must be lowercase words joined by single hyphens (e.g. my-new-guide)`);
  process.exit(1);
}
const title = arg("title", null);
if (!title) { console.error("--title is required"); process.exit(1); }
const category = arg("category", "AI");
if (!CAT_URL[category]) {
  console.error(`unknown category "${category}". Valid: ${Object.keys(CAT_URL).join(" | ")}`);
  process.exit(1);
}
const desc = arg("desc", "TODO: one-sentence description used for meta, feed, search and OG image.");
const tags = (arg("tags", "") || "").split(",").map((t) => t.trim()).filter(Boolean);

const file = slug + ".html";
const hiFile = slug + ".hi.html";
const taFile = slug + ".ta.html";
for (const f of [file, hiFile, taFile]) {
  if (fs.existsSync(path.join(ROOT, f))) { console.error(`${f} already exists – refusing to overwrite`); process.exit(1); }
}

const V = JSON.parse(fs.readFileSync(path.join(__dirname, "versions.json"), "utf8"));
const today = new Date().toISOString().slice(0, 10);
const pretty = new Date().toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#0b0f14" />
  <meta name="description" content="${desc.replace(/"/g, "&quot;")}" />
  <title>${title} | VelsTech</title>
  <link rel="canonical" href="https://velstech.net/${file}" />
  <link rel="alternate" type="application/atom+xml" title="VelsTech (Atom feed)" href="https://velstech.net/feed.xml" />
  <link rel="manifest" href="manifest.json" />
  <link rel="preload" href="fonts/InterVariable.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="icon" href="favicon.ico" sizes="48x48" />
  <link rel="icon" type="image/png" sizes="32x32" href="favicon-32x32.png" />
  <link rel="icon" type="image/png" sizes="16x16" href="favicon-16x16.png" />
  <link rel="icon" type="image/svg+xml" href="logo.svg" />
  <link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png" />
  <link rel="stylesheet" href="styles.css?v=${V["styles.css"]}" />
  <script defer src="articles.js?v=${V["articles.js"]}"></script>
  <script defer src="i18n.js?v=${V["i18n.js"]}"></script>
  <script defer src="whatsnew-core.js?v=${V["whatsnew-core.js"]}"></script>
  <script defer src="script.js?v=${V["script.js"]}"></script>
</head>
<body>
  <main class="article-page" data-article>
    <p class="breadcrumb"><a href="index.html">Home</a> / <a href="${CAT_URL[category]}">${category}</a></p>
    <h1 class="title">${title}</h1>
    <div class="meta">
      <span class="tag cat-pill" style="color:${CAT_COLORS[category]};background:${CAT_COLORS[category]}26">${category}</span>
${tags.map((t) => `      <span class="tag">${t}</span>\n`).join("")}      <span>${pretty}</span>
      <span>· 4 min read</span>
      <span>· Updated ${pretty}</span>
          <span class="ai-badge" title="This article was created with the assistance of artificial intelligence.">🤖 AI-assisted</span>
    </div>

    <div class="article-body">
      <p>TODO: intro paragraph.</p>

      <h2>Section one</h2>
      <p>TODO.</p>
    </div>

    <div class="article-nav">
      <a href="${CAT_URL[category]}">← Back to ${category}</a>
      <a href="tutorials.html">All tutorials</a>
    </div>
  </main>

</body>
</html>
`;

fs.writeFileSync(path.join(ROOT, file), html);

const artPath = path.join(ROOT, "articles.js");
let art = fs.readFileSync(artPath, "utf8");
const entry = `  {
    title: ${JSON.stringify(title)},
    url: ${JSON.stringify(file)},
    date: ${JSON.stringify(today)},
    updated: ${JSON.stringify(today)},
    category: ${JSON.stringify(category)},
    tags: ${JSON.stringify(tags.length ? tags : [category])},
    description: ${JSON.stringify(desc)},
  },
`;
art = art.replace("const ARTICLES = [\n", "const ARTICLES = [\n" + entry);
fs.writeFileSync(artPath, art);

console.log(`created ${file} + articles.js entry (${today}, ${category})`);
console.log(`
next steps:
  1. write the article body in ${file}
  2. translate -> ${hiFile} and ${taFile}
     (keep <html lang>, self-canonical, code/pre blocks verbatim,
      acronyms in English; see README "Internationalization")
  3. if it is a Lab/benchmark piece: add an entry to benchmarks/data.json
     (tested:true + source_article: "${file}")
  4. node tools/sync-all.js     # seo + feed + search + og + benchmarks + versions
  5. node tools/check-article-sync.js && git add -A && git commit && git push
     (CI runs the same guard – an EN-only article will fail the build)`);
