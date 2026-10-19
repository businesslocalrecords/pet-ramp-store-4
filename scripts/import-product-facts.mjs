#!/usr/bin/env node
/**
 * Merge a desktop-agent facts file into src/lib/product-facts.json.
 *
 *   node scripts/import-product-facts.mjs path/to/pawgrip-product-facts.json
 *
 * The input is the file described in scripts/desktop-product-facts-prompt.md.
 * Existing slugs are replaced. Slugs that are absent stay as they are.
 * Strings that invent a medical endorsement or a customer statistic are dropped.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('Usage: node scripts/import-product-facts.mjs <pawgrip-product-facts.json>');
  process.exit(1);
}

const BANNED = /vet[-\s]?approv|veterinarian approved|clinically proven|94\s*%|2,?847/i;
const outPath = resolve('src/lib/product-facts.json');
const current = JSON.parse(readFileSync(outPath, 'utf8'));
const incoming = JSON.parse(readFileSync(resolve(inputPath), 'utf8'));
const rows = Array.isArray(incoming) ? incoming : incoming.products;
if (!Array.isArray(rows)) {
  console.error('Expected a products array.');
  process.exit(1);
}

function cleanList(value, label) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => {
      if (BANNED.test(item)) {
        console.warn(`dropped ${label}: banned claim`);
        return false;
      }
      return true;
    })
    .map((item) => item.slice(0, 500));
}

let written = 0;
for (const row of rows) {
  const dp = String(row.dp ?? '').replace(/\D/g, '');
  const slug = typeof row.slug === 'string' && row.slug.trim() ? row.slug.trim() : dp ? `dp-${dp}` : '';
  if (!slug) {
    console.warn('skipped a row with no dp or slug');
    continue;
  }
  if (row.error) {
    console.warn(`skipped ${slug}: ${row.error}`);
    continue;
  }
  current.products[slug] = {
    sourceUrl: typeof row.sourceUrl === 'string' ? row.sourceUrl.trim() : '',
    details: cleanList(row.details, `${slug} details`),
    instructions: cleanList(row.instructions, `${slug} instructions`),
    specs: Array.isArray(row.specs)
      ? row.specs
          .filter((spec) => spec && typeof spec.label === 'string' && typeof spec.value === 'string')
          .map((spec) => ({ label: spec.label.trim().slice(0, 80), value: spec.value.trim().slice(0, 120) }))
          .filter((spec) => spec.label && spec.value && !BANNED.test(spec.label) && !BANNED.test(spec.value))
      : [],
    included: cleanList(row.included, `${slug} included`),
    questions: Array.isArray(row.questions)
      ? row.questions
          .filter((item) => item && typeof item.q === 'string' && typeof item.a === 'string')
          .map((item) => ({ q: item.q.trim().slice(0, 200), a: item.a.trim().slice(0, 500) }))
          .filter((item) => item.q && item.a && !BANNED.test(item.q) && !BANNED.test(item.a))
          .slice(0, 6)
      : [],
  };
  written += 1;
}

writeFileSync(outPath, `${JSON.stringify(current, null, 2)}\n`);
console.log(`merged ${written} product fact sheet(s) into ${outPath}`);
