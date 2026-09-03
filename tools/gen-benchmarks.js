#!/usr/bin/env node
/* Generate per-benchmark detail pages from benchmarks/data.json.
 * Run:  node tools/gen-benchmarks.js
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "benchmarks");
const SITE = "https://velstech.net";

const data = JSON.parse(fs.readFileSync(path.join(OUT, "data.json"), "utf8")).benchmarks;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* "ROCm (MTP)" -> "rocm-mtp" (matches sitemap + published URLs) */
const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function page(b, bk) {
  const slug = b.id + "-" + slugify(bk.name);
  const url = `${SITE}/benchmarks/${slug}.html`;
  const title = `${b.gpu} · ${b.model} · ${b.quant} · ${bk.name} · ${b.context}`;
  const desc = `Benchmark: ${b.gpu} (${b.gpu_vram}) running ${b.model} (${b.params}) at ${b.quant} / ${b.context} / ${b.kv_quant} on ${bk.name} – ${bk.decode} tok/s decode. ${b.tested ? "Tested in the VelsTech Lab." : "Estimated from the GPU AI Performance Calculator."}`;
  const tested = b.tested ? "🧪 Tested" : "📐 Estimated";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#0b0f14" />
  <meta name="description" content="${esc(desc)}" />
  <title>${esc(title)} | VelsTech Lab</title>
  <link rel="canonical" href="${url}" />
  <script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "TechArticle",
  "@id": "${url}#article",
  "headline": "${esc(title)}",
  "description": "${esc(desc)}",
  "url": "${url}",
  "inLanguage": "en",
  "author": { "@type": "Person", "name": "VelsTech", "url": "${SITE}/" },
  "publisher": { "@type": "Organization", "name": "VelsTech", "url": "${SITE}/", "logo": { "@type": "ImageObject", "url": "${SITE}/logo.svg" } },
  "mainEntityOfPage": "${url}",
  "image": "${SITE}/og-image.png"
}
  </script>
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="VelsTech" />
  <meta property="og:url" content="${url}" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta property="og:image" content="${SITE}/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(desc)}" />
  <meta name="twitter:image" content="${SITE}/og-image.png" />
  <link rel="icon" href="../favicon.ico" sizes="48x48" />
  <link rel="icon" type="image/png" sizes="32x32" href="../favicon-32x32.png" />
  <link rel="icon" type="image/png" sizes="16x16" href="../favicon-16x16.png" />
  <link rel="icon" type="image/svg+xml" href="../logo.svg" />
  <link rel="apple-touch-icon" sizes="180x180" href="../apple-touch-icon.png" />
  <link rel="stylesheet" href="../styles.css?v=42" />
</head>
<body>
  <main class="article-page">
    <p class="breadcrumb"><a href="../index.html">Home</a> / <a href="index.html">Benchmarks</a> / ${esc(b.gpu)} / ${esc(b.model)}</p>
    <h1 class="title">${esc(b.gpu)} · ${esc(b.model)}</h1>
    <div class="meta">
      <span>${esc(b.params)}</span>
      <span>· ${esc(b.quant)}</span>
      <span>· ${esc(b.context)}</span>
      <span>· ${esc(b.kv_quant)}</span>
      <span>· ${tested}</span>
    </div>

    <div class="article-body">
      <div class="calc">
        <div class="result-rows">
          <div class="result-row total"><span>Backend</span><strong>${esc(bk.name)}</strong></div>
          <div class="result-row total"><span>Decode</span><strong>${esc(bk.decode)} tok/s</strong></div>
          ${bk.prompt != null ? '<div class="result-row"><span>Prompt eval</span><strong>' + esc(bk.prompt) + ' tok/s</strong></div>' : ''}
          <div class="result-row"><span>VRAM</span><strong>${esc(b.gpu_vram)}</strong></div>
          <div class="result-row"><span>Memory bandwidth</span><strong>${esc(b.gpu_bw)}</strong></div>
          <div class="result-row"><span>Model</span><strong>${esc(b.model)}</strong></div>
          <div class="result-row"><span>Parameters</span><strong>${esc(b.params)}</strong></div>
          <div class="result-row"><span>Quantization</span><strong>${esc(b.quant)}</strong></div>
          <div class="result-row"><span>Context</span><strong>${esc(b.context)}</strong></div>
          <div class="result-row"><span>KV quant</span><strong>${esc(b.kv_quant)}</strong></div>
          <div class="result-row"><span>Offload</span><strong>${b.offload ? 'Partial (some layers in RAM)' : 'Fully on GPU'}</strong></div>
        </div>
      </div>

      <h2>About this result</h2>
      <p>${esc(b.notes)}</p>
      <p>
        ${b.tested
          ? 'This result was <strong>tested in the VelsTech Lab</strong> on real hardware. <a href="../' + b.source_article + '">Read the full Lab report →</a>'
          : 'This result is <strong>estimated</strong> from the <a href="../gpu-ai-calculator.html">GPU AI Performance Calculator</a> – expect variation on real hardware.'}
      </p>

      <h2>Related</h2>
      <ul>
        <li><a href="../best-gpu-for-local-llm.html">Best GPU for running LLMs locally</a></li>
        <li><a href="../llm-vram-calculator.html">LLM VRAM Calculator</a></li>
        <li><a href="../gpu-ai-calculator.html">GPU AI Performance Calculator</a></li>
        <li><a href="index.html">All benchmarks</a></li>
      </ul>
    </div>

    <div class="article-nav">
      <a href="index.html">← All benchmarks</a>
      <a href="../lab.html">VelsTech Lab</a>
    </div>
  </main>

  <script src="../articles.js?v=14"></script>
  <script src="../i18n.js?v=2"></script>
  <script src="../script.js?v=49"></script>
</body>
</html>`;
}

for (const b of data) {
  for (const bk of b.backends) {
    const slug = b.id + "-" + slugify(bk.name);
    fs.writeFileSync(path.join(OUT, slug + ".html"), page(b, bk));
    console.log("  " + slug + ".html");
  }
}
console.log("Done. " + data.reduce((n, b) => n + b.backends.length, 0) + " pages.");