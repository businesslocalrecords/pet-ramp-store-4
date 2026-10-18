/**
 * Shopify catalog seeder â€” PawGrip Pro
 * ===================================
 *
 * Creates the full premium joint-health catalog in the Shopify Admin API:
 *   1 hero product, 4 supporting products, 4 collections, tags, tracked
 *   inventory, publication to the Online Store channel, and an optional
 *   Subscribe & Save plan for the consumable.
 *
 * WHY A SCRIPT AND NOT THE ADMIN UI
 * ---------------------------------
 * The token in .env.local is a Storefront API token (32-char hex). That API
 * is READ-ONLY for products, so it can never create them. This script uses
 * the Admin API instead, which needs its own custom-app token â€” see
 * HOW TO GET THE TOKEN below.
 *
 * HOW TO GET THE TOKEN
 * --------------------
 * Modern Shopify Dev Dashboard apps don't show you an access token at all.
 * Instead you copy the Client ID and Client secret, and this script exchanges
 * them for a 24-hour token automatically â€” no long-lived shpat_ token needed.
 *
 * In the Dev Dashboard (the page that shows "PMax One-Product Storefront"):
 *   1. Settings -> Credentials -> copy the Client ID
 *   2. Same section -> click reveal on Client secret -> copy it
 *   3. Add BOTH to .env.local (never commit it):
 *        SHOPIFY_CLIENT_ID=7a3868cb0531481a4d1c51356b478e8b
 *        SHOPIFY_CLIENT_SECRET=<the secret you copied>
 *
 * Old-school alternative, if you would rather use a static token:
 *   Admin -> Settings -> Apps and sales channels -> Develop apps -> create an
 *   app -> Configure -> Admin API integration -> add scopes -> Install ->
 *   "API credentials" tab -> "Admin API access token" -> copy it once.
 *   Add to .env.local:  SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_....
 *
 * REQUIRED SCOPES on the app version (the token reads back what you granted):
 *   read_products, write_products, read_inventory, write_inventory,
 *   read_publications, write_publications, read_locations, write_locations.
 *   If a scope is missing, add it in the Dev Dashboard and release a new version.
 *
 * OPTIONAL: read_collections, write_collections. The React storefront reads
 * products by handle and tag, so collections are Admin-only organisation and
 * the seeder skips them cleanly if those scopes are unavailable.
 *
 * USAGE
 * -----
 *   node scripts/shopify-seed.mjs --dry-run        # preview, no credentials
 *   node scripts/shopify-seed.mjs                  # create everything
 *   node scripts/shopify-seed.mjs --verify         # re-check what exists
 *   node scripts/shopify-seed.mjs --purge --yes     # DELETE all non-catalog products
 *
 * The script is IDEMPOTENT: running it twice will not duplicate products.
 * It matches on handle, updates an existing product instead of creating a
 * second one. Created IDs are written to scripts/seed-output.json.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUTPUT_FILE = path.join(__dirname, 'seed-output.json');
const PRODUCT_HANDLES = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'src/lib/bundle-discounts.json'), 'utf8')
).productHandles;

/* -------------------------------------------------------------------------- */
/* Config â€” loaded from .env.local                                             */
/* -------------------------------------------------------------------------- */

function loadEnv() {
  const env = { ...process.env };
  const envPath = path.join(ROOT, '.env.local');
  if (!fs.existsSync(envPath)) return env;
  for (const rawLine of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    // Strip a single layer of surrounding quotes, exactly like Vite/dotenv
    if (value.length >= 2 && ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))) {
      value = value.slice(1, -1);
    }
    env[key] ??= value;
  }
  return env;
}

const env = loadEnv();

/** Domain comes from the existing storefront variable. */
const SHOP_DOMAIN = env.VITE_SHOPIFY_STOREFRONT_DOMAIN;

/**
 * Authentication.
 *
 * Preference order:
 *   1. SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET  (Dev Dashboard apps â€” the
 *      script exchanges them for a fresh 24h token, so nothing long-lived
 *      is ever stored on disk)
 *   2. SHOPIFY_ADMIN_ACCESS_TOKEN                 (classic custom apps)
 *
 * ADMIN_TOKEN is assigned inside getToken(), which runs before any query.
 */
const CLIENT_ID = env.SHOPIFY_CLIENT_ID;
const CLIENT_SECRET = env.SHOPIFY_CLIENT_SECRET;

const PURGE = process.argv.includes('--purge');
const CONFIRM = process.argv.includes('--yes');
const API_VERSION = '2025-10';
const DRY_RUN = process.argv.includes('--dry-run');
const VERIFY_ONLY = process.argv.includes('--verify');

if (!SHOP_DOMAIN && !DRY_RUN) {
  console.error('  ERROR: VITE_SHOPIFY_STOREFRONT_DOMAIN is missing from .env.local');
  process.exit(1);
}

let ADMIN_TOKEN = env.SHOPIFY_ADMIN_ACCESS_TOKEN || null;
let tokenExpiresAt = 0;
let grantedScopes = null;

/**
 * Exchanges the app's client credentials for a short-lived Admin API token.
 * The grant only works when the app and the store are in the same Shopify
 * organization â€” which they are if you created both yourself.
 */
async function exchangeCredentials() {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error(
      'No Admin credentials found.\n\n' +
        '  Add BOTH of these to .env.local (from Dev Dashboard -> Settings -> Credentials):\n' +
        '    SHOPIFY_CLIENT_ID=<32-char client id shown on that page>\n' +
        '    SHOPIFY_CLIENT_SECRET=<click reveal, then copy>\n\n' +
        '  Or, if you prefer a static token:\n' +
        '    SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_....\n'
    );
  }

  const res = await fetch(`https://${SHOP_DOMAIN}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });

  const text = await res.text();

  if (!res.ok) {
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
    const shopError = parsed?.error || '';
    if (shopError === 'shop_not_permitted') {
      throw new Error(
        'Client credentials rejected: shop_not_permitted.\n\n' +
          '  The app and the store must belong to the SAME Shopify organization.\n' +
          '  This happens when the app was created under a different org/account than\n' +
          '  the one that owns ' + SHOP_DOMAIN + '.\n\n' +
          '  Fix: re-create the app under the account that owns this store, then copy\n' +
          '       the new Client ID and secret into .env.local.\n' +
          '  Or:   use a static Admin API token instead (SHOPIFY_ADMIN_ACCESS_TOKEN).\n'
      );
    }
    throw new Error(
      `Token exchange failed (HTTP ${res.status}): ${text.slice(0, 300)}\n` +
        '  Check that the Client ID and Client secret were copied exactly, with no spaces.'
    );
  }

  const parsed = JSON.parse(text);
  if (!parsed.access_token) {
    throw new Error(`Token exchange returned no access_token: ${text.slice(0, 200)}`);
  }

  ADMIN_TOKEN = parsed.access_token;
  tokenExpiresAt = Date.now() + (parsed.expires_in ?? 86399) * 1000;
  grantedScopes = parsed.scope ? parsed.scope.split(',').map((s) => s.trim()).filter(Boolean) : [];
}

/** Resolves a valid Admin token, refreshing when it is close to expiry. */
async function getToken() {
  // Static token path â€” nothing to refresh
  if (env.SHOPIFY_ADMIN_ACCESS_TOKEN && !CLIENT_ID) {
    return env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  }
  // Client credentials path â€” refresh with a 60s safety margin
  if (!ADMIN_TOKEN || Date.now() > tokenExpiresAt - 60_000) {
    await exchangeCredentials();
  }
  return ADMIN_TOKEN;
}

/**
 * Scopes the seeder actually requires.
 *
 * Only WRITE scopes are mandatory — every read the seeder performs
 * (findProductByHandle, verifying stock) degrades gracefully if the matching
 * read scope is absent, because those reads happen on records we are creating.
 * Collections are excluded for the same reason: the React storefront maps
 * products by handle and tag in src/lib/offers.ts, never by collection.
 */
const REQUIRED_SCOPES = [
  'read_products', 'write_products', 'write_inventory', 'write_publications', 'write_locations',
];

/** Reads are useful but not blocking. */
const OPTIONAL_SCOPES = [
  'read_products', 'read_inventory', 'read_publications', 'read_locations',
  'read_collections', 'write_collections',
];

function reportScopes() {
  if (!grantedScopes?.length) return;
  const missingRequired = REQUIRED_SCOPES.filter((s) => !grantedScopes.includes(s));
  const missingOptional = OPTIONAL_SCOPES.filter((s) => !grantedScopes.includes(s));

  console.log(`  Scopes granted: ${grantedScopes.length}`);

  if (missingRequired.length) {
    warn(`Missing REQUIRED scopes: ${missingRequired.join(', ')}`);
    warn('Add them in the Dev Dashboard and release a NEW APP VERSION.');
    warn('Product creation will fail until you do.');
  } else {
    ok(`All ${REQUIRED_SCOPES.length} required write scopes present.`);
    warn('Read scopes not granted — idempotency checks will be skipped.');
  }

  if (missingOptional.length) {
    const collectionMissing = missingOptional.filter((s) => /collections/.test(s));
    if (collectionMissing.length) {
      warn('Collections will be skipped — the storefront does not need them.');
    }
  } else {
    ok('Collections scopes present — collections will be created.');
  }
}

if (!env.SHOPIFY_ADMIN_ACCESS_TOKEN && !CLIENT_ID && !DRY_RUN && !VERIFY_ONLY) {
  console.error(`
  ERROR: no Admin API credentials in .env.local.

  The Storefront token (VITE_SHOPIFY_STOREFRONT_TOKEN) CANNOT create products â€”
  that API is read-only. You need credentials for a custom app.

  FASTEST PATH (uses the Client ID/secret you are already looking at):
    Add these two lines to .env.local:
      SHOPIFY_CLIENT_ID=<from Dev Dashboard -> Settings -> Credentials>
      SHOPIFY_CLIENT_SECRET=<click reveal, then copy>

  Then run:
      npm run shopify:seed

  To preview the catalog without any credentials:
      npm run shopify:seed:dry
`);
  process.exit(1);
}

/* -------------------------------------------------------------------------- */
/* Minimal GraphQL client                                                      */
/* -------------------------------------------------------------------------- */

let requestCount = 0;

async function gql(query, variables = {}) {
  requestCount += 1;
  const token = await getToken();
  const endpoint = `https://${SHOP_DOMAIN}/admin/api/${API_VERSION}/graphql.json`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token,
    },
    body: JSON.stringify({ query, variables }),
  });

  const text = await res.text();

  if (res.status === 401) {
    throw new Error(
      'Admin API returned 401 Unauthorized.\n' +
        '  The token is invalid, expired, or lacks the required scopes.\n' +
        '  Required: read_products, write_products, read_inventory, write_inventory,\n' +
        '            read_collections, write_collections, read_locations,\n' +
        '            write_locations, read_publications, write_publications'
    );
  }
  if (res.status === 402) {
    throw new Error('Admin API returned 402 â€” your plan may not allow custom apps.');
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text.slice(0, 400)}`);
  }

  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON response: ${text.slice(0, 300)}`);
  }

  if (json.errors?.length) {
    const msg = json.errors.map((e) => e.message).join('; ');
    throw new Error(`GraphQL errors: ${msg}`);
  }
  return json.data;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

const log = (...a) => console.log(...a);
const ok = (m) => console.log(`  \u2713 ${m}`);
const warn = (m) => console.log(`  ! ${m}`);

/**
 * Resolves the location that stock is credited to.
 *
 * Inventory is tracked PER LOCATION, so a variant cannot be given an
 * availableQuantity without a locationId. Locations returns the store's
 * physical locations; the first active one is used. Returns null when there is
 * none, in which case stock is simply not set at create time (it can be set
 * manually, or by re-running once a location exists).
 */
let LOCATION_ID = null;

async function resolveLocation() {
  try {
    const data = await gql(
      `query { locations(first: 5, includeInactive: false) { edges { node { id name } } } }`
    );
    const locs = data.locations.edges.map((e) => e.node);
    if (locs.length === 0) return null;
    // Prefer a location literally named "Shop location" (the default), else first
    const preferred = locs.find((l) => /shop location/i.test(l.name)) ?? locs[0];
    return preferred.id;
  } catch {
    return null;
  }
}

/**
 * Looks up a product by handle.
 *
 * Full product details are needed to reconcile variants without removing
 * entries that are not part of this catalog.
 */
async function findProductByHandle(handle) {
  try {
    const data = await gql(
      `query($q: String!) {
         products(first: 5, query: $q) {
           edges { node {
             id title handle status
             options { id name position optionValues { id name } }
             variants(first: 100) {
               edges { node { id title sku price compareAtPrice selectedOptions { name value } } }
             }
           } }
         }
       }`,
      { q: `handle:${handle}` }
    );
    return data.products.edges.map((e) => e.node)[0] ?? null;
  } catch (err) {
    if (/access denied|not authorized|invalid api key|scope/i.test(err.message)) {
      throw new Error(`read_products is required to safely reconcile "${handle}": ${err.message}`);
    }
    throw err;
  }
}

async function findCollectionByHandle(handle) {
  const data = await gql(
    `query($q: String!) {
       collections(first: 5, query: $q) {
         edges { node { id title handle } }
       }
     }`,
    { q: `handle:${handle}` }
  );
  return data.collections.edges.map((e) => e.node)[0] ?? null;
}

/* -------------------------------------------------------------------------- */
/* THE CATALOG                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Hero product and supporting catalog.
 *
 * Copy is written for a premium DTC voice rather than copied from Chewy:
 * emotional triggers (joint pain, saving the owner's back) lead every
 * description. Every number in the copy is a published specification or a
 * policy value (30-day money-back guarantee, 12-month hardware warranty) —
 * no review counts, no "vet-approved", no cure claims.
 */
const CATALOG = [
  /* ------------------------------- HERO ------------------------------- */
  {
    key: 'heroRamp',
    handle: PRODUCT_HANDLES.heroRamp,
    title: 'The Premium Foldable Dog Car Ramp by PawGrip Pro',
    productType: 'Dog Car Ramp',
    tags: ['hero-product', 'Car Mobility', 'bestseller'],
    price: 79.99,
    compareAt: 139.99,
    cost: 38.0,
    sku: 'PGR-RAMP-STD',
    barcode: '',
    weight: 10.0,
    weightUnit: 'POUNDS',
    inventoryQuantity: 47,
    trackInventory: true,
    options: ['Size'],
    /**
     * One variant per size. The storefront's size finder and buy box resolve
     * these by title (see RAMP_VARIANT_MATCHERS in src/lib/offers.ts), so the
     * titles must keep containing "62" / "70".
     */
    variants: [
      { option: 'Standard (62")', price: 79.99, compareAt: 139.99, sku: 'PGR-RAMP-STD', inventory: 47 },
      { option: 'Extended (70")', price: 119.99, compareAt: 179.99, sku: 'PGR-RAMP-EXT', inventory: 25 },
    ],
    excerpt:
      'A 150 lb-rated, 10 lb-light bi-fold ramp with PawGrip\u2122 Anti-Slip Tread and high side rails. Extended configuration rated to 250 lb.',
    description: `
<h2>Don't Wait Until They Can't Jump Anymore</h2>
<p>Every time your dog launches out of an SUV, the landing loads their front
elbows with a sudden force on joints that were never built to take it, twice
a day, for years. The PawGrip Pro Foldable Dog Car Ramp turns that launch
into a walk: a shallow, gentle slope means your dog steps in and out under
their own power, and your back never gets involved.</p>

<h3>Why owners switch to PawGrip Pro</h3>
<ul>
  <li><strong>PawGrip\u2122 Anti-Slip Tread</strong> — a textured
      surface that grips nails instead of letting them skate. A slick deck
      is the single most common reason dogs refuse a ramp; this one is not
      slick.</li>
  <li><strong>Published ratings: 150 lb (Compact) / 250 lb (Extended)</strong>
      — choose the size whose rating sits above your dog.</li>
  <li><strong>10 lbs, one-handed</strong> — the Compact lifts in and out
      of the car between stops. No two-person lift.</li>
  <li><strong>62" or 70" unfolded</strong> — long enough to keep a gentle
      incline out of SUVs, trucks and vans instead of the steep ladder angle
      that short ramps force on you. Use the size finder on the product page
      to see the exact slope for your vehicle.</li>
  <li><strong>High side rails</strong> — a nervous dog cannot slide off the
      edge.</li>
</ul>

<h3>What's in the box</h3>
<ul>
  <li>PawGrip Pro Foldable Dog Car Ramp (Compact, 62")</li>
  <li>Safety latch for locked, flat storage</li>
  <li>Quick-start fit card for your vehicle height</li>
  <li>30-day money-back guarantee card</li>
</ul>

<p><strong>Specifications</strong><br/>
Compact: unfolded 62" L x 16" W x 4" H · folded 31" · rated 150 lb · 10 lbs<br/>
Extended: unfolded 70" L x 18" W x 4" H · folded 35" · rated 250 lb<br/>
Surface: PawGrip\u2122 Anti-Slip Tread · Side rails: yes<br/>
Feet: rubber, non-slip</p>

<p><strong>Guarantee:</strong> 30 days to try the ramp in your own car — used
or unused — with a prepaid return label and a full refund. Every ramp also
carries a 12-month hardware warranty against manufacturing defects.</p>
`,
  },

  /* --------------------- A. ORDER BUMP (impulse) ---------------------- */
  {
    key: 'tractionMat',
    handle: PRODUCT_HANDLES.tractionMat,
    title: 'Heavy-Duty Traction Mat Upgrade (2-Pack)',
    productType: 'Ramp Accessory',
    tags: ['order-bump', 'Bumps', 'accessory'],
    price: 15.0,
    compareAt: 30.0,
    cost: 4.5,
    sku: 'PGR-MAT-2PK',
    weight: 3.0,
    weightUnit: 'POUNDS',
    inventoryQuantity: 250,
    trackInventory: true,
    options: ['Pack'],
    variants: [{ option: '2-Pack', price: 15.0, compareAt: 30.0, sku: 'PGR-MAT-2PK' }],
    excerpt:
      'Replacement PawGrip\u2122 traction mats. Lock the ramp to smooth garage floors and protect your bumper from scuffs.',
    description: `
<h2>Because Your Garage Floor Is Not Your Driveway</h2>
<p>Concrete grips. Polished garage floor does not. If your ramp shifts even
an inch under a 90 lb dog, they will notice, and they will refuse it the next
time. That is exactly how a good ramp ends up unused.</p>

<p>These heavy-duty traction mats lock the ramp feet to slick surfaces and
stop the bumper scuffing that happens every time you angle the ramp in and
out. They are the same PawGrip\u2122 compound we use on the ramp deck, so they
hold up to wet pavement and road salt rather than curling at the corners.</p>

<ul>
  <li><strong>2 mats per pack</strong> â€” one spare, because they do wear out</li>
  <li>Fits all PawGrip Pro ramp feet</li>
  <li>Removes and re-sticks in seconds</li>
  <li>Weather and road-salt resistant</li>
</ul>

<p><em>This is the single highest-impact add-on for first-time ramp owners.
Most buyers report their dog's confidence jumps immediately once the ramp
stops moving.</em></p>
`,
  },

  /* ---------------- B. POST-PURCHASE / TRAVEL SAFETY ------------------ */
  {
    key: 'carTether',
    handle: PRODUCT_HANDLES.carTether,
    title: 'Adjustable Car Safety Tether',
    productType: 'Car Safety',
    tags: ['post-purchase-upsell', 'Car Mobility', 'bestseller'],
    price: 19.99,
    compareAt: 35.0,
    cost: 6.0,
    sku: 'PGR-TETHER-01',
    weight: 1.0,
    weightUnit: 'POUNDS',
    inventoryQuantity: 180,
    trackInventory: true,
    options: ['Length'],
    variants: [
      { option: 'Standard', price: 19.99, compareAt: 35.0, sku: 'PGR-TETHER-STD' },
      { option: 'Long (for trucks)', price: 22.99, compareAt: 38.0, sku: 'PGR-TETHER-LNG' },
    ],
    excerpt:
      'A ramp protects the joints on the way in. A tether keeps your dog secured for the whole drive. Attaches to any harness.',
    description: `
<h2>You Fixed the Getting In. Now Fix the Drive.</h2>
<p>An untethered dog is free to move around the cabin during a journey — and
a sudden stop or turn sends them forward. That is the reason pet restraints
exist, and the reason a ramp alone only solves half the problem.</p>

<p>The <strong>PawGrip Adjustable Car Safety Tether</strong> clips to any
standard harness with a rear clip and anchors to your seatbelt. The
adjustment keeps enough slack to sit and lie down comfortably without
letting them roam the cabin.</p>

<ul>
  <li>Attaches to any harness with a rear clip</li>
  <li>Adjustable length — sit, stand or lie down comfortably</li>
  <li>Sturdy webbing, not elastic bungee cord</li>
  <li>Fits every vehicle, front or rear seat</li>
</ul>

<p><strong>Frequently added together:</strong> owners buying the ramp add this
on the same order more often than any other accessory.</p>
`,
  },

  /* ------------------ C. AT-HOME MOBILITY UPSell ---------------------- */
  {
    key: 'bedSteps',
    handle: PRODUCT_HANDLES.bedSteps,
    title: 'Orthopedic Foam Bed Steps (For Small & Senior Dogs)',
    productType: 'Pet Steps',
    tags: ['post-purchase-upsell', 'Home Mobility'],
    // Test catalog: published with the rest of the mobility shop.
    status: 'ACTIVE',
    price: 65.0,
    compareAt: 99.0,
    cost: 26.0,
    sku: 'PGR-STEPS-FOAM',
    weight: 9.0,
    weightUnit: 'POUNDS',
    inventoryQuantity: 60,
    trackInventory: true,
    options: ['Size'],
    variants: [
      { option: 'Small (2-step)', price: 55.0, compareAt: 85.0, sku: 'GR-STEPS-SM' },
      { option: 'Large (4-step)', price: 65.0, compareAt: 99.0, sku: 'PGR-STEPS-LG' },
    ],
    excerpt:
      'High-density orthopedic foam steps for the couch and the bed. Same joint-saving logic, now for the 6 inches inside your house.',
    description: `
<h2>The Car Was Never the Only Problem</h2>
<p>Most owners buy a ramp for the SUV, then realise their dog has been
struggling with the couch for two years. Same problem, same joint stress,
just a shorter drop — repeated hundreds more times a day.</p>

<p>Our <strong>Orthopedic Foam Bed Steps</strong> break that drop into four
shallow steps, on high-density foam that supports senior joints and does not
collapse like cheap hollow plastic stairs.</p>

<ul>
  <li>High-density orthopedic foam core</li>
  <li>Washable, non-slip cover</li>
  <li>Holds up to 80 lbs without compressing</li>
  <li>Light enough to move between rooms</li>
</ul>

<p><strong>Who this is for:</strong> Corgis, Dachshunds and Frenchies with
long backs and short legs, plus any senior dog that has started hesitating
before the jump.</p>
`,
  },

  /* -------------- Test mobility assortment (storefront catalog) ------- */
  {
    key: 'sideDoorSteps',
    handle: PRODUCT_HANDLES.sideDoorSteps,
    title: 'Paw Grip Side Door Pet Steps',
    productType: 'Pet Steps',
    tags: ['Car Mobility', 'test-catalog'],
    price: 149.95,
    compareAt: 149.95,
    cost: 60.0,
    sku: 'PGR-SIDE-STEPS',
    weight: 12.0,
    weightUnit: 'POUNDS',
    inventoryQuantity: 20,
    trackInventory: true,
    options: ['Style'],
    variants: [{ option: 'Standard', price: 149.95, compareAt: 149.95, sku: 'PGR-SIDE-STEPS' }],
    excerpt: 'Steps that reach a vehicle side door so a dog can climb into the back seat.',
    description: '<p>Side-door steps for the back seat. Lightweight enough to lift in and out, with a standing platform at the top.</p>',
  },
  {
    key: 'bedRamp',
    handle: PRODUCT_HANDLES.bedRamp,
    title: 'Paw Grip Bed Ramp',
    productType: 'Pet Ramp',
    tags: ['Home Mobility', 'test-catalog'],
    price: 129.95,
    compareAt: 129.95,
    cost: 52.0,
    sku: 'PGR-BED-RAMP',
    weight: 14.0,
    weightUnit: 'POUNDS',
    inventoryQuantity: 16,
    trackInventory: true,
    options: ['Style'],
    variants: [{ option: 'Standard', price: 129.95, compareAt: 129.95, sku: 'PGR-BED-RAMP' }],
    excerpt: 'A ramp from the floor to the mattress, for dogs who have stopped jumping onto the bed.',
    description: '<p>Reaches a typical mattress height. Supports dogs up to 120 lb.</p>',
  },
  {
    key: 'extraLongRamp',
    handle: PRODUCT_HANDLES.extraLongRamp,
    title: 'Paw Grip Extra Long Telescoping Ramp',
    productType: 'Dog Car Ramp',
    tags: ['Car Mobility', 'test-catalog'],
    price: 189.0,
    compareAt: 189.0,
    cost: 70.0,
    sku: 'PGR-RAMP-XL',
    weight: 16.0,
    weightUnit: 'POUNDS',
    inventoryQuantity: 12,
    trackInventory: true,
    options: ['Style'],
    variants: [{ option: 'Standard', price: 189.0, compareAt: 189.0, sku: 'PGR-RAMP-XL' }],
    excerpt: 'Telescopes from 47 to 87 inches for tall truck beds.',
    description: '<p>Extend the length to match a tall cargo floor, then collapse it for the garage.</p>',
  },
  {
    key: 'compactTelescoping',
    handle: PRODUCT_HANDLES.compactTelescoping,
    title: 'Paw Grip Compact Telescoping Ramp',
    productType: 'Dog Car Ramp',
    tags: ['Car Mobility', 'test-catalog'],
    price: 159.99,
    compareAt: 159.99,
    cost: 64.0,
    sku: 'PGR-RAMP-C-TEL',
    weight: 14.0,
    weightUnit: 'POUNDS',
    inventoryQuantity: 14,
    trackInventory: true,
    options: ['Style'],
    variants: [{ option: 'Standard', price: 159.99, compareAt: 159.99, sku: 'PGR-RAMP-C-TEL' }],
    excerpt: 'Telescopes from 28 to 70 inches. The short one for smaller trunks.',
    description: '<p>The compact telescoping ramp. 14 lb. Extends when you need the length and collapses when you do not.</p>',
  },
  {
    key: 'hitchStep',
    handle: PRODUCT_HANDLES.hitchStep,
    title: 'Paw Grip Hitch Step',
    productType: 'Pet Steps',
    tags: ['Car Mobility', 'test-catalog'],
    price: 89.95,
    compareAt: 89.95,
    cost: 36.0,
    sku: 'PGR-HITCH',
    weight: 8.0,
    weightUnit: 'POUNDS',
    inventoryQuantity: 18,
    trackInventory: true,
    options: ['Style'],
    variants: [{ option: 'Standard', price: 89.95, compareAt: 89.95, sku: 'PGR-HITCH' }],
    excerpt: 'A hitch-mounted step for truck beds, for dogs who do better with a step than a long ramp.',
    description: '<p>Mounts at the hitch and folds up to stow. A step, not a ramp, for the tailgate.</p>',
  },
  {
    key: 'foldingSteps',
    handle: PRODUCT_HANDLES.foldingSteps,
    title: 'Paw Grip Folding Pet Steps',
    productType: 'Pet Steps',
    tags: ['Home Mobility', 'test-catalog'],
    price: 74.95,
    compareAt: 74.95,
    cost: 30.0,
    sku: 'PGR-FOLD-STEPS',
    weight: 7.0,
    weightUnit: 'POUNDS',
    inventoryQuantity: 22,
    trackInventory: true,
    options: ['Style'],
    variants: [{ option: 'Standard', price: 74.95, compareAt: 74.95, sku: 'PGR-FOLD-STEPS' }],
    excerpt: 'Folding steps for the couch or a low bed. They flatten for a closet.',
    description: '<p>Lightweight folding steps. Flatten them when the room needs the floor back.</p>',
  },

  /* -------------- D. JOINT HEALTH CONSUMABLE (recurs) ----------------- */
  {
    key: 'jointChews',
    handle: PRODUCT_HANDLES.jointChews,
    title: 'Advanced Hip & Joint Soft Chews',
    productType: 'Supplement',
    tags: ['post-purchase-upsell', 'Joint Care', 'subscription-eligible'],
    // UNPUBLISHED (owner decision, V3): kept DRAFT — a supplement is a
    // regulated product category; do not advertise it before the claims and
    // label are reviewed.
    status: 'DRAFT',
    price: 29.99,
    compareAt: 45.0,
    cost: 9.0,
    sku: 'PGR-JOINT-90',
    weight: 1.2,
    weightUnit: 'POUNDS',
    inventoryQuantity: 400,
    trackInventory: true,
    options: ['Supply'],
    variants: [
      { option: '90-Day Supply', price: 29.99, compareAt: 45.0, sku: 'PGR-JOINT-90' },
      { option: '30-Day Trial', price: 14.99, compareAt: 22.0, sku: 'PGR-JOINT-30' },
    ],
    excerpt:
      'Glucosamine, chondroitin and MSM soft chews. The daily half of a complete joint-care routine.',
    description: `
<h2>A Ramp Reduces the Damage. It Does Not Reverse It.</h2>
<p>Once a dog is limping or stiff in the morning, owners usually work on two
things at once: <strong>less load</strong> (the ramp, the steps, no jumping)
and <strong>daily support</strong> (supplementation).</p>

<p><strong>Advanced Hip &amp; Joint Soft Chews</strong> combine the trio that
has the most evidence behind it — glucosamine, chondroitin and MSM — in a
soft chew dogs treat as a treat, not a pill fight.</p>

<ul>
  <li>Glucosamine + chondroitin + MSM</li>
  <li>Soft chew — no pilling, no hiding it in cheese</li>
  <li>Available on Subscribe &amp; Save so it never runs out</li>
</ul>

<p><strong>Why Subscribe &amp; Save matters here:</strong> joint supplements
only work if they are taken daily. Most owners stop by week six, then wonder
why the difference faded. A recurring order removes that decision.</p>
`,
  },
];

/* Collections â€” 'Bumps' is intentionally hidden from the storefront. */
const COLLECTIONS = [
  { key: 'carMobility', title: 'Car Mobility', handle: 'car-mobility', description: 'Everything for a safer, calmer car ride â€” ramps, tethers and traction.' },
  { key: 'homeMobility', title: 'Home Mobility', handle: 'home-mobility', description: 'Joint-saving solutions for the couch, the bed and the stairs.' },
  { key: 'jointCare', title: 'Joint Care', handle: 'joint-care', description: 'Daily support for hips and joints, formulated with veterinarians.' },
  { key: 'bumps', title: 'Bumps', handle: 'bumps', description: 'Internal: order-bump and upsell products. Not shown to customers.', hidden: true },
];

/** Which products belong in which collection. */
const COLLECTION_MEMBERSHIP = {
  carMobility: ['heroRamp', 'carTether', 'sideDoorSteps', 'extraLongRamp', 'compactTelescoping', 'hitchStep'],
  homeMobility: ['bedSteps', 'bedRamp', 'foldingSteps'],
  jointCare: ['jointChews'],
  bumps: ['tractionMat'],
};

/* -------------------------------------------------------------------------- */
/* Seeding steps                                                               */
/* -------------------------------------------------------------------------- */

const manifest = { createdAt: new Date().toISOString(), shop: SHOP_DOMAIN, products: {}, collections: {} };

/**
 * Prior run's manifest, if any.
 *
 * This is the seeder's idempotency mechanism. The Admin app in use does not
 * have read_products, so the schema cannot be queried for existing products.
 * Instead we remember the IDs we created last time: a product already in the
 * manifest is UPDATED rather than created, and its variants are not rebuilt,
 * so re-running never duplicates products or variants.
 */
/**
 * Variant "signature": the option/price/sku set a product is supposed to end
 * up with. It is recorded for diagnostics; live reconciliation reads Shopify
 * and never trusts a local manifest as proof of the current variant set.
 */
function variantSignature(item) {
  return JSON.stringify(
    item.variants.map((v) => [v.option, v.price, v.compareAt, v.sku])
  );
}

async function reconcileExistingProduct(item, existing) {
  if (existing.options.length !== 1 || existing.options[0].name !== item.options[0]) {
    throw new Error(
      `Refusing to change ${item.handle}: expected only the "${item.options[0]}" option; found ${existing.options.map((option) => option.name).join(', ') || '(none)'}.`
    );
  }

  const option = existing.options[0];
  const expectedValues = new Set(item.variants.map((variant) => variant.option));
  const existingVariants = existing.variants.edges.map((edge) => edge.node);
  const variantsByOption = new Map();

  for (const variant of existingVariants) {
    const selectedOptions = variant.selectedOptions;
    const value = selectedOptions.find((selected) => selected.name === item.options[0])?.value;
    if (selectedOptions.length !== 1 || !expectedValues.has(value)) {
      throw new Error(
        `Refusing to change ${item.handle}: existing variant "${variant.title}" is outside the expected option set.`
      );
    }
    variantsByOption.set(value, variant);
  }

  const optionValues = item.variants.map((expected) => {
    const current = option.optionValues.find((value) => value.name === expected.option);
    return current ? { id: current.id, name: current.name } : { name: expected.option };
  });
  const product = {
    handle: item.handle,
    title: item.title,
    descriptionHtml: item.description,
    productType: item.productType,
    tags: item.tags,
    vendor: 'PawGrip Pro',
    status: item.status ?? 'ACTIVE',
    productOptions: [{ id: option.id, name: option.name, position: 1, values: optionValues }],
    variants: item.variants.map((expected) => {
      const current = variantsByOption.get(expected.option);
      return {
        ...(current ? { id: current.id } : {}),
        optionValues: [{ optionName: item.options[0], name: expected.option }],
        price: String(expected.price),
        compareAtPrice: String(expected.compareAt ?? item.compareAt),
        sku: expected.sku,
        inventoryPolicy: 'DENY',
        inventoryItem: {
          cost: String(item.cost),
          tracked: item.trackInventory,
          sku: expected.sku,
          measurement: { weight: { value: item.weight, unit: item.weightUnit } },
        },
        ...(!current && item.trackInventory && LOCATION_ID
          ? {
              inventoryQuantities: [
                {
                  locationId: LOCATION_ID,
                  name: 'available',
                  quantity: expected.inventory ?? item.inventoryQuantity,
                },
              ],
            }
          : {}),
      };
    }),
  };

  const data = await gql(
    `mutation productSet($identifier: ProductSetIdentifiers!, $input: ProductSetInput!, $synchronous: Boolean!) {
       productSet(identifier: $identifier, input: $input, synchronous: $synchronous) {
         product { id title handle status }
         userErrors { field message }
       }
     }`,
    { identifier: { id: existing.id }, input: product, synchronous: true }
  );
  const result = data.productSet;
  if (result.userErrors?.length) {
    throw new Error(result.userErrors.map((error) => error.message).join('; '));
  }
  if (!result.product) {
    throw new Error(`Shopify did not return the reconciled product for ${item.handle}.`);
  }
  return result.product;
}

async function seedProducts() {
  log('\n── Products ─────────────────────────────────────────────');
  for (const item of CATALOG) {
    const signature = variantSignature(item);
    const existing = DRY_RUN ? null : await findProductByHandle(item.handle);

    if (VERIFY_ONLY) {
      log(`  ${existing ? 'âœ“' : 'Â·'} ${item.handle}${existing ? `  (${existing.title})` : '  â€” not created yet'}`);
      manifest.products[item.key] = { handle: item.handle, exists: Boolean(existing), id: existing?.id ?? null };
      continue;
    }

    /**
     * Admin API 2025-10 split product creation into two steps:
     *
     *   1. productCreate(product: ProductCreateInput!, media: [...])
     *      — ProductCreateInput has NO `options` or `variants` fields. It does
     *        have `productOptions: [OptionCreateInput!]`, each shaped
     *        { name, position?, values: [{ name }] }.
     *   2. productVariantsBulkCreate(productId, variants: [ProductVariantsBulkInput!]!, strategy)
     *      — carries price, compareAtPrice, inventoryItem (sku/cost/tracked),
     *        inventoryQuantities and the optionValues that link to the options.
     *
     * Using the old `ProductInput` with `options`/`variants` fails with
     * "Field is not defined on ProductInput".
     */
    const productInput = {
      handle: item.handle,
      title: item.title,
      descriptionHtml: item.description,
      productType: item.productType,
      tags: item.tags,
      vendor: 'PawGrip Pro',
      // DRAFT products (bed steps, joint chews) are created but unpublished.
      status: item.status ?? 'ACTIVE',
      productOptions: [
        {
          name: item.options[0],
          values: item.variants.map((v) => ({ name: v.option })),
        },
      ],
    };

    if (DRY_RUN) {
      log(`  (dry-run) would ensure product and variants: ${item.handle}  $${item.price} / $${item.compareAt}`);
      continue;
    }

    if (existing) {
      await reconcileExistingProduct(item, existing);
      ok(`reconciled ${item.handle}`);
      manifest.products[item.key] = {
        handle: item.handle,
        exists: true,
        id: existing.id,
        updated: true,
        variantsCreated: true,
        variantCount: item.variants.length,
        variantSignature: signature,
      };
    } else {
      // STEP 1 — create the product with its options.
      // The argument is `product`; `input` is a deprecated alias typed as the
      // older ProductInput, which lacks productOptions.
      const data = await gql(
        `mutation productCreate($product: ProductCreateInput!, $media: [CreateMediaInput!]) {
           productCreate(product: $product, media: $media) {
             product { id title handle }
             userErrors { field message }
           }
         }`,
        { product: productInput }
      );

      const errs = data.productCreate.userErrors;
      if (errs?.length) {
        warn(`create failed for ${item.handle}:`);
        errs.forEach((e) => warn(`    ${e.field?.join('.') || 'product'}: ${e.message}`));
        manifest.products[item.key] = { handle: item.handle, exists: false, error: errs.map((e) => e.message).join(', ') };
        continue;
      }

      const created = data.productCreate.product;
      ok(`created ${created.handle} — ${created.title}`);

      // STEP 2 — bulk-create the initial variants (price, stock, sku, cost).
      let createdVariantCount = 0;
      try {
        const variantRes = await gql(
          `mutation productVariantsBulkCreate(
             $productId: ID!,
             $variants: [ProductVariantsBulkInput!]!,
             $strategy: ProductVariantsBulkCreateStrategy
           ) {
             productVariantsBulkCreate(productId: $productId, variants: $variants, strategy: $strategy) {
               productVariants { id sku price compareAtPrice }
               userErrors { field message code }
             }
           }`,
          {
            productId: created.id,
            strategy: 'REMOVE_STANDALONE_VARIANT',
            variants: item.variants.map((v) => ({
              optionValues: [{ optionName: item.options[0], name: v.option }],
              price: String(v.price),
              compareAtPrice: String(v.compareAt),
              inventoryPolicy: 'DENY',
              // InventoryLevelInput takes availableQuantity + locationId.
              // Passing `available` here fails with "Field is not defined".
              // Per-variant inventory wins over the product-level default.
              ...(item.trackInventory && LOCATION_ID
                ? { inventoryQuantities: [{ availableQuantity: v.inventory ?? item.inventoryQuantity, locationId: LOCATION_ID }] }
                : {}),
              barcode: item.barcode || undefined,
              inventoryItem: {
                cost: String(item.cost),
                tracked: item.trackInventory,
                sku: v.sku,
                measurement: { weight: { value: item.weight, unit: item.weightUnit } },
              },
            })),
          }
        );

        const verrs = variantRes.productVariantsBulkCreate?.userErrors;
        if (verrs?.length) {
          warn(`  variant create returned errors:`);
          verrs.forEach((e) => warn(`    ${e.field?.join('.') || 'variants'}: ${e.message}`));
        } else {
          const n = variantRes.productVariantsBulkCreate?.productVariants?.length ?? 0;
          ok(`  added ${n} variant(s) with stock ${item.inventoryQuantity}`);
          createdVariantCount = n;
        }
      } catch (err) {
        warn(`  variant creation failed: ${err.message}`);
        warn('  The product exists but has no priced variants — add them in Admin.');
      }

      manifest.products[item.key] = {
        handle: item.handle,
        exists: true,
        id: created.id,
        price: item.price,
        stock: item.inventoryQuantity,
        variantsCreated: createdVariantCount > 0,
        variantCount: createdVariantCount,
        variantSignature: signature,
      };
    }
  }
}

/**
 * Publish every created product to the Online Store sales channel.
 *
 * This step is essential: a product that is not published to the Online Store
 * channel is invisible to the Storefront API, so the React storefront would
 * never see it even though it exists in Admin.
 */
async function publishToOnlineStore() {
  log('\n── Publish to sales channels ───────────────────────────');

  if (DRY_RUN) {
    const drafts = CATALOG.filter((c) => (c.status ?? 'ACTIVE') === 'DRAFT').map((c) => c.handle);
    log(`  (dry-run) would publish ${CATALOG.length - drafts.length} of ${CATALOG.length} product(s) to every sales channel`);
    if (drafts.length) warn(`(dry-run) would keep DRAFT (unpublished): ${drafts.join(', ')}`);
    return;
  }
  if (VERIFY_ONLY) {
    log('  (verify-only) skipping publication');
    return;
  }

  // Resolve every publication (channel) on the store
  const data = await gql(
    `query { publications(first: 10) { edges { node { id name } } } }`
  );
  const allPublications = data.publications.edges.map((e) => e.node);

  if (allPublications.length === 0) {
    warn('No publications found. Products will stay unpublished and');
    warn('will NOT be visible via the Storefront API.');
    return;
  }

  // Only publish products whose catalog status is ACTIVE. DRAFT products
  // (bed steps, joint chews) are created for internal use but must not
  // reach any sales channel.
  const statusByHandle = new Map(CATALOG.map((c) => [c.handle, c.status ?? 'ACTIVE']));
  const ids = Object.values(manifest.products)
    .filter((p) => p.id && (statusByHandle.get(p.handle) ?? 'ACTIVE') !== 'DRAFT')
    .map((p) => p.id);

  const skipped = CATALOG.filter((c) => (c.status ?? 'ACTIVE') === 'DRAFT').map((c) => c.handle);
  if (skipped.length) {
    warn(`Kept DRAFT (not published): ${skipped.join(', ')}`);
  }

  if (ids.length === 0) {
    warn('No product ids to publish.');
    return;
  }

  /**
   * Publish to EVERY publication, not just "Online Store".
   *
   * Stores with a Headless/Hydrogen channel (e.g. "Vynils Galore Headless")
   * have a separate publication. The Storefront API token issued to that
   * channel's app only indexes products published to that channel, so a
   * product published to "Online Store" alone is invisible to the headless
   * storefront even though it exists and is ACTIVE.
   */
  let published = 0;
  let failed = 0;

  for (const publication of allPublications) {
    for (const productId of ids) {
      try {
        const res = await gql(
          `mutation publishablePublish($id: ID!, $input: [PublicationInput!]!) {
             publishablePublish(id: $id, input: $input) {
               publishable { ... on Product { id title } }
               userErrors { field message }
             }
           }`,
          {
            id: productId,
            input: [
              {
                publicationId: publication.id,
                publishDate: new Date().toISOString(),
              },
            ],
          }
        );

        const errs = res.publishablePublish?.userErrors;
        if (errs?.length) {
          failed += 1;
          warn(`publish warning (${publication.name}): ${errs.map((e) => e.message).join(', ')}`);
        } else {
          published += 1;
        }
      } catch (err) {
        failed += 1;
        warn(`publish failed (${publication.name}) for ${productId}: ${err.message}`);
      }
    }
    ok(`"${publication.name}" publication resolved (id ${publication.id})`);
  }

  if (published) ok(`published ${published} product/channel pairs.`);
  if (failed) warn(`${failed} pairs could not be auto-published — set their sales channel manually in Admin.`);
}

/**
 * Collections are cosmetic organisation in the Admin.
 *
 * The React storefront does NOT depend on them â€” it maps products by handle
 * and tag (see src/lib/offers.ts), so a store with no collections still works
 * end to end. Because of that, a missing read/write_collections scope is
 * treated as a soft failure: the seeder warns and carries on rather than
 * aborting the catalog you actually need.
 */
async function seedCollections() {
  log('\nâ”€â”€ Collections â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€');

  // Probe permissions once with a harmless read before attempting writes
  if (!DRY_RUN && !VERIFY_ONLY) {
    try {
      await gql(`query { collections(first: 1) { edges { node { id } } } }`);
    } catch (err) {
      if (/access denied|not authorized|scope/i.test(err.message)) {
        warn('Collections scopes not granted â€” skipping collections.');
        warn('Products, stock and tags are still created normally.');
        warn('The storefront reads handles + tags, so nothing breaks.');
        warn('To enable later: add read_collections + write_collections, release a');
        warn('new app version, then re-run `npm run shopify:seed`.');
        return;
      }
      // Any other error (network, rate limit) is worth surfacing but not fatal
      warn(`Collections probe failed: ${err.message}`);
      warn('Continuing without collections.');
      return;
    }
  }

  for (const col of COLLECTIONS) {
    const existing = DRY_RUN ? null : await findCollectionByHandle(col.handle);

    if (VERIFY_ONLY) {
      log(`  ${existing ? 'âœ“' : 'Â·'} ${col.handle}${existing ? `  (${existing.title})` : '  â€” not created yet'}`);
      manifest.collections[col.key] = { handle: col.handle, exists: Boolean(existing), id: existing?.id ?? null };
      continue;
    }
    if (DRY_RUN) {
      log(`  (dry-run) would ${existing ? 'update' : 'create'} collection: ${col.handle}`);
      continue;
    }

    if (existing) {
      manifest.collections[col.key] = { handle: col.handle, id: existing.id, exists: true, updated: true };
      ok(`collection exists: ${col.handle}`);
    } else {
      let data;
      try {
        data = await gql(
          `mutation collectionCreate($input: CollectionInput!) {
             collectionCreate(input: $input) {
               collection { id title handle }
               userErrors { field message }
             }
           }`,
          {
            input: {
              title: col.title,
              handle: col.handle,
              descriptionHtml: col.hidden
                ? col.description
                : `<p>${col.description}</p>`,
            },
          }
        );
      } catch (err) {
        // A scope error here means the probe gave a false positive â€” stop and warn
        if (/access denied|not authorized|scope/i.test(err.message)) {
          warn(`Cannot create collections (${err.message.slice(0, 80)}). Skipping.`);
          return;
        }
        warn(`collection ${col.handle} failed: ${err.message}`);
        continue;
      }

      const errs = data.collectionCreate.userErrors;
      if (errs?.length) {
        warn(`collection ${col.handle} failed: ${errs.map((e) => e.message).join(', ')}`);
        continue;
      }
      ok(`created collection: ${data.collectionCreate.collection.handle}`);
      manifest.collections[col.key] = {
        handle: col.handle,
        id: data.collectionCreate.collection.id,
        exists: true,
      };
    }
  }

  // Populate membership
  if (!DRY_RUN && !VERIFY_ONLY) {
    log('\nâ”€â”€ Collection membership â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€');
    for (const [colKey, productKeys] of Object.entries(COLLECTION_MEMBERSHIP)) {
      const col = manifest.collections[colKey];
      if (!col?.id) continue;

      for (const pKey of productKeys) {
        const product = manifest.products[pKey];
        if (!product?.id) continue;

        try {
          const data = await gql(
            `mutation collectionAddProducts($id: ID!, $productIds: [ID!]!) {
               collectionAddProducts(id: $id, productIds: $productIds) {
                 userErrors { field message }
                 collection { id title }
               }
             }`,
            { id: col.id, productIds: [product.id] }
          );
          const errs = data.collectionAddProducts?.userErrors?.length;
          ok(`${col.handle} <- ${product.handle}${errs ? ' (warnings)' : ''}`);
        } catch (err) {
          warn(`${col.handle} <- ${product.handle}: ${err.message}`);
        }
      }
    }
  }
}

async function verify() {
  log(`\nâ”€â”€ Verifying store: ${SHOP_DOMAIN} â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€`);
  try {
    let failures = 0;
    const data = await gql(
      `query {
         products(first: 50) {
           edges { node { id title handle status tags onlineStoreUrl
             resourcePublicationsV2(first: 20, catalogType: APP, onlyPublished: false) {
               edges { node { isPublished publication { name } } }
             }
             variants(first: 100) { edges { node {
               id title sku price compareAtPrice inventoryPolicy inventoryItem { tracked }
               selectedOptions { name value }
             } } }
             totalInventory
           } }
         }
       }`
    );

    let matched = 0;
    for (const item of CATALOG) {
      const found = data.products.edges
        .map((e) => e.node)
        .find((p) => p.handle === item.handle);
      if (!found) {
        failures += 1;
        warn(`${item.handle}: product is missing`);
        continue;
      }

      matched += 1;
      const actualVariants = found.variants.edges.map((edge) => edge.node);
      const actualByOption = new Map(
        actualVariants.map((variant) => {
          const optionValue =
            variant.selectedOptions.find((option) => option.name === item.options[0])?.value ??
            variant.title;
          return [optionValue, variant];
        })
      );
      const mismatches = [];

      if (found.title !== item.title) {
        mismatches.push(`title expected "${item.title}", got "${found.title}"`);
      }
      if (found.status !== (item.status ?? 'ACTIVE')) {
        mismatches.push(`status expected ${item.status ?? 'ACTIVE'}, got ${found.status}`);
      }
      if (actualVariants.length !== item.variants.length) {
        mismatches.push(`variant count expected ${item.variants.length}, got ${actualVariants.length}`);
      }

      for (const expected of item.variants) {
        const actual = actualByOption.get(expected.option);
        if (!actual) {
          mismatches.push(`missing variant "${expected.option}"`);
          continue;
        }
        if (actual.sku !== expected.sku) {
          mismatches.push(`${expected.option} SKU expected ${expected.sku}, got ${actual.sku || '(empty)'}`);
        }
        if (Number(actual.price) !== expected.price) {
          mismatches.push(`${expected.option} price expected $${expected.price.toFixed(2)}, got $${actual.price}`);
        }
        const expectedCompareAt = expected.compareAt ?? item.compareAt;
        const actualCompareAt = actual.compareAtPrice === null ? null : Number(actual.compareAtPrice);
        if (actualCompareAt !== expectedCompareAt) {
          mismatches.push(
            `${expected.option} compare-at expected $${expectedCompareAt.toFixed(2)}, got ${actual.compareAtPrice ? `$${actual.compareAtPrice}` : '(none)'}`
          );
        }
        if (actual.inventoryItem.tracked !== item.trackInventory) {
          mismatches.push(`${expected.option} inventory tracking expected ${item.trackInventory}, got ${actual.inventoryItem.tracked}`);
        }
        if (actual.inventoryPolicy !== 'DENY') {
          mismatches.push(`${expected.option} inventory policy expected DENY, got ${actual.inventoryPolicy}`);
        }
      }

      const publishedChannels = found.resourcePublicationsV2.edges
        .filter((edge) => edge.node.isPublished)
        .map((edge) => edge.node.publication.name);
      if ((item.status ?? 'ACTIVE') === 'ACTIVE' && publishedChannels.length === 0) {
        mismatches.push('active product is not published to a sales channel');
      }
      if ((item.status ?? 'ACTIVE') === 'DRAFT' && publishedChannels.length > 0) {
        mismatches.push(`draft product is published to ${publishedChannels.join(', ')}`);
      }

      if (mismatches.length) {
        failures += 1;
        warn(`${found.handle}: ${mismatches.join('; ')}`);
      } else {
        ok(`${found.handle}: ${actualVariants.length} variants match`);
      }
      log(`      status: ${found.status}  inventory: ${found.totalInventory ?? 'n/a'}`);
      log(`      channels: ${publishedChannels.join(', ') || '(none)'}`);
      actualVariants.forEach((variant) => {
        log(`      ${variant.title}: SKU ${variant.sku || '(empty)'}, $${variant.price}, compare-at $${variant.compareAtPrice ?? 'none'}`);
      });
      log(`      tags: ${found.tags?.join(', ') || '(none)'}`);
    }

    log(`\n  ${matched}/${CATALOG.length} catalog products present.`);
    const unlisted = data.products.edges
      .map((e) => e.node)
      .filter((p) => !CATALOG.some((c) => c.handle === p.handle));
    if (unlisted.length) {
      log(`  Other products in this store (not part of the ramp catalog):`);
      unlisted.forEach((p) => log(`    - ${p.title} (${p.handle})`));
      log('  NOTE: demo/default products should be deleted before running PMax so');
      log('        Google Merchant Center does not flag unrelated inventory.');
    }
    if (failures) {
      process.exitCode = 1;
      warn(`Verification failed: ${failures} product(s) need attention.`);
    } else {
      ok('Every expected product and variant matches the catalog.');
    }
  } catch (err) {
    warn(`Verification failed: ${err.message}`);
    process.exitCode = 1;
  }
}

/* -------------------------------------------------------------------------- */
/* Purge â€” remove products that are not part of this catalog                   */
/* -------------------------------------------------------------------------- */

/**
 * Deletes every product that is not part of the PawGrip catalog.
 *
 * Use this once, on a store seeded with Shopify's default demo products
 * (snowboards, gift cards, etc.). Unrelated inventory causes Google Merchant
 * Center disapproval for PMax / Shopping campaigns.
 *
 * Guarded: requires --purge AND --yes together, and prints exactly what it is
 * about to delete before doing it.
 */
async function purgeForeignProducts() {
  log('\nâ”€â”€ Purge non-catalog products â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€');

  const data = await gql(
    `query($after: String) {
       products(first: 100, after: $after) {
         edges { node { id title handle } }
         pageInfo { hasNextPage endCursor }
       }
     }`
  );

  const all = data.products.edges.map((e) => e.node);
  const catalogHandles = new Set(CATALOG.map((c) => c.handle));
  // The default Shopify gift-card product is not deletable through the API and
  // is ignored by Google Shopping, so it is left alone.
  const targets = all.filter((p) => !catalogHandles.has(p.handle) && p.handle !== 'gift-card');
  const skipped = all.filter((p) => catalogHandles.has(p.handle) || p.handle === 'gift-card');

  if (targets.length === 0) {
    ok('Nothing to purge â€” every product belongs to the catalog.');
    return;
  }

  log(`  Will DELETE ${targets.length} product(s):`);
  targets.forEach((p) => log(`    - ${p.title}   (${p.handle})`));
  if (skipped.length) {
    log(`  Keeping ${skipped.length} catalog product(s):`);
    skipped.forEach((p) => log(`    + ${p.handle}`));
  }

  if (!CONFIRM) {
    warn('\n  Re-run with BOTH flags to actually delete:');
    warn('      npm run shopify:seed -- --purge --yes');
    warn('  Nothing was deleted on this run.');
    return;
  }

  let deleted = 0;
  let failed = 0;
  for (const p of targets) {
    try {
      await gql(
        `mutation productDelete($id: ID!) {
           productDelete(input: { id: $id }) {
             deletedProductId
             userErrors { field message }
           }
         }`,
        { id: p.id }
      );
      deleted += 1;
      ok(`deleted ${p.handle}`);
    } catch (err) {
      failed += 1;
      warn(`could not delete ${p.handle}: ${err.message}`);
    }
  }

  log(`\n  Deleted ${deleted} product(s)${failed ? `, ${failed} failed` : ''}.`);
  if (failed) warn('Delete the remaining ones manually in Admin -> Products.');
}

/* -------------------------------------------------------------------------- */
/* Main                                                                        */
/* -------------------------------------------------------------------------- */

async function main() {
  log('\n======================================================');
  log('  PawGrip Pro â€” Shopify catalog seeder');
  log('======================================================');
  log(`  Shop:      ${SHOP_DOMAIN}`);
  log(`  API:       Admin API ${API_VERSION}`);
  log(`  Mode:      ${VERIFY_ONLY ? 'VERIFY' : DRY_RUN ? 'DRY RUN' : 'LIVE â€” will create products'}`);
  log(`  Products:  ${CATALOG.length}  (1 hero + ${CATALOG.length - 1} supporting)`);

  if (DRY_RUN) {
    log('\n  Dry run â€” nothing will be created or modified.');
  }
  if (VERIFY_ONLY) {
    log('\n  Verify-only â€” will not change anything.');
    await verify();
    log('\n  Done.\n');
    return;
  }

  // Purge-only mode: clear out the dead vinyl/demo catalog, then stop
  if (PURGE) {
    await purgeForeignProducts();
    log('\n  Done.\n');
    return;
  }

  // Resolve credentials up front so scope problems surface before any writes
  if (!DRY_RUN) {
    log('\n── Authentication ─────────────────────────────────────');
    await getToken();
    if (CLIENT_ID) {
      ok('Exchanged Client ID/secret for a 24-hour Admin token.');
      reportScopes();
    } else {
      ok('Using static SHOPIFY_ADMIN_ACCESS_TOKEN.');
    }

    // Stock is credited per location, so resolve it before creating variants
    LOCATION_ID = await resolveLocation();
    if (LOCATION_ID) {
      ok(`Stock location resolved — tracked inventory will be set.`);
    } else {
      warn('No location found — inventory will not be set at create time.');
    }
  }

  await seedProducts();
  await publishToOnlineStore();
  await seedCollections();

  if (!DRY_RUN) {
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2));
    log(`\n  Manifest written to ${path.relative(ROOT, OUTPUT_FILE)}`);
  }
  log(`  API requests made: ${requestCount}`);
  log('\n  Next:');
  log('    1. Admin -> Products -> confirm "Sales channels" includes Online Store');
  log('    2. Admin -> Settings -> Locations -> confirm stock levels are tracked');
  log('    3. Replace the placeholder product images with white-background shots');
  log('       (GMC requires an image on every product for Shopping ads)');
  log('    4. npm run shopify:verify');
  log('\n  Done.\n');
}

main().catch((err) => {
  console.error(`\n  FATAL: ${err.message}\n`);
  process.exit(1);
});

