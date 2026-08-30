# VelsTech Newsletter – Setup & Operations

Everything needed to send the VelsTech Weekly via **Brevo** from your own domain.

## Stack

```
velstech.net  →  Cloudflare (DNS)  →  Brevo (sending)  →  Gmail/Yahoo/Outlook ✅
```

- **From address:** `newsletter@velstech.net`
- **Captures:** web3forms (homepage + resources.html) → export → import into Brevo
- **Delivery:** Brevo (free tier: 300 emails/day, unlimited contacts)

## DNS records (added to Cloudflare)

Zone: `velstech.net`. All records were added/verified via the `cf` CLI on 2026-08-27.

### Authentication
| Type | Name | Value |
|------|------|-------|
| TXT | `@` | `brevo-code:79e29a70fc9c272f81cef9c094a57e2f` |
| TXT | `@` | `v=spf1 include:_spf.mx.cloudflare.net include:sendinblue.com ~all` |
| CNAME | `brevo1._domainkey` | `b1.velstech-net.dkim.brevo.com` |
| CNAME | `brevo2._domainkey` | `b2.velstech-net.dkim.brevo.com` |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:rua@dmarc.brevo.com` |

### Branding
| Type | Name | Value |
|------|------|-------|
| CNAME | `newsletter` | `newsletter-velstech-net.brand.brevosend.com` |
| CNAME | `r.newsletter` | `newsletter-velstech-net.r.brand.brevosend.com` |
| CNAME | `img.newsletter` | `newsletter-velstech-net.img.brand.brevosend.com` |

## SPF merge (important)

`velstech.net` already had Cloudflare Email Routing's SPF on `@`:
`v=spf1 include:_spf.mx.cloudflare.net ~all`

**Do NOT add a second SPF record** – multiple SPF records break email for both systems.
Instead, keep the existing one merged:

```
v=spf1 include:_spf.mx.cloudflare.net include:sendinblue.com ~all
```

- `include:_spf.mx.cloudflare.net` → keeps `hello@velstech.net` (Email Routing) working
- `include:sendinblue.com` → authorizes Brevo

## Using the cf CLI to manage these records

```sh
# list zone records
cf dns records list -z velstech.net

# find a specific record (e.g. the SPF TXT on @)
cf dns records list -z velstech.net --name velstech.net --type TXT

# edit a record (SPF merge, for example)
cf dns records edit <record-id> -z velstech.net --body \
  '{"content":"v=spf1 include:_spf.mx.cloudflare.net include:sendinblue.com ~all"}'
```

> Auth note: `cf` is authenticated as velstechoffl@gmail.com (OAuth). `wrangler` is the
> Workers-oriented CLI; `cf` is the general-purpose one for DNS.

## Brevo sender compliance

All sender domains report compliant with Google / Yahoo / Microsoft sender requirements
(SPF + DKIM + DMARC verified, branding CNAMEs live). Sender: `newsletter@velstech.net`.

### Troubleshooting the "Branded record mismatch"
The CNAME was confirmed correct via `dig` (full chain resolves). A persistent Brevo error
was a stale check; fix by re-verifying in Brevo, waiting ~30–60 min, or deleting and
re-adding the single CNAME.

## Sending checklist (each issue)

1. Copy `newsletter/issue-001.md` → `newsletter/issue-00N.md`; update number/date/picks.
2. Fill the **Deal of the week** link (Amazon affiliate, tag `velstechoffl-21`).
3. Optional sponsor slot.
4. Paste into Brevo editor (use `newsletter/issue-001.html` for a pre-styled HTML version).
5. Send to a small test list first; then full list.
6. Keep the affiliate disclosure footer in every issue.

## Recommended practices

- **Double opt-in** on in Brevo signup forms for deliverability.
- Keep the **affiliate disclosure** line in every issue.
- Newsletter is subject to the site's [Affiliate Disclosure](https://velstech.net/disclosure.html)
  and [Privacy Policy](https://velstech.net/privacy.html).
