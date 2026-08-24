const root = document.documentElement;
const themeToggle = document.getElementById("theme-toggle");
const paletteBtn = document.getElementById("palette-btn");
const palette = document.getElementById("palette");

const SUN = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
const MOON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';

function applyTheme(theme) {
  root.setAttribute("data-theme", theme);
  themeToggle.innerHTML = theme === "dark" ? SUN : MOON;
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
