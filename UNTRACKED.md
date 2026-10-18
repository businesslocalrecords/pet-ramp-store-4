# Untracked working files

This repo intentionally tracks only the storefront source. Several folders and
files in the working directory are **not tracked** and show up as `??` in
`git status`. This file records what each one is, why it is not tracked, and
what would have to happen before it could be committed.

| Item | What it is | Why it is untracked | Before it could be tracked |
|---|---|---|---|
| `product images/` | Owner's source material: the `manual cured/` originals (`.jfif`), reference photos (`PetSafe …/`), the cure scripts, and leftover Chrome debug-profile folders | Large binaries and browser-profile junk. Manufacturer photos that the test shop actually uses are already curated under `public/assets/catalog/` | Keep the working folder untracked. Do not bulk-add it. |
| `product images/ramp/ai-output/` | Working drop zone from the previous image batch: `badge-150lb-rated.png` and the corrected infographic / slope guide (all since retired to `public/assets/old-assets/`) plus `spec-infographic-SUPERSEDED.png` | Owner-generated working copies; only the curated, claim-checked versions belong in git | Kept as the working area; nothing new from this batch is needed from it |
| `edited pics/` | Source of the current hero gallery: the owner's revised images, `.jfif` files numbered 1–7 plus `fold1` (1 excluded by instruction; 2–7 and `fold1` installed under `public/assets/product/revised/`) | Owner-supplied source material; only the curated web-ready versions belong in git | Already done: the used files are converted to `.jpg` in `public/assets/product/revised/`, wired via `ASSETS.heroPhotos`, and claim-checked in `claims.md`; the folder stays as the source area for future revisions |
| `product-photos.pdf` | PDF of product photography, unreviewed | Large, unreviewed, duplicative until its contents are sorted | Extract the images that will actually be used, convert them, place them under `public/assets/…`, then delete the PDF |
| `tez imagz/` | `.PNG` images, contents undetermined | Unknown provenance — may be competitor or stock imagery | Review each file; keep only owner-owned or legally usable images, convert to web formats, place under `public/assets/…` |
| `screenshots/` | QA screenshots from preview checks (`hero-1440.png`, `order-390.png`, …) | Verification output, not source; would add churn on every capture | Keep untracked. Publish-worthy shots can be added to `docs/` deliberately, one at a time |
| `.kilo/` | Local planning/working notes for this repo's editing sessions (e.g. `.kilo/plans/*.md`) | Local tooling state, not part of the storefront | Keep untracked. Anything worth keeping long-term — decisions, rejected approaches — belongs in `claims.md`, `AGENTS.md` or `LAUNCH_BLOCKERS.md` instead |
| `ns.env` | Network Solutions (cPanel) hosting credentials — the FTP/SSH/cPanel values that populate the deploy workflow's repository secrets (see `DEPLOYMENT.md` §1) | Live host credentials: committing them would publish write access to the production server. It is gitignored on purpose so it can never be staged | Keep untracked permanently. The deploy pipeline reads these values as GitHub Actions repository secrets; the local file only exists as the owner's fill-in sheet |

Rules of thumb before any of this goes into git:

1. Nothing the build doesn't need is committed into `src/` or `public/`. Raw
   material stays outside the repo until it has been curated.
2. Manufacturer photographs the owner has cleared for the test catalog may
   be committed under `public/assets/catalog/`. The raw `product images/`
   working folder still stays untracked.
3. Photos enter the repo converted and renamed (`.jfif` → `.jpg`), sized for
   the web, under `public/assets/…` — the same way
   `public/assets/product/manual-cured/` was added.
4. Browser-profile and cache folders are never committed, in any folder.

## What the hero gallery and stored sets look like now

The hero gallery is the owner's **revised photo set**: `edited pics/` files 2–7
(file 1 excluded by instruction), converted `.jfif` → `.jpg`, installed under
`public/assets/product/revised/` and wired as `ASSETS.heroPhotos` — the whole
gallery, ordered as a narrative (dog walking up the ramp → deployed at the
tailgate → studio shot → folded form → one-hand carry → spec collage). Frame 1
is also the `index.html` preload / og:image / JSON-LD image.

Every earlier set is retired from display: the two scene photos, the side view,
the rating badge, the corrected infographic and slope guide, and the three AI
white-background renderings all moved to `public/assets/old-assets/` (with the
stale "12 lbs" / "OPTIMAL 18°" versions that were already there). The
"manual cured" set keeps only two stored-but-unwired files:

| Stored file | Why it is not displayed |
|---|---|
| `badge-1-year-warranty.jpg` | "1-year" ≈ the warranty term, but "SATISFACTION GUARANTEED" is not the wording of `GUARANTEE_LABEL` |
| `ramp-detail-10lb-polymer.jpg` | Marketing copy, no slot on the page; adds no spec information beyond `offers.ts` |

Full reasoning lives in `claims.md` (sections "Manual cured image set" and
"The revised photo set").

Provenance note: the two displayed photos are Gemini re-renders of real
scenes, not photos of the shipped unit, and their alt text describes the scene
rather than claiming ownership. White-background photography of the actual
product is still owed before a Merchant Center image submit
(`LAUNCH_BLOCKERS.md` #2).
