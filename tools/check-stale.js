const ARTICLES = require("../articles.js");

const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;
const now = Date.now();

const stale = ARTICLES.filter((a) => {
  const updated = new Date(a.updated + "T00:00:00Z").getTime();
  return now - updated > SIX_MONTHS_MS;
}).sort((a, b) => a.updated.localeCompare(b.updated));

const fs = require("fs");

function setOutput(name, value) {
  if (process.env.GITHUB_OUTPUT) {
    const delimiter = `vt_${Math.random().toString(36).slice(2)}`;
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `${name}<<${delimiter}\n${value}\n${delimiter}\n`);
  } else {
    console.log(`[output] ${name}=${value}`);
  }
}

if (stale.length) {
  const lines = stale.map(
    (a) => `- [${a.title}](${a.url}) – last updated ${a.updated}`
  );
  const body = [
    "The following articles haven't been updated in more than 6 months. Review each and decide whether it needs a refresh:",
    "",
    ...lines,
    "",
    "_This issue is generated automatically by the weekly stale-check workflow._",
  ].join("\n");

  setOutput("stale", "true");
  setOutput("body", body);
  console.log(`Stale articles found: ${stale.length}`);
} else {
  setOutput("stale", "false");
  console.log("No stale articles found. All good!");
}
