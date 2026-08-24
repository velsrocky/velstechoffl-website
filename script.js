const root = document.documentElement;

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
    '<nav class="links">' + links + "</nav>" +
    '<div class="controls">' +
    '<button class="icon-btn" id="theme-toggle" aria-label="Toggle theme" title="Toggle theme"></button>' +
    '<div class="palette-wrap">' +
    '<button class="icon-btn" id="palette-btn" aria-label="Accent color" title="Accent color" aria-expanded="false">' + paintIcon + "</button>" +
    '<div class="palette" id="palette" hidden>' + dots + "</div>" +
    "</div></div></header>"
  );
}

const footerHTML =
  '<footer class="footer"><p>&copy; <span id="year"></span> VelsTech. All rights reserved.</p></footer>';

document.body.insertAdjacentHTML("afterbegin", navHTML());
document.body.insertAdjacentHTML("beforeend", footerHTML);

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
