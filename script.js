const root = document.documentElement;

// i18n helpers – uses i18n.js if loaded, otherwise falls back to English
function getLang() {
  try {
    if (window.VelsI18n && window.VelsI18n.getLang) return window.VelsI18n.getLang();
    const s = localStorage.getItem("vt-lang");
    if (s && ["en","ta","hi"].includes(s)) return s;
  } catch {}
  return "en";
}
function t(key) {
  try {
    if (window.VelsI18n && window.VelsI18n.t) return window.VelsI18n.t(key);
  } catch {}
  return key;
}
function getCurrentArticle() {
  const path = location.pathname.split("/").pop() || "index.html";
  const base = path.replace(/\.(hi|ta)\.html$/, ".html");
  return ARTICLES.find((a) => a.url === base) || ARTICLES.find((a) => location.pathname.endsWith(a.url)) || null;
}
function localizeUrl(url) {
  const lang = getLang();
  // Also infer from current pathname if localStorage not yet set
  const path = location.pathname.split("/").pop() || "";
  const inferred = path.endsWith(".hi.html") ? "hi" : path.endsWith(".ta.html") ? "ta" : lang;
  if (inferred === "hi") return url.replace(/\.html$/, ".hi.html");
  if (inferred === "ta") return url.replace(/\.html$/, ".ta.html");
  return url;
}
function setLang(lang) {
  if (window.VelsI18n && window.VelsI18n.setLang) {
    window.VelsI18n.setLang(lang); // dispatches vt-lang-change internally
  } else {
    try { localStorage.setItem("vt-lang", lang); document.documentElement.setAttribute("lang", lang); } catch {}
    try { window.dispatchEvent(new CustomEvent("vt-lang-change", { detail: lang })); } catch {}
  }

  const rawPath = location.pathname.split("/").pop() || "index.html";
  let path = rawPath.includes(".") ? rawPath : rawPath + ".html";
  const baseUrl = location.origin + location.pathname.replace(/[^/]+$/, "");

  // Resolve the English base filename of the current page.
  let base = path;
  if (/\.(hi|ta)\.html$/.test(base)) base = base.replace(/\.(hi|ta)\.html$/, ".html");

  // Target variant for the chosen language.
  const variants = {
    en: base,
    hi: base.replace(/\.html$/, ".hi.html"),
    ta: base.replace(/\.html$/, ".ta.html"),
  };
  const target = variants[lang] || base;

  // Already on the target variant -> just apply UI in place.
  if (target === path) {
    applyLang(lang);
    return;
  }

  // Apply the UI immediately so the toggle feels instant,
  // then swap the article body in place (no full reload) if the
  // translated variant exists; fall back to navigation on failure.
  applyLang(lang);

  const swapMain = (html, url) => {
    try {
      const doc = new DOMParser().parseFromString(html, "text/html");
      const newMain = doc.querySelector("main");
      const curMain = document.querySelector("main");
      if (!newMain || !curMain) return false;
      if (doc.title) document.title = doc.title;
      const newDesc = doc.querySelector('meta[name="description"]')?.content;
      if (newDesc) {
        const curDesc = document.querySelector('meta[name="description"]');
        if (curDesc) curDesc.content = newDesc;
      }
      curMain.innerHTML = newMain.innerHTML;
      try { history.pushState(null, "", url); } catch {}
      try { document.documentElement.setAttribute("lang", lang); } catch {}
      document.querySelectorAll(".article-flow, .pillar-card, .cta-stack, .caution-callout, .pre-caution-wrap").forEach((el) => el.remove());
      document.querySelectorAll(".code-block").forEach((el) => {
        const pre = el.querySelector("pre");
        if (pre) el.replaceWith(pre);
      });
      applyLang(lang);
      try { initArticleFlow(); } catch {}
      try { initPillar(); } catch {}
      try { initArticleCta(); } catch {}
      try { initCopyButtons(); } catch {}
      try { initCaution(); } catch {}
      try { initAmazonLinks(); } catch {}
      try { injectGlossary(); } catch {}
      window.scrollTo({ top: 0, behavior: "instant" });
      return true;
    } catch { return false; }
  };

  fetch(baseUrl + target)
    .then((r) => {
      if (r.ok) return r.text().then((html) => {
        if (!swapMain(html, baseUrl + target + location.search + location.hash))
          location.href = baseUrl + target + location.search + location.hash;
      });
      if (lang !== "en" && path !== base) {
        return fetch(baseUrl + base).then((r2) => {
          if (r2.ok) return r2.text().then((html) => {
            if (!swapMain(html, baseUrl + base + location.search + location.hash))
              location.href = baseUrl + base + location.search + location.hash;
          });
          location.href = baseUrl + base + location.search + location.hash;
        });
      }
      applyLang(lang);
    })
    .catch(() => applyLang(lang));
}

function applyLang(lang) {
  // Update html lang and selector state
  try { document.documentElement.setAttribute("lang", lang); } catch {}
  document.querySelectorAll(".lang-btn").forEach(b => b.classList.toggle("active", b.dataset.lang === lang));

  // Update all elements tagged with data-i18n (nav, footer, headings…)
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    const attr = el.getAttribute("data-i18n-attr");
    const val = t(key);
    if (attr) el.setAttribute(attr, val);
    else el.textContent = val;
  });

  // Buttons with title/aria-label (theme, accent)
  const themeBtn = document.getElementById("theme-toggle");
  if (themeBtn) { themeBtn.title = t("theme_toggle"); themeBtn.setAttribute("aria-label", t("theme_toggle")); }
  const paletteBtn = document.getElementById("palette-btn");
  if (paletteBtn) { paletteBtn.title = t("accent_toggle"); paletteBtn.setAttribute("aria-label", t("accent_toggle")); }

  // Re-render search results so the empty message / placeholders match.
  const input = document.getElementById("search-input");
  if (input) {
    input.placeholder = t("search_placeholder");
    if (input.value) input.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

// On load, if the user's stored language is ta/hi and this page is the English
// variant, bounce to the translated page so navigation between pages stays in
// the chosen language (internal links point at English .html files).
function redirectToLangVariant() {
  try {
    const lang = getLang();
    if (lang === "en") return;
    const path = location.pathname.split("/").pop() || "index.html";
    const baseUrl = location.origin + location.pathname.replace(/[^/]+$/, "");
    // Already on the correct variant -> nothing to do.
    if ((lang === "ta" && path.endsWith(".ta.html")) ||
        (lang === "hi" && path.endsWith(".hi.html"))) return;
    // Only redirect plain English pages.
    if (!path.endsWith(".html") || path.endsWith(".hi.html") || path.endsWith(".ta.html")) return;
    const suffix = lang === "ta" ? ".ta.html" : ".hi.html";
    const target = path.replace(/\.html$/, suffix);
    if (target === path) return;
    // HEAD-check so we never redirect to a non-existent variant.
    fetch(baseUrl + target, { method: "HEAD" })
      .then(r => { if (r.ok) location.replace(baseUrl + target + location.search + location.hash); })
      .catch(() => {});
  } catch {}
}

// Keep the chosen language across pages: if the stored lang is ta/hi and we
// landed on an English page, redirect to the translated variant right away.
redirectToLangVariant();

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

/* Analytics – provider-agnostic helper. Tries Zaraz (Cloudflare),
   gtag (GA4), plausible, then a no-op. The beacon for Web Analytics
   (Automatic Setup) is edge-injected; zaraz.track is its custom-event API.
   No error is thrown if no provider is present. */
function track(name, props) {
  try {
    if (window.zaraz && typeof window.zaraz.track === "function") window.zaraz.track(name, props);
    if (typeof window.gtag === "function") window.gtag("event", name, props);
    if (typeof window.plausible === "function") window.plausible(name, { props });
    window.dispatchEvent(new CustomEvent("vt:track", { detail: { name, props } }));
  } catch {}
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
    if (!a.dataset.trackWired) {
      a.dataset.trackWired = "1";
      a.addEventListener("click", () =>
        track("affiliate_click", { network: "amazon", query, page: location.pathname })
      );
    }
  });

  document.querySelectorAll("a[data-aff]").forEach((a) => {
    const key = a.getAttribute("data-aff");
    const url = affiliateHref(key);
    if (!url) return;
    a.href = url;
    a.target = "_blank";
    a.setAttribute("rel", "sponsored nofollow noopener");
    if (!a.dataset.trackWired) {
      a.dataset.trackWired = "1";
      a.addEventListener("click", () =>
        track("affiliate_click", { network: key, page: location.pathname })
      );
    }
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

  const curLang = getLang();
  const langSwitch =
    '<div class="lang-switch" role="group" aria-label="Language">' +
    '<button class="lang-btn' + (curLang==="en"?" active":"") + '" data-lang="en" aria-label="English">EN</button>' +
    '<button class="lang-btn' + (curLang==="ta"?" active":"") + '" data-lang="ta" aria-label="Tamil">TA</button>' +
    '<button class="lang-btn' + (curLang==="hi"?" active":"") + '" data-lang="hi" aria-label="Hindi">HI</button>' +
    "</div>";

  return (
    '<header class="nav">' +
    '<a class="brand" href="index.html">' + brandSVG + '<span class="brand-name">VelsTech<span class="brand-sub">Solutions</span></span></a>' +
    '<div class="search-wrap">' +
    '<input id="search-input" class="search-input" type="search" data-i18n="search_placeholder" data-i18n-attr="placeholder" placeholder="' + t("search_placeholder") + '" aria-label="Search articles" autocomplete="off" />' +
    '<div id="search-results" class="search-results" hidden></div>' +
    "</div>" +
    '<nav class="links">' +
    '<a class="nav-link' + (currentPage === "index.html" ? " active" : "") + '" href="index.html" data-i18n="nav_home">' + t("nav_home") + '</a>' +
    '<a class="nav-link' + (currentPage === "start-here.html" ? " active" : "") + '" href="start-here.html" data-i18n="nav_getstarted">' + t("nav_getstarted") + '</a>' +
    '<div class="nav-dropdown" id="topics-dropdown">' +
    '<button type="button" class="nav-link dropdown-toggle' + (inTopic ? " active" : "") + '" id="topics-toggle" aria-haspopup="true" aria-expanded="false"><span data-i18n="nav_topics">' + t("nav_topics") + '</span> <span class="dropdown-caret">▾</span></button>' +
    '<div class="dropdown-menu" id="topics-menu">' + topicLinks + "</div>" +
    "</div>" +
    '<a class="nav-link' + (currentPage === "lab.html" ? " active" : "") + '" href="lab.html" data-i18n="nav_lab">' + t("nav_lab") + '</a>' +
    '<a class="nav-link' + (currentPage === "benchmarks/index.html" || location.pathname.includes("/benchmarks/") ? " active" : "") + '" href="benchmarks/index.html" data-i18n="nav_benchmarks">' + t("nav_benchmarks") + '</a>' +
    '<a class="nav-link' + (currentPage === "tools.html" ? " active" : "") + '" href="tools.html" data-i18n="nav_tools">' + t("nav_tools") + '</a>' +
    '<a class="nav-link' + (currentPage === "buying-guides.html" ? " active" : "") + '" href="buying-guides.html" data-i18n="nav_guides">' + t("nav_guides") + '</a>' +
    "</nav>" +
    '<div class="controls">' +
    langSwitch +
    '<button class="icon-btn" id="theme-toggle" aria-label="' + t("theme_toggle") + '" title="' + t("theme_toggle") + '"></button>' +
    '<div class="palette-wrap">' +
    '<button class="icon-btn" id="palette-btn" aria-label="' + t("accent_toggle") + '" title="' + t("accent_toggle") + '" aria-expanded="false">' + paintIcon + "</button>" +
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

function initLangSwitch() {
  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const lang = btn.dataset.lang;
      if (lang && lang !== getLang()) setLang(lang);
    });
  });
  window.addEventListener("vt-lang-change", (e) => {
    document.querySelectorAll(".lang-btn").forEach(b => b.classList.toggle("active", b.dataset.lang === e.detail));
  });
}

function initSearch() {
  const input = document.getElementById("search-input");
  const results = document.getElementById("search-results");
  if (!input || !results) return;

  let SEARCH_INDEX = null;
  let activeIdx = -1;

  function loadIndex() {
    if (SEARCH_INDEX || window._vtSearchLoading) return window._vtSearchLoading;
    window._vtSearchLoading = fetch("/search-index.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (Array.isArray(j) && j.length) SEARCH_INDEX = j; })
      .catch(() => {})
      .finally(() => { window._vtSearchLoading = null; });
    return window._vtSearchLoading;
  }

  function editDist1(a, b) {
    if (a === b) return 0;
    const la = a.length, lb = b.length;
    if (Math.abs(la - lb) > 1) return 2;
    if (la === lb) {
      let first = -1;
      for (let k = 0; k < la; k++) if (a[k] !== b[k]) { first = k; break; }
      if (first === -1) return 0;
      if (a.slice(first + 1) === b.slice(first + 1)) return 1;
      if (first + 1 < la && a[first] === b[first + 1] && a[first + 1] === b[first] && a.slice(first + 2) === b.slice(first + 2)) return 1;
      return 2;
    }
    let i = 0, j = 0, edits = 0;
    while (i < la && j < lb) {
      if (a[i] === b[j]) { i++; j++; }
      else {
        if (edits) return 2;
        edits++;
        if (la > lb) i++;
        else j++;
      }
    }
    edits += (la - i) + (lb - j);
    return edits;
  }

  function scoreEntry(entry, qTokens) {
    const titleLower = entry.title.toLowerCase();
    const titleWords = titleLower.split(/\W+/).filter(Boolean);
    const descLower = (entry.desc || "").toLowerCase();
    const catLower = (entry.category || "").toLowerCase();
    const tagsLower = (entry.tags || []).map((t) => t.toLowerCase());
    let total = 0;
    for (const q of qTokens) {
      let best = 0;
      if (titleLower.includes(q)) best = Math.max(best, 10);
      else {
        for (const w of titleWords) {
          if (w.startsWith(q)) { best = Math.max(best, 9); break; }
          if (q.length >= 3 && w.length >= 3 && editDist1(q, w) === 1) { best = Math.max(best, 6); break; }
        }
      }
      for (const t of tagsLower) {
        if (t === q) best = Math.max(best, 8);
        else if (t.includes(q)) best = Math.max(best, 7);
        else if (t.split(/\W+/).some((w) => w.startsWith(q))) best = Math.max(best, 6);
        else if (q.length >= 3 && t.split(/\W+/).some((w) => w.length >= 3 && editDist1(q, w) === 1)) best = Math.max(best, 4);
        if (best >= 8) break;
      }
      if (catLower.includes(q)) best = Math.max(best, 4);
      if (!best && descLower.includes(q)) best = Math.max(best, 3);
      if (!best && q.length >= 3) {
        const dw = descLower.split(/\W+/);
        for (const w of dw) { if (w.length >= 3 && editDist1(q, w) === 1) { best = Math.max(best, 1); break; } }
      }
      total += best;
    }
    return total;
  }

  function getSource() {
    return SEARCH_INDEX || ARTICLES.map((a) => ({
      title: a.title, url: a.url, desc: a.description || "",
      category: a.category || "", tags: a.tags || [], kind: "article", date: a.date || ""
    }));
  }

  function render() {
    const raw = input.value.trim();
    const q = raw.toLowerCase();
    activeIdx = -1;
    if (!q) { results.hidden = true; return; }
    const qTokens = q.split(/\s+/).filter(Boolean);
    const source = getSource();
    const scored = [];
    for (const e of source) {
      const s = scoreEntry(e, qTokens);
      if (s > 0) scored.push({ e, s });
    }
    scored.sort((a, b) => b.s - a.s || (b.e.date || "").localeCompare(a.e.date || ""));
    const hits = scored.slice(0, 8).map((x) => x.e);

    if (!hits.length) {
      const lang = getLang();
      if (lang === "ta") results.innerHTML = '<div class="search-empty">"' + esc(raw) + '" – முடிவுகள் இல்லை</div>';
      else if (lang === "hi") results.innerHTML = '<div class="search-empty">"' + esc(raw) + '" – कोई परिणाम नहीं</div>';
      else results.innerHTML = '<div class="search-empty">No results for "' + esc(raw) + '"</div>';
      results.hidden = false;
      return;
    }
    results.innerHTML = hits
      .map(
        (a) =>
          '<a class="search-result' + (a.kind && a.kind !== "article" ? " search-kind-" + a.kind : "") + '" href="' + esc(a.url) + '">' +
          '<span class="search-title">' + esc(a.title) + "</span>" +
          '<span class="search-meta">' + esc(a.category || a.kind || "") + (a.date ? " · " + fmtDate(a.date) : "") + "</span>" +
          "</a>"
      )
      .join("");
    results.hidden = false;
  }

  function setActive(delta) {
    const items = results.querySelectorAll(".search-result");
    if (!items.length) return;
    activeIdx = Math.max(-1, Math.min(items.length - 1, activeIdx + delta));
    items.forEach((el, i) => el.classList.toggle("is-active", i === activeIdx));
    if (activeIdx >= 0) items[activeIdx].scrollIntoView({ block: "nearest" });
  }

  input.addEventListener("focus", loadIndex);
  input.addEventListener("input", () => { loadIndex(); render(); });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { input.value = ""; results.hidden = true; activeIdx = -1; }
    else if (e.key === "ArrowDown") { e.preventDefault(); setActive(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive(-1); }
    else if (e.key === "Enter" && activeIdx >= 0) {
      const items = results.querySelectorAll(".search-result");
      if (items[activeIdx]) { e.preventDefault(); location.href = items[activeIdx].getAttribute("href"); }
    }
  });
  document.addEventListener("click", (e) => {
    if (!results.contains(e.target) && e.target !== input) results.hidden = true;
  });
  results.addEventListener("click", () => { input.value = ""; results.hidden = true; });
  try {
    const sp = new URLSearchParams(location.search);
    const preset = sp.get("q");
    if (preset) { input.value = preset; loadIndex().finally(render); }
  } catch {}
  loadIndex();
}

function initWhatsNew() {
  const list = document.getElementById("latest-list");
  if (!list) return;
  const filters = document.getElementById("latest-filters");
  const filterBtns = filters ? filters.querySelectorAll(".tag-btn") : [];
  const countEl = document.getElementById("latest-count");
  const total = (typeof ARTICLES !== "undefined") ? ARTICLES.length : 0;
  const core = window.WhatsNewCore || {};

  function renderCount() {
    if (!countEl || !window.VelsI18n) return;
    countEl.textContent = core.formatLatestCount
      ? core.formatLatestCount(window.VelsI18n.t("latest_count"), total)
      : window.VelsI18n.t("latest_count").replace("{n}", String(total));
  }

  const matchesFilter = core.matchesFilter || function (a, filter) {
    if (filter === "All") return true;
    if (filter === "AI") return a.category === "AI";
    if (filter === "Hardware") return a.category === "Hardware";
    if (filter === "Software") return ["Operating Systems", "Programming & Web", "Tutorials"].includes(a.category);
    if (filter === "Lab") return Array.isArray(a.tags) && (a.tags.includes("VelsTech Lab") || a.tags.includes("Benchmark"));
    return false;
  };

  function render(filter) {
    const f = filter || "All";
    const filtered = ARTICLES.filter((a) => matchesFilter(a, f));
    const sorted = (core.sortByRecency || function (arr) {
      return [...arr].sort((a, b) => {
        const d = (b.updated || b.date || "").localeCompare(a.updated || a.date || "");
        if (d !== 0) return d;
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
    })(filtered).slice(0, 5);
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

  renderCount();
  window.addEventListener("vt-lang-change", renderCount);

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
  const cur = getCurrentArticle();
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
    span.textContent = t("tag_updated") + fmtDate(cur.updated);
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
    '<h2 class="related-heading" data-i18n="related_heading">' + t("related_heading") + '</h2>' +
    '<div class="related-list">' +
    scored
      .map(
        (a) =>
          '<a class="related-item" href="' + localizeUrl(a.url) + '">' +
          '<span class="related-title">' + esc(getLocalizedTitle(a.url)) + "</span>" +
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
  const cur = getCurrentArticle();
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
    '<span class="share-label">' + t("share_label") + '</span>' + nets +
    '<button type="button" class="share-btn share-copy" aria-label="' + t("copy_title") + '" title="' + t("copy_title") + '">' +
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
      btn.title = t("copied");
      setTimeout(() => { btn.classList.remove("copied"); btn.title = t("copy_title"); }, 2000);
    } catch { /* clipboard unavailable */ }
  });

  const meta = main.querySelector(".meta");
  if (meta) meta.parentNode.insertBefore(bar, meta.nextSibling);
  else main.insertBefore(bar, main.firstChild);
}

/* Author box – small E-E-A-T signal. Shown on article pages only. */
function initAuthorBox() {
  const cur = getCurrentArticle();
  if (!cur) return;
  const main = document.querySelector(".article-page");
  if (!main) return;

  const box = document.createElement("div");
  box.className = "author-box";
  box.innerHTML =
    '<div class="author-avatar">VT</div>' +
    '<div class="author-info">' +
    '<span class="author-name">VelsTech</span>' +
    '<p>' + t("author_desc") + '</p>' +
    '<a class="author-link" href="' + localizeUrl("lab.html") + '">' + t("author_visit") + '</a>' +
    "</div>";
  main.appendChild(box);
}

/* FAQ section – renders the article's FAQ visibly on the page (matches the
   FAQPage JSON-LD injected by gen-seo.js). */
function initFaq() {
  const cur = getCurrentArticle();
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
    '<h2 class="faq-heading" data-i18n="faq_heading">' + t("faq_heading") + '</h2>' +
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

function footerHTML() {
  return (
    '<footer class="footer">' +
    '<nav class="footer-links">' +
    '<a href="feed.xml" title="Subscribe to the Atom feed">' + rssIcon + ' <span data-i18n="footer_subscribe">' + t("footer_subscribe") + '</span></a>' +
    '<a href="resources.html" data-i18n="footer_resources">' + t("footer_resources") + '</a>' +
    '<a href="advertise.html" data-i18n="footer_advertise">' + t("footer_advertise") + '</a>' +
    '<a href="disclosure.html" data-i18n="footer_disclosure">' + t("footer_disclosure") + '</a>' +
    '<a href="terms.html" data-i18n="footer_terms">' + t("footer_terms") + '</a>' +
    '<a href="privacy.html" data-i18n="footer_privacy">' + t("footer_privacy") + '</a>' +
    '<a href="mailto:hello@velstech.net" data-i18n="footer_contact">' + t("footer_contact") + '</a>' +
    "</nav>" +
    socialHTML() +
    '<p class="footer-note" data-i18n="footer_note">' + t("footer_note") + '</p>' +
    '<p>&copy; <span id="year"></span> VelsTech. <span data-i18n="footer_rights">' + t("footer_rights") + '</span></p>' +
    "</footer>"
  );
}

function injectGlossary() {
  if (!document.querySelector(".article-body")) return;
  if (!document.getElementById("vt-glossary-css")) {
    const l = document.createElement("link");
    l.id = "vt-glossary-css";
    l.rel = "stylesheet";
    l.href = "glossary.css?v=2";
    document.head.appendChild(l);
  }
  if (!document.getElementById("vt-glossary-js")) {
    const g = document.createElement("script");
    g.id = "vt-glossary-js";
    g.src = "glossary.js?v=2";
    g.onload = injectDefine;
    g.onerror = () => console.error("[VelsTech] Failed to load glossary");
    document.head.appendChild(g);
  } else {
    injectDefine();
  }
}
function injectDefine() {
  if (document.getElementById("vt-define-js")) return;
  const d = document.createElement("script");
  d.id = "vt-define-js";
  d.src = "define.js?v=5";
  d.onerror = () => console.error("[VelsTech] Failed to load define");
  document.head.appendChild(d);
}
function injectChat() {
  if (document.getElementById("vt-chat-link")) return;
  const link = document.createElement("link");
  link.id = "vt-chat-link";
  link.rel = "stylesheet";
  link.href = "chat.css?v=9";
  document.head.appendChild(link);

  if (document.getElementById("vt-chat-script")) return;
  const s = document.createElement("script");
  s.id = "vt-chat-script";
  s.src = "chat.js?v=21";
  s.onerror = () => console.error("[VelsTech] Failed to load chat widget");
  document.head.appendChild(s);
}

document.body.insertAdjacentHTML("afterbegin", navHTML());
document.body.insertAdjacentHTML("beforeend", footerHTML());
injectChat();
injectGlossary();

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
  document.querySelectorAll("form.newsletter-form").forEach((form) => wireNewsletterForm(form));
}

function wireNewsletterForm(form) {
  if (form.dataset.wired) return;
  form.dataset.wired = "1";
  const status = form.querySelector(".form-status");
  const emailInput = form.querySelector('input[type="email"]');

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = form.querySelector("button[type='submit']");
    const original = btn.textContent;
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
        if (emailInput) emailInput.blur();
        status.textContent = "You're in! Watch your inbox for the next issue.";
        status.style.color = "var(--accent)";
        track("newsletter_signup", { source: form.id || "newsletter", page: location.pathname });
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
    btn.textContent = original;
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
    btn.textContent = t("copy");
    btn.setAttribute("aria-label", t("copy_aria"));
    btn.title = t("copy_title");
    wrap.appendChild(btn);

    btn.addEventListener("click", async () => {
      const text = pre.innerText;
      try {
        await navigator.clipboard.writeText(text);
        btn.textContent = t("copied");
        btn.classList.add("copied");
      } catch {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        btn.textContent = t("copied");
        btn.classList.add("copied");
      }
      setTimeout(() => {
        btn.textContent = t("copy");
        btn.classList.remove("copied");
      }, 2000);
    });
  });
}

function initCaution() {
  const body = document.querySelector(".article-body");
  if (!body) return;
  const cur = getCurrentArticle();
  // Global callout for tutorials / OS / networking where commands are common
  const cautionCategories = ["Tutorials", "Operating Systems", "Networking", "Networking & Self-hosting", "Programming & Web"];
  const shouldShowGlobal = cur && cautionCategories.includes(cur.category) && body.querySelector("pre");
  if (shouldShowGlobal) {
    const callout = document.createElement("div");
    callout.className = "caution-callout";
    // Use t() if available for HI/TA, fallback to English
    const isHi = getLang() === "hi" || location.pathname.endsWith(".hi.html");
    const isTa = getLang() === "ta" || location.pathname.endsWith(".ta.html");
    let text = "<strong>⚠️ Use with caution:</strong> Commands are for the versions tested (Ubuntu 22.04+/RDNA2 etc.) — check your version, path and backup before running <code>sudo</code>/<code>rm</code>. Adapt as needed.";
    if (isHi) text = "<strong>⚠️ सावधानी से उपयोग करें:</strong> ये commands Ubuntu 22.04+/RDNA2 पर टेस्ट किए गए हैं — अपना version/path जाँचें और <code>sudo</code>/<code>rm</code> से पहले backup लें।";
    else if (isTa) text = "<strong>⚠️ கவனமாக பயன்படுத்தவும்:</strong> இந்த commands Ubuntu 22.04+/RDNA2 இல் சோதிக்கப்பட்டவை — உங்கள் version/path சரிபார்த்து <code>sudo</code>/<code>rm</code> முன் backup எடுக்கவும்.";
    callout.innerHTML = text;
    body.insertBefore(callout, body.firstChild);
  }

  // Per-command badge for destructive patterns
  const destructiveRe = /(rm\s+(-rf?|-\s*rf)|\bsudo\s+rm\b|\bdd\s+if=|\bchmod\s+777\b|\bmkfs\b|curl\s+.*\|\s*(bash|sh)|wget\s+.*\|\s*(bash|sh)|>\s*\/dev\/sd|:\(\)\s*\{\s*:\|\s*:&\s*;\s*\})/i;
  body.querySelectorAll("pre").forEach((pre) => {
    const txt = pre.innerText || pre.textContent || "";
    if (!destructiveRe.test(txt)) return;
    // Avoid double badge if already wrapped
    if (pre.parentElement && pre.parentElement.classList.contains("pre-caution-wrap")) return;
    const wrap = document.createElement("div");
    wrap.className = "pre-caution-wrap";
    const badge = document.createElement("div");
    badge.className = "caution-badge";
    const isHi = getLang() === "hi" || location.pathname.endsWith(".hi.html");
    const isTa = getLang() === "ta" || location.pathname.endsWith(".ta.html");
    badge.textContent = isHi ? "⚠️ सावधानी — destructive command" : isTa ? "⚠️ கவனம் — ஆபத்தான command" : "⚠️ Caution — destructive command";
    badge.title = isHi ? "इस command को समझकर ही चलाएँ" : isTa ? "இந்த command-ஐ புரிந்து கொண்டு இயக்கவும்" : "Review before running";
    pre.parentNode.insertBefore(wrap, pre);
    wrap.appendChild(badge);
    wrap.appendChild(pre);
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

const PILLAR = [
  { url: "how-much-vram-for-llm.html", key: "pillar_step_vram" },
  { url: "best-gpu-for-local-llm.html", key: "pillar_step_gpu" },
  { url: "best-gpu-ai-under-50000.html", key: "pillar_step_budget" },
  { url: "llm-vram-calculator.html", key: "pillar_step_calc" },
  { url: "gpu-ai-calculator.html", key: "pillar_step_speed" },
  { url: "vram-budget-planner.html", key: "pillar_step_planner" },
  { url: "benchmark-explorer.html", key: "pillar_step_bench" },
];

// Localized titles for Continue reading / Related (HI/TA) – keep tech terms English
const ARTICLE_TITLES = {
  "better-prompts.html": { hi: "बेहतर prompt कैसे लिखें", ta: "சிறந்த பரிந்துரைகளை எழுதுவதற்கான முறைகள்" },
  "what-is-an-llm.html": { hi: "एक बड़ा भाषा मॉडल वास्तव में क्या है?", ta: "பெரிய மொழி மாதிரி" },
  "what-is-machine-learning.html": { hi: "मशीन लर्निंग क्या है, वास्तव में?", ta: "மாஷின் கற்றல் என்பது என்ன?" },
  "local-vs-cloud-ai.html": { hi: "Local vs cloud AI: कौन सा चुनें?", ta: "உள்ளூர் vs கிளவுட் AI: எதை தேர்வு செய்ய வேண்டும்?" },
  "qwen3-8-flash-next.html": { hi: "Qwen3.8 Flash Next: Alibaba का नया तेज़ reasoning model", ta: "Qwen3.8 Flash Next: அலிபாபாவின் புதிய வேகமான சிந்தனை மாடல்" },
  "glm-5-3.html": { hi: "GLM 5.3: Zhipu AI के नए model में क्या नया है", ta: "GLM 5.3: Zhipu AI-யின் சமீபத்திய மாடலில் புதியது என்ன" },
  "first-pc-build.html": { hi: "अपने पहले PC build के लिए पार्ट्स कैसे चुनें", ta: "உங்கள் முதல் PC கட்டுமானத்திற்கான பாகங்களை எப்படி தேர்ந்தெடுப்பது" },
  "cpu-vs-gpu.html": { hi: "CPU vs GPU – प्रत्येक क्या करता है?", ta: "CPU மற்றும் GPU விவகாரம்: அவை என்ன செய்கின்றன?" },
  "ssd-vs-hdd.html": { hi: "SSD vs HDD: वह अपग्रेड जो सब कुछ बदल देता है", ta: "SSD vs HDD: எல்லாவற்றையும் மாற்றும் மேம்படுத்தல்" },
  "new-mac-desktops.html": { hi: "Apple के नए Mac desktops: M5 Max/Ultra वाला Mac Studio और M6/M5 Pro वाला Mac mini", ta: "Apple-இன் புதிய Mac டெஸ்க்டாப்கள்: Mac Studio M5 Max/Ultra மற்றும் M6/M5 Pro" },
  "omarchy.html": { hi: "Omarchy: सुंदर, opinionated Linux distro जिसकी हर कोई बात कर रहा है", ta: "Omarchy: அனைவரும் பேசும் அழகான, துணிச்சலான Linux distro" },
  "linux-beginners.html": { hi: "शुरुआती लोगों के लिए Linux: शुरुआत कैसे करें", ta: "ஆரம்பநிலையாளர்களுக்கான Linux: தொடங்குவது எப்படி" },
  "terminal-commands.html": { hi: "हर किसी को पता होने चाहिए ऐसे ज़रूरी टर्मिनल कमांड्स", ta: "அனைவரும் தெரிந்திருக்க வேண்டிய அத்தியாவசிய டெர்மினல் கட்டளைகள்" },
  "windows-vs-linux.html": { hi: "Windows vs Linux: कब किसे इस्तेमाल करें", ta: "Windows vs Linux: எப்போது எதை பயன்படுத்துவது" },
  "how-internet-works.html": { hi: "इंटरनेट वास्तव में कैसे काम करता है?", ta: "இணையம் உண்மையில் எவ்வாறு வேலை செய்கிறது?" },
  "setup-domain.html": { hi: "Domain सेटअप करना और कहीं भी point करना", ta: "ஒரு டொமைனை அமைத்து அதை எங்கும் சுட்டிக்காட்டுதல்" },
  "self-hosting-101.html": { hi: "Self-hosting 101: घर पर क्या चला सकते हैं?", ta: "சுய-ஹோஸ்டிங் 101: வீட்டில் என்ன இயக்க முடியும்?" },
  "security-habits.html": { hi: "सिर्फ़ 5 सुरक्षा आदतें जो आपको चाहिए", ta: "உங்களுக்கு உண்மையில் தேவையான 5 பாதுகாப்பு பழக்கங்கள் மட்டுமே" },
  "password-managers.html": { hi: "पासवर्ड मैनेजर: आपको इसकी ज़रूरत क्यों है", ta: "கடவுச்சொல் மேலாளர்கள்: உங்களுக்கு ஏன் ஒன்று தேவை" },
  "spotting-phishing.html": { hi: "Phishing की पहचान करना", ta: "ஃபிஷிங் முயற்சிகளைக் கண்டறிதல்" },
  "learn-to-code.html": { hi: "2026 में कोडिंग सीखना कैसे शुरू करें", ta: "2026-ல் குறியீடு எழுதக் கற்றுக்கொள்வது எப்படி" },
  "html-css-js.html": { hi: "HTML, CSS और JavaScript: हर एक क्या करता है?", ta: "HTML, CSS, JavaScript: ஒவ்வொன்றும் என்ன செய்கிறது?" },
  "git-beginners.html": { hi: "शुरुआती लोगों के लिए Git के साथ version control", ta: "Git உடன் பதிப்பு கட்டுப்பாடு – முழு ஆரம்பநிலையாளர்களுக்கு" },
  "moe-vs-dense-rx6800m-16k-vs-262k.html": { hi: "RX 6800M पर MoE vs Dense: 3B Active vs 27B 16K/262K – VelsTech Lab", ta: "RX 6800M-ல் MoE vs Dense: 3B Active vs 27B at 16K/262K – VelsTech Lab" },
  "ornith-35b-moe-262k-rocm-vs-vulkan.html": { hi: "RX 6800M पर Ornith 35B MoE 262K: ROCm vs Vulkan – VelsTech Lab", ta: "RX 6800M-ல் 262K-இல் Ornith 35B MoE: ROCm vs Vulkan – VelsTech Lab" },
  "qwen-27b-ridge-rocm-vs-vulkan.html": { hi: "Qwen 27B Ridge 3.7bpw RX 6800M पर: 16K पर ROCm vs Vulkan – VelsTech Lab", ta: "Qwen 27B Ridge 3.7bpw on RX 6800M: ROCm vs Vulkan at 16K – VelsTech Lab" },
  "how-much-vram-for-llm.html": { hi: "7B, 14B और 32B models के लिए कितनी VRAM चाहिए?", ta: "7B, 14B, 32B மாடல்களுக்கு எவ்வளவு VRAM தேவை?" },
  "best-gpu-for-local-llm.html": { hi: "स्थानीय रूप से LLM चलाने के लिए सर्वश्रेष्ठ GPU (2026)", ta: "உள்ளூரில் LLMகளை இயக்க சிறந்த GPU (2026)" },
  "best-gpu-ai-under-50000.html": { hi: "₹50,000 के अंदर AI के लिए सर्वश्रेष्ठ GPU (भारत, 2026)", ta: "₹50,000-க்கு கீழ் AI-க்கு சிறந்த GPU (இந்தியா, 2026)" },
  "xiaomi-ai-cube.html": { hi: "Xiaomi AI Cube: लोकल AI के लिए बना मिनी डेस्कटॉप", ta: "Xiaomi AI Cube: உள்ளூர் AI-க்காக உருவாக்கப்பட்ட மினி டெஸ்க்டாப்" },
};
function getLocalizedTitle(url) {
  const lang = getLang();
  const path = location.pathname.split("/").pop() || "";
  const inferred = path.endsWith(".hi.html") ? "hi" : path.endsWith(".ta.html") ? "ta" : lang;
  const entry = ARTICLE_TITLES[url];
  if (entry && entry[inferred]) return entry[inferred];
  const art = ARTICLES.find((a) => a.url === url);
  return art ? art.title : url;
}

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
  const cur = getCurrentArticle();
  if (!cur || !cur.category) return;
  const meta = document.querySelector(".meta");
  if (!meta) return;
  const color = CAT_COLORS[cur.category];
  if (!color) return;
  const pill = document.createElement("a");
  pill.className = "tag cat-pill";
  pill.href = localizeUrl(CAT_URL[cur.category] || "#");
  pill.style.color = color;
  pill.style.background = color + "26";
  pill.style.borderColor = "transparent";
  pill.textContent = cur.category;
  meta.insertBefore(pill, meta.firstChild);
}

/* "Continue reading" flow – next/previous article in the same series. */
function initArticleFlow() {
  const cur = getCurrentArticle();
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
  if (!prev && !next) {
    const related = ARTICLES.filter((a) => a.url !== cur.url && a.category === cur.category)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 2);
    if (!related.length) return;
    prev = related[0] || null;
    next = related[1] || null;
  }

  const flow = document.createElement("div");
  flow.className = "article-flow";
  flow.innerHTML =
    '<p class="flow-heading">' + t("continue_reading") + '</p>' +
    '<div class="flow-row">' +
    (prev
      ? '<a class="flow-link flow-prev" href="' + localizeUrl(prev.url) + '"><span class="flow-label">' + t("prev") + '</span><span class="flow-title">' + esc(getLocalizedTitle(prev.url)) + '</span></a>'
      : "") +
    (next
      ? '<a class="flow-link flow-next" href="' + localizeUrl(next.url) + '"><span class="flow-label">' + t("next") + '</span><span class="flow-title">' + esc(getLocalizedTitle(next.url)) + '</span></a>'
      : "") +
    "</div>";
  nav.parentNode.insertBefore(flow, nav);
}

function initPillar() {
  const curFile = (location.pathname.split("/").pop() || "index.html").replace(/\.(hi|ta)\.html$/, ".html");
  if (!PILLAR.some((p) => p.url === curFile)) return;
  const nav = document.querySelector(".article-nav");
  if (!nav || nav.parentElement.querySelector(".pillar-card")) return;
  const card = document.createElement("div");
  card.className = "pillar-card";
  const steps = PILLAR.map((p, i) => {
    const active = p.url === curFile;
    const labelKey = p.key;
    const label = esc(t(labelKey));
    const num = '<span class="pillar-num">' + (i + 1) + "</span>";
    const labelSpan = '<span data-i18n="' + labelKey + '">' + label + "</span>";
    if (active) return '<span class="pillar-step is-active" data-pillar-url="' + esc(p.url) + '">' + num + labelSpan + "</span>";
    return '<a class="pillar-step" data-pillar-url="' + esc(p.url) + '" href="' + esc(localizeUrl(p.url)) + '">' + num + labelSpan + "</a>";
  }).join('<span class="pillar-sep">→</span>');
  card.innerHTML =
    '<div class="pillar-head"><span class="pillar-title" data-i18n="pillar_title">' + esc(t("pillar_title")) + '</span><span class="pillar-desc" data-i18n="pillar_desc">' + esc(t("pillar_desc")) + "</span></div>" +
    '<nav class="pillar-path" aria-label="Local AI path">' + steps + "</nav>";
  const stack = nav.parentElement.querySelector(".cta-stack");
  if (stack) stack.parentNode.insertBefore(card, stack);
  else nav.parentNode.insertBefore(card, nav);
  track("pillar_view", { page: location.pathname });
  card.querySelectorAll("a.pillar-step").forEach((a) =>
    a.addEventListener("click", () => track("pillar_click", { from: curFile, to: a.getAttribute("href"), page: location.pathname }))
  );
  window.addEventListener("vt-lang-change", () => {
    card.querySelectorAll("[data-pillar-url]").forEach((el) => {
      const base = el.getAttribute("data-pillar-url");
      if (el.tagName === "A") el.setAttribute("href", localizeUrl(base));
    });
  });
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

/* "Recommended gear" – per-category Amazon searches (money pages first).
   Keys must match ARTICLES categories (see CAT_COLORS). */
const GEAR_PICKS = {
  "AI": ["RTX 4060 Ti 16GB GPU", "NVMe SSD 2TB"],
  "AI & ML": ["RTX 4060 Ti 16GB GPU", "NVMe SSD 2TB"],
  "Hardware": ["Ryzen 5 processor", "NVMe SSD 1TB", "power supply 650W"],
  "Operating Systems": ["Raspberry Pi 5 kit", "USB-C hub"],
  "Linux": ["Raspberry Pi 5 kit", "USB-C hub"],
  "Software": ["Raspberry Pi 5 kit", "USB-C hub"],
  "Networking": ["WiFi 6 router", "Raspberry Pi 5 kit"],
  "Networking & Self-hosting": ["WiFi 6 router", "Raspberry Pi 5 kit"],
  "Security & Privacy": ["hardware security key", "password manager book"],
  "Security": ["hardware security key", "password manager book"],
  "Programming & Web": ["mechanical keyboard", "monitor arm"],
  "Development": ["mechanical keyboard", "monitor arm"],
  "Tutorials": ["laptop stand", "mechanical keyboard"],
};

function initArticleCta() {
  const cur = getCurrentArticle();
  if (!cur) return; // articles only
  const nav = document.querySelector(".article-nav");
  if (!nav || nav.parentElement.querySelector(".cta-stack")) return;

  const stack = document.createElement("div");
  stack.className = "cta-stack";

  // Newsletter card (skip if the page already has a hand-placed newsletter form)
  if (!document.querySelector("main form.newsletter-form")) {
    const nl = document.createElement("div");
    nl.className = "cta-card cta-newsletter";
    nl.innerHTML =
      '<h3 data-i18n="cta_newsletter_title">' + esc(t("cta_newsletter_title")) + "</h3>" +
      '<p data-i18n="cta_newsletter_text">' + esc(t("cta_newsletter_text")) + "</p>" +
      '<form class="newsletter-form" id="newsletter-form">' +
      '<input type="hidden" name="access_key" value="047538ca-c990-448d-9fe7-2319998e6840" />' +
      '<input type="hidden" name="subject" value="VelsTech newsletter signup (article CTA) - ' + esc(cur.url) + '" />' +
      '<label class="sr-only" for="cta-newsletter-email">Email</label>' +
      '<input id="cta-newsletter-email" type="email" name="email" autocomplete="email" placeholder="you@example.com" required />' +
      '<button class="btn btn-primary" type="submit" data-i18n="cta_newsletter_button">' + esc(t("cta_newsletter_button")) + "</button>" +
      '<p class="form-status" hidden></p>' +
      "</form>";
    stack.appendChild(nl);
    wireNewsletterForm(nl.querySelector("form"));
  }

  // Gear card – category-mapped Amazon picks
  const picks = GEAR_PICKS[cur.category];
  if (picks && picks.length) {
    const gear = document.createElement("div");
    gear.className = "cta-card cta-gear";
    gear.innerHTML =
      '<h3 data-i18n="cta_gear_title">' + esc(t("cta_gear_title")) + "</h3>" +
      '<div class="cta-gear-links">' +
      picks.map((p) => '<a data-amazon="' + esc(p) + '" href="#">' + esc(p) + "</a>").join(" · ") +
      "</div>" +
      '<p class="cta-gear-note" data-i18n="cta_gear_note">' + esc(t("cta_gear_note")) + "</p>";
    stack.appendChild(gear);
    initAmazonLinks();
  }

  if (stack.children.length) {
    nav.parentNode.insertBefore(stack, nav);
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (!e.isIntersecting) return;
            track("cta_view", { type: "article_bottom", page: location.pathname, cards: stack.children.length });
            io.disconnect();
          });
        },
        { threshold: 0.3 }
      );
      io.observe(stack);
    } else {
      track("cta_view", { type: "article_bottom", page: location.pathname, cards: stack.children.length });
    }
  }
}

initSearch();
initNavDropdown();
initLangSwitch();
initWhatsNew();
initArticleMeta();
initContactForm();
initNewsletter();
initTagsPage();
initCopyButtons();
initCaution();
addCategoryPill();
initArticleFlow();
initPillar();
initBackToTop();
initProgressBar();
initReveal();
initCategoryColors();
initHotTopic();
initArticleCta();
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

/* Service worker – offline support (PWA) */
if ("serviceWorker" in navigator && location.protocol === "https:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) =>
      console.error("[VelsTech] Service worker registration failed:", err)
    );
  });
}
