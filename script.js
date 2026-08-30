const root = document.documentElement;

/* Amazon Associates tracking ID – ONE place to change it site-wide.
   Every <a data-amazon="search query"> is rewritten to an Amazon.in
   keyword link carrying this tag. */
const AMAZON_TAG = "velstechoffl-21";

/* Software / cloud / hosting affiliate referral URLs.
   Each key matches a <a data-aff="key" href="..."> link on the site.
   Add the referral URL you get from each program's signup; until then
   the plain homepage href is used. Edit these values – not the HTML.
   Order: cash-per-sale programs first (priority), then credit-based. */
const AFFILIATE_LINKS = {
  /* Cash-per-sale / recurring commissions (priority) */
  hostinger: "",   // hosting · 40%+ per sale, grows with volume – https://affiliates.hostinger.com
  nordvpn: "",     // VPN · 40–100% per sale + 30% recurring renewals – nordvpn.com/affiliate (also unlocks NordPass/NordLocker)
  kit: "",         // email/newsletter · 50% of first 12 months + 10–20% recurring – https://kit.com/affiliates
  brevo: "",       // email/CRM · affiliate program, reward per referred signup – brevo.com/partners
  /* Credit-based referral programs (secondary) */
  bitwarden: "",   // credit-based referral
  proton: "",      // credit-based referral
  tailscale: "",   // credit-based referral
  digitalocean: "",// credit-based referral ($25 credit per refer)
  runpod: "",      // credit-based referral
  vastai: "",      // credit-based referral
  hetzner: "",     // no public program confirmed – remove data-aff if none
  namecheap: "",   // check current program – remove data-aff if none
  copilot: "",     // no public program confirmed – remove data-aff if none
};

function affiliateHref(key) {
  const url = AFFILIATE_LINKS[key];
  return url || null;
}

/* Google AdSense – client ID is live (Auto Ads). Setting ADSENSE_SLOT additionally
   inserts a manual responsive unit before .article-nav; leave empty to let Google
   auto-place ads. Ads only serve after AdSense approval. */
const ADSENSE_CLIENT = "ca-pub-5002392377660300";
const ADSENSE_SLOT = "";

/* Cloudflare Web Analytics – enabled via Automatic Setup in the Cloudflare
   dashboard (Analytics → Web Analytics → Add a site → select the zone → Automatic
   Setup). Because velstech.net is proxied through Cloudflare, the beacon is
   injected at the edge – no code or token needed here. */
/* Social profiles – shown in the footer and added to the Organization schema.
   Leave any key empty to hide it. Reach audience where it already is. */
const SOCIAL_LINKS = {
  github: "https://github.com/velsrocky",
  youtube: "",
  x: "",
  reddit: "",
  mastodon: "",
  linkedin: "",
};

function initAdsense() {
  if (!ADSENSE_CLIENT) return;
  if (!document.querySelector('script[src*="adsbygoogle.js"]')) {
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + ADSENSE_CLIENT;
    s.crossOrigin = "anonymous";
    document.head.appendChild(s);
  }

  if (!ADSENSE_SLOT) return; // Auto Ads mode – Google decides placement

  const slot = document.createElement("ins");
  slot.className = "adsbygoogle";
  slot.style.display = "block";
  slot.style.margin = "24px 0";
  slot.setAttribute("data-ad-client", ADSENSE_CLIENT);
  slot.setAttribute("data-ad-slot", ADSENSE_SLOT);
  slot.setAttribute("data-ad-format", "auto");
  slot.setAttribute("data-full-width-responsive", "true");

  const main = document.querySelector("main");
  if (!main) return;
  const nav = main.querySelector(".article-nav");
  if (nav) main.insertBefore(slot, nav);
  else main.appendChild(slot);
  (adsbygoogle = window.adsbygoogle || []).push({});
}

function initAmazonLinks() {
  document.querySelectorAll("a[data-amazon]").forEach((a) => {
    const query = a.getAttribute("data-amazon").trim();
    if (!query) return;
    a.href =
      "https://www.amazon.in/s?k=" + encodeURIComponent(query) +
      "&tag=" + encodeURIComponent(AMAZON_TAG) + "&linkCode=ll1&language=en_IN";
    a.target = "_blank";
    const rel = a.getAttribute("rel") ? a.getAttribute("rel").split(/\s+/) : [];
    ["sponsored", "nofollow", "noopener"].forEach((r) => { if (!rel.includes(r)) rel.push(r); });
    a.setAttribute("rel", rel.join(" "));
  });

  document.querySelectorAll("a[data-aff]").forEach((a) => {
    const url = affiliateHref(a.getAttribute("data-aff"));
    if (!url) return;
    a.href = url;
    a.target = "_blank";
    a.setAttribute("rel", "sponsored nofollow noopener");
  });
}


const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtDate = (iso) => {
  const [y, m, d] = iso.split("-");
  return `${MONTHS[+m - 1]} ${+d}, ${y}`;
};
const esc = (s) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const TOPICS = [
  { href: "ai.html", label: "AI", page: "ai.html" },
  { href: "hardware.html", label: "Hardware", page: "hardware.html" },
  { href: "os.html", label: "Software", page: "os.html" },
  { href: "networking.html", label: "Networking", page: "networking.html" },
  { href: "security.html", label: "Security", page: "security.html" },
  { href: "programming.html", label: "Development", page: "programming.html" },
];

const currentPage = location.pathname.split("/").pop() || "index.html";

const brandSVG =
  '<svg class="brand-mark" viewBox="0 0 64 64" width="34" height="34" role="img" aria-label="VelsTech logo">' +
  '<rect x="2" y="2" width="60" height="60" rx="14" fill="var(--bg-soft)" stroke="var(--border)" stroke-width="1.5"/>' +
  '<path d="M20 20 L32 44 L44 20" fill="none" stroke="var(--accent)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>' +
  '<circle cx="20" cy="18" r="3.2" fill="var(--accent)"/>' +
  '<circle cx="44" cy="18" r="3.2" fill="var(--accent)"/>' +
  '<circle cx="32" cy="47" r="3.2" fill="var(--accent)" opacity="0.6"/>' +
  "</svg>";

const themeIcon = (dark) =>
  dark
    ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
    : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';

const paintIcon =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7 7 3-3-7-7"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>';

const paletteColors = [
  { accent: "blue", color: "#4cc2ff" },
  { accent: "green", color: "#3ddc97" },
  { accent: "purple", color: "#a78bfa" },
  { accent: "orange", color: "#fb923c" },
  { accent: "pink", color: "#f472b6" },
];

function navHTML() {
  const inTopic = TOPICS.some((t) => t.page === currentPage);
  const topicLinks = TOPICS.map(
    (t) => `<a class="dropdown-link${t.page === currentPage ? " active" : ""}" href="${t.href}">${t.label}</a>`
  ).join("");

  const dots = paletteColors
    .map((c) => `<button class="dot" data-accent="${c.accent}" style="--c: ${c.color}" aria-label="${c.accent}"></button>`)
    .join("");

  return (
    '<header class="nav">' +
    '<a class="brand" href="index.html">' + brandSVG + '<span class="brand-name">VelsTech<span class="brand-sub">Solutions</span></span></a>' +
    '<div class="search-wrap">' +
    '<input id="search-input" class="search-input" type="search" placeholder="Search articles…" aria-label="Search articles" autocomplete="off" />' +
    '<div id="search-results" class="search-results" hidden></div>' +
    "</div>" +
    '<nav class="links">' +
    '<a class="nav-link' + (currentPage === "index.html" ? " active" : "") + '" href="index.html">Home</a>' +
    '<div class="nav-dropdown" id="topics-dropdown">' +
    '<button type="button" class="nav-link dropdown-toggle' + (inTopic ? " active" : "") + '" id="topics-toggle" aria-haspopup="true" aria-expanded="false">Topics <span class="dropdown-caret">▾</span></button>' +
    '<div class="dropdown-menu" id="topics-menu">' + topicLinks + "</div>" +
    "</div>" +
    '<a class="nav-link' + (currentPage === "lab.html" ? " active" : "") + '" href="lab.html">Lab</a>' +
    '<a class="nav-link' + (currentPage === "benchmarks/index.html" || location.pathname.includes("/benchmarks/") ? " active" : "") + '" href="benchmarks/index.html">Benchmarks</a>' +
    '<a class="nav-link' + (currentPage === "tools.html" ? " active" : "") + '" href="tools.html">Tools</a>' +
    '<a class="nav-link' + (currentPage === "tags.html" ? " active" : "") + '" href="tags.html">Tags</a>' +
    '<a class="nav-link' + (currentPage === "buying-guides.html" ? " active" : "") + '" href="buying-guides.html">Guides</a>' +
    "</nav>" +
    '<div class="controls">' +
    '<button class="icon-btn" id="theme-toggle" aria-label="Toggle theme" title="Toggle theme"></button>' +
    '<div class="palette-wrap">' +
    '<button class="icon-btn" id="palette-btn" aria-label="Accent color" title="Accent color" aria-expanded="false">' + paintIcon + "</button>" +
    '<div class="palette" id="palette" hidden>' + dots + "</div>" +
    "</div></div></header>"
  );
}

function initNavDropdown() {
  const dd = document.getElementById("topics-dropdown");
  const toggle = document.getElementById("topics-toggle");
  if (!dd || !toggle) return;
  const open = (o) => {
    dd.classList.toggle("open", o);
    toggle.setAttribute("aria-expanded", String(o));
  };
  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    open(!dd.classList.contains("open"));
  });
  document.addEventListener("click", (e) => {
    if (!dd.contains(e.target)) open(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") open(false);
  });
}

function initSearch() {
  const input = document.getElementById("search-input");
  const results = document.getElementById("search-results");
  if (!input || !results) return;

  const render = () => {
    const q = input.value.trim().toLowerCase();
    if (!q) {
      results.hidden = true;
      return;
    }
    const hits = ARTICLES.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
    ).slice(0, 8);

    if (!hits.length) {
      results.innerHTML = '<div class="search-empty">No results for "' + esc(q) + '"</div>';
      results.hidden = false;
      return;
    }
    results.innerHTML = hits
      .map(
        (a) =>
          '<a class="search-result" href="' + a.url + '">' +
          '<span class="search-title">' + esc(a.title) + "</span>" +
          '<span class="search-meta">' + esc(a.category) + " · " + fmtDate(a.date) + "</span>" +
          "</a>"
      )
      .join("");
    results.hidden = false;
  };

  input.addEventListener("input", render);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      input.value = "";
      results.hidden = true;
    }
  });
  document.addEventListener("click", (e) => {
    if (!results.contains(e.target) && e.target !== input) results.hidden = true;
  });
  results.addEventListener("click", () => {
    input.value = "";
    results.hidden = true;
  });
}

function initWhatsNew() {
  const list = document.getElementById("latest-list");
  if (!list) return;
  const filters = document.getElementById("latest-filters");
  const filterBtns = filters ? filters.querySelectorAll(".tag-btn") : [];

  function matchesFilter(a, filter) {
    if (filter === "All") return true;
    if (filter === "AI") return a.category.includes("AI");
    if (filter === "Hardware") return a.category === "Hardware";
    if (filter === "Software") return ["Operating Systems", "Programming & Web", "Tutorials"].includes(a.category);
    if (filter === "Lab") return a.tags.includes("VelsTech Lab") || a.tags.includes("Benchmark");
    return true;
  }

  function render(filter) {
    const f = filter || "All";
    const filtered = ARTICLES.filter((a) => matchesFilter(a, f));
    const sorted = [...filtered].sort((a, b) => {
      const d = b.updated.localeCompare(a.updated);
      if (d !== 0) return d;
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return 0;
    }).slice(0, 5);
    if (!sorted.length) {
      list.innerHTML = '<p class="tool-note">No articles in this filter yet – try All.</p>';
      return;
    }
    list.innerHTML = sorted.map((a) =>
      '<a class="latest-item' + (a.featured ? " featured" : "") + '" href="' + a.url + '">' +
      '<span class="latest-title">' + esc(a.title) + (a.featured ? '<span class="latest-badge">Featured</span>' : "") + "</span>" +
      '<span class="latest-meta">' + esc(a.category) + " · " + fmtDate(a.updated) + "</span>" +
      "</a>"
    ).join("");
    if (filters) {
      filterBtns.forEach((b) => {
        const active = b.dataset.filter === f;
        b.classList.toggle("active", active);
        b.setAttribute("aria-selected", String(active));
      });
    }
  }

  if (filters) {
    filters.addEventListener("click", (e) => {
      const btn = e.target.closest(".tag-btn");
      if (!btn) return;
      render(btn.dataset.filter);
    });
  }
  render("All");
}

function initArticleMeta() {
  const cur = ARTICLES.find((a) => location.pathname.endsWith(a.url));
  if (!cur) return;
  const meta = document.querySelector(".meta");
  if (!meta) return;

  const ai = document.createElement("span");
  ai.className = "ai-badge";
  ai.textContent = "🤖 AI-assisted";
  ai.title = "This article was created with the assistance of artificial intelligence.";
  meta.appendChild(ai);

  meta.querySelectorAll(".tag").forEach((t) => {
    const link = document.createElement("a");
    link.className = "tag";
    link.href = "tags.html#" + encodeURIComponent(t.textContent);
    link.textContent = t.textContent;
    t.replaceWith(link);
  });

  if (cur.updated !== cur.date) {
    const span = document.createElement("span");
    span.textContent = "· Updated " + fmtDate(cur.updated);
    meta.appendChild(span);
  }

  renderRelated(cur);
}

function renderRelated(cur) {
  const scored = ARTICLES
    .filter((a) => a.url !== cur.url)
    .map((a) => {
      let score = a.category === cur.category ? 1 : 0;
      a.tags.forEach((t) => { if (cur.tags.includes(t)) score += 2; });
      return { ...a, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (!scored.length) return;

  const main = document.querySelector(".article-page");
  if (!main) return;

  const section = document.createElement("section");
  section.className = "related-section";
  section.innerHTML =
    '<h2 class="related-heading">Related articles</h2>' +
    '<div class="related-list">' +
    scored
      .map(
        (a) =>
          '<a class="related-item" href="' + a.url + '">' +
          '<span class="related-title">' + esc(a.title) + "</span>" +
          '<span class="related-meta">' + esc(a.category) + " · " + fmtDate(a.date) + "</span>" +
          "</a>"
      )
      .join("") +
    "</div>";

  const nav = main.querySelector(".article-nav");
  if (nav) main.insertBefore(section, nav);
  else main.appendChild(section);
}

/* Share buttons – injected on article pages. Uses the Web Share API where
   available and falls back to X / WhatsApp / LinkedIn / copy-link. */
const shareIcon = (path) =>
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + path + "</svg>";

const SHARE_NETWORKS = {
  x: {
    label: "Share on X",
    svg: '<path d="M4 4l16 16M20 4L4 20"/>',
    href: (u, t) => "https://twitter.com/intent/tweet?url=" + encodeURIComponent(u) + "&text=" + encodeURIComponent(t),
  },
  whatsapp: {
    label: "Share on WhatsApp",
    svg: '<path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.5L3 21l2-5.6A8.5 8.5 0 1 1 21 11.5z"/><path d="M9.5 10a.5.5 0 0 0 .8.7 2.5 2.5 0 0 0 3 3 .5.5 0 0 0 .7-.8"/>',
    href: (u, t) => "https://wa.me/?text=" + encodeURIComponent(t + " " + u),
  },
  linkedin: {
    label: "Share on LinkedIn",
    svg: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4V8h4v1.5A5.98 5.98 0 0 1 16 8z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>',
    href: (u) => "https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(u),
  },
  mail: {
    label: "Share via email",
    svg: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
    href: (u, t) => "mailto:?subject=" + encodeURIComponent(t) + "&body=" + encodeURIComponent(u),
  },
};

function initShareBar() {
  const cur = ARTICLES.find((a) => location.pathname.endsWith(a.url));
  if (!cur) return;
  const main = document.querySelector(".article-page");
  if (!main) return;

  const url = location.origin + location.pathname;
  const title = cur.title;

  const nets = Object.keys(SHARE_NETWORKS)
    .map((k) => {
      const n = SHARE_NETWORKS[k];
      return '<a class="share-btn" href="' + n.href(url, title) + '" target="_blank" rel="noopener nofollow" aria-label="' + n.label + '" title="' + n.label + '">' + shareIcon(n.svg) + "</a>";
    })
    .join("");

  const bar = document.createElement("div");
  bar.className = "share-bar";
  bar.innerHTML =
    '<span class="share-label">Share</span>' + nets +
    '<button type="button" class="share-btn share-copy" aria-label="Copy link" title="Copy link">' +
    shareIcon('<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>') +
    "</button>";

  if (navigator.share) {
    const native = bar.querySelector("a");
    if (native) {
      native.style.display = "inline-flex";
      native.setAttribute("href", "javascript:void(0)");
      native.addEventListener("click", (e) => {
        e.preventDefault();
        navigator.share({ title: title, url: url });
      });
    }
  }

  bar.querySelector(".share-copy").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(url);
      const btn = bar.querySelector(".share-copy");
      btn.classList.add("copied");
      btn.title = "Copied!";
      setTimeout(() => { btn.classList.remove("copied"); btn.title = "Copy link"; }, 2000);
    } catch { /* clipboard unavailable */ }
  });

  const meta = main.querySelector(".meta");
  if (meta) meta.parentNode.insertBefore(bar, meta.nextSibling);
  else main.insertBefore(bar, main.firstChild);
}

/* Author box – small E-E-A-T signal. Shown on article pages only. */
function initAuthorBox() {
  const cur = ARTICLES.find((a) => location.pathname.endsWith(a.url));
  if (!cur) return;
  const main = document.querySelector(".article-page");
  if (!main) return;

  const box = document.createElement("div");
  box.className = "author-box";
  box.innerHTML =
    '<div class="author-avatar">VT</div>' +
    '<div class="author-info">' +
    '<span class="author-name">VelsTech</span>' +
    '<p>Technology explained for everyone – practical guides, free tools and real experiments. Written by a developer who tests it on real hardware first.</p>' +
    '<a class="author-link" href="lab.html">Visit the Lab →</a>' +
    "</div>";
  main.appendChild(box);
}

/* FAQ section – renders the article's FAQ visibly on the page (matches the
   FAQPage JSON-LD injected by gen-seo.js). */
function initFaq() {
  const cur = ARTICLES.find((a) => location.pathname.endsWith(a.url));
  if (!cur || !cur.faq || !cur.faq.length) return;
  const main = document.querySelector(".article-page");
  if (!main) return;

  const details = cur.faq
    .map(
      (f, i) =>
        '<details class="faq-item"' + (i === 0 ? ' open' : "") + ">" +
        "<summary>" + esc(f.q) + "</summary>" +
        "<p>" + esc(f.a) + "</p>" +
        "</details>"
    )
    .join("");

  const section = document.createElement("section");
  section.className = "faq-section";
  section.innerHTML =
    '<h2 class="faq-heading">Frequently asked questions</h2>' +
    details;

  const nav = main.querySelector(".article-nav");
  if (nav) main.insertBefore(section, nav);
  else main.appendChild(section);
}

const rssIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/></svg>';

const socialHTML = () => {
  const entries = Object.entries(SOCIAL_LINKS).filter(([, v]) => v);
  if (!entries.length) return "";
  const icons = {
    github: '<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>',
    x: '<path d="M4 4l16 16M20 4L4 20"/>',
    youtube: '<path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.94 2C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/>',
    reddit: '<circle cx="12" cy="12" r="10"/><path d="M8 14a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm8 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm-4 2a2 2 0 0 0-2 2h4a2 2 0 0 0-2-2z"/><path d="M12 7c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/><path d="M12 4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8z" fill="none"/>',
    mastodon: '<path d="M21.59 10.95c-.15-1.26-.83-2.33-1.56-3.1-.73-.76-2.25-1.4-5.18-1.58l-.12-1.44c-.05-.6-.35-1.1-.8-1.42-.46-.32-1.07-.47-1.7-.42-.96.08-1.73.8-1.8 1.76l-.12 1.44c-2.93.18-4.45.82-5.18 1.57-.73.78-1.41 1.85-1.56 3.1-.3 2.5-.3 5.5.3 8.5.3 1.5 1.5 2.8 2.8 3.3 1.5.5 3.1.8 4.9.8s3.4-.3 4.9-.8c1.3-.5 2.5-1.8 2.8-3.3.6-3 .6-6 .3-8.5z"/><path d="M12.5 8.5v4.5"/><path d="M12.5 10.5c-1.5 0-2.5-1-2.5-2"/>',
    linkedin: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4V8h4v1.5A5.98 5.98 0 0 1 16 8z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>',
  };
  return '<nav class="footer-links social-links" aria-label="Social profiles">' +
    entries.map(([k, v]) => '<a href="' + v + '" target="_blank" rel="noopener" aria-label="' + k + '">' + shareIcon(icons[k] || "") + " " + k + "</a>").join("") +
    "</nav>";
};

const footerHTML =
  '<footer class="footer">' +
  '<nav class="footer-links">' +
  '<a href="feed.xml" title="Subscribe to the Atom feed">' + rssIcon + ' Subscribe</a>' +
  '<a href="resources.html">Resources</a>' +
  '<a href="advertise.html">Advertise</a>' +
  '<a href="disclosure.html">Affiliate Disclosure</a>' +
  '<a href="terms.html">Terms</a>' +
  '<a href="privacy.html">Privacy</a>' +
  '<a href="mailto:hello@velstech.net">Contact</a>' +
  "</nav>" +
  "<nav class=\"footer-links\" style=\"margin-top:10px; opacity:0.9\">" +
  '<a href="networking.html">Networking</a>' +
  '<a href="security.html">Security</a>' +
  '<a href="programming.html">Development</a>' +
  '<a href="tutorials.html">Tutorials</a>' +
  "</nav>" +
  socialHTML() +
  '<p class="footer-note">Content on this site is generated with the assistance of AI and is for informational purposes only.</p>' +
  '<p>&copy; <span id="year"></span> VelsTech. All rights reserved.</p>' +
  "</footer>";

function injectChat() {
  if (document.getElementById("vt-chat-link")) return;
  const link = document.createElement("link");
  link.id = "vt-chat-link";
  link.rel = "stylesheet";
  link.href = "chat.css?v=6";
  document.head.appendChild(link);

  if (document.getElementById("vt-chat-script")) return;
  const s = document.createElement("script");
  s.id = "vt-chat-script";
  s.src = "chat.js?v=12";
  s.onerror = () => console.error("[VelsTech] Failed to load chat widget");
  document.head.appendChild(s);
}

document.body.insertAdjacentHTML("afterbegin", navHTML());
document.body.insertAdjacentHTML("beforeend", footerHTML);
injectChat();

const feedLink = document.createElement("link");
feedLink.rel = "alternate";
feedLink.type = "application/atom+xml";
feedLink.title = "VelsTech – Atom feed";
feedLink.href = "feed.xml";
document.head.appendChild(feedLink);

function initContactForm() {
  const form = document.querySelector(".contact-form");
  if (!form) return;
  const status = document.getElementById("contact-status");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = form.querySelector("button[type='submit']");
    btn.disabled = true;
    btn.textContent = "Sending…";
    status.hidden = true;

    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        form.reset();
        status.textContent = "Thanks! Your message has been sent.";
        status.style.color = "var(--accent)";
      } else {
        status.textContent = "Something went wrong. Please email hello@velstech.net instead.";
        status.style.color = "var(--text)";
      }
    } catch (err) {
      console.error("Contact form error:", err);
      status.textContent = "Couldn't reach the form service. Please email hello@velstech.net instead.";
      status.style.color = "var(--text)";
    }
    status.hidden = false;
    btn.disabled = false;
    btn.textContent = "Send message";
  });
}

function initNewsletter() {
  const form = document.getElementById("newsletter-form");
  if (!form) return;
  const status = document.getElementById("newsletter-status");
  const email = document.getElementById("newsletter-email");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = form.querySelector("button[type='submit']");
    btn.disabled = true;
    btn.textContent = "Subscribing…";
    status.hidden = true;

    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        form.reset();
        status.textContent = "You're in! Watch your inbox for the next issue.";
        status.style.color = "var(--accent)";
      } else {
        status.textContent = "Couldn't subscribe right now. Please email hello@velstech.net instead.";
        status.style.color = "var(--text)";
      }
    } catch (err) {
      console.error("Newsletter error:", err);
      status.textContent = "Couldn't reach the form service. Please email hello@velstech.net instead.";
      status.style.color = "var(--text)";
    }
    status.hidden = false;
    btn.disabled = false;
    btn.textContent = "Subscribe";
  });
}

function initTagsPage() {
  const cloud = document.getElementById("tag-cloud");
  const results = document.getElementById("tag-results");
  if (!cloud || !results) return;

  const counts = {};
  ARTICLES.forEach((a) => a.tags.forEach((t) => (counts[t] = (counts[t] || 0) + 1)));
  const tags = Object.keys(counts).sort();

  cloud.innerHTML = tags
    .map(
      (t) =>
        '<button class="tag-btn" data-tag="' + esc(t) + '">' +
        esc(t) + ' <span class="tag-count">' + counts[t] + "</span></button>"
    )
    .join("");

  const select = (tag) => {
    document.querySelectorAll(".tag-btn").forEach((b) => b.classList.toggle("active", b.dataset.tag === tag));
    if (!tag) {
      results.innerHTML = "";
      return;
    }
    const hits = ARTICLES.filter((a) => a.tags.includes(tag));
    results.innerHTML =
      '<h2 class="tag-results-heading">"' + esc(tag) + '" – ' + hits.length + " article" + (hits.length === 1 ? "" : "s") + "</h2>" +
      hits
        .map(
          (a) =>
            '<a class="latest-item" href="' + a.url + '">' +
            '<span class="latest-title">' + esc(a.title) + "</span>" +
            '<span class="latest-meta">' + esc(a.category) + " · " + fmtDate(a.date) + "</span>" +
            "</a>"
        )
        .join("");
  };

  cloud.addEventListener("click", (e) => {
    const btn = e.target.closest(".tag-btn");
    if (btn) select(btn.dataset.tag);
  });

  const hash = location.hash.replace("#", "");
  if (hash && counts[hash]) select(hash);
}

function initCopyButtons() {
  document.querySelectorAll(".article-body pre").forEach((pre) => {
    const wrap = document.createElement("div");
    wrap.className = "code-block";
    pre.parentNode.insertBefore(wrap, pre);
    wrap.appendChild(pre);

    const btn = document.createElement("button");
    btn.className = "copy-btn";
    btn.type = "button";
    btn.textContent = "Copy";
    btn.setAttribute("aria-label", "Copy code");
    btn.title = "Copy code to clipboard";
    wrap.appendChild(btn);

    btn.addEventListener("click", async () => {
      const text = pre.innerText;
      try {
        await navigator.clipboard.writeText(text);
        btn.textContent = "Copied!";
        btn.classList.add("copied");
      } catch {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        btn.textContent = "Copied!";
        btn.classList.add("copied");
      }
      setTimeout(() => {
        btn.textContent = "Copy";
        btn.classList.remove("copied");
      }, 2000);
    });
  });
}

const CAT_COLORS = {
  "AI & ML": "#a78bfa",
  "AI": "#a78bfa",
  "Hardware": "#fb923c",
  "Operating Systems": "#3ddc97",
  "Linux": "#3ddc97",
  "Software": "#3ddc97",
  "Networking": "#4cc2ff",
  "Networking & Self-hosting": "#4cc2ff",
  "Security & Privacy": "#f472b6",
  "Security": "#f472b6",
  "Programming & Web": "#facc15",
  "Development": "#facc15",
  "Tutorials": "#38bdf8",
};

const CAT_URL = {
  "AI & ML": "ai.html",
  "AI": "ai.html",
  "Hardware": "hardware.html",
  "Operating Systems": "os.html",
  "Linux": "os.html",
  "Software": "os.html",
  "Networking": "networking.html",
  "Networking & Self-hosting": "networking.html",
  "Security & Privacy": "security.html",
  "Security": "security.html",
  "Programming & Web": "programming.html",
  "Development": "programming.html",
  "Tutorials": "tutorials.html",
};

/* Reading order for the "Continue reading" flow – mirrors the order each
   category page is curated in. Lab-tagged posts use the Lab series. */
const SERIES = {
  "AI": [
    "better-prompts.html",
    "what-is-an-llm.html",
    "what-is-machine-learning.html",
    "local-vs-cloud-ai.html",
    "qwen3-8-flash-next.html",
    "glm-5-3.html",
  ],
  "Hardware": [
    "first-pc-build.html",
    "cpu-vs-gpu.html",
    "ssd-vs-hdd.html",
    "new-mac-desktops.html",
  ],
  "Operating Systems": [
    "omarchy.html",
    "linux-beginners.html",
    "terminal-commands.html",
    "windows-vs-linux.html",
  ],
  "Networking": [
    "how-internet-works.html",
    "setup-domain.html",
    "self-hosting-101.html",
  ],
  "Security & Privacy": [
    "security-habits.html",
    "password-managers.html",
    "spotting-phishing.html",
  ],
  "Programming & Web": [
    "learn-to-code.html",
    "html-css-js.html",
    "git-beginners.html",
  ],
  "VelsTech Lab": [
    "moe-vs-dense-rx6800m-16k-vs-262k.html",
    "ornith-35b-moe-262k-rocm-vs-vulkan.html",
    "qwen-27b-ridge-rocm-vs-vulkan.html",
    "how-much-vram-for-llm.html",
    "best-gpu-for-local-llm.html",
    "best-gpu-ai-under-50000.html",
    "xiaomi-ai-cube.html",
  ],
};

function initProgressBar() {
  const bar = document.createElement("div");
  bar.className = "progress-bar";
  document.body.appendChild(bar);
  let ticking = false;
  const update = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const pct = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
    bar.style.transform = "scaleX(" + Math.min(1, Math.max(0, pct)) + ")";
    ticking = false;
  };
  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
  update();
}

function initReveal() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const containers = [".cat-grid", ".article-grid", "#latest-list", ".related-list", ".tag-results"];
  document.querySelectorAll(containers.join(",")).forEach((container) => {
    Array.from(container.children).forEach((child, i) => {
      child.classList.add("reveal");
      if (reduce) {
        child.classList.add("in");
      } else {
        child.style.transitionDelay = (i * 60) + "ms";
      }
    });
  });
  if (reduce) return;
  if (!("IntersectionObserver" in window)) {
    document.querySelectorAll(".reveal").forEach((e) => e.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
  document.querySelectorAll(".reveal").forEach((e) => io.observe(e));
}

function initCategoryColors() {
  const hrefCat = {};
  Object.keys(CAT_URL).forEach((c) => (hrefCat[CAT_URL[c]] = c));

  document.querySelectorAll(".cat-card").forEach((card) => {
    const cat = hrefCat[card.getAttribute("href")];
    if (cat && CAT_COLORS[cat]) card.style.setProperty("--cat-color", CAT_COLORS[cat]);
  });

  document.querySelectorAll(".latest-meta, .related-meta, .search-meta").forEach((el) => {
    const cat = el.textContent.split(" · ")[0].trim();
    if (CAT_COLORS[cat]) el.style.color = CAT_COLORS[cat];
  });
}

function addCategoryPill() {
  const cur = ARTICLES.find((a) => location.pathname.endsWith(a.url));
  if (!cur || !cur.category) return;
  const meta = document.querySelector(".meta");
  if (!meta) return;
  const color = CAT_COLORS[cur.category];
  if (!color) return;
  const pill = document.createElement("a");
  pill.className = "tag cat-pill";
  pill.href = CAT_URL[cur.category] || "#";
  pill.style.color = color;
  pill.style.background = color + "26";
  pill.style.borderColor = "transparent";
  pill.textContent = cur.category;
  meta.insertBefore(pill, meta.firstChild);
}

/* "Continue reading" flow – next/previous article in the same series. */
function initArticleFlow() {
  const cur = ARTICLES.find((a) => location.pathname.endsWith(a.url));
  if (!cur) return;
  const nav = document.querySelector(".article-nav");
  if (!nav) return;

  const list = (cur.tags && cur.tags.includes("VelsTech Lab") && SERIES["VelsTech Lab"])
    ? SERIES["VelsTech Lab"]
    : SERIES[cur.category] || null;

  let prev, next;
  if (list) {
    const idx = list.indexOf(cur.url);
    if (idx >= 0) {
      prev = idx > 0 ? ARTICLES.find((a) => a.url === list[idx - 1]) : null;
      next = idx < list.length - 1 ? ARTICLES.find((a) => a.url === list[idx + 1]) : null;
    }
  }
  if (!prev && !next) return;

  const flow = document.createElement("div");
  flow.className = "article-flow";
  flow.innerHTML =
    '<p class="flow-heading">Continue reading</p>' +
    '<div class="flow-row">' +
    (prev
      ? '<a class="flow-link flow-prev" href="' + prev.url + '"><span class="flow-label">← Previous</span><span class="flow-title">' + esc(prev.title) + '</span></a>'
      : "") +
    (next
      ? '<a class="flow-link flow-next" href="' + next.url + '"><span class="flow-label">Next →</span><span class="flow-title">' + esc(next.title) + '</span></a>'
      : "") +
    "</div>";
  nav.parentNode.insertBefore(flow, nav);
}

function initBackToTop() {
  const btn = document.createElement("button");
  btn.className = "back-to-top";
  btn.type = "button";
  btn.setAttribute("aria-label", "Back to top");
  btn.title = "Back to top";
  btn.textContent = "↑";
  document.body.appendChild(btn);

  const toggle = () => btn.classList.toggle("visible", window.scrollY > 600);
  window.addEventListener("scroll", toggle, { passive: true });
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  toggle();
}

function initHotTopic() {
  const container = document.getElementById("hot-topic-list");
  if (!container) return;

  const featured = ARTICLES.filter((a) => a.featured)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  const article = featured || ARTICLES[0];
  if (!article) return;

  const color = CAT_COLORS[article.category];
  const style = color ? ' style="--cat-color: ' + color + '"' : "";
  const meta = article.category + " · " + fmtDate(article.date);

  container.innerHTML =
    '<a class="hot-topic-card"' + style + ' href="' + article.url + '">' +
      '<span class="hot-cat">' + esc(article.category) + "</span>" +
      '<h3>' + esc(article.title) + "</h3>" +
      '<p>' + esc(article.description) + "</p>" +
      '<span class="hot-topic-cta">Read article</span>' +
      '<div class="hot-topic-meta">' + esc(meta) + "</div>" +
    "</a>";
}

initSearch();
initNavDropdown();
initWhatsNew();
initArticleMeta();
initContactForm();
initNewsletter();
initTagsPage();
initCopyButtons();
addCategoryPill();
initArticleFlow();
initBackToTop();
initProgressBar();
initReveal();
initCategoryColors();
initHotTopic();
initAmazonLinks();
initAdsense();
initShareBar();
initAuthorBox();
initFaq();

/* Theme + palette */
const themeToggle = document.getElementById("theme-toggle");
const paletteBtn = document.getElementById("palette-btn");
const palette = document.getElementById("palette");

function applyTheme(theme) {
  root.setAttribute("data-theme", theme);
  themeToggle.innerHTML = themeIcon(theme === "dark");
}

function applyAccent(accent) {
  root.setAttribute("data-accent", accent);
  document.querySelectorAll(".dot").forEach((dot) => {
    dot.classList.toggle("active", dot.dataset.accent === accent);
  });
}

const savedTheme = localStorage.getItem("vt-theme") || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
const savedAccent = localStorage.getItem("vt-accent") || "blue";
applyTheme(savedTheme);
applyAccent(savedAccent);

window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", (e) => {
  if (!localStorage.getItem("vt-theme")) {
    applyTheme(e.matches ? "light" : "dark");
  }
});

themeToggle.addEventListener("click", () => {
  const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  localStorage.setItem("vt-theme", next);
  applyTheme(next);
});

paletteBtn.addEventListener("click", () => {
  const open = palette.hidden;
  palette.hidden = !open;
  paletteBtn.setAttribute("aria-expanded", String(open));
});

document.querySelectorAll(".dot").forEach((dot) => {
  dot.addEventListener("click", () => {
    const accent = dot.dataset.accent;
    localStorage.setItem("vt-accent", accent);
    applyAccent(accent);
    palette.hidden = true;
    paletteBtn.setAttribute("aria-expanded", "false");
  });
});

document.addEventListener("click", (e) => {
  if (!palette.hidden && !palette.contains(e.target) && !paletteBtn.contains(e.target)) {
    palette.hidden = true;
    paletteBtn.setAttribute("aria-expanded", "false");
  }
});

document.getElementById("year").textContent = new Date().getFullYear();
