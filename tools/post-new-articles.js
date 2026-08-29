/* Post-new-articles script.
 *
 * Detects newly added articles (by URL) between the previous commit and the
 * current one, then posts a short announcement to each configured platform.
 *
 * Runs from .github/workflows/social-post.yml on every push to main. Uses only
 * Node built-ins (crypto, https) so it needs no npm install.
 *
 * Platforms (each is optional – configure via repo secrets):
 *
 *   X / Twitter      TWITTER_API_KEY, TWITTER_API_SECRET,
 *                    TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET
 *                    (API v2 POST /2/tweets, OAuth 1.0a)
 *
 *   Mastodon         MASTODON_INSTANCE (e.g. https://mastodon.social),
 *                    MASTODON_TOKEN (access token)
 *
 *   Generic webhook  WEBHOOK_URL – receives JSON {title, url, summary}
 *                    (point it at n8n / Zapier / Buffer / Make etc.)
 *
 * If none are configured the script just prints what it would post and exits 0.
 */

const { execSync } = require("child_process");
const crypto = require("crypto");
const https = require("https");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SITE = "https://velstech.net";

function currentArticles() {
  const ARTICLES = require(path.join(ROOT, "articles.js"));
  return ARTICLES;
}

function previousArticles() {
  try {
    const out = execSync("git show HEAD~1:articles.js", { cwd: ROOT, maxBuffer: 4 * 1024 * 1024 }).toString();
    const mod = { exports: {} };
    new Function("module", "exports", out)(mod, mod.exports);
    return mod.exports || [];
  } catch {
    return [];
  }
}

function newArticles() {
  const cur = currentArticles();
  const prev = previousArticles();
  const prevUrls = new Set(prev.map((a) => a.url));
  return cur
    .filter((a) => !prevUrls.has(a.url))
    .sort((a, b) => b.date.localeCompare(a.date));
}

/* ---------- X / Twitter (API v2, OAuth 2.0 Bearer token) ---------- */

function postToX(text) {
  const token = process.env.TWITTER_ACCESS_TOKEN || process.env.TWITTER_BEARER_TOKEN;
  if (!token) return null;
  const url = "https://api.twitter.com/2/tweets";
  const body = JSON.stringify({ text });
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve("posted");
        else reject(new Error("X API " + res.statusCode + ": " + data.slice(0, 200)));
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

/* ---------- Mastodon ---------- */

function postToMastodon(text) {
  const instance = (process.env.MASTODON_INSTANCE || "").replace(/\/$/, "");
  const token = process.env.MASTODON_TOKEN;
  if (!instance || !token) return null;
  const url = instance + "/api/v1/statuses";
  const body = new URLSearchParams({ status: text }).toString();
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request(u, {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/x-www-form-urlencoded", "Content-Length": Buffer.byteLength(body) },
    }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve("posted");
        else reject(new Error("Mastodon " + res.statusCode + ": " + data.slice(0, 200)));
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

/* ---------- Generic webhook ---------- */

function postToWebhook(article) {
  const url = process.env.WEBHOOK_URL;
  if (!url) return null;
  const payload = JSON.stringify({
    title: article.title,
    url: SITE + "/" + article.url,
    summary: article.description,
    category: article.category,
  });
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request(u, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) },
    }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve("posted");
        else reject(new Error("Webhook " + res.statusCode + ": " + data.slice(0, 200)));
      });
    });
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

/* ---------- Bluesky (AT Protocol) ---------- */

function bskyRequest(path, token, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const u = new URL("https://bsky.social" + path);
    const req = https.request(u, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": payload ? Buffer.byteLength(payload) : 0,
        ...(token ? { Authorization: "Bearer " + token } : {}),
      },
    }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(JSON.parse(data || "{}"));
        else reject(new Error("Bluesky " + res.statusCode + ": " + data.slice(0, 300)));
      });
    });
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function postToBluesky(text) {
  const handle = process.env.BLUESKY_HANDLE;
  const appPassword = process.env.BLUESKY_APP_PASSWORD;
  if (!handle || !appPassword) return null;
  return bskyRequest("/xrpc/com.atproto.server.createSession", null, {
    identifier: handle,
    password: appPassword,
  }).then((session) => {
    const { accessJwt, did } = session;
    return bskyRequest("/xrpc/com.atproto.repo.createRecord", accessJwt, {
      repo: did,
      collection: "app.bsky.feed.post",
      record: {
        $type: "app.bsky.feed.post",
        text: text,
        createdAt: new Date().toISOString(),
      },
    }).then(() => "posted");
  });
}

/* ---------- Main ---------- */

function compose(article) {
  const url = SITE + "/" + article.url;
  const tags = (article.tags || []).slice(0, 3).map((t) => t.replace(/[^a-zA-Z0-9]+/g, "").toLowerCase());
  const hashtags = tags.filter((t) => t && t.length > 1 && !["gpu", "ai"].includes(t)).map((t) => "#" + t).join(" ");
  return `${article.title}\n\n${url} ${hashtags}`.trim();
}

(async () => {
  const fresh = newArticles();
  if (!fresh.length) {
    console.log("No new articles to post.");
    process.exit(0);
  }
  console.log("New articles: " + fresh.map((a) => a.url).join(", "));

  for (const article of fresh) {
    const text = compose(article);
    const results = await Promise.allSettled([postToX(text), postToMastodon(text), postToBluesky(text), postToWebhook(article)]);
    const labels = ["X", "Mastodon", "Bluesky", "webhook"];
    results.forEach((r, i) => {
      if (r.status === "fulfilled" && r.value) console.log(`  [${labels[i]}] ${r.value}`);
      else if (r.status === "rejected") console.error(`  [${labels[i]}] failed: ${r.reason.message}`);
      else console.log(`  [${labels[i]}] skipped (not configured)`);
    });
  }
})();
