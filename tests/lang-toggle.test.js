/* tests/lang-toggle.test.js – browser-level guard for the EN/TA/HI toggle.
 *
 * Opt-in by design: needs a Chrome/Chromium binary + puppeteer-core. When
 * either is missing the whole file SKIPS, so CI (`node --test tests/*.test.js`,
 * no npm deps) is unaffected. Run locally:
 *
 *   npm i puppeteer-core                      # once, or NODE_PATH to a checkout
 *   CHROME_PATH=/usr/bin/google-chrome node --test tests/lang-toggle.test.js
 *
 * It serves the repo through a mini Cloudflare-Pages emulator (308 redirect
 * .html -> clean URL) because every toggle bug we fixed was clean-URL-specific
 * (see commit 8738323): persistence across navigation, FAQ/related/CTA/pillar
 * rendering, translated-URL switching, and direct landings on /foo.hi.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const http = require("node:http");

const ROOT = path.join(__dirname, "..");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let puppeteer = null;
try {
  puppeteer = require("puppeteer-core");
} catch {}
function findChrome() {
  const cands = [
    process.env.CHROME_PATH,
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);
  return cands.find((c) => fs.existsSync(c)) || null;
}
const CHROME = findChrome();
const SKIP = !puppeteer || !CHROME ? "requires puppeteer-core + a Chrome binary (see header)" : false;

/* Mini Cloudflare-Pages emulator: 308 .html -> clean URL, serve extensionless. */
function startServer() {
  const isFile = (f) => {
    try {
      return fs.statSync(f).isFile();
    } catch {
      return false;
    }
  };
  const TYPES = {
    ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
    ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml",
    ".woff2": "font/woff2", ".xml": "application/xml", ".ico": "image/x-icon",
  };
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split("?")[0]);
    if (p.endsWith(".html") && p !== "/index.html" && p !== "/404.html" && p !== "/offline.html" && isFile(path.join(ROOT, p))) {
      res.writeHead(308, { location: p.replace(/\.html$/, "") });
      return res.end();
    }
    if (p === "/") p = "/index.html";
    let file = path.join(ROOT, p);
    if (!isFile(file) && isFile(file + ".html")) file += ".html";
    if (!isFile(file) && isFile(path.join(file, "index.html"))) file = path.join(file, "index.html");
    if (!isFile(file)) {
      res.writeHead(404);
      return res.end("nf");
    }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "text/plain" });
    res.end(fs.readFileSync(file));
  });
  return new Promise((resolve) => {
    srv.listen(0, "127.0.0.1", () => resolve(srv));
  });
}

let srv, BASE, browser;
test.before(async () => {
  if (SKIP) return;
  srv = await startServer();
  BASE = `http://127.0.0.1:${srv.address().port}`;
  browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
});
test.after(async () => {
  if (browser) await browser.close().catch(() => {});
  if (srv) srv.close();
});

async function newPage() {
  const ctx = await browser.createBrowserContext(); // isolated localStorage per test
  const page = await ctx.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  return page;
}
async function goto(page, url) {
  await page.goto(BASE + url, { waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => {});
  await sleep(900);
}
async function clickLang(page, lang) {
  await page.click(`.lang-btn[data-lang="${lang}"]`);
  await sleep(1600);
}
const state = (page) =>
  page.evaluate(() => ({
    url: location.pathname,
    htmlLang: document.documentElement.getAttribute("lang"),
    stored: localStorage.getItem("vt-lang"),
    activeBtn: (document.querySelector(".lang-btn.active") || {}).dataset?.lang || null,
    navHomeText: (document.querySelector('[data-i18n="nav_home"]') || {}).textContent || null,
    faqHeading: (document.querySelector(".faq-heading") || {}).textContent || null,
    devanagari: /[\u0900-\u097F]/.test(document.body.innerText),
    tamil: /[\u0B80-\u0BFF]/.test(document.body.innerText),
  }));

test("toggle renders EN/TA/HI and defaults to en", { skip: SKIP }, async () => {
  const page = await newPage();
  await goto(page, "/");
  const btns = await page.$$eval(".lang-btn", (b) => b.map((x) => x.dataset.lang).sort());
  assert.deepEqual(btns, ["en", "hi", "ta"]);
  assert.equal((await state(page)).activeBtn, "en");
  await page.close();
});

test("skip link is first in tab order and jumps to main", { skip: SKIP }, async () => {
  const page = await newPage();
  await goto(page, "/what-is-an-llm.html");
  await page.keyboard.press("Tab");
  const focused = await page.evaluate(() => {
    const a = document.activeElement;
    return { cls: a.className, href: a.getAttribute("href"), text: a.textContent };
  });
  assert.equal(focused.cls, "skip-link", "first tab stop should be the skip link");
  assert.equal(focused.href, "#main");
  await page.keyboard.press("Enter");
  await sleep(400);
  const hash = await page.evaluate(() => location.hash);
  assert.equal(hash, "#main");
  await page.close();
});

test("click HI: persists, sets html lang, swaps to Hindi variant", { skip: SKIP }, async () => {
  const page = await newPage();
  await goto(page, "/");
  await clickLang(page, "hi");
  const s = await state(page);
  assert.equal(s.stored, "hi");
  assert.equal(s.htmlLang, "hi");
  assert.equal(s.activeBtn, "hi");
  assert.ok(s.navHomeText && s.navHomeText !== "Home", "nav should be translated");
  assert.ok(s.devanagari, "body should show Devanagari");
  await page.close();
});

test("click TA then back to EN", { skip: SKIP }, async () => {
  const page = await newPage();
  await goto(page, "/");
  await clickLang(page, "ta");
  let s = await state(page);
  assert.equal(s.stored, "ta");
  assert.equal(s.htmlLang, "ta");
  assert.ok(s.tamil, "body should show Tamil");
  await clickLang(page, "en");
  s = await state(page);
  assert.equal(s.stored, "en");
  assert.equal(s.navHomeText, "Home");
  await page.close();
});

test("stored HI bounces English article to HI variant (clean URL)", { skip: SKIP }, async () => {
  const page = await newPage();
  await goto(page, "/");
  await page.evaluate(() => localStorage.setItem("vt-lang", "hi"));
  await goto(page, "/what-is-an-llm.html");
  await sleep(1600);
  const s = await state(page);
  assert.match(s.url, /\.hi(\.html)?$/, "should bounce to HI variant");
  assert.equal(s.htmlLang, "hi");
  await page.close();
});

test("clean URL (no .html) honors stored TA", { skip: SKIP }, async () => {
  const page = await newPage();
  await goto(page, "/");
  await page.evaluate(() => localStorage.setItem("vt-lang", "ta"));
  await goto(page, "/what-is-an-llm");
  await sleep(1600);
  assert.match((await state(page)).url, /\.ta(\.html)?$/);
  await page.close();
});

test("FAQ section renders on article and localizes after toggle", { skip: SKIP }, async () => {
  const page = await newPage();
  await goto(page, "/first-pc-build.html");
  let s = await state(page);
  assert.ok(s.faqHeading && /frequently/i.test(s.faqHeading), "EN FAQ heading should render");
  await clickLang(page, "hi");
  s = await state(page);
  assert.ok(s.faqHeading, "FAQ heading must survive the in-place swap");
  assert.match(s.faqHeading, /[\u0900-\u097F]/, "FAQ heading should be Hindi");
  await page.close();
});

test("untranslated paths do not redirect-loop or leave the site", { skip: SKIP }, async () => {
  const page = await newPage();
  await goto(page, "/");
  await page.evaluate(() => localStorage.setItem("vt-lang", "ta"));
  await goto(page, "/pdf-to-image/");
  await sleep(1200);
  assert.match(await page.evaluate(() => location.pathname), /pdf-to-image/);
  await page.close();
});
