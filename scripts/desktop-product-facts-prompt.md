# Desktop engine prompt — product facts for Paw Grip

Paste everything below the line to the desktop engine. It must drive the Chrome window already open on this PC with the mouse and keyboard. Do not open a second Chrome, do not use a debug port, do not use Playwright, and do not use a temporary profile.

---

You are collecting product facts for the Paw Grip store. The store already has the photos. This pass collects only the words that belong under each product: description bullets, the specification table, setup steps, what is in the box, and factual questions already printed on the page.

## How to browse

Use the Chrome window that is already open. Click, scroll, and type in that window. If a page shows a human check, stop on that product, wait until the check clears, then continue. Do not try to defeat the check from code.

## Where the list is

Open `scripts/chewy-fact-targets.json` from the pet-ramp-store-4 repo. It has 184 rows: `dp`, `slug`, `name`, `url`. Visit each `url`. If that URL does not land on the product, search the `name` on chewy.com and open the matching product page. Confirm the page's product id is the same `dp` before you write a row.

If `C:\Users\Johnny\AppData\Local\Temp\chewy-catalog.json` is still there, you may use its product URLs instead of the `/dp/{id}` links when the short link misroutes. Match on the numeric id in `/dp/`.

## What to write

Save one JSON file, overwriting it after every product so a stop does not lose the work:

`C:\Users\Johnny\AppData\Local\Temp\pawgrip-product-facts.json`

Shape:

```json
{
  "products": [
    {
      "dp": "53683",
      "slug": "dp-53683",
      "name": "the title printed on the page",
      "sourceUrl": "the final page URL",
      "details": ["one description bullet", "the next bullet"],
      "instructions": ["one setup step"],
      "specs": [{ "label": "the left column", "value": "the right column" }],
      "included": ["one thing in the box"],
      "questions": [{ "q": "a factual question printed on the page", "a": "the answer printed with it" }]
    }
  ]
}
```

If the output file already exists, skip any `dp` that already has a row with no `error`.

## Rules for each field

- `details`: the manufacturer's description bullets or the short "About this item" lines. One sentence per item. Do not paste the whole description as a single string. Skip marketing lines that are not about this product.
- `specs`: every row of the specification table, label and value copied as shown. Do not convert units. Do not calculate a missing number. If the page has no table, use `[]`.
- `instructions`: numbered directions or "how to use" steps, if the page has them. Otherwise `[]`.
- `included`: the "what's included" list, if the page has one. Otherwise `[]`.
- `questions`: at most 6. Only a question and answer that the page itself prints as product information. Skip it if you would have to write the answer.
- If a block is not on the page, use an empty array. Never fill it from another product, and never guess a weight, height, or capacity.
- `name` must be the title on that page, even if it differs from the target file.

## Do not collect

- Star ratings, review counts, review quotes, reviewer names, or "customers say" text.
- Veterinary, medical, arthritis, hip, joint, or "recommended by vets" lines. If a bullet is only that kind of claim, drop the bullet.
- Prices. The store already priced these.
- Photos. The store already has them.
- Coupon codes, shipping promises, or Chewy's return policy. Those are not Paw Grip's.

## When a page fails

Still append a row so the gap is visible:

```json
{ "dp": "53683", "slug": "dp-53683", "name": "", "sourceUrl": "", "error": "what stopped you", "details": [], "instructions": [], "specs": [], "included": [], "questions": [] }
```

Then continue with the next product. Do not stop the whole run for one page.

## When you are done

Leave the JSON file at the path above. Say how many products have facts, how many have an `error`, and the path. Do not summarize the products in the chat beyond those counts.
