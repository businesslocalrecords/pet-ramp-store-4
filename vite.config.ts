import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { writeSeoShells } from './scripts/write-seo-shells.mjs'

const ROOT = path.dirname(fileURLToPath(import.meta.url));

/**
 * True while the BUSINESS object in src/lib/assets.ts still contains
 * REPLACE_ placeholders (unfilled business identity).
 */
function businessIdentityIsPlaceholder(): boolean {
  const source = fs.readFileSync(path.join(ROOT, 'src/lib/assets.ts'), 'utf8');
  return /REPLACE_WITH_/.test(source);
}

/**
 * Business-identity enforcement switch.
 *
 * With VITE_REQUIRE_BUSINESS_INFO unset (today's state) the build passes and
 * the storefront shows its developer notice banner. Set the flag to 'true'
 * once the real address/phone are in place — if any placeholder remains, the
 * build fails loudly instead of deploying a site Google Merchant Center /
 * Ads would reject. See LAUNCH_BLOCKERS.md #1 and AGENTS.md.
 */
if (process.env.VITE_REQUIRE_BUSINESS_INFO === 'true' && businessIdentityIsPlaceholder()) {
  throw new Error(
    'VITE_REQUIRE_BUSINESS_INFO is set, but the BUSINESS object in src/lib/assets.ts ' +
      'still contains REPLACE_ placeholders. Fill in the real street address, city, ' +
      'state, ZIP and phone (or unset the env var).'
  );
}

/**
 * Writes sitemap.xml and one HTML shell per public route after the bundle
 * exists, so the hashed script tags in dist/index.html are copied intact.
 */
function seoShellsPlugin() {
  return {
    name: 'pawgrip-seo-shells',
    apply: 'build' as const,
    async closeBundle() {
      await writeSeoShells(path.join(ROOT, 'dist'));
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react(), seoShellsPlugin()],
})
