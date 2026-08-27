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

const sorted = [...ARTICLES].sort((a, b) => b.date.localeCompare(a.date));
const now = new Date().toISOString();

let xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>VelsTech</title>
  <subtitle>Technology explained for everyone – plain-language guides, free tools and real experiments, from choosing a first PC to understanding AI.</subtitle>
  <id>${SITE}/</id>
  <link rel="alternate" href="${SITE}/" />
  <link rel="self" href="${SITE}/feed.xml" />
  <updated>${now}</updated>
  <author><name>VelsTech</name></author>
`;

for (const a of sorted) {
  xml += `
  <entry>
    <title>${esc(a.title)}</title>
    <link rel="alternate" href="${SITE}/${a.url}" />
    <id>${SITE}/${a.url}</id>
    <published>${a.date}T00:00:00Z</published>
    <updated>${a.updated}T00:00:00Z</updated>
    <category term="${esc(a.category)}" />
    <summary>${esc(a.description)}</summary>
  </entry>`;
}

xml += `\n</feed>\n`;

fs.writeFileSync(path.join(__dirname, "../feed.xml"), xml);
console.log("feed.xml generated with", sorted.length, "entries");
