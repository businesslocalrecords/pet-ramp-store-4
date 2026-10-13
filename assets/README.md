# Public Assets

Static media served from `public/assets/` (referenced as absolute paths, e.g. `/assets/product/ramp-compact.svg`).

## Current files

| File | Purpose | Replace with |
|------|---------|-------------|
| `product/ramp-compact.svg` | Compact (62″) product rendering, white background | Registered fallback only — the hero gallery uses `product/revised/` (see above); still replace with a real photo for the Merchant Center feed |
| `product/ramp-extended.svg` | Extended (70″) product rendering, white background | Registered fallback only — same as above |
| `badges/30-day-guarantee.svg` | Guarantee badge (matches `POLICY.returnDays`) | Optional custom badge |
| `badges/free-shipping.svg` | Shipping badge | Optional custom badge |
| `badges/secure-checkout.svg` | Security badge | Optional custom badge |

## `product/revised/` — the owner's revised photo set (hero gallery)

The current hero gallery. Owner-supplied JPEGs (delivered as `.jfif` in
`edited pics/`, files 2–7 — number 1 excluded by instruction), wired as
`ASSETS.heroPhotos` in the order below; the frame order is a deliberate
narrative (dog walking up → deployed → product → folded → carried → specs):

| Frame | File | Label in the UI |
|---|---|---|
| 1 (main) | `ramp-scene-dog-walking-up.jpg` | "Effortless Walk" |
| 2 | `ramp-scene-deployed-tailgate.jpg` | "Sturdy Grip" |
| 3 | `ramp-studio-three-quarter.jpg` | "Quality Build" |
| 4 | `ramp-folded-studio.jpg` | "Compact Fold" |
| 5 | `ramp-scene-carrying-folded.jpg` | "easy to store" |
| 6 | `ramp-spec-collage.jpg` | "Specs" |

Frame 1 is also the `index.html` preload / og:image / JSON-LD image. Frames 3,
4 and 6 carry `fit: 'contain'` in `ASSETS.heroPhotos` — the two white-background
studio shots are 1024×955 and a fixed 3:2 fill-crop would slice ~28% off them,
and the collage's baked-in spec text would be cut. Claim checks for the set
(the spec collage's baked-in numbers vs `RAMP_SIZES`) are recorded in
`claims.md`.

## `product/manual-cured/` — owner's Gemini-cured image set (retired from display)

Real scenes re-rendered by Gemini from the owner's reference photography
(`product images/ramp/manual cured/`), renamed `.jfif` → `.jpg` (identical JPEG
bytes). **Nothing here is displayed anymore** — the revised photo set above
replaced every frame this set had, and the retired files moved to
`old-assets/`. Two files remain stored but deliberately unwired:

| File | Why it is not displayed |
|------|----------|
| `badge-1-year-warranty.jpg` | "Satisfaction guaranteed" ≠ `GUARANTEE_LABEL` wording |
| `ramp-detail-10lb-polymer.jpg` | Marketing copy, no slot |

## `old-assets/` — superseded files

Files replaced by newer owner-supplied versions, kept for reference and never
referenced from code:
- `badge-manufacturer-certified.jpg` (replaced by the rating badge, itself later retired)
- `ramp-spec-infographic-62in.jpg` / `.png` — the "12 lbs" version, then its corrected replacement (both superseded by `revised/ramp-spec-collage.jpg`)
- `ramp-slope-guide.jpg` / `.png` — the stale chart and its corrected replacement (both removed per owner instruction)
- `ramp-scene-hound-in-suv.jpg`, `ramp-scene-folding-the-ramp.jpg`, `ramp-scene-side-view.jpg`, `badge-150lb-rated.png` — the manual-cured frames retired when the revised set landed
- `ramp-folded-top-down.jpg` — the earlier folded-form frame, replaced by `fold1` (`revised/ramp-folded-studio.jpg`)
- `ai-shots/` — the three AI white-background renderings retired when the revised set landed

## Swapping in real media

1. Drop real files into `public/assets/`.
2. Update the path in `src/lib/assets.ts` (`ASSETS.product.*`) — one place, not per component.
3. For owner photography in the hero, populate `ASSETS.heroPhotos`; `HeroSection` shows those frames, and falls back to the `ASSETS.product` SVGs only while `heroPhotos` is empty.
4. Gated sections (demo video, owner clips, reviews, founder note) live behind `GATES` in `src/lib/assets.ts` — flip the flag only when the real asset exists. See the asset-gate pattern documented at the top of that file.

## Recommended video specs (for the gated video sections)

- 15–30 seconds, 1080p, H.264, MP4
- Show a real dog walking up the ramp unassisted
- Keep it under 10 MB for mobile page speed
- Add captions — most of your CPC traffic will watch muted
