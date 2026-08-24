const fs = require("fs");
const path = require("path");
const ARTICLES = require("../articles.js");

const SITE = "https://velstech.net";
const esc = (s) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const files = fs.readdirSync(path.join(__dirname, "..")).filter((f) => f.endsWith(".html"));

const STATIC_META = {
  "index.html": {
    title: "VelsTech | Modern Tech Solutions",
    desc: "VelsTech — modern tech notes on AI, hardware, OS, networking, security, and programming.",
  },
  "terms.html": { title: "Terms of Use | VelsTech", desc: "Terms of use and disclaimer for VelsTech." },
  "privacy.html": { title: "Privacy Policy | VelsTech", desc: "Privacy policy for VelsTech." },
};

const CATEGORY_META = {
  "ai.html": { title: "AI & ML | VelsTech", desc: "AI and machine learning notes — LLMs, tools, prompting, and trends." },
  "hardware.html": { title: "Hardware | VelsTech", desc: "Hardware notes — PC builds, components, GPUs, and performance." },
  "os.html": { title: "Operating Systems | VelsTech", desc: "Operating system notes — Linux, Windows, and macOS guides." },
  "networking.html": { title: "Networking | VelsTech", desc: "Networking notes — DNS, routers, self-hosting, and how the internet works." },
  "security.html": { title: "Security & Privacy | VelsTech", desc: "Security and privacy basics — passwords, backups, and safe habits." },
  "programming.html": { title: "Programming & Web | VelsTech", desc: "Programming and web development — learning to code and building websites." },
};

function getMeta(file) {
  if (STATIC_META[file]) return STATIC_META[file];
  if (CATEGORY_META[file]) return CATEGORY_META[file];
  const art = ARTICLES.find((a) => a.url === file);
  if (art) return { title: `${art.title} | VelsTech`, desc: art.description };
  return null;
}

let injected = 0;
for (const file of files) {
  const meta = getMeta(file);
  if (!meta) continue;
  const fp = path.join(__dirname, "..", file);
  let html = fs.readFileSync(fp, "utf8");

  const ogUrl = file === "index.html" ? `${SITE}/` : `${SITE}/${file}`;
  const og = `
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="VelsTech" />
  <meta property="og:url" content="${ogUrl}" />
  <meta property="og:title" content="${esc(meta.title)}" />
  <meta property="og:description" content="${esc(meta.desc)}" />
  <meta property="og:image" content="${SITE}/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(meta.title)}" />
  <meta name="twitter:description" content="${esc(meta.desc)}" />
  <meta name="twitter:image" content="${SITE}/og-image.png" />`;

  if (!html.includes('property="og:title"')) {
    html = html.replace('<link rel="icon"', og.trim() + '\n  <link rel="icon"');
    fs.writeFileSync(fp, html);
    injected++;
  } else if (file === "index.html") {
    html = html.replace(/<meta property="og:url" content="[^"]*" \/>/, `  <meta property="og:url" content="${ogUrl}" />`);
    fs.writeFileSync(fp, html);
  }
}

const urls = [];
for (const file of files) {
  if (!getMeta(file)) continue;
  const priority = file === "index.html" ? "1.0" : file === "terms.html" || file === "privacy.html" ? "0.3" : "0.8";
  urls.push(`  <url>\n    <loc>${SITE}/${file}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>${priority}</priority>\n  </url>`);
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;
fs.writeFileSync(path.join(__dirname, "..", "sitemap.xml"), sitemap);

const robots = `User-agent: *
Allow: /

Sitemap: ${SITE}/sitemap.xml
`;
fs.writeFileSync(path.join(__dirname, "..", "robots.txt"), robots);

console.log(`Meta injected into ${injected} pages`);
console.log(`sitemap.xml: ${urls.length} URLs`);
console.log("robots.txt written");
