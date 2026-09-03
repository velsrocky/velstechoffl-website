/* whatsnew-core.js – pure logic shared by the homepage "Latest" section
 * and its tests. Loaded as a plain <script> by index.{html,hi.html,ta.html}
 * (before script.js) and required by tests/whatsnew.test.js.
 *
 * No DOM, no globals, no I/O. Easy to test with `node --test`.
 */

(function (root) {
  "use strict";

  function matchesFilter(a, filter) {
    if (filter === "All") return true;
    if (filter === "AI") return a.category === "AI";
    if (filter === "Hardware") return a.category === "Hardware";
    if (filter === "Software") return ["Operating Systems", "Programming & Web", "Tutorials"].includes(a.category);
    if (filter === "Lab") return Array.isArray(a.tags) && (a.tags.includes("VelsTech Lab") || a.tags.includes("Benchmark"));
    return false;
  }

  // Sort articles by `updated` desc, then featured-first as tiebreak.
  // Pure function; returns a new array.
  function sortByRecency(articles) {
    return [...articles].sort((a, b) => {
      const ad = (a.updated || a.date || "");
      const bd = (b.updated || b.date || "");
      const d = bd.localeCompare(ad);
      if (d !== 0) return d;
      const af = a.featured ? 1 : 0;
      const bf = b.featured ? 1 : 0;
      return bf - af;
    });
  }

  function pickLatest(articles, filter, limit) {
    const filtered = articles.filter((a) => matchesFilter(a, filter));
    const sorted = sortByRecency(filtered);
    return sorted.slice(0, limit || 5);
  }

  // Format the "{n} articles and counting." template with the article count.
  // Falls back to a sane default if template is missing/undefined.
  function formatLatestCount(template, n) {
    const safe = (template && typeof template === "string") ? template : "{n} articles";
    return safe.replace("{n}", String(n));
  }

  const api = { matchesFilter, sortByRecency, pickLatest, formatLatestCount };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.WhatsNewCore = api;
  }
})(typeof window !== "undefined" ? window : globalThis);