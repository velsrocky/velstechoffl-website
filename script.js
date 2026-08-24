const root = document.documentElement;

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
  { href: "ai.html", label: "AI & ML", page: "ai.html" },
  { href: "hardware.html", label: "Hardware", page: "hardware.html" },
  { href: "os.html", label: "OS", page: "os.html" },
  { href: "networking.html", label: "Networking", page: "networking.html" },
  { href: "security.html", label: "Security", page: "security.html" },
  { href: "programming.html", label: "Programming", page: "programming.html" },
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
    '<a class="brand" href="index.html">' + brandSVG + '<span class="brand-name">VelsTech</span></a>' +
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
    .sort((a, b) => b.updated.localeCompare(a.updated))
    .slice(0, 5);
  list.innerHTML = latest
    .map(
      (a) =>
        '<a class="latest-item" href="' + a.url + '">' +
        '<span class="latest-title">' + esc(a.title) + "</span>" +
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
  '<a href="terms.html">Terms</a>' +
  '<a href="privacy.html">Privacy</a>' +
  '<a href="mailto:hello@velstech.net">Contact</a>' +
  "</nav>" +
  '<p class="footer-note">Content on this site is generated with the assistance of AI and is for informational purposes only.</p>' +
  '<p>&copy; <span id="year"></span> VelsTech. All rights reserved.</p>' +
  "</footer>";

document.body.insertAdjacentHTML("afterbegin", navHTML());
document.body.insertAdjacentHTML("beforeend", footerHTML);

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

initSearch();
initWhatsNew();
initArticleMeta();
initContactForm();

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

const savedTheme = localStorage.getItem("vt-theme") || "dark";
const savedAccent = localStorage.getItem("vt-accent") || "blue";
applyTheme(savedTheme);
applyAccent(savedAccent);

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
