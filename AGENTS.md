# AGENTS.md

Working agreement for anyone (human or AI) editing this storefront. Read this
before your first change; it exists because the repo is small enough to look
obvious and wrong often enough.

## The directory trap

There are multiple copies of this project on this machine:

- **`pet-ramp-store`** — prototype 1, FROZEN. The VS Code window usually has
  this one open. **Do not edit it** unless explicitly told to.
- **`pet-ramp-store-2`** — prototype 2, superseded. Do not target it for this
  launch.
- **`pet-ramp-store-3`** — prototype 3, superseded by 4 (still on GitHub as
  `businesslocalrecords/pet-ramp-store-3`). Do not target it for this launch.
- **`pet-ramp-store-4`** — prototype 4, **THE LIVE WORK** (this directory,
  pushed to `businesslocalrecords/pet-ramp-store-4`). All edits, builds and
  git commands target this directory. Verify `pwd` before any command.

## Commands

```bash
npm install
npm run dev                    # local dev server
npm run build                  # tsc -b && vite build  (must be clean)
npm run lint                   # oxlint (must be zero warnings)
npm run preview -- --port 4173 --host 127.0.0.1
node scripts/shopify-seed.mjs --dry-run   # preview catalog, no credentials
npm run shopify:seed           # LIVE — mutates the Shopify store
npm run shopify:verify         # re-reads the store and compares
npm run shopify:discounts:dry  # preview package discount setup, no writes
npm run shopify:discounts:apply # LIVE — creates Shopify bundle discount codes
```

Node 22 / npm 11 (matched to local tooling and the deploy workflow in
`DEPLOYMENT.md`).

## Architecture map

```
src/
├── lib/
│   ├── policy.ts              SINGLE SOURCE: every policy number (30-day,
│   │                          12-month, 5–7 business-day delivery, support
│   │                          reply time, who pays returns)
│   ├── assets.ts              SINGLE SOURCE: asset paths, content GATES,
│   │                          BUSINESS identity, founder-note placeholder
│   ├── offers.ts              SINGLE SOURCE: tiers/prices/compare-at,
│   │                          product names, add-on prices, RAMP_SIZES,
│   │                          slopeDeg()/recommendSize(), bundleSavings(),
│   │                          money()/formatMoney(), PRODUCT_HANDLES
│   ├── bundle-discounts.json  Shopify product handles + bundle discount codes
│   ├── shopify.ts             Storefront API client (products, stock, cart)
│   ├── cart.tsx / cart-context.ts     CartProvider + localStorage cart
│   ├── purchase-provider.tsx  SINGLE buy() for both CTAs; size→variant
│   │                          resolution; attribution forwarding; events
│   ├── purchase-context.ts    usePurchase() type surface
│   ├── dki.ts                 whitelisted DKI headlines (NEVER raw params)
│   └── analytics.ts           GA4 / Google Ads / Meta Pixel events
├── components/                one file per section; BuyBox is the register
├── pages/index.tsx            12-col split layout (left editorial 7, right 5)
└── styles/globals.css         Tailwind v4 theme + tokens

public/
├── assets/product/*.svg       original renderings (white background)
├── assets/badges/*.svg        in-house trust badges
└── {shipping,returns,warranty,privacy,terms,contact,about}/index.html
    guide/how-to-choose-a-dog-car-ramp/index.html   (static HTML, served as
    files; forms are being re-pointed off Netlify — see DEPLOYMENT.md)

scripts/shopify-seed.mjs       Admin API catalog seeder (idempotent)
```

## The four single-source rules

1. **Policy numbers** come from `src/lib/policy.ts`. Never hardcode
   "30-day", "1-year", "5–7 business days" in a component or page. Static
   `public/` pages cannot import TS — they restate the values with an HTML
   comment saying they mirror `policy.ts`.
2. **Prices/sizes/specs** come from `src/lib/offers.ts`
   (`money()`/`formatMoney()` are mandatory — `139.99 - 79.99` is
   `60.000000000000014` in JS).
3. **Product identity** comes from `PRODUCT_NAMES` in `offers.ts` — the buy
   box, the purchase flow and analytics all use it.
4. **Handles** in `PRODUCT_HANDLES` must match the seeder's handles. The
   tether was renamed to "Adjustable Car Safety Tether" but its HANDLE is
   still `crash-tested-adjustable-car-safety-tether` — do not "fix" it.

## The asset-gate pattern

Sections that need real, owner-supplied content are OFF by default:

| Gate | Section | Real asset needed |
|---|---|---|
| `GATES.videoProof` | `VideoProof` | owner demo clip |
| `GATES.ugcGallery` | `UGCGallery` | credited customer clips |
| `GATES.testimonials` | `Testimonials` | real review source |
| `GATES.founderNote` | `FounderNote` | founder's real note |

To enable one: add the asset to `public/assets/`, replace the placeholder
copy, flip the flag in `src/lib/assets.ts`, cross it off `LAUNCH_BLOCKERS.md`.
The gate lives inside the component *after* the hooks (hooks must run
unconditionally), and `pages/index.tsx` also wraps the section so a disabled
section never downloads its lazy chunk.

## Claim discipline

No invented reviews, review quotes, reviewer names, "94% of customers", vet
endorsements, medical claims, or lifetime warranties. Numeric star ratings
and a rating count stay on every product, including JSON-LD `aggregateRating`
using the `rating` and `ratingCount` already in `src/lib/catalog.ts` (owner
decision, 20 Oct 2026, recorded in `claims.md`). Named reviews stay behind
`GATES.testimonials`. Every rewording is recorded with its reason in
`claims.md` — add a row before adding a claim. Compare-at prices are allowed
as a subtle anchor (owner decision) but must be real prices the store has charged.

## Untracked working files

The working directory holds material that is deliberately NOT committed
(`edited pics/`, `product images/`, `product-photos.pdf`, `tez imagz/`,
`screenshots/`, `.kilo/`). `UNTRACKED.md` says what each one is, why it stays out of git, and
what must happen first if you later want to track any of it. Stage files
explicitly — never `git add -A`, which would sweep all of it in.

## DKI safety

`src/lib/dki.ts` maps whitelisted URL keywords (`kw_vehicle`, `loc`,
`kw_breed`) to pre-written headlines. Raw params are never interpolated into
the DOM. Unknown values fall back to neutral defaults. Do not reintroduce
string interpolation of URL data.

## Purchase flow notes

- `buy()` creates a fresh cart with ramp → mat → tether lines, applies the
  selected package code from `bundle-discounts.json`, verifies Shopify's
  returned discount and total, then redirects with gclid/utm forwarded.
- Size selection (`setRampSize`) resolves the Shopify variant by title via
  `RAMP_VARIANT_MATCHERS`; the Extended variant carries a $40 delta applied
  to `rampPrice` and the live `total`.
- Coupon `RAMP20` was removed. Bundle codes are `PGRIPMAT5` and
  `PGRIPKIT3498`; the Admin script requires `write_discounts` to create them.
  `read_discounts` allows it to inspect and reconcile existing codes.
- Purchase conversions belong to the Shopify Customer Events custom pixel —
  the app never sees the thank-you page.

## Verification (do this before every commit)

```bash
npm run build && npm run lint

# no stray policy numbers / prices outside their owners
grep -rn "30-day\|30 day" src/ index.html | grep -v "policy.ts"
grep -rn "1-year\|12-month\|lifetime\|Lifetime" src/ index.html
grep -rn "79.99\|139.99\|49.99" src/ | grep -v "offers.ts"

# no fabricated content anywhere
grep -rni "RAMP20\|vet-approved\|vet approved\|2,847\|2847\|94%" src/ index.html
```

Visual check: `npm run preview -- --port 4173 --host 127.0.0.1`, then a
headless Edge screenshot at 1440px and 390px widths. ERROR lines from Edge's
sandbox telemetry are harmless. Scroll-triggered UI (the mobile buy bar,
glass header) cannot be captured this way — verify those manually.

## Deployment gotchas

Hosting is now the dedicated domain **pawgrip.app** (Cloudflare DNS + TLS)
served from a **Linode VPS** running nginx — **`DEPLOYMENT.md` is the full
working agreement** (the old Network Solutions / `businesslocalrecords.com`
route is archived there). The short version:

- `import.meta.env.VITE_*` is inlined at BUILD time — the values live as
  GitHub Actions repository secrets/variables, and changing one means a NEW
  deploy (push to `main` or `workflow_dispatch`).
- Push to `main` = deploy. `.github/workflows/deploy-linode.yml` builds and
  rsyncs `dist/` to the VPS over SSH (`deploy` user). GitHub Actions, not
  Netlify; no deploy previews here.
- The catch-all rewrite and the security/cache headers from `netlify.toml`
  (retired) live in `public/.htaccess`, which Vite copies into `dist/`. That
  file is **Apache-only** — under the Linode nginx host it is inert; the
  equivalent SPA / headers / cache behavior is installed by
  `deploy/linode-setup.sh` (see DEPLOYMENT.md).
- Forms (contact + founding-tester) → re-pointed to Formspree
  (`public/contact/index.html` → `https://formspree.io/f/mljgpwkd`,
  `public/guide/how-to-choose-a-dog-car-ramp/index.html` →
  `https://formspree.io/f/mrpeyavj`). The static `data-netlify` attributes
  and hidden detection forms in index.html were removed.
- Rollback = `git revert` and push; there is no previous-deploy switcher.
