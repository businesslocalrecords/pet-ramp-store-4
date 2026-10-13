# PawGrip Pro — Headless Shopify Landing Page

A high-conversion, single-product landing page for a foldable dog car ramp.
Built with **React 19 + Vite + Tailwind CSS v4**, powered by the **Shopify
Storefront API** (headless — Shopify handles checkout).

V3 is the honesty overhaul: fabricated reviews, vet endorsements, coupon
codes, fake countdowns and unsupported medical claims were removed and
replaced with published specifications, computed slope math, and gated
slots that stay empty until real content exists. See `claims.md` for the
full rewording table and `LAUNCH_BLOCKERS.md` for what is still needed
before paid traffic.

## Sections

| # | Section | Purpose |
|---|---------|---------|
| 1 | `AnnouncementBar` | Static service bar — shipping, guarantee, warranty (all from `policy.ts`) |
| 2 | `StickyHeader` | Logo + live offer price + cart on scroll (no CTA button — owner request) |
| 3 | `HeroSection` | Whitelisted DKI headline, honest byline, product gallery |
| 4 | `Benefits` | Three benefit cards, every number computed or published |
| 5 | `ComparisonTable` | Compact / Extended / Lifting / Jumping + limitation row + buyer's checklist |
| 6 | `SizeGuide` | Interactive finder: Compact-first recommendation, practical spec comparison (no degree math in the UI) |
| 7 | ~~`TrustBadges`~~ | Removed — duplicated trust claims shown elsewhere (owner instruction; see `claims.md`) |
| 8 | `ShippingReturns` | 4-step process + policy detail panels |
| 9 | `Faq` | Accordion + FAQPage JSON-LD (answers from published specs) |
| 10 | `Footer` | Final CTA, business identity, real policy-page links |
| 11 | `StickyMobileBuyBar` | Mobile buy bar sharing the purchase context |
| — | Gated: `VideoProof` / `UGCGallery` / `Testimonials` / `FounderNote` | Inert until real content exists (`GATES` in `src/lib/assets.ts`) |

## Quick Start

```bash
npm install
cp .env.example .env.local     # then fill in your Shopify credentials
npm run dev                    # http://localhost:5173
npm run build                  # production bundle in dist/
npm run lint                   # oxlint
npm run shopify:seed:dry       # preview the catalog (no credentials needed)
npm run shopify:seed           # create/update the catalog in Shopify (LIVE)
```

## Single sources of truth

Do not duplicate these values anywhere else:

| File | Owns |
|---|---|
| `src/lib/policy.ts` | Every policy number: 30-day guarantee, 12-month warranty, ship/delivery times, support reply, who pays returns |
| `src/lib/assets.ts` | Asset paths, content `GATES`, `BUSINESS` identity, founder-note placeholder, `VITE_REQUIRE_BUSINESS_INFO` flag |
| `src/lib/offers.ts` | Tiers, prices, compare-at, product names, add-on prices, `RAMP_SIZES` specs, `slopeDeg()`, `bundleSavings()`, `money()`/`formatMoney()`, `PRODUCT_HANDLES` |

`money()` / `formatMoney()` are mandatory for displayed prices — JS floats
make `139.99 - 79.99` render as `60.000000000000014` otherwise.

## Shopify Setup

### 1. The three credentials (this trips everyone up)

| Variable | Format | Used by | Can create products? |
|----------|--------|---------|---------------------|
| `VITE_SHOPIFY_STOREFRONT_TOKEN` | 32-char hex ("public access token") | React frontend | No — read published products, write carts |
| `SHOPIFY_CLIENT_ID` + `SHOPIFY_CLIENT_SECRET` | ~32 char / `shpss_…` | `scripts/shopify-seed.mjs` | Yes |
| `SHOPIFY_ADMIN_ACCESS_TOKEN` | `shpat_…` | `scripts/shopify-seed.mjs` | Yes |

**The Storefront and Admin token formats are not interchangeable.** An `shpat_`
Admin token sent to the Storefront API returns `401`, which breaks every product
query on the site. Storefront tokens are hex, public by design, and safe to ship
in browser JS.

Currently in use for `vynils-galor.myshopify.com`:

| Variable | Value |
|----------|-------|
| `VITE_SHOPIFY_STOREFRONT_DOMAIN` | `vynils-galor.myshopify.com` |
| `VITE_SHOPIFY_STOREFRONT_TOKEN` | `055c1ac160fae23c3f43f80b9bfceee6` |
| `SHOPIFY_CLIENT_ID` | `7a3868cb0531481a4d1c51356b478e8b` |
| `SHOPIFY_CLIENT_SECRET` | *(secret — in `.env.local` only)* |

The storefront app must also grant `unauthenticated_read_product_inventory`
for live stock counts; without it the site still works, and stock messaging
stays hidden rather than erroring.

### 2. Run the seeder

```bash
npm run shopify:seed:dry    # preview, no credentials needed, no writes
npm run shopify:seed        # create or update the catalog (mutates LIVE data)
npm run shopify:verify      # re-check what exists in the store
npm run shopify:purge -- --yes   # DELETE every non-catalog product
```

**The seeder is idempotent.** It remembers the product IDs it created in
`scripts/seed-output.json` and uses `productUpdate` on those instead of
`productCreate`. Variants re-sync automatically when the option/price set
changes (the `variantSignature` in the manifest) — so adding the Extended
(70″) variant to an existing store updates it rather than duplicating it.

**`--purge` is for reusing a store that already has junk in it.** It deletes
everything that is not part of the PawGrip catalog and keeps the Shopify
`gift-card` product, which is not API-deletable and is ignored by Shopping
ads. It prints the exact list first and requires `--yes`.

### 3. Products

| Handle | Title | Price | Compare-at | Status | Role |
|--------|-------|-------|-----------|--------|------|
| `premium-foldable-dog-car-ramp` | The Premium Foldable Dog Car Ramp by PawGrip Pro | $79.99 / $119.99 (Extended) | $139.99 / $179.99 | ACTIVE | Main funnel product (2 size variants) |
| `heavy-duty-traction-mat-upgrade-2-pack` | Heavy-Duty Traction Mat Upgrade (2-Pack) | $15.00 | $30.00 | ACTIVE | Pre-checkout bump |
| `crash-tested-adjustable-car-safety-tether` | Adjustable Car Safety Tether *(renamed — handle kept)* | $19.99 | $35.00 | ACTIVE | Cart upsell |
| `orthopedic-foam-bed-steps` | Orthopedic Foam Bed Steps | $65.00 | $99.00 | DRAFT | Home Mobility (unpublished) |
| `advanced-hip-joint-soft-chews` | Advanced Hip & Joint Soft Chews | $29.99 | $45.00 | DRAFT | Joint Care (unpublished) |

Plus collections: **Car Mobility**, **Home Mobility**, **Joint Care**, and a
hidden **Bumps** collection.

**Pricing rationale:** the reference product (PetSafe Happy Ride) has an MSRP
of $59.99. $79.99 / $139.99 (43% off) sits ~33% above that — defensible with
the PawGrip Tread and 30-day money-back guarantee — while leaving a ~52%
gross margin on the hero for ad spend.

## Analytics

Conversion events are wired in `src/lib/analytics.ts`:

| Event | Fires when |
|-------|-----------|
| `page_view` | App load |
| `view_item` | Buy box mounts |
| `add_to_cart` | Any add to cart |
| `begin_checkout` | Checkout redirect (+ dataLayer) |
| `size_finder_used` | A size is selected in the finder |
| `faq_open` | An FAQ entry is expanded |
| `lead_submit` / `tester_apply` | Contact / founding-tester forms (contact & guide pages) |

**Purchase tracking is NOT in this app** — the thank-you page lives on
Shopify's checkout domain, so it must be implemented as a Shopify Customer
Events custom pixel (see `LAUNCH_BLOCKERS.md`). Supported platforms: GA4,
Google Ads, Meta Pixel; set the IDs in `.env` (Vite inlines them at build
time).

## DKI (URL personalization)

`src/lib/dki.ts` maps whitelisted campaign params to pre-written headlines:

```
/?kw_vehicle=SUV&loc=Texas&kw_breed=Labrador
→ "The SUV Dog Ramp / Texas Owners Love" + "built for Labradors"
```

Raw parameters are never interpolated into the DOM. Unknown values fall back
to neutral defaults. gclid/fbclid/utm_* are forwarded into the Shopify
checkout so attribution survives the cross-domain hop.

## Assets & gates

Product renderings in `public/assets/product/` are original SVG artwork on
white backgrounds (NOT scraped photography — see `claims.md`). Owner photos
slot in through `ASSETS.heroPhotos`. Gated sections (`GATES` in
`src/lib/assets.ts`) stay inert until their real asset exists; flipping a
gate is documented in `AGENTS.md`.

## Static pages

`public/` holds plain-HTML pages so they work without JS: `/shipping/`,
`/returns/`, `/warranty/`, `/privacy/`, `/terms/`, `/contact/` (form backend
being replaced — see DEPLOYMENT.md), `/about/`, and
`/guide/how-to-choose-a-dog-car-ramp/`. Their policy numbers mirror
`src/lib/policy.ts`.

## Deployment

Builds to static files in `dist/`. Hosting moved off Netlify to the owner's
Network Solutions (cPanel) subscription — **full plan, credentials and cutover
checklist live in `DEPLOYMENT.md`** — and the store is served from a subdomain
(`<store>.businesslocalrecords.com`) so the root domain keeps its existing
application. In short:

- **Push to `main` on `github.com/businesslocalrecords/pet-ramp-store-4`
  builds and deploys automatically** via GitHub Actions (Netlify's webhook
  role), which uploads `dist/` to the subdomain's document root.
- `public/.htaccess` translates `netlify.toml` (retired) to Apache: the SPA
  catch-all rewrite, the security headers and the hashed-asset caching.
- `VITE_*` variables are inlined at BUILD time — they live as GitHub Actions
  repository secrets/variables, and changing one means a NEW deploy.
- `VITE_REQUIRE_BUSINESS_INFO=true` makes the build fail while the business
  address is still a placeholder — the enforcement switch for Merchant
  Center readiness.
- The contact and founding-tester forms used Netlify Forms; they must be
  re-pointed to a replacement before cutover (see DEPLOYMENT.md).

Point your Google Ads / Meta campaign landing page URL at the deployed
subdomain.

## Structure

```
src/
├── components/
│   ├── AnnouncementBar.tsx      static service bar (was UrgencyBar)
│   ├── StickyHeader.tsx         scroll header, live price
│   ├── HeroSection.tsx          DKI headline + gallery
│   ├── BuyBox.tsx               purchase register (size row + tiers + add-ons)
│   ├── TieredOfferSelector.tsx  bundle table (honest savings, subtle anchor)
│   ├── OrderBump.tsx            traction-mat add-on row
│   ├── TetherUpsell.tsx         tether add-on row
│   ├── FlatBuyButton.tsx        flat orange action button
│   ├── TrustBlock.tsx           3-cell guarantee row
│   ├── Benefits.tsx             3 honest benefit cards (was FeatureBento)
│   ├── ComparisonTable.tsx      options comparison + checklist
│   ├── SizeGuide.tsx            Compact-first size finder
│   ├── TrustBadges.tsx          unused — kept for the badge SVGs, not rendered
│   ├── ShippingReturns.tsx      process + policy panels
│   ├── Faq.tsx                  accordion + FAQ schema
│   ├── Footer.tsx               CTA + business identity + links
│   ├── StickyMobileBuyBar.tsx   mobile buy bar
│   ├── Byline.tsx               honest byline (was AuthorByline)
│   ├── FounderNote.tsx          gated founder note
│   ├── VideoProof.tsx           gated demo video
│   ├── UGCGallery.tsx           gated owner clips
│   └── Testimonials.tsx         gated reviews
├── pages/index.tsx              12-col split layout
├── lib/                         see the single-sources table above
└── styles/globals.css           Tailwind v4 theme + tokens

public/                          static pages + assets/ (+ .htaccess for Apache)
public/.htaccess                Apache config — mirrors netlify.toml (retired)
scripts/shopify-seed.mjs         Admin API catalog seeder
DEPLOYMENT.md                   Network Solutions hosting: credentials, pipeline,
                                cutover checklist (replaces Netlify)
AGENTS.md                        working agreement — read before editing
claims.md                        claim audit / rewording table
LAUNCH_BLOCKERS.md              what is still needed before paid traffic
```
