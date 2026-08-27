const root = document.documentElement;

/* Amazon Associates tracking ID — ONE place to change it site-wide.
   Every <a data-amazon="search query"> is rewritten to an Amazon.in
   keyword link carrying this tag. */
const AMAZON_TAG = "velstechoffl-21";

/* Software / cloud / hosting affiliate referral URLs.
   Each key matches a <a data-aff="key" href="..."> link on the site.
   Add the referral URL you get from each program's signup; until then
   the plain homepage href is used. Edit these values — not the HTML.
   Order: cash-per-sale programs first (priority), then credit-based. */
const AFFILIATE_LINKS = {
  /* Cash-per-sale / recurring commissions (priority) */
  hostinger: "",   // hosting · 40%+ per sale, grows with volume — https://affiliates.hostinger.com
  nordvpn: "",     // VPN · 40–100% per sale + 30% recurring renewals — nordvpn.com/affiliate (also unlocks NordPass/NordLocker)
  kit: "",         // email/newsletter · 50% of first 12 months + 10–20% recurring — https://kit.com/affiliates
  brevo: "",       // email/CRM · affiliate program, reward per referred signup — brevo.com/partners
  /* Credit-based referral programs (secondary) */
  bitwarden: "",   // credit-based referral
  proton: "",      // credit-based referral
  tailscale: "",   // credit-based referral
  digitalocean: "",// credit-based referral ($25 credit per refer)
  runpod: "",      // credit-based referral
  vastai: "",      // credit-based referral
  hetzner: "",     // no public program confirmed — remove data-aff if none
  namecheap: "",   // check current program — remove data-aff if none
  copilot: "",     // no public program confirmed — remove data-aff if none
};

function affiliateHref(key) {
  const url = AFFILIATE_LINKS[key];
  return url || null;
}

/* Google AdSense — client ID is live (Auto Ads). Setting ADSENSE_SLOT additionally
   inserts a manual responsive unit before .article-nav; leave empty to let Google
   auto-place ads. Ads only serve after AdSense approval. */
const ADSENSE_CLIENT = "ca-pub-5002392377660300";
const ADSENSE_SLOT = "";

function initAdsense() {
  if (!ADSENSE_CLIENT) return;
  if (!document.querySelector('script[src*="adsbygoogle.js"]')) {
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + ADSENSE_CLIENT;
    s.crossOrigin = "anonymous";
    document.head.appendChild(s);
  }

  if (!ADSENSE_SLOT) return; // Auto Ads mode — Google decides placement

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

const PAGES = [
  { href: "index.html", label: "Home", page: "index.html" },
  { href: "ai.html", label: "AI", page: "ai.html" },
  { href: "hardware.html", label: "Hardware", page: "hardware.html" },
  { href: "os.html", label: "Software", page: "os.html" },
  { href: "index.html#lab", label: "Lab", page: "__lab__" },
  { href: "tools.html", label: "Tools", page: "tools.html" },
  { href: "tags.html", label: "Tags", page: "tags.html" },
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
  const links = PAGES.map(
    (p) =>
      `<a class="nav-link${p.page === currentPage ? " active" : ""}" href="${p.href}">${p.label}</a>`
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
    '<nav class="links">' + links + "</nav>" +
    '<div class="controls">' +
    '<button class="icon-btn" id="theme-toggle" aria-label="Toggle theme" title="Toggle theme"></button>' +
    '<div class="palette-wrap">' +
    '<button class="icon-btn" id="palette-btn" aria-label="Accent color" title="Accent color" aria-expanded="false">' + paintIcon + "</button>" +
    '<div class="palette" id="palette" hidden>' + dots + "</div>" +
    "</div></div></header>"
  );
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
  const latest = [...ARTICLES]
    .sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return b.updated.localeCompare(a.updated);
    })
    .slice(0, 5);
  list.innerHTML = latest
    .map(
      (a) =>
        '<a class="latest-item' + (a.featured ? " featured" : "") + '" href="' + a.url + '">' +
        '<span class="latest-title">' + esc(a.title) + (a.featured ? '<span class="latest-badge">Featured</span>' : "") + "</span>" +
        '<span class="latest-meta">' + esc(a.category) + " · " + fmtDate(a.updated) + "</span>" +
        "</a>"
    )
    .join("");
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

const rssIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/></svg>';

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
  '<nav class="footer-links" style="margin-top:10px; opacity:0.9">' +
  '<a href="networking.html">Networking</a>' +
  '<a href="security.html">Security</a>' +
  '<a href="programming.html">Development</a>' +
  '<a href="tutorials.html">Tutorials</a>' +
  "</nav>" +
  '<p class="footer-note">Content on this site is generated with the assistance of AI and is for informational purposes only.</p>' +
  '<p>&copy; <span id="year"></span> VelsTech. All rights reserved.</p>' +
  "</footer>";

function injectChat() {
  if (document.getElementById("vt-chat-link")) return;
  const link = document.createElement("link");
  link.id = "vt-chat-link";
  link.rel = "stylesheet";
  link.href = "chat.css?v=5";
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
feedLink.title = "VelsTech — Atom feed";
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
      '<h2 class="tag-results-heading">"' + esc(tag) + '" — ' + hits.length + " article" + (hits.length === 1 ? "" : "s") + "</h2>" +
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
initWhatsNew();
initArticleMeta();
initContactForm();
initNewsletter();
initTagsPage();
initCopyButtons();
addCategoryPill();
initProgressBar();
initReveal();
initCategoryColors();
initHotTopic();
initAmazonLinks();
initAdsense();

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
