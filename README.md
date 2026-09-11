# vellum-institute-site

Static site for [velluminstitute.org](https://velluminstitute.org), deployed on Cloudflare Pages.

Public pricing on the homepage stays **By inquiry**. Dollar figures live only on the unlisted, password-gated tuition page.

## Paths

| Path | Indexed | Notes |
| --- | --- | --- |
| `/` | yes | Public homepage. Pricing remains by inquiry. Hash nav still scrolls in-page. |
| `/courses/` | yes | Seminar catalog with unique title and Course JSON-LD. |
| `/how-it-works/` | yes | Application-to-seminar process. |
| `/pricing/` | yes | Public pricing page. Dollar figures stay by inquiry. |
| `/guided-research/` | yes | Optional post-seminar research / apprenticeship. |
| `/faq/` | yes | Q&A in the initial HTML plus FAQPage JSON-LD. |
| `/apply/` | yes | Inquiry form (same endpoint as the homepage). |
| `/counselors/` | yes | Explains the counselor survey gate. Does not embed the questionnaire. |
| `/llms.txt` | yes | Plain-text institute summary for crawlers and LLM agents. |
| `/offer/` | no | Gated tuition configurator + Spring 2027 full application. Not in primary nav or the sitemap. |
| `/offer/unlock.html` | no | Password form for `/offer/`. |
| `/tuition/` | no | Redirects to `/offer/`. |
| `/full-application.html` | no | Redirects to `/offer/` (old links enter the gated flow). |
| `/api/offer-unlock` | — | Pages Function. Checks `PRICING_GATE_PASSWORD`, sets an HttpOnly cookie. |
| `/api/offer-lead` | — | Pages Function. Optional secondary write after a successful application. No Stripe, no charges. |

Counselor survey questionnaire: [https://vellum-counselor-survey.pages.dev/gate](https://vellum-counselor-survey.pages.dev/gate) (separate host).

## Cloudflare Pages setup

1. Deploy this repo as a Pages project (output directory: `/`, or the repo root).
2. In **Settings → Environment variables**, set the same secrets on Production and Preview:

   | Name | Required | Purpose |
   | --- | --- | --- |
   | `PRICING_GATE_PASSWORD` | yes | Shared password for `/offer/`. Do not commit a real value. |
   | `OFFER_LEAD_WEBHOOK` | no | HTTPS URL that accepts a JSON POST of an offer lead. |

Production secret `PRICING_GATE_PASSWORD` is set via wrangler/dashboard; redeploy required after rotate.

3. Optional D1: create a database, bind it as `DB`, and the lead function will create `offer_leads` on first successful write.

   ```sql
   -- Created automatically if missing. Shown here for operators.
   CREATE TABLE IF NOT EXISTS offer_leads (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     created_at TEXT NOT NULL,
     parent_name TEXT,
     student_name TEXT,
     email TEXT,
     phone TEXT,
     country TEXT,
     country_name TEXT,
     seminar_count INTEGER,
     include_research INTEGER,
     payment_method TEXT,
     seminar_subtotal INTEGER,
     seminar_discount INTEGER,
     research_total INTEGER,
     grand_total INTEGER,
     notes TEXT
   );
   ```

4. If neither D1 nor `OFFER_LEAD_WEBHOOK` is configured, `/api/offer-lead` still accepts a valid, gated submission and returns `{ ok: true, stored: "stub", charged: false }`. Wire storage before treating that as a production inbox.

Session cookie: `vellum_offer` (HttpOnly, Secure, SameSite=Lax, 7 days). It is an HMAC of the expiry timestamp using `PRICING_GATE_PASSWORD`. Changing the password invalidates existing sessions.

## Local preview

```bash
cp .dev.vars.example .dev.vars
# put a throwaway password in .dev.vars — never a production secret
npx wrangler pages dev . --compatibility-date=2026-01-15
```

A plain static server (`python3 -m http.server`) can show the HTML, but it will not run the gate or the lead function.

## Pricing math (gated page only)

- Seminar: **$1,750**
- Guided research / apprenticeship add-on: **$3,300** (8 hours; after the seminar; same professor)
- Two seminars: **10% off seminar tuition only** (not the research add-on)
- Seats: first come, first served
- Payment options are UI placeholders (card / ACH). No charge on submit.
- One submit on `/offer/` writes the full application to the Spring 2027 Apps Script endpoint (same `/exec` URL as the former `full-application.html` page). Package totals go in the existing `notes` field plus dedicated pricing keys so ID minting (`27SPRC###`) stays server-side. An optional `/api/offer-lead` POST may follow; application success does not depend on it.

## Tests

```bash
node scripts/test-offer-pricing.mjs
node scripts/test-seo-phase1.mjs
```

The same script also checks that `/offer/` has no invoice option or notes field, and that application payloads keep `source: 'full-application'` with pricing written into `notes`.
