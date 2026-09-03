/* Tests for whatsnew-core.js – the pure logic behind the homepage
 * "Latest from VelsTech" section (filter + sort + count formatting).
 *
 * Run: `node --test tests/whatsnew.test.js`
 * CI:  included in build-check.yml (added in the same commit).
 */

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { matchesFilter, sortByRecency, pickLatest, formatLatestCount } = require(path.join(__dirname, "..", "whatsnew-core.js"));
const ARTICLES = require(path.join(__dirname, "..", "articles.js"));

// Use a couple of synthetic articles to exercise edge cases that the live
// dataset doesn't cover (e.g. unknown category, featured boolean quirks).
const FIXTURES = [
  { url: "a.html", title: "A", category: "AI", tags: [], date: "2026-09-01", updated: "2026-09-04", featured: false },
  { url: "b.html", title: "B", category: "AI", tags: ["VelsTech Lab"], date: "2026-09-02", updated: "2026-09-03", featured: true },
  { url: "c.html", title: "C", category: "Hardware", tags: [], date: "2026-09-03", updated: "2026-09-02", featured: false },
  { url: "d.html", title: "D", category: "Operating Systems", tags: [], date: "2026-09-04", updated: "2026-09-01", featured: false },
  { url: "e.html", title: "E", category: "Programming & Web", tags: [], date: "2026-09-05", updated: "2026-09-05", featured: false },
  { url: "f.html", title: "F", category: "Tutorials", tags: [], date: "2026-09-06", updated: "2026-09-06", featured: false },
  { url: "g.html", title: "G", category: "Networking", tags: ["Benchmark"], date: "2026-09-07", updated: "2026-09-07", featured: false },
];

test("matchesFilter returns true for 'All' regardless of category/tags", () => {
  for (const a of FIXTURES) {
    assert.equal(matchesFilter(a, "All"), true, `expected ${a.url} to match All`);
  }
});

test("matchesFilter matches AI category exactly (case-sensitive)", () => {
  assert.equal(matchesFilter(FIXTURES[0], "AI"), true);
  assert.equal(matchesFilter(FIXTURES[2], "AI"), false);
  // Defensive: a typo'd lowercase 'ai' must NOT match. The real articles.js
  // always uses uppercase 'AI', but if a future contributor introduces a
  // typo, this test will fail and force them to fix the data or the filter.
  assert.equal(matchesFilter({ category: "ai" }, "AI"), false);
  assert.equal(matchesFilter({ category: "Ai" }, "AI"), false);
});

test("matchesFilter matches Hardware exactly", () => {
  assert.equal(matchesFilter(FIXTURES[2], "Hardware"), true);
  assert.equal(matchesFilter(FIXTURES[0], "Hardware"), false);
});

test("matchesFilter matches the Software bucket (OS + Programming + Tutorials)", () => {
  assert.equal(matchesFilter({ category: "Operating Systems" }, "Software"), true);
  assert.equal(matchesFilter({ category: "Programming & Web" }, "Software"), true);
  assert.equal(matchesFilter({ category: "Tutorials" }, "Software"), true);
  assert.equal(matchesFilter({ category: "Networking" }, "Software"), false);
  assert.equal(matchesFilter({ category: "AI" }, "Software"), false);
});

test("matchesFilter matches Lab by tag (VelsTech Lab or Benchmark)", () => {
  assert.equal(matchesFilter({ category: "AI", tags: ["VelsTech Lab"] }, "Lab"), true);
  assert.equal(matchesFilter({ category: "Hardware", tags: ["Benchmark"] }, "Lab"), true);
  assert.equal(matchesFilter({ category: "AI", tags: ["Other"] }, "Lab"), false);
  // Defensive: missing tags array must not throw.
  assert.equal(matchesFilter({ category: "AI" }, "Lab"), false);
});

test("matchesFilter returns false for unknown filter values", () => {
  assert.equal(matchesFilter(FIXTURES[0], "Unknown"), false);
  assert.equal(matchesFilter(FIXTURES[0], ""), false);
});

test("sortByRecency orders by updated desc, featured-first as tiebreak", () => {
  const sorted = sortByRecency([
    { url: "x", updated: "2026-09-01", featured: false },
    { url: "y", updated: "2026-09-05", featured: false },
    { url: "z", updated: "2026-09-05", featured: true },
    { url: "w", updated: "2026-09-03", featured: true },
  ]);
  assert.deepEqual(sorted.map((a) => a.url), ["z", "y", "w", "x"]);
});

test("sortByRecency falls back to date when updated is missing", () => {
  const sorted = sortByRecency([
    { url: "x", date: "2026-09-01", featured: false },
    { url: "y", updated: "2026-09-05", featured: false },
    { url: "z", date: "2026-09-10", featured: false },
  ]);
  assert.equal(sorted[0].url, "z");
  assert.equal(sorted[2].url, "x");
});

test("sortByRecency does not mutate the input array", () => {
  const input = [
    { url: "a", updated: "2026-09-01", featured: false },
    { url: "b", updated: "2026-09-05", featured: false },
  ];
  const before = input.map((a) => a.url);
  sortByRecency(input);
  assert.deepEqual(input.map((a) => a.url), before);
});

test("pickLatest returns up to `limit` articles in recency order", () => {
  const result = pickLatest(FIXTURES, "All", 3);
  assert.equal(result.length, 3);
  // g (2026-09-07) -> f (2026-09-06) -> e (2026-09-05)
  assert.deepEqual(result.map((a) => a.url), ["g.html", "f.html", "e.html"]);
});

test("pickLatest respects the filter", () => {
  const ai = pickLatest(FIXTURES, "AI", 10);
  assert.equal(ai.length, 2);
  assert.ok(ai.every((a) => a.category === "AI"));
});

test("pickLatest returns empty array if nothing matches", () => {
  const empty = pickLatest([], "All", 5);
  assert.deepEqual(empty, []);
});

test("formatLatestCount substitutes {n} with the article count", () => {
  assert.equal(formatLatestCount("{n} articles and counting.", 0), "0 articles and counting.");
  assert.equal(formatLatestCount("{n} articles and counting.", 1), "1 articles and counting.");
  assert.equal(formatLatestCount("{n} articles and counting.", 43), "43 articles and counting.");
});

test("formatLatestCount handles missing template gracefully", () => {
  assert.equal(formatLatestCount(undefined, 5), "5 articles");
  assert.equal(formatLatestCount("", 5), "5 articles");
  assert.equal(formatLatestCount(null, 5), "5 articles");
});

test("formatLatestCount handles Tamil / Hindi templates without breaking", () => {
  assert.equal(formatLatestCount("{n} கட்டுரைகள் மற்றும் தொடர்கிறது.", 43), "43 கட்டுரைகள் மற்றும் தொடர்கிறது.");
  assert.equal(formatLatestCount("{n} लेख और बढ़ते जा रहे हैं।", 43), "43 लेख और बढ़ते जा रहे हैं।");
});

// Smoke test against the real articles.js dataset. If this fails, the live
// "Latest" section on the homepage will be broken.
test("real ARTICLES dataset: every article passes matchesFilter for 'All'", () => {
  for (const a of ARTICLES) {
    assert.equal(matchesFilter(a, "All"), true, `article ${a.url} failed to match All`);
  }
});

test("real ARTICLES dataset: category values are all recognized by Software or other filters", () => {
  const known = new Set([
    "AI", "Hardware", "Operating Systems", "Networking",
    "Security & Privacy", "Programming & Web", "Tutorials",
  ]);
  for (const a of ARTICLES) {
    assert.ok(known.has(a.category), `unknown category "${a.category}" on ${a.url} — will be invisible to every filter except All`);
  }
});

test("real ARTICLES dataset: every article has url/title/date/updated", () => {
  for (const a of ARTICLES) {
    assert.ok(a.url && a.title && a.date, `article missing required fields: ${JSON.stringify(a).slice(0, 80)}`);
    assert.ok(a.updated, `article ${a.url} missing 'updated' field — sort will fall back to date but newer articles should always have it`);
  }
});