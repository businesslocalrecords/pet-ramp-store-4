# claims.md — Claim Audit & Rewordings

Every claim on this storefront, where it came from, and what happened to it.
This is the record that proves the V3 overhaul removed unverifiable content
rather than quietly reworded it. If you are about to add a claim, add a row
here first.

## The rules

1. **No claim without a source.** Specifications, policy numbers and prices
   live in `src/lib/offers.ts` / `src/lib/policy.ts` and are single-sourced.
2. **No invented reviews.** No review quotes, reviewer names, "94% of
   customers", customer counts, or vet/medical endorsements. Numeric star
   ratings and a rating count stay on every product (owner decision, 20 Oct
   2026). The same `rating` and `ratingCount` from `src/lib/catalog.ts` are
   written into JSON-LD `aggregateRating`. The removed 4.9 / 2,847 figure
   stays removed. Named reviews stay behind `GATES.testimonials`.
3. **No medical claims.** The ramp is described with physics and specs
   (slope angles, published weight ratings); health outcomes are deferred to
   the visitor's veterinarian.
4. **Real compare-at prices only.** A strikethrough price must be one the
   store has actually charged.

## Approved price-display decision (owner)

The original brief asked to strip all compare-at prices. The owner decided to
**keep them as a subtle anchor** instead:

- The compare-at price renders muted and small (`text-xs text-gray-400
  line-through`) in `TieredOfferSelector` — it anchors value without reading
  like discount-warehouse pricing.
- "Save $x vs buying separately" is computed live
  (`bundleSavings()` in `offers.ts`) and renders **only when genuinely
  positive**.
- Every compare-at in `offers.ts` is a real, previously charged price.

## Rewording table

| Where | Old claim | Why it had to go | What it says now |
|---|---|---|---|
| `index.html` JSON-LD | `aggregateRating` 4.9 / 2,847 | Fabricated ratings; Google rich-result & Merchant Center policy reject invented review markup | Removed. Returns only when a real review source exists (LAUNCH_BLOCKERS #5) |
| `index.html` meta/JSON-LD | "vet-approved", "fits any vehicle", `price: "149"` | Unverifiable; false for the 150 lb Compact; stale price | "rated to 150 lb (Compact) or 250 lb (Extended)", `price: "79.99"` matching `DEFAULT_TIER_ID` |
| `HeroSection` | "4.9 stars · 2,847 reviews", "96% would buy again" | Invented review stats | Removed; reviews live behind `GATES.testimonials` |
| `HeroSection` | "24–28° joint-safe slope" | Vet-style medical claim; the real angles depend on vehicle height | "about 20–25° at typical SUV heights", computed by `slopeDeg()` and shown live in the SizeGuide |
| `AdvertorialHeader` | Fake "Advertisement — Lifestyles" editorial shell + fabricated vet author | The page is a product page, not an advertorial | Component deleted |
| `AuthorByline` → `Byline` | "Dr. Sarah Jenkins, DVM — medically reviewed" | Invented veterinarian and medical review | "By the PawGrip Pro team" + last-updated stamp |
| `UrgencyBar` → `AnnouncementBar` | "RAMP20 — 20% off", countdown, stock scraped from the nonexistent `dog-car-ramp` handle | Coupon no longer exists; the stock call never resolved (dead code — real handle is `premium-foldable-dog-car-ramp`) | Static bar: free insured shipping, 30-day money-back guarantee, 12-month hardware warranty (all from `policy.ts`) |
| `FeatureBento` → `Benefits` | "Vet-Approved Slope", "eliminates the 3–4× body-weight impact" | Medical claims | "A gentle, computed slope" with the real angles (23° / 20° at 24″) |
| `TrustBadges` | "Vet Approved" badge + `vet-approved.svg` | No veterinary endorsement exists | Badge and SVG deleted; three in-house badges remain |
| `hero-ramp.svg` | Floating "Vet Approved / Tested & certified 250 lb / 26° slope" cards baked into the hero image | Unverifiable claims in artwork; 250 lb wrong for the Compact | File deleted; replaced by original product renderings in `public/assets/product/` |
| `FAQ` | "94% of customers report…", "veterinarians recommend", "static-tested beyond 500 lbs", "2× safety margin" | Invented statistics | Spec-based answers; senior-dog question defers to the visitor's veterinarian |
| `FAQ` | "ships same business day… 2–5 business days… Canada and UK at checkout" | International shipping not set up | Policy values from `policy.ts`; continental US only |
| Ship-speed claims across the site | "Ships within 1 business day (orders before 2pm)" / "Ships in 1 business day" / "ship the same day" / the 2pm cutoff, plus the live "In stock · ships in 1 business day" line | Owner instruction: remove every dispatch-speed promise — the operation cannot honour it, and an unkept shipping promise is an ad-network and refund-liability risk | Removed everywhere: hero assurance strip, `TrustBlock` first cell, `StickyMobileBuyBar` stock line, `FAQ` and `ShippingReturns` step 1 copy, the "Dispatch time" section on `/shipping/`. `POLICY.shipsWithinBusinessDays`, `POLICY.shippingCutoff` and `SHIPPING_SPEED_LABEL` deleted; the mobile buy bar's green line now shows the `30-day money-back guarantee` label from `policy.ts` |
| `POLICY.deliveryWindow` | `'2–5 business days'` | Owner instruction: widen the delivery estimate to a window the carriers actually hit | `'5–7 business days'` — flows to the FAQ answer, the ShippingReturns step-2 title and the hero; `/shipping/` meta, method copy and rate table restated to match |
| `ComparisonTable` | "PawGrip Pro vs. Cheap Knockoffs" with unverifiable competitor claims | Cannot assert what competitors' products do | Compact / Extended / Lifting / Jumping, with an honest-limitation row and a buyer's checklist |
| `Tiers` perks | "100-day money-back guarantee" | Policy is 30 days | `30-day money-back guarantee` (from `policy.ts`) |
| `TrustBlock` | "100-Day Trial", "covered for as long as you own it" | Wrong window; lifetime claim | 30-day trial; 12-month hardware warranty |
| `index.tsx` | "Lifetime hardware warranty" | No lifetime warranty exists | `WARRANTY_PRODUCT_LABEL` (12-month) |
| `Footer` | "Join 12,000+ owners", "Lifetime hardware warranty", dead social links | Invented customer count; false warranty term; links went nowhere | Removed; policy-sourced labels; links to real policy pages |
| `TetherUpsell` | "Crash-Tested Car Safety Tether" | "Crash-tested" overstated what the store can evidence (owner decision) | "Adjustable Car Safety Tether" — Shopify handle unchanged (`crash-tested-adjustable-car-safety-tether`) |
| `StickyHeader` | Hardcoded `$199 / $149` | Contradicted `offers.ts` | Live tier price + compare-at from the purchase context — **then removed entirely per owner instruction**: a price bubble floating over the page read as a discount popup, and the price is already in the buy box, the size-finder buttons and the mobile sticky buy bar. The header now shows brand + cart count only |
| Seeder hero copy | "rated by 2,800+ owners", "94% within 24 hours", "vet-approved", "Made in the USA", "100-day guarantee card" | Invented proof + unverifiable origin | Published specifications + the real 30-day/12-month policy |
| Seeder chews | "Vet Formulated", "formulated with veterinarians", "Made in the USA" | Unverifiable claims on a regulated category (product also unpublished) | "Advanced Hip & Joint Soft Chews", spec-only copy |
| Testimonials / VideoProof / UGCGallery | Entire sections | Placeholder narrative presented as real customers/video | `return null` behind `GATES` (asset-gate pattern in `src/lib/assets.ts`) |
| `HeroSection` hero gallery | SVG-only renderings | Owner supplied photography | Hero gallery = the six photos of the owner's revised set via `ASSETS.heroPhotos` (see the provenance rows below); the SVG renderings remain the fallback |
| `ASSETS.heroPhotos` alt text | Generic "PawGrip Pro owner photo N" | Alt text must describe the image — implying ownership would be invented social proof (rule 2) | Descriptive alt per photo ("A man guiding a large white dog as it walks up…") |
| `index.html` preload / og:image / JSON-LD image | `ramp-compact.svg`, then `manual-cured/ramp-scene-hound-in-suv.jpg`, then `revised/ramp-scene-dog-walking-up.jpg` | SVG is not a renderable social/raster image, and the main hero frame changed with each photo revision | `/assets/product/grit/ramp-german-shepherd-suv.jpg` — the current first hero frame |
| Hero tagline, BuyBox bullet, Benefits, FAQ "assembly", meta/JSON-LD description, seeder description | "Telescopes open in seconds" / "telescoping ramp" | Wrong mechanism: every owner photo and the spec sheet show a bi-fold ramp (62″ folds in half to 31″, latch) | "Folds in half to 31″ and latches shut"; tagline now "Stop lifting your dog into the {vehicle}. The Paw-Grip deck gives paws real traction, and the 10 lb ramp folds in half to 31″ for the trunk." |
| Hero gallery | Six `revised/` photos, three showing a smooth deck | Smooth deck is not the product sold; owner supplied the grit-deck set (`more-pics-for-site/` 1–8) | Gallery = the eight `grit/` photos only; source 8 (brand poster) has an AI-rendered "MADE IN THE USA"-like mark on the ramp foot painted out — no origin claim is made anywhere |
| Paw-Grip deck (headline default, tagline, bullets, FAQ "Will my dog slip on it?") | "textured", "high-traction deck" | Owner spec sheet (`grit/ramp-grit-spec-sheet.jpg`) names a "Grit Surface"; owner named the deck "Paw-Grip" | "Paw-Grip deck" (brand name for the deck) / "grit surface that paws and nails can grip" — describes the surface, no wet-traction or test claim |
| Default DKI headline (no `kw_vehicle`) | "Foldable Dog Car Ramp for SUVs, Rated to 150 lb" | Told sedan/truck searchers "SUVs" | "Foldable Dog Car Ramp with a Paw-Grip Deck, Rated to 150 lb"; vehicle ads keep "…for {Vehicles}, Rated to 150 lb" |
| Spec sheet image text | — | "Steel Reinforced Frame" and model name "Heavy-Duty Grit-Grip Folding Ramp" appear only in the owner's image, not in site copy | Not repeated in any copy; confirm with the supplier before quoting it |
| `SizeGuide` heading + intro | "Find the right size for your vehicle" + computed-slope explanation | Owner instruction: lead with the Compact's popularity and explain the practical difference in plain language, not degrees | "Most owners pick the 62″ Compact" + practical fit copy (see the owner-attested popularity row below) |
| `SizeGuide` degree math | Live slope readout ("22.8° / 20.1°"), per-card "Slope at {height}″" rows, the slope-by-cargo-height chart table and the degree-labelled ramp diagram | Owner instruction: shoppers decide on fit, not trigonometry | Practical specs only (capacity, ramp weight, open/folded size, best-for vehicles); `slopeDeg()` now feeds only the `trackSizeFinderUsed` analytics payload |
| `SizeGuide` trust bar | "30-Day Risk-Free Trial / Insured Shipping / Hassle-Free Returns" panel under the finder | Owner instruction: redundant with the announcement bar, the buy box's assurance row and trust block, the ShippingReturns section and the footer | Panel deleted; every policy value is still shown at least once elsewhere |
| `TrustBadges` | Whole "Shop With Total Confidence" section (three in-house badges + payment strip) | Owner instruction: redundant with the same trust claims elsewhere on the page | Section removed from `pages/index.tsx`; badge SVGs remain in `public/assets/badges/` for future use |
| `badge-manufacturer-certified.jpg` (manual-cured) | "Manufacturer Certified" / "Certified pet safe materials" | Owner replaced it with an AI-generated badge that drops every certification claim and states only the published Compact rating | `badge-150lb-rated.png` (owner-supplied, in `public/assets/product/manual-cured/`), displayed in the SizeGuide under the size cards; the old file moved to `public/assets/old-assets/`. Deliberately not in the buy box — a flat 150 lb figure next to the selectable 250 lb Extended would misstate the extended product. **Later removed entirely per owner instruction** — the badge and its SizeGuide slot were deleted and the file retired to `old-assets/` (see the "revised photo set" section below) |
| `ramp-scene-side-view.jpg` (manual-cured) | Stored-but-unwired as a near-verbatim re-render of reference product art (copyright / Merchant Center risk) | Owner reviewed it against the competitor's site, judged it sufficiently different, and chose to keep it | Was displayed as a hero gallery frame ("On the ramp") via `ASSETS.gallery.sideView`; **retired per owner instruction** when the revised photo set landed — the file moved to `public/assets/old-assets/` |
| `ramp-spec-infographic-62in.jpg` (manual-cured) | Stored-but-unwired: baked-in "Ramp Weight: 12 lbs" contradicts `RAMP_SIZES[0].rampWeightLb` = 10 lb | Owner supplied a corrected version with the 10 lb figure | Corrected `ramp-spec-infographic-62in.png` was displayed as the hero "Specs" frame; **superseded by the revised photo set** (its `4.jfif` collage) — both `.png` and the stale `.jpg` now live in `public/assets/old-assets/` |
| `ramp-slope-guide.jpg` (manual-cured) | Stored-but-unwired: "OPTIMAL 18° / MODERATE 23–28°" contradicts `slopeDeg()` (22.8° / 20.1° at 24″) and echoed the removed "24–28° joint-safe slope" claim | Owner supplied a corrected version whose bands match the computed model | Corrected `ramp-slope-guide.png` was displayed in the SizeGuide; **removed per owner instruction** — the chart and its slot were deleted and the file retired to `old-assets/` |
| `HeroSection` gallery — SVG then AI frames | The hero showed the two in-house SVG renderings, then the `ASSETS.aiShots` white-background renderings plus the corrected spec infographic and side view | Owner supplied a full revised photo set (`edited pics/`, files 2–7) | Hero gallery = the six revised photos only (order below); `ASSETS.aiShots`, `gallery.sideView`, `gallery.ratingBadge`, `gallery.slopeGuide` and `gallery.specInfographic` were deleted; the SVG renderings stay registered (`ASSETS.product`) as the fallback when `heroPhotos` is empty |
## "Manual cured" image set — provenance and what is deliberately not displayed

The owner's `product images/ramp/manual cured/` folder holds 8 Gemini-generated
images produced from manufacturer reference photography
(`product images/ramp/PetSafe …/`). All 8 are committed to
`public/assets/product/manual-cured/` (renamed `.jfif` → `.jpg` — identical JPEG
bytes, avoids MIME ambiguity on the static host). **None is displayed anymore:**
the revised photo set below replaced every frame this set had, and the
retired files moved to `public/assets/old-assets/` (with the stale
"12 lbs"/"OPTIMAL 18°" versions that were already there).

Two files from the set were never displayed and stay stored but unwired:

| Stored file | Why it is not displayed |
|---|---|
| `badge-1-year-warranty.jpg` | "1-year" ≈ `POLICY.warrantyMonths` but "SATISFACTION GUARANTEED" is not the wording of `GUARANTEE_LABEL` ("30-day money-back guarantee"); the same policy wording already runs in the announcement bar, the buy box and the footer |
| `ramp-detail-10lb-polymer.jpg` | Marketing copy ("Featherlight", "sturdy polymer construction", "10 LB") with no clean slot; no new spec information beyond `offers.ts` |

## The revised photo set — what the hero shows now

The owner revised all the imagery and delivered it in `edited pics/` (JPEG
bytes in `.jfif` containers, converted to `.jpg` on install), numbered 1–7.
Number 1 was excluded by instruction; 2–7 are installed under
`public/assets/product/revised/` and wired as `ASSETS.heroPhotos`, which is
now the entire hero gallery:

| Frame | Source | File | Alt text (abbreviated) |
|---|---|---|---|
| 1 (main) | `6` | `ramp-scene-dog-walking-up.jpg` | A man guiding a large white dog as it walks up the ramp into the cargo area of a white SUV |
| 2 | `5` | `ramp-scene-deployed-tailgate.jpg` | The ramp deployed from the tailgate of a white SUV with a dog waiting in the cargo area |
| 3 | `2` | `ramp-studio-three-quarter.jpg` | Studio view of the ramp at a three-quarter angle on a white background |
| 4 | `fold1` | `ramp-folded-studio.jpg` | Top-down studio view of the ramp folded in half on a white background |
| 5 | `7` | `ramp-scene-carrying-folded.jpg` | A man carrying the folded ramp beside a white SUV while a dog waits in the cargo area |
| 6 | `4` | `ramp-spec-collage.jpg` | Specifications collage: 62″ unfolded, 31″ folded, 150 lb capacity, 10 lb ramp weight, textured polymer grip deck |

The frame-4 slot first used `3` (`ramp-folded-top-down.jpg`); the owner
supplied `fold1` — a cleaner centered top-down of the folded ramp — which
replaced it, the earlier file retiring to `old-assets/`. Frame labels are
owner-set benefit captions ("Effortless Walk", "Sturdy Grip", "Quality Build",
"Compact Fold", "easy to store", "Specs") — they sit under generic published
features (slope vs lifting, non-slip grip, fold-and-store), so they assert
nothing new. The hero's main frame is a fixed `aspect-[3/2]` box; the fill-crop
(`object-cover`) was slicing ~28% off the top and bottom of the two
white-background studio shots (1024×955). Per owner instruction those two
frames and the collage render with `fit: 'contain'` in `ASSETS.heroPhotos` —
nothing cropped, and their white backgrounds match the frame so no letterbox
bars show. The scene photos keep the fill-crop.

**Order rationale (owner instruction: "an order that is most coherent"):**
the main frame is the page's core promise — a large dog walking up the ramp
instead of being lifted — then the same ramp deployed with the dog waiting,
the clean studio shot of the product, the folded form, the one-hand carry, and
the spec sheet last as reference. The SUV, man and dog match across frames
2/5/6, so the gallery reads as one shoot.

**Claim checks on the baked-in content:**
- The spec collage (`4`) states 62″ unfolded, 31″ folded, 150 lb capacity and
  10 lb ramp weight — all match `RAMP_SIZES` in `offers.ts`. It brands the
  product "A-frame folding ramp"; the alt text says the same and the store's
  naming (`PRODUCT_NAMES`) is unchanged.
- The collage's material line ("heavy-duty textured polymer", "slip-resistant
  grip") restates published features already used on the page — no new claim.
- Life-frame alt text describes only what the photos show; nothing asserts
  ownership, review counts or veterinary endorsement.

Provenance honesty note: the displayed photos are owner-supplied and show a
real ramp and a real dog, but they are not photographs of the store's own
inventory unless the owner confirms it — alt text describes the scene rather
than claiming ownership. White-background photography of the actual shipped
unit is still owed before a Merchant Center image submit (LAUNCH_BLOCKERS #2).

## Deliberately kept (and why)

| Claim | Justification |
|---|---|
| `$79.99 / $139.99` compare-at | Real pricing decision; see "Approved price-display decision" above |
| "150 lb / 250 lb rated" | Published ratings for the two published sizes; confirm against the supplier spec sheet (LAUNCH_BLOCKERS #3) |
| "62″ / 70″ unfolded, 31″ / 35″ folded" | Published dimensions in the size finder and catalog |
| Slope table (22.8° / 20.1° at 24″) | Arithmetic on the published dimensions: `asin(height / length)` because the ramp is the hypotenuse — kept in the hero's "about 20–25°" line and the size-finder analytics payload; removed from the size-finder UI per the owner instruction above |
| "Most owners pick the 62″ Compact … almost every customer who buys one is happy with it" | Owner-attested popularity claim (owner instruction for the size finder). Qualitative — deliberately no percentages or review counts. Owner should sanity-check it against Shopify variant sales before scaling paid traffic; if the Compact is not in fact the top seller, soften the heading back to "Find the right size for your vehicle" |
| Size-finder slider help text | "Slide the measure of ground-to-bumper height and we will pick auto-select the best size for you." — owner wording replaces the height verdict in prose; the matching card is highlighted live (border + dog icon) and both Select buttons write the shared purchase context |
| "rubber, non-slip feet", "textured deck", "side rails" | Published product features |
| "Ships within 1 business day (before 2pm), 2–5 business day delivery" | Store policy in `policy.ts`; confirm operationally (LAUNCH_BLOCKERS) |
| "About This Item" panels (Details / Instructions / Size) | Built only from `offers.ts` sizes and `policy.ts` labels; instructions describe the bi-fold unfold → rest on bumper/cargo floor → treat-train → fold & latch use, no new performance claim |
| Quantity selector (1–5) | UX only; capped by Shopify stock, price = unit price × quantity |

## Product catalog imagery

Uploaded to Shopify by `scripts/shopify-product-images.mjs`
(`npm run shopify:images:apply`) for the original four products.

- **Hero ramp** (`premium-foldable-dog-car-ramp`) keeps the owner's photo set.
  The storefront gallery is `ASSETS.heroPhotos`. Those files are not replaced.
- **Mat, tether, soft chews** still use the SVG illustrations when this script
  runs, because they have no manufacturer photograph in `public/assets/catalog/`.
- **Test mobility assortment** (side-door steps, bed ramp, telescoping ramps,
  hitch step, folding steps, foam steps) uses manufacturer photographs saved
  from PetSafe's public product images — the manufacturer behind the Chewy
  listings — under `public/assets/catalog/`. Extra frames from those product
  pages are on each product page. Dimension diagrams, slope guides, and
  frames with baked marketing lines were left out (same rule as the removed
  ramp spec-sheet collage). Each kept file was re-saved as a 1400×1400 JPEG
  with EXIF, XMP, and IPTC stripped. The owner cleared those photos
  for this project. Captions under the photos are Paw-Grip copy. Product
  titles on the storefront are Paw-Grip names, not the manufacturer's marks.
  Star ratings on these cards are numeric ratings (see rule 2). There
  is no review text. The same numbers are in JSON-LD `aggregateRating`.

## Voice pass (October 2026)

Homepage, catalog summaries, the car-ramp supporting line, About, the buyer's guide opening, the category lede, and the footer call to action were rewritten for a more specific voice. No new specification, rating, medical outcome, or customer-count claim was added. "A hard landing" describes the jump itself, not a diagnosis. Policy numbers still come from `policy.ts`.

The homepage hero photo is a link to the foldable car ramp. The caption under that photo was removed; the link stays.

## Brand spelling (October 2026)

The storefront brand is **Paw Grip**, with a space. Product titles, the footer legal name, page titles, and alt text no longer use “Paw-Grip”. Shopify handles are unchanged. Older rows in this file still quote the hyphenated spelling because they record the wording at the time. Shopify checkout will keep the previous product titles until those titles are updated in Shopify. The seeder titles that used the hyphen now say Paw Grip. That seeder was not run.

Four lifestyle frames (shepherd SUV, boxer hatchback, white dog, folded ramp at the hatch) were replaced with the owner's newer photographs, cover-cropped to the same 1400×1400 JPEG canvas, metadata stripped.

## CPC price rule (October 2026)

Owner decision, not yet applied to the live offer. Checkout still charges the Shopify price. Do not change a displayed price until Shopify is updated to the same number, because the buy button refuses a mismatch.

- Paw Grip's cost for a product taken from Chewy is the price Chewy lists. Chewy's price is not the price Paw Grip charges.
- Ad planning is 40 cents a click, and the price must cover 25 clicks on a sale ($10).
- Free insured shipping is still on Paw Grip. Leave $5 in the price for shipping.
- Selling price = Chewy listed price + $10 + $5, rounded up to the next `.99`. No new compare-at price is invented from Chewy's number.

The Chewy dog-stairs category (184 distinct products) is on `/dog-ramps`. Photos were saved from `image.chewy.com`, resized to a 1400-pixel maximum, and written as JPEG with EXIF, XMP, and IPTC removed. These products are not in Shopify yet, so checkout tells the shopper that. `npm run shopify:chewy` creates only these 184 products and does not restock the products already in the store. That command was not run: this machine has no `.env.local` Admin credentials. The existing Paw Grip products keep their own prices.

## Catalog decision page (October 2026)

Products other than the foldable car ramp use a separate page, not a copy of the ramp's About This Item, size finder, or FAQ. Those sections state the ramp's own specs.

What the new page may say before any desktop extract arrives:

- The product's existing catalog summary, bullets, and weight rating, when the catalog already has them.
- Shipping, the money-back guarantee, the warranty, and three questions that restate `policy.ts`.

Measurements, setup steps, box contents, and product questions render only after `src/lib/product-facts.json` has a row for that slug. An empty row stays empty. The desktop prompt that fills the file is `scripts/desktop-product-facts-prompt.md`. No Chewy review text or star count is imported. Description lines about joints, arthritis, injury, or mobility treatment are dropped on import, even when Chewy printed them. Specification rows such as a published weight rating stay.

## Test catalog (October 2026)

| Where | What changed | Why |
|---|---|---|
| Homepage, `/dog-ramps`, `/products/:handle` | The site is a ramp-and-stairs shop, not a one-product landing | Owner decision: meet any pet owner looking for a ramp, using Shopify handles, for this test |
| `public/assets/catalog/` | Manufacturer photographs on the new products | Owner has written notice from the manufacturer that the photos may be used. Chewy itself returned 403 to the browser on port 9222, so the files were saved from the manufacturer's own product images |
| Star ratings | A rating and a count on each catalog card, the car-ramp buy box, and JSON-LD `aggregateRating` | Owner decision, 20 Oct 2026: stars stay. Same `rating` / `ratingCount` as `catalog.ts`. No review quotes, no reviewer names, and not the removed 4.9 / 2,847 figure |
| Chewy catalog cards | The star number and count printed on the Chewy page, for 117 of the 184 products (`src/lib/chewy-ratings.json`) | Owner decision: these 184 products are test catalog items and should show a numeric rating the way the Paw Grip test products do. The numbers are copied from the Chewy page. No review text is copied. The 67 pages with no rating stay blank. `aggregateRating` uses the same number when the product has one |
| Foam-steps still and green paw mark | Lead photo on the foam bed steps, and `favicon.png` | Owner confirmed, 20 Oct 2026, these may be published as Paw Grip product photos |
| Foam-steps clip | 9-second file on the homepage, the foam-steps page, and the stairs guide. Caption: a corgi climbs the gray foam steps beside a bed, stands on the top, steps back down to the carpet, then moves on the bed | The frames show that sequence. A Magic Hour mark stays in the corner. The caption does not name the dog, call it a customer, or describe the car ramp |
| `/guide/dog-stairs-for-bed-or-couch` | Restates each product's catalog name, summary, capacity, price, and bullets for the foam steps, folding steps, and bed ramp | No new specification. Prices and capacities come from `catalog.ts` |


## Layout and wording pass (October 2026)

| Where | What changed | Why |
|---|---|---|
| Homepage hero paragraph | "Jumping down from a hatchback is hard on a dog. Lifting one into an SUV is hard on you." replaces the "hard landing / your back" lines | Plainer wording. Says "hard on", names no injury or condition |
| Homepage hero paragraph | "Ramps and stairs for the car, the bed, and the back seat. Your dog walks up instead of jumping or being lifted." | Same places as the headline, in the same voice. No new product claim |
| Homepage hero photo | Wide crop of the existing hatchback photo, saved as `ramp-boxer-hatchback-hero.jpg` | The square frame left a band of sky and pavement around the scene. The original square file stays for the product gallery |
| Homepage showcases | “Most popular for the car / the bed / the back seat” on the car ramp, bed ramp, and side-door steps | Owner wording for these three homepage modules. It is not a sales ranking. Each “Browse more…” link opens the shop with that place and type already filtered |
| Homepage showcases | Each module is one product again. Order is car, then back seat, then bed | Owner asked to drop the extra two products and to put the back seat ahead of the bed |
| Homepage showcases | A whitelisted search intent (`kw` or a matching `utm_term`) moves that module first: car ramp, car steps, or bed | The raw keyword is never printed. Organic visits with no match keep car, then back seat, then bed |
| Homepage, “Paw Grip ramps and steps” | The fourth cell is the guide card again: “Not sure which one?” | That text card used to close the place-tile row. The row now has three products, so the card fills the empty cell. No new product claim |
| Homepage showcases | Back seat shows the Heeyoo 5-step car stairs. Bed shows the LovMor small ramp. The car ramp stays the Paw Grip foldable ramp | Owner asked for lower prices on the other homepage products to attract shoppers. “Most popular” is still the section title, not a sales ranking |
| Homepage showcases | Back seat is the side-door steps again. Bed is the TSCOMON steps whose photo is a bed, and the button says “Shop the bed steps” | The cheaper stairs were a trunk climb, and the cheaper ramp was indoor stairs. The picture, the product, and the line have to be the same job |
| Product pages, "More ramps and steps" | Cards prefer a scene photo and several frames, with a lower price as a tie-breaker, still favoring the same place and type | Owner asked for the photos most likely to convert, and for inexpensive ones when the photo is as strong |
| Homepage, “Paw Grip ramps and steps” | “The products we put our name on.” replaces “Our own line, each with a star rating.” | Same meaning, written as a store would say it. No new rating claim |
| Homepage, “See all ramps and steps” | The product count is no longer printed in the link | Owner asked to drop the number |
| Car-ramp page | “Why a ramp” and “Head to head” (including “What to look for in any ramp”) are removed | Owner asked to delete that block |
| Flagship gallery and homepage hero | Replacement crops of the Boxer hatchback, German Shepherd SUV, and white-dog SUV photos | Owner supplied the new frames. The people who stood beside the ramp are no longer in these three photos. Alts no longer mention them |
| Homepage "Where does your dog need a boost?" and "Paw Grip ramps and steps" | Place tiles link to filtered shop results. The product row lists only our own line | The two sections used to repeat the same three products |
| Product pages, "More ramps and steps" | Replaces "Often added with this" | We have no data on what is bought together |
| Catalog product page | Store-wide shipping/guarantee/warranty questions removed from Questions (the Shipping, returns and warranty cards already say it) | Removed duplication. Numbers still come from `policy.ts` |
| Shop, homepage, and product URLs | Extra-long ramp, compact telescoping ramp, traction mat, and car safety tether are unlisted | Those four have one photo or a drawing and no manufacturer description. Owner decision: take them off the shop rather than invent copy |
| Car-ramp buy box | The traction-mat and tether checkboxes are removed | Same decision. The single ramp is the only thing that page sells. The FAQ no longer tells the shopper to add the mat |
