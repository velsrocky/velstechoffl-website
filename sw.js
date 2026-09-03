/* VelsTech service worker – offline support for guides + tools.
 *
 * Strategy:
 *  - Precache: app shell basics (root, offline fallback, manifest, font, logo).
 *  - Navigations (HTML): network-first → cache fallback → offline.html.
 *    Fresh content when online; last-known page when offline.
 *  - Same-origin assets (css/js/img/font): cache-first → network.
 *    Versioned URLs (?v=N) form new cache keys automatically after a bump;
 *    old entries are pruned on activate.
 *  - Cross-origin requests (chat proxy, RSS feeds): passed through untouched.
 *    Non-GET requests: passed through untouched.
 *
 * Bump SW_VERSION to invalidate every cache (structure/strategy changes only –
 * asset changes need nothing, the ?v=N cache keys handle themselves).
 */

const SW_VERSION = "v1";
const SHELL_CACHE = `velstech-shell-${SW_VERSION}`;
const RUNTIME_CACHE = `velstech-runtime-${SW_VERSION}`;
const RUNTIME_LIMIT = 120;

const PRECACHE = [
  "/",
  "/offline.html",
  "/manifest.json",
  "/fonts/InterVariable.woff2",
  "/logo.svg",
  "/favicon.ico",
  "/icon-192.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((n) => n.startsWith("velstech-") && n !== SHELL_CACHE && n !== RUNTIME_CACHE)
          .map((n) => caches.delete(n))
      );
      await trimRuntime();
      await self.clients.claim();
    })()
  );
});

async function trimRuntime() {
  const cache = await caches.open(RUNTIME_CACHE);
  const keys = await cache.keys();
  if (keys.length <= RUNTIME_LIMIT) return;
  // keys() order is insertion order in practice – drop oldest overflow
  await Promise.all(keys.slice(0, keys.length - RUNTIME_LIMIT).map((k) => cache.delete(k)));
}

async function cacheFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  try {
    const res = await fetch(request);
    if (res && res.ok) {
      cache.put(request, res.clone());
      trimRuntime();
    }
    return res;
  } catch (err) {
    const shell = await caches.open(SHELL_CACHE);
    return (await shell.match(request)) || Response.error();
  }
}

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const res = await fetch(request);
    if (res && res.ok) {
      cache.put(request, res.clone());
      trimRuntime();
    }
    return res;
  } catch (err) {
    const hit =
      (await cache.match(request)) ||
      (await caches.open(SHELL_CACHE).then((c) => c.match(request)));
    if (hit) return hit;
    // uncached navigation → offline fallback
    const shell = await caches.open(SHELL_CACHE);
    const offline = await shell.match("/offline.html");
    return offline || Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // chat proxy, RSS feeds, CDNs
  if (url.pathname.startsWith("/pdf-to-image/")) return; // separate Next.js app

  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(networkFirst(request));
    return;
  }

  const assetTypes = ["style", "script", "image", "font"];
  if (assetTypes.includes(request.destination) || url.pathname.startsWith("/fonts/")) {
    event.respondWith(cacheFirst(request));
  }
});
