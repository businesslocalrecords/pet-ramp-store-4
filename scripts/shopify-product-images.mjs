#!/usr/bin/env node
/**
 * PawGrip Pro — Shopify product-image uploader.
 *
 * Attaches a product image to every catalog product. The storefront seeder
 * (scripts/shopify-seed.mjs) creates the products but no media, so each
 * product ships image-less; this script fills that gap.
 *
 * Flow per image (Shopify's secure two-step upload):
 *   1. stagedUploadsCreate  → a temporary target { url, resourceUrl, parameters }
 *   2. HTTP POST the file   → multipart/form-data to target.url (params + file)
 *   3. productCreateMedia   → originalSource = resourceUrl, mediaContentType IMAGE
 *
 * Image sources (public/assets/product/):
 *   - premium-foldable-dog-car-ramp → the owner's white-background photos
 *     (revised/*.jpg). The flagship gallery stays that set.
 *   - mat / tether / chews / bed steps → original SVG renderings, rasterized to
 *     PNG here via `sharp` because Shopify product media must be raster
 *     (SVG is rejected). The storefront test catalog uses manufacturer
 *     photographs from public/assets/catalog/ for the mobility assortment.
 *
 * Idempotent: an image whose alt text already exists on the product is skipped,
 * so re-running never duplicates media.
 *
 * Auth + Admin GraphQL client mirror shopify-seed.mjs exactly. Credentials come
 * from .env.local (never committed, never pasted into chat):
 *   SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET   (Dev Dashboard app), or
 *   SHOPIFY_ADMIN_ACCESS_TOKEN                   (classic custom app, shpat_…)
 * Required scope: write_products. read_products is used for idempotency.
 *
 * Usage:
 *   node scripts/shopify-product-images.mjs            # dry-run (no creds needed)
 *   node scripts/shopify-product-images.mjs --apply    # LIVE — mutates the store
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PRODUCT_DIR = path.join(ROOT, 'public', 'assets', 'product');
const OUTPUT_FILE = path.join(__dirname, 'product-images-output.json');

const APPLY = process.argv.includes('--apply');
const DRY_RUN = !APPLY;
const API_VERSION = '2025-10';

/* -------------------------------------------------------------------------- */
/* Pretty logging                                                              */
/* -------------------------------------------------------------------------- */
const c = {
  reset: '\u001b[0m', dim: '\u001b[2m', bold: '\u001b[1m',
  green: '\u001b[32m', yellow: '\u001b[33m', red: '\u001b[31m', cyan: '\u001b[36m',
};
const log = (m = '') => console.log(m);
const ok = (m) => console.log(`  ${c.green}✓${c.reset} ${m}`);
const fail = (m) => console.log(`  ${c.red}✗${c.reset} ${m}`);
const info = (m) => console.log(`  ${c.cyan}·${c.reset} ${m}`);

/* -------------------------------------------------------------------------- */
/* Config — loaded from .env.local (same loader as the seeder)                 */
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
    if (value.length >= 2 && ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))) {
      value = value.slice(1, -1);
    }
    env[key] ??= value;
  }
  return env;
}

const env = loadEnv();
const SHOP_DOMAIN = env.VITE_SHOPIFY_STOREFRONT_DOMAIN;
const CLIENT_ID = env.SHOPIFY_CLIENT_ID;
const CLIENT_SECRET = env.SHOPIFY_CLIENT_SECRET;


/* -------------------------------------------------------------------------- */
/* Auth — identical preference order to shopify-seed.mjs                       */
/* -------------------------------------------------------------------------- */
let ADMIN_TOKEN = env.SHOPIFY_ADMIN_ACCESS_TOKEN || null;
let tokenExpiresAt = 0;

async function exchangeCredentials() {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error(
      'No Admin credentials found.\n\n' +
        '  Add to .env.local (from Dev Dashboard -> Settings -> Credentials):\n' +
        '    SHOPIFY_CLIENT_ID=<32-char client id>\n' +
        '    SHOPIFY_CLIENT_SECRET=<click reveal, then copy>\n\n' +
        '  Or use a static token:\n' +
        '    SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_....'
    );
  }
  const res = await fetch(`https://${SHOP_DOMAIN}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: CLIENT_ID, client_secret: CLIENT_SECRET }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Token exchange failed (HTTP ${res.status}): ${text.slice(0, 300)}\n  Check the Client ID and secret were copied exactly.`);
  }
  const parsed = JSON.parse(text);
  if (!parsed.access_token) throw new Error(`Token exchange returned no access_token: ${text.slice(0, 200)}`);
  ADMIN_TOKEN = parsed.access_token;
  tokenExpiresAt = Date.now() + (parsed.expires_in ?? 86399) * 1000;
}

async function getToken() {
  if (env.SHOPIFY_ADMIN_ACCESS_TOKEN && !CLIENT_ID) return env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  if (!ADMIN_TOKEN || Date.now() > tokenExpiresAt - 60_000) await exchangeCredentials();
  return ADMIN_TOKEN;
}

/* -------------------------------------------------------------------------- */
/* Minimal Admin GraphQL client (mirrors shopify-seed.mjs)                     */
/* -------------------------------------------------------------------------- */
let requestCount = 0;

async function gql(query, variables = {}) {
  requestCount += 1;
  const token = await getToken();
  const res = await fetch(`https://${SHOP_DOMAIN}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
    body: JSON.stringify({ query, variables }),
  });
  const text = await res.text();
  if (res.status === 401) {
    throw new Error('Admin API returned 401. The token is invalid/expired or lacks write_products.');
  }
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}: ${text.slice(0, 400)}`);
  let json;
  try { json = JSON.parse(text); } catch { throw new Error(`Non-JSON response: ${text.slice(0, 300)}`); }
  if (json.errors?.length) throw new Error(`GraphQL errors: ${json.errors.map((e) => e.message).join('; ')}`);
  return json.data;
}

/* -------------------------------------------------------------------------- */
/* The image manifest — one entry per catalog product                          */
/* -------------------------------------------------------------------------- */
const IMAGE_MANIFEST = [
  {
    handle: 'premium-foldable-dog-car-ramp',
    images: [
      { file: 'revised/ramp-studio-three-quarter.jpg', alt: 'The Premium Foldable Dog Car Ramp, three-quarter studio view on a white background' },
      { file: 'revised/ramp-folded-studio.jpg', alt: 'The dog car ramp folded flat for storage, studio view on a white background' },
      { file: 'revised/ramp-scene-deployed-tailgate.jpg', alt: 'The dog car ramp deployed at a vehicle tailgate' },
    ],
  },
  {
    handle: 'heavy-duty-traction-mat-upgrade-2-pack',
    images: [{ file: 'mat-traction-2pack.svg', alt: 'Heavy-duty traction mat two-pack with a textured non-slip surface' }],
  },
  {
    handle: 'crash-tested-adjustable-car-safety-tether',
    images: [{ file: 'tether-adjustable.svg', alt: 'Adjustable car safety tether with a seatbelt clip and slider buckle' }],
  },
  {
    handle: 'advanced-hip-joint-soft-chews',
    images: [{ file: 'chews-soft-chew.svg', alt: 'Hip and joint soft chews in a stand-up pouch with soft-chew pieces' }],
  },
  {
    handle: 'orthopedic-foam-bed-steps',
    images: [{ file: 'bed-steps-foam.svg', alt: 'Orthopedic foam pet steps, a three-step set with removable covers' }],
  },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */
function mimeTypeFor(file) {
  const ext = path.extname(file).toLowerCase();
  if (ext === '.svg') return 'image/png'; // rasterized to PNG before upload
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  throw new Error(`Unsupported image type: ${file}`);
}

/** Reads a file; rasterizes SVG → PNG buffer (Shopify rejects SVG media). */
async function loadImageBuffer(file) {
  const abs = path.join(PRODUCT_DIR, file);
  if (!fs.existsSync(abs)) throw new Error(`Missing image file: ${path.relative(ROOT, abs)}`);
  const raw = fs.readFileSync(abs);
  if (path.extname(file).toLowerCase() === '.svg') {
    const sharp = (await import('sharp')).default;
    return sharp(raw)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: false })
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .png()
      .toBuffer();
  }
  return raw;
}

/** Filename Shopify expects: a bare name, no path separators, correct extension. */
function uploadFilename(file) {
  const base = path.basename(file);
  return path.extname(file).toLowerCase() === '.svg' ? base.replace(/\.svg$/i, '.png') : base;
}

async function findProduct(handle) {
  const data = await gql(
    `query($q: String!) {
       products(first: 1, query: $q) {
         edges { node {
           id title handle
           media(first: 50) { edges { node { alt } } }
         } }
       }
     }`,
    { q: `handle:${handle}` }
  );
  return data.products.edges.map((e) => e.node)[0] ?? null;
}


async function stageUpload({ filename, mimeType, buffer }) {
  const data = await gql(
    `mutation($input: [StagedUploadInput!]!) {
       stagedUploadsCreate(input: $input) {
         stagedTargets { url resourceUrl parameters { name value } }
         userErrors { field message }
       }
     }`,
    { input: [{ filename, mimeType, resource: 'IMAGE', fileSize: String(buffer.byteLength), httpMethod: 'POST' }] }
  );
  const result = data.stagedUploadsCreate;
  if (result.userErrors?.length) throw new Error(result.userErrors.map((e) => e.message).join('; '));
  const target = result.stagedTargets?.[0];
  if (!target?.url || !target?.resourceUrl) throw new Error('stagedUploadsCreate returned no usable target.');
  return target;
}

async function uploadToStagedTarget(target, buffer, filename, mimeType) {
  const form = new FormData();
  for (const p of target.parameters) form.append(p.name, p.value);
  form.append('file', new Blob([buffer], { type: mimeType }), filename);
  const res = await fetch(target.url, { method: 'POST', body: form });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Staged upload failed (HTTP ${res.status}): ${body.slice(0, 200)}`);
  }
}

async function createMedia(productId, resourceUrl, alt) {
  const data = await gql(
    `mutation($productId: ID!, $media: [CreateMediaInput!]!) {
       productCreateMedia(productId: $productId, media: $media) {
         media { alt mediaContentType status }
         mediaUserErrors { field message }
       }
     }`,
    { productId, media: [{ originalSource: resourceUrl, alt, mediaContentType: 'IMAGE' }] }
  );
  const result = data.productCreateMedia;
  if (result.mediaUserErrors?.length) throw new Error(result.mediaUserErrors.map((e) => e.message).join('; '));
  return result.media?.[0] ?? null;
}

/* -------------------------------------------------------------------------- */
/* Main                                                                        */
/* -------------------------------------------------------------------------- */
async function main() {
  log('');
  log('  ══════════════════════════════════════════════════════');
  log('   PawGrip Pro — Shopify product-image uploader');
  log('  ══════════════════════════════════════════════════════');
  log(`  Shop:  ${SHOP_DOMAIN || '(unset)'}`);
  log(`  API:   Admin API ${API_VERSION}`);
  log(`  Mode:  ${DRY_RUN ? 'DRY RUN — nothing will be uploaded' : 'APPLY — LIVE writes'}`);
  log(`  Plan:  ${IMAGE_MANIFEST.reduce((n, p) => n + p.images.length, 0)} image(s) across ${IMAGE_MANIFEST.length} product(s)`);
  log('');

  if (!DRY_RUN && !SHOP_DOMAIN) {
    fail('VITE_SHOPIFY_STOREFRONT_DOMAIN is missing from .env.local');
    process.exit(1);
  }
  if (!DRY_RUN && !env.SHOPIFY_ADMIN_ACCESS_TOKEN && !CLIENT_ID) {
    fail('No Admin credentials in .env.local. The Storefront token cannot upload media.');
    process.exit(1);
  }

  const report = { mode: DRY_RUN ? 'dry-run' : 'apply', products: {} };

  for (const entry of IMAGE_MANIFEST) {
    log(`── ${entry.handle}`);
    let product = null;
    let existingAlts = new Set();

    if (!DRY_RUN) {
      product = await findProduct(entry.handle);
      if (!product) {
        fail(`product not found: ${entry.handle} — run the seeder first (npm run shopify:seed)`);
        report.products[entry.handle] = { error: 'product not found' };
        continue;
      }
      existingAlts = new Set(
        (product.media?.edges ?? []).map((e) => (e.node.alt || '').trim()).filter(Boolean)
      );
    }

    const uploaded = [];
    for (const img of entry.images) {
      const abs = path.join(PRODUCT_DIR, img.file);
      if (!fs.existsSync(abs)) {
        fail(`missing file: ${img.file}`);
        continue;
      }

      if (!DRY_RUN && existingAlts.has(img.alt.trim())) {
        info(`already present, skipping: ${img.file}`);
        continue;
      }

      if (DRY_RUN) {
        const kind = path.extname(img.file).toLowerCase() === '.svg' ? 'SVG→PNG' : path.extname(img.file).replace('.', '').toUpperCase();
        info(`would upload ${img.file}  [${kind}]  alt="${img.alt}"`);
        continue;
      }

      try {
        const buffer = await loadImageBuffer(img.file);
        const filename = uploadFilename(img.file);
        const mimeType = mimeTypeFor(img.file);
        const target = await stageUpload({ filename, mimeType, buffer });
        await uploadToStagedTarget(target, buffer, filename, mimeType);
        const media = await createMedia(product.id, target.resourceUrl, img.alt);
        ok(`uploaded ${filename} → ${media?.status || 'UPLOADED'}`);
        uploaded.push({ file: img.file, alt: img.alt, status: media?.status || 'UPLOADED' });
      } catch (err) {
        fail(`failed ${img.file}: ${err.message}`);
      }
    }

    report.products[entry.handle] = report.products[entry.handle] || {};
    if (uploaded.length) report.products[entry.handle].uploaded = uploaded;
  }

  log('');
  log(`  Admin API requests made: ${requestCount}`);
  if (DRY_RUN) {
    log('  Dry run complete. Re-run with --apply to upload for real.');
  } else {
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2));
    log(`  Manifest written to ${path.relative(ROOT, OUTPUT_FILE)}`);
  }
  log('');
}

main().catch((err) => {
  console.error(`\n  ${c.red}FATAL:${c.reset} ${err.message}\n`);
  process.exit(1);
});

