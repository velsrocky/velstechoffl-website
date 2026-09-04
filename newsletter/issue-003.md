# VelsTech Weekly – Issue #3

**Date:** Sep 5, 2026 · **Read time:** ~4 min

> How to reuse this file: copy `newsletter/issue-003.md` to `newsletter/issue-004.md`,
> update the number/date, refresh the five picks, and paste into your newsletter provider.
> Placeholders to fill every week: `[DEAL LINK]`, `[SPONSOR SLOT – optional]`, and the
> weekly intro. Also update the "Read Issue #N" link on the homepage (all 3 languages).

---

**Hey, here's VelsTech Weekly #3.** *(edit me each week)*

This week I broke my own site in three languages – and then hardened it. A Tamil word
that refused to fit on a phone, a chat widget that wouldn't let go of the old language,
and a Content-Security-Policy that went to war with Google Ads. Plus the best benchmark
surprise yet on the 6800M. If something's wrong or missing, just reply and tell me.

---

## 🤖 AI

**1. Qwen3.8 27B on a 12 GB RX 6800M – and it's not the model I thought it was**
IQ2_XS vs IQ3_S, same model, same flags: 20.8 vs 19.0 tok/s decode, 52K vs 4K context.
Then the re-runs flipped the story: enabling the MTP head hit 23 tok/s, and "letting
--fit do the right thing" *collapsed* decode to 7.3 tok/s – because Qwen3.8 is a Gated
Delta Net hybrid and ROCm has no fused kernel for it. My "mistake" was the correct config.
→ https://velstech.net/qwen38-27b-gsq-rco-rx6800m.html

**2. The benchmark database grew to 14 GPU × model combos (20 rows)**
Four new entries for the Qwen3.8 runs, each labelled 🧪 Tested or 📐 Estimated – and the
explorer now reads one live data source, so nothing drifts behind anymore.
→ https://velstech.net/benchmarks/

## 🔧 Under the hood

**3. The Tamil word that broke mobile on 108 pages**
"புரிந்துகொள்ளக்கூடிய" – one unbreakable 21-character word. Tamil is agglutinative: no
spaces, no hyphenation points, and flex/grid items refuse to shrink below their longest
word. The fix is three CSS properties (`overflow-wrap: anywhere`, `min-width: 0`, and
knowing when to use `display: block` instead of flex). If your site has a Hindi or Tamil
version, open it at 320px width today.
→ https://velstech.net/lab.html

**4. An event that fires before the state changes is a lie**
The chat widget re-localises on a language-change event – but the event fired *before*
the URL swap, and the language is read from the URL first. Result: switching away from a
translated page left the chat speaking the old language. One re-dispatch after
`pushState` fixed it; a headless-Chrome test makes sure it never comes back.
→ https://velstech.net/lab.html

**5. I gave my site a CSP. Google Ads fought me for four rounds.**
`adtrafficquality.google`? Not in any doc I found – it just appeared in the console.
While auditing, I also found a real XSS in my own notes tool (unescaped search echo) and
learned that Cloudflare zone purges don't touch Pages' own cache. Full header + policy
are now in the repo, and the audit found zero secrets anywhere.
→ https://velstech.net/start-here.html

## 📚 New on the site

**6. A pipeline that refuses half-finished articles**
New routine: scaffold → translate → one `sync-all` command regenerates hreflang, feed,
search, OG images and benchmark pages – and a CI guard fails the build if any article is
missing its Hindi or Tamil version. Shipping an English-only article is now structurally
impossible.
→ https://velstech.net/tutorials.html

## 🔥 Deal of the week

**[Pick one deal – e.g. a GPU, NVMe SSD, or VPS offer.]**
One sentence on why it's a good deal and for whom.
→ [DEAL LINK – add Amazon affiliate link here, e.g. https://www.amazon.in/s?k=NVMe+SSD+1TB&tag=velstechoffl-21]

---

*Some links in this newsletter are affiliate links – if you buy through them, VelsTech may
earn a small commission at no extra cost to you. Full disclosure: https://velstech.net/disclosure.html*

---

**VelsTech – Practical AI, Linux & Hardware.** · [Home](https://velstech.net/) · [Subscribe](https://velstech.net/#newsletter) · [Unsubscribe](mailto:hello@velstech.net?subject=unsubscribe)

*You're receiving this because you subscribed at velstech.net. We don't track or share your
email.*
