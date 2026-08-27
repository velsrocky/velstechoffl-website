# VelsTech Monetization — Setup Manual

Step-by-step actions required to turn on the four monetization streams. Everything that
needs an account/approval is manual; the code side is already in place and documented below.

## 1. Software / cloud affiliate URLs (cash-per-sale focus)

**Strategy:** prioritize programs that pay **cash per sale** (some with recurring revenue
share) over credit-based referral programs. All plumbing is done via `data-aff="key"` links
in `resources.html`; you only need to sign up and paste referral URLs into `AFFILIATE_LINKS`
in `script.js` (~lines 12–27).

### Priority — cash-per-sale (verified)

| Key | Program | Verified payout | Sign up / where to find your link |
|-----|---------|-----------------|-----------------------------------|
| `hostinger` | Hostinger (web hosting) | **40%+ per sale**, grows with volume | https://affiliates.hostinger.com |
| `nordvpn` | NordVPN (VPN) | **40–100% per sale** + **30% recurring** on renewals; same program unlocks NordPass/NordLocker | nordvpn.com → affiliate program |
| `kit` | Kit / ConvertKit (email) | **50% of first 12 months** per referred customer + **10–20% recurring** (tiered) | https://kit.com/affiliates |
| `brevo` | Brevo (email/CRM) | affiliate program, reward per referred signup | https://www.brevo.com/partners → Affiliate Program |

> You're already a Brevo customer and run a newsletter — Kit and Brevo both fit the
> audience naturally. These four are the ones to wire up **first**.

### Secondary — credit-based referral programs

| Key | Program | Payout model |
|-----|---------|--------------|
| `digitalocean` | DigitalOcean | $25 credit per referred new user (credit, not cash) |
| `runpod` | RunPod | referral credits |
| `vastai` | Vast.ai | referral credits |
| `bitwarden` | Bitwarden | referral credits |
| `proton` | Proton Pass | referral credits |
| `tailscale` | Tailscale | credits for Pro |
| `hetzner` | Hetzner | no public program confirmed → remove `data-aff` if none |
| `namecheap` | Namecheap | check current program → remove `data-aff` if none |
| `copilot` | GitHub Copilot | no public program confirmed → remove `data-aff` if none |

### Action
1. Sign up for the four cash-per-sale programs above.
2. Paste each referral URL into `AFFILIATE_LINKS` in `script.js`.
3. For the credit-based programs, set them only if the effort is trivial — they earn
   credits, not revenue. If a program doesn't exist, delete the `data-aff="key"` attribute
   from the link in `resources.html` (the card keeps its plain link).

Once a URL is set, the `data-aff` link automatically gets:
`target="_blank"` and `rel="sponsored nofollow noopener"` (no code change needed).

### After filling the map
- Bump the cache-buster: `script.js?v=N` → next number across all `*.html`
  (`sed -i 's/script\.js?v=15/script.js?v=16/g' -- *.html`).
- Test: click each linked card on resources.html → should open the referral URL in a new tab.

## 2. Amazon Business link (verify via SiteStripe)

The current placement on `resources.html` uses a best-guess URL:
`https://www.amazon.in/business?tag=velstechoffl-21`

To get the **canonical tracked link**, use Amazon's SiteStripe:

1. Install the **SiteStripe** bookmarklet (Amazon Associates → Tools → SiteStripe) in your browser.
2. Browse to `https://www.amazon.in/business` (or the Business signup/registration page).
3. Click the SiteStripe bookmarklet while on that page.
4. Choose the link type and copy the generated URL — it will carry your `tag=velstechoffl-21`
   and any business-bounty parameters Amazon adds.
5. Replace the `href` on the Amazon Business card in `resources.html` with the SiteStripe URL
   (keep `target="_blank"` and `rel="sponsored nofollow noopener"`).

> The Amazon Business bounty (e.g. ₹200 for qualifying registrations) is tracked only through
> a properly-generated link — the best-guess URL may not earn it. Use SiteStripe to be safe.

## 3. Brevo: create sender, import subscribers, send

### Create the sender
1. Brevo → **Settings → Senders & IP** → **Create Sender**.
2. Email: `newsletter@velstech.net` · Name: `VelsTech`.
3. Domain authentication is already fully verified (see `NEWSLETTER-SETUP.md`).

### Import subscribers (from web3forms)
1. **Export** the collected emails from web3forms (homepage + resources forms).
2. Brevo → **Contacts → List → New list** (e.g. `VelsTech Weekly`).
3. **Import** → upload CSV. Format (see `newsletter/subscribers-template.csv`):
   ```
   EMAIL,NAME
   someone@example.com,Someone
   ```
   Map the CSV columns to Brevo's `EMAIL` and `FIRSTNAME` fields during import.
4. Recommended: use **double opt-in** (Brevo → Settings → Company → double opt-in) so your
   list is compliant and deliverability stays high.

### Send issue #1
1. Brevo → **Campaigns → Email → Create**.
2. Paste the HTML from `newsletter/issue-001.html` (email-safe, table layout, inline styles).
3. Add the Deal-of-the-week affiliate link (already templated with `tag=velstechoffl-21`).
4. Sender: `newsletter@velstech.net` · Subject: e.g. "VelsTech Weekly #1 — GPUs for local AI, VRAM guide, 15 free tools".
5. Send a **test** to yourself first, then to the full list.

### Automation (later)
Brevo → **Automation** → trigger a welcome email on signup. For now, web3forms collects and
you import manually — add this once the list is a steady flow.

## 4. AdSense (client ID live — Auto Ads)

Client ID is set in `script.js` and the AdSense loader is injected on every page
(**Auto Ads** mode — Google decides placement; ads only serve once AdSense approves
the site):

```js
const ADSENSE_CLIENT = "ca-pub-5002392377660300"; // live
const ADSENSE_SLOT = "";                            // optional manual ad unit
```

Optionally, create an ad unit in AdSense → paste its slot ID into `ADSENSE_SLOT`; then
`initAdsense()` also inserts a responsive unit before `.article-nav` on article pages.

Checklist once approved:
- Confirm ads render (incognito, since ad-blockers hide them).
- Ensure affiliate/adsense pages (disclosure.html, privacy.html) stay live and linked —
  AdSense policy requires transparency.

---

## Status recap

| # | Stream | Code ready | Needs you |
|---|--------|-----------|-----------|
| 1 | Software affiliates (cash-per-sale) | ✅ `AFFILIATE_LINKS` + `data-aff` links | Sign up for Hostinger, NordVPN, Kit, Brevo → paste URLs into `script.js` |
| 2 | Amazon Business | ✅ card placed | Generate canonical link via SiteStripe, replace href |
| 3 | Newsletter | ✅ DNS + Brevo compliant + draft HTML | Create sender, import subscribers, send |
| 4 | AdSense | ✅ client ID live (Auto Ads) | Await approval; optional manual slot ID |
