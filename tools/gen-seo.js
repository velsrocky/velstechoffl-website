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

/* Google Search Console verification – paste the token from Search Console
   (Settings → Ownership verification → HTML tag) here, then re-run gen-seo.js.
   Leave empty to skip. */
const GSC_VERIFICATION = "";

/* Social profile URLs – added to the Organization schema (sameAs) on the
   homepage. Leave any empty to skip it. Keep in sync with script.js SOCIAL_LINKS. */
const GITHUB_URL = "https://github.com/velsrocky";
const YOUTUBE_URL = "";
const X_URL = "";
const REDDIT_URL = "";
const MASTODON_URL = "";
const LINKEDIN_URL = "";

const files = fs.readdirSync(path.join(__dirname, "..")).filter((f) => f.endsWith(".html"));

const STATIC_META = {
  "index.html": {
    title: "VelsTech Solutions",
    desc: "Technology explained for everyone – plain-language guides, free tools and real experiments: choosing a first PC, staying safe online, understanding AI, and more.",
  },
  "lab.html": { title: "VelsTech Lab – Benchmarks & Experiments | VelsTech", desc: "VelsTech Lab – benchmarks, experiments and tools tested on real hardware. Status, hardware specs, methodology and raw results – including failures." },
  "terms.html": { title: "Terms of Use | VelsTech", desc: "Terms of use and disclaimer for VelsTech." },
  "privacy.html": { title: "Privacy Policy | VelsTech", desc: "Privacy policy for VelsTech." },
  "tags.html": { title: "Tags | VelsTech", desc: "Browse all VelsTech articles by tag – Linux, AI, security, and more." },
  "disclosure.html": { title: "Affiliate Disclosure | VelsTech", desc: "How affiliate links on VelsTech work – when we earn a commission and why it never costs you anything extra." },
  "resources.html": { title: "Recommended Tools | VelsTech", desc: "VelsTech's recommended tools – the AI apps, developer tools, cloud services, hosting, and security software we actually use." },
  "advertise.html": { title: "Advertise | VelsTech", desc: "Advertise on VelsTech – sponsored tutorials, product reviews, newsletter sponsorships, and display advertising for AI, hardware, Linux, and developer tools." },
  "linux-cheat-sheet.html": { title: "Linux Command Cheat Sheet (Free) | VelsTech", desc: "Every Linux command you need – files, permissions, processes, networking, and package management. Free printable cheat sheet." },
  "benchmarks/index.html": { title: "LLM & GPU Benchmark Database | VelsTech Lab", desc: "Real tokens/sec for LLMs on real GPUs – filter by GPU, model, quantization, context, and backend. RX 6800M, RTX 4090, RX 7900 XTX and more." },
  "buying-guides.html": { title: "What Should I Buy? – Tech Buying Guides | VelsTech", desc: "Decision-focused tech buying guides – best laptop under ₹50,000, best GPU for local AI, best mini PC for Linux, best SSD for developers, and more. Tested or research-backed picks." },
  "start-here.html": { title: "Start Here – choose your learning path | VelsTech", desc: "New to VelsTech? Pick an interest – AI, PCs, Linux, or Programming – and follow a step-by-step learning path built from our plain-language guides." },
  "best-laptop-under-50000.html": { title: "Best laptop under ₹50,000 in India (2026) | VelsTech", desc: "Best laptops under ₹50,000 in India (2026) – what to look for, what to skip, and which specs matter most at this price. Ryzen 5, 16 GB RAM, and more." },
  "best-mini-pc-for-linux.html": { title: "Best mini PC for Linux (2026) | VelsTech", desc: "Best mini PCs for Linux in 2026 – quiet, low-power, always-on machines for self-hosting, local AI, and daily use." },
  "best-ssd-for-developers.html": { title: "Best SSD for developers (2026) | VelsTech", desc: "Best SSDs for developers and everyday users in 2026 – NVMe vs SATA, what specs matter, how much capacity, and which drives are worth the money." },
};

const TOOLS_META = {
  "tools.html": { title: "Tools | VelsTech", desc: "Free practical tools – an LLM VRAM calculator, a GPU AI performance calculator, and a PC power supply calculator." },
  "llm-vram-calculator.html": { title: "LLM VRAM Calculator | VelsTech", desc: "Estimate how much GPU memory an LLM needs – model weights plus KV cache at your quantization and context length – and see if it fits your GPU." },
  "gpu-ai-calculator.html": { title: "GPU AI Performance Calculator | VelsTech", desc: "Estimate tokens/sec, prompt processing speed, and time to first token for running an LLM on a specific GPU." },
  "psu-calculator.html": { title: "PC Power Supply Calculator | VelsTech", desc: "Estimate your build's peak power draw and get a recommended PSU wattage with headroom." },
  "cidr-calculator.html": { title: "CIDR / Subnet Calculator | VelsTech", desc: "Enter an IPv4 address and prefix to get the network address, usable host range, broadcast address, subnet mask, and wildcard mask." },
  "chmod-calculator.html": { title: "chmod Calculator | VelsTech", desc: "Toggle read/write/execute permissions for owner, group, and others and get the numeric mode (like 755) and the chmod command to run." },
  "cron-generator.html": { title: "Cron Generator | VelsTech", desc: "Pick a schedule in plain English and get the cron expression plus next run times. No more memorizing cron syntax." },
  "csv-json-converter.html": { title: "CSV ↔ JSON Converter | VelsTech", desc: "Paste CSV and get clean JSON, or paste a JSON array and get CSV back. No server uploads – runs in your browser." },
  "docker-compose-generator.html": { title: "Docker Compose Generator | VelsTech", desc: "Generate a copy-paste ready docker-compose.yml – pick an image, ports, volumes, environment variables, and restart policy." },
  "ffmpeg-command-generator.html": { title: "FFmpeg Command Generator | VelsTech", desc: "Build a correct ffmpeg command for converting, compressing, and trimming media – container, codec, quality, scale, and audio settings." },
  "json-formatter.html": { title: "JSON Formatter & Validator | VelsTech", desc: "Format, minify, validate, and check the size of JSON with syntax highlighting. Runs entirely in your browser." },
  "regex-tester.html": { title: "Regex Tester | VelsTech", desc: "Test regular expressions live – paste a pattern and test string to see every match, capture group, and position highlighted inline." },
  "jwt-decoder.html": { title: "JWT Decoder | VelsTech", desc: "Decode and inspect a JSON Web Token – header, payload, claims like exp/iat/iss, and signature. All data stays in your browser." },
  "base64-encoder-decoder.html": { title: "Base64 Encoder / Decoder | VelsTech", desc: "Convert text to and from base64 with proper UTF-8 support. Runs entirely in your browser." },
  "timestamp-converter.html": { title: "Unix Timestamp Converter | VelsTech", desc: "Convert between Unix timestamps (seconds or milliseconds) and human-readable dates with relative time. Copy the current timestamp instantly." },
  "color-converter.html": { title: "Color Converter (HEX / RGB / HSL) | VelsTech", desc: "Convert colors between HEX, RGB, and HSL with a live swatch and copy-ready CSS values. Runs entirely in your browser." },
  "text-diff-checker.html": { title: "Text Diff Checker | VelsTech", desc: "Compare two versions of text with added and removed lines highlighted. A simple line-based diff, no server involved." },
  "url-encoder-decoder.html": { title: "URL Encoder / Decoder | VelsTech", desc: "Percent-encode and decode URL components with UTF-8 support. Runs entirely in your browser." },
  "gguf-size-calculator.html": { title: "GGUF Size Calculator | VelsTech", desc: "Estimate how much disk space a quantized model will take at Q2 through Q8 before you download it." },
  "context-length-calculator.html": { title: "Context Length & Memory Calculator | VelsTech", desc: "Estimate VRAM usage for different context window sizes and KV cache quantizations on your GPU." },
  "password-strength-checker.html": { title: "Password Strength Checker | VelsTech", desc: "Check a password's strength, estimated entropy, and crack time. Runs entirely in your browser." },
  "ai-api-cost-calculator.html": { title: "AI API Cost Calculator | VelsTech", desc: "Compare per-token pricing across OpenAI, Anthropic, Google, and local inference costs. Estimate the break-even point for running your own hardware." },
  "random-secret-generator.html": { title: "Random Secret Generator | VelsTech", desc: "Create secure random secrets for API keys, salts, or session tokens with a chosen length and character set. Runs entirely in your browser." },
  "csv-json-converter.html": { title: "CSV to JSON Converter | VelsTech", desc: "Paste CSV and get clean JSON, or paste a JSON array and get CSV back. Runs entirely in your browser." },
  "hash-generator.html": { title: "Hash Generator (MD5 / SHA-1 / SHA-256 / SHA-512) | VelsTech", desc: "Compute MD5, SHA-1, SHA-256, and SHA-512 hashes of any text instantly. Runs entirely in your browser." },
  "cron-generator.html": { title: "Cron Generator | VelsTech", desc: "Pick a schedule in plain English and get the cron expression plus next run times. No more memorizing cron syntax." },
  "password-generator.html": { title: "Password Generator | VelsTech", desc: "Generate strong random passwords with adjustable length and character sets. Runs entirely in your browser." },
  "text-case-converter.html": { title: "Text Case Converter | VelsTech", desc: "Convert text to uppercase, lowercase, title case, sentence case, or camelCase instantly. Runs entirely in your browser." },
  "uuid-generator.html": { title: "UUID Generator | VelsTech", desc: "Generate UUID v4 and v7 identifiers instantly. Copy ready-to-use UUIDs for your database, API, or code. Runs in your browser." },
  "playground.html": { title: "LLM Playground – Chat with AI models | VelsTech", desc: "Full LLM Playground – chat with multiple models, adjust temperature, top-p, max tokens, system prompt, and share conversations. Powered by VelsTech's AI proxy." },
  "benchmark-explorer.html": { title: "LLM Benchmark Explorer | VelsTech", desc: "Browse and compare LLM benchmarks across GPUs, models, and backends – filter by hardware, sort by tok/s, and see real tested results." },
  "model-comparison.html": { title: "Model Comparison Wizard | VelsTech", desc: "Compare LLM models, quantizations, and GPUs side-by-side – VRAM requirements, expected tok/s, and whether your hardware can run it." },
  "vram-budget-planner.html": { title: "VRAM Budget Planner | VelsTech", desc: "Visual VRAM budget planner – pick a GPU, model, and context length to see a bar chart of weights, KV cache, overhead, and whether it fits." },
  "prompt-library.html": { title: "Prompt Library & Editor | VelsTech", desc: "Browse prompt templates, fill in variables, test them against an AI model, and save your own prompts. Copy anywhere or chat directly." },
  "notes.html": { title: "Markdown Notes | VelsTech", desc: "Private Markdown notes that stay in your browser – no account, no server. Write, preview, search, and copy your notes." },
  "bookmarks.html": { title: "Bookmarks & Reading List | VelsTech", desc: "Save, tag, and search your reading list right in the browser – no account needed. Import URLs, export JSON, mark things done." },
  "config-generator.html": { title: "Config Generator Studio | VelsTech", desc: "Generate Docker Compose, systemd service units, and llama-server commands with a live YAML preview – copy and paste to use." },
  "pdf-to-image/index.html": { title: "PDF to Image Converter — Private, Fast, No Upload | VelsTech", desc: "Convert PDF pages to PNG, JPEG, or WebP right in your browser. 100% client-side, private, no upload, up to 100MB, custom DPI and page ranges." },
  "rag-ask.html": { title: "RAG: Ask Your File | VelsTech", desc: "Upload a text file and ask questions about it. The content is chunked, scored, and sent to an AI model with the relevant context." },
  "rss-aggregator.html": { title: "RSS Aggregator | VelsTech", desc: "Read your favorite RSS and Atom feeds in one place. Add any feed URL, browse the latest posts, and manage your reading list." },
};

const CATEGORY_META = {
  "ai.html": { title: "AI | VelsTech", desc: "AI and machine learning notes – LLMs, tools, prompting, and trends." },
  "hardware.html": { title: "Hardware | VelsTech", desc: "Hardware notes – PC builds, components, GPUs, and performance." },
  "os.html": { title: "Operating Systems | VelsTech", desc: "Operating system notes – Linux, Windows, and macOS guides." },
  "networking.html": { title: "Networking | VelsTech", desc: "Networking notes – DNS, routers, self-hosting, and how the internet works." },
  "security.html": { title: "Security & Privacy | VelsTech", desc: "Security and privacy basics – passwords, backups, and safe habits." },
  "programming.html": { title: "Programming & Web | VelsTech", desc: "Programming and web development – learning to code and building websites." },
  "tutorials.html": { title: "Tutorials | VelsTech", desc: "Step-by-step tutorials and practical guides – build, set up, and learn with clear instructions." },
};

function getMeta(file) {
  if (STATIC_META[file]) return STATIC_META[file];
  if (TOOLS_META[file]) return TOOLS_META[file];
  if (CATEGORY_META[file]) return CATEGORY_META[file];
  const art = ARTICLES.find((a) => a.url === file);
  if (art) return { title: `${art.title} | VelsTech`, desc: art.description };
  return null;
}

function pageUrl(file) {
  return file === "index.html" ? `${SITE}/` : `${SITE}/${file}`;
}

function jsonLd(file, meta) {
  const url = pageUrl(file);
  const art = ARTICLES.find((a) => a.url === file);
  const blocks = [];

  if (file === "index.html") {
    const org = {
      "@type": "Organization",
      "@id": `${SITE}/#organization`,
      name: "VelsTech",
      url: `${SITE}/`,
      logo: { "@type": "ImageObject", url: `${SITE}/logo.svg` },
    };
    const socials = [GITHUB_URL, YOUTUBE_URL, X_URL, REDDIT_URL, MASTODON_URL, LINKEDIN_URL].filter(Boolean);
    if (socials.length) org.sameAs = socials;
    blocks.push({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          "@id": `${SITE}/#website`,
          url: `${SITE}/`,
          name: "VelsTech",
          description: meta.desc,
          inLanguage: "en",
          publisher: { "@id": `${SITE}/#organization` },
          potentialAction: {
            "@type": "SearchAction",
            target: { "@type": "EntryPoint", urlTemplate: `${SITE}/?q={search_term_string}` },
            "query-input": "required name=search_term_string",
          },
        },
        org,
      ],
    });
  } else if (art) {
    blocks.push({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "@id": `${url}#article`,
      headline: art.title,
      description: art.description,
      url,
      datePublished: `${art.date}T00:00:00Z`,
      dateModified: `${art.updated}T00:00:00Z`,
      inLanguage: "en",
      image: `${SITE}/og/${art.url.replace(/\.html$/, "")}.png`,
      author: { "@type": "Person", name: "VelsTech", url: `${SITE}/` },
      publisher: {
        "@type": "Organization",
        name: "VelsTech",
        url: `${SITE}/`,
        logo: { "@type": "ImageObject", url: `${SITE}/logo.svg` },
      },
      mainEntityOfPage: url,
    });
    if (art.faq && art.faq.length) {
      blocks.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: art.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      });
    }
  } else if (CATEGORY_META[file]) {
    blocks.push({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": `${url}#webpage`,
      url,
      name: meta.title,
      description: meta.desc,
      inLanguage: "en",
    });
  } else if (TOOLS_META[file]) {
    blocks.push({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "@id": `${url}#webapp`,
      name: meta.title,
      description: meta.desc,
      url,
      inLanguage: "en",
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Web",
    });
  } else {
    blocks.push({
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: meta.title,
      description: meta.desc,
      inLanguage: "en",
    });
  }

  return blocks
    .map((s) => `  <script type="application/ld+json">\n${JSON.stringify(s, null, 2)}\n  </script>`)
    .join("\n");
}

let injected = 0;
if (require.main === module) {
for (const file of files) {
  const meta = getMeta(file);
  if (!meta) continue;
  const fp = path.join(__dirname, "..", file);
  let html = fs.readFileSync(fp, "utf8");

  const url = pageUrl(file);
  const art = ARTICLES.find((a) => a.url === file);
  const ogImage = art ? `${SITE}/og/${art.url.replace(/\.html$/, "")}.png` : `${SITE}/og-image.png`;
  const og = `
  <meta property="og:type" content="${art ? "article" : "website"}" />
  <meta property="og:site_name" content="VelsTech" />
  <meta property="og:url" content="${url}" />
  <meta property="og:title" content="${esc(meta.title)}" />
  <meta property="og:description" content="${esc(meta.desc)}" />
  <meta property="og:image" content="${ogImage}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(meta.title)}" />
  <meta name="twitter:description" content="${esc(meta.desc)}" />
  <meta name="twitter:image" content="${ogImage}" />`;

  const canonical = `  <link rel="canonical" href="${url}" />`;
  const ld = jsonLd(file, meta);
  const gsc = GSC_VERIFICATION
    ? `  <meta name="google-site-verification" content="${esc(GSC_VERIFICATION)}" />`
    : "";

  const seoBlock = [canonical, gsc, ld.trim(), og.trim()].filter(Boolean).join("\n  ");

  if (!html.includes('rel="canonical"')) {
    html = html.replace('<link rel="icon"', seoBlock + '\n  <link rel="icon"');
    injected++;
  } else {
    // Canonical already present – refresh idempotently (no reordering).
    if (GSC_VERIFICATION && !html.includes("google-site-verification")) {
      html = html.replace('<link rel="canonical"', '<link rel="canonical"\n' + gsc);
    }
    if (file === "index.html") {
      html = html.replace(/(\s*)<meta property="og:description" content="[^"]*" \/>/, `$1<meta property="og:description" content="${esc(meta.desc)}" />`);
      html = html.replace(/(\s*)<meta name="twitter:description" content="[^"]*" \/>/, `$1<meta name="twitter:description" content="${esc(meta.desc)}" />`);
    }
    if (art) {
      // Point og:image / twitter:image at the per-article OG image.
      html = html.replace(/(\s*)<meta property="og:image" content="[^"]*" \/>/, `$1<meta property="og:image" content="${ogImage}" />`);
      html = html.replace(/(\s*)<meta name="twitter:image" content="[^"]*" \/>/, `$1<meta name="twitter:image" content="${ogImage}" />`);
    }
    if (file === "index.html" || art) {
      // Refresh JSON-LD in place: drop any existing ld+json blocks (including
      // leading indentation), then re-insert the regenerated block(s) right
      // after the canonical link so output stays byte-stable on re-runs.
      html = html.replace(/^[ \t]*<script type="application\/ld\+json">[\s\S]*?<\/script>\n?/gm, "");
      const newLd = jsonLd(file, meta);
      html = html.replace(/(<link rel="canonical"[^>]*\/>)(\n)/, `$1\n${newLd}$2`);
    }
  }
  fs.writeFileSync(fp, html);
}

const urls = [];
for (const file of files) {
  if (file.endsWith(".hi.html") || file.endsWith(".ta.html")) continue; // handled below
  if (!getMeta(file)) continue;
  const loc = file === "index.html" ? `${SITE}/` : `${SITE}/${file}`;
  const priority = file === "index.html" ? "1.0" : file === "terms.html" || file === "privacy.html" ? "0.3" : TOOLS_META[file] ? "0.9" : "0.8";
  urls.push({ file, loc, priority });
}
// Add benchmark detail pages (generated by tools/gen-benchmarks.js)
const benchDir = path.join(__dirname, "..", "benchmarks");
if (fs.existsSync(benchDir)) {
  for (const f of fs.readdirSync(benchDir).filter((f) => f.endsWith(".html") && f !== "index.html")) {
    const loc = `${SITE}/benchmarks/${f}`;
    urls.push({ file: "benchmarks/" + f, loc, priority: "0.7" });
  }
}
// Add pdf-to-image app (Next.js static export)
if (fs.existsSync(path.join(__dirname, "..", "pdf-to-image", "index.html"))) {
  urls.push({ file: "pdf-to-image/index.html", loc: `${SITE}/pdf-to-image/index.html`, priority: "0.9" });
}
// Add translated article pages (HI + TA) to sitemap
for (const suffix of [".hi.html", ".ta.html"]) {
  for (const f of files.filter((f) => f.endsWith(suffix))) {
    const base = f.replace(suffix, ".html");
    // Only include if the base English page exists (skip orphans)
    if (!fs.existsSync(path.join(__dirname, "..", base))) continue;
    const loc = `${SITE}/${f}`;
    urls.push({ file: f, loc, priority: "0.8" });
  }
}
urls.sort((a, b) => { if (a.file === "index.html") return -1; if (b.file === "index.html") return 1; return a.file.localeCompare(b.file); });

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.map((u) => {
  const isHi = u.file.endsWith(".hi.html");
  const isTa = u.file.endsWith(".ta.html");
  const enFile = isHi ? u.file.replace(".hi.html", ".html") : isTa ? u.file.replace(".ta.html", ".html") : u.file;
  const enLoc = SITE + (enFile === "index.html" ? "/" : "/" + enFile);
  const hiLoc = SITE + "/" + enFile.replace(/\.html$/, ".hi.html");
  const taLoc = SITE + "/" + enFile.replace(/\.html$/, ".ta.html");
  let alternates = "";
  if (isHi || isTa) {
    // Translated page: point to EN primary + its own language
    const ownLang = isHi ? "hi" : "ta";
    const ownLoc = isHi ? hiLoc : taLoc;
    alternates = `\n    <xhtml:link rel="alternate" hreflang="en" href="${enLoc}" />\n    <xhtml:link rel="alternate" hreflang="${ownLang}" href="${ownLoc}" />\n    <xhtml:link rel="alternate" hreflang="x-default" href="${enLoc}" />`;
  } else {
    // EN page: add alternate links for every translation that exists
    const hiExists = fs.existsSync(path.join(__dirname, "..", enFile.replace(/\.html$/, ".hi.html")));
    const taExists = fs.existsSync(path.join(__dirname, "..", enFile.replace(/\.html$/, ".ta.html")));
    alternates = `\n    <xhtml:link rel="alternate" hreflang="en" href="${enLoc}" />`;
    if (hiExists) alternates += `\n    <xhtml:link rel="alternate" hreflang="hi" href="${hiLoc}" />`;
    if (taExists) alternates += `\n    <xhtml:link rel="alternate" hreflang="ta" href="${taLoc}" />`;
    if (hiExists || taExists) alternates += `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${enLoc}" />`;
  }
  return `  <url>\n    <loc>${u.loc}</loc>${alternates}\n    <changefreq>monthly</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`;
}).join("\n")}
</urlset>
`;
fs.writeFileSync(path.join(__dirname, "..", "sitemap.xml"), sitemap);

const robots = `User-agent: *
Allow: /

Sitemap: ${SITE}/sitemap.xml
`;
fs.writeFileSync(path.join(__dirname, "..", "robots.txt"), robots);

console.log(`Canonical + JSON-LD injected into ${injected} pages`);
console.log(`sitemap.xml: ${urls.length} URLs`);
console.log("robots.txt written");
}

module.exports = { SITE, STATIC_META, TOOLS_META, CATEGORY_META, getMeta, pageUrl };
