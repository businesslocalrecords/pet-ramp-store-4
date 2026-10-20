/**
 * After `vite build`, copy dist/index.html once per public route so nginx
 * serves a unique title, description, canonical, and JSON-LD before JS runs.
 * Route data is bundled from src/lib/seo.ts with rolldown (already installed
 * via Vite). No extra dependency.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { rolldown } from 'rolldown';

const SITE = 'https://pawgrip.app';

function escapeText(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function escapeAttr(value) {
  return escapeText(value).replace(/"/g, '&quot;');
}

function replaceOnce(html, regex, replacement, label) {
  if (!regex.test(html)) {
    throw new Error(`SEO shell is missing ${label}`);
  }
  return html.replace(regex, replacement);
}

function applyRoute(template, route) {
  const url = route.path === '/' ? `${SITE}/` : `${SITE}${route.path}`;
  let html = template;
  html = replaceOnce(html, /<title>[\s\S]*?<\/title>/, `<title>${escapeText(route.title)}</title>`, 'title');
  html = replaceOnce(
    html,
    /<meta\s[^>]*name="description"[^>]*>/,
    `<meta name="description" content="${escapeAttr(route.description)}" />`,
    'description',
  );
  html = replaceOnce(
    html,
    /<meta\s[^>]*name="keywords"[^>]*>/,
    `<meta name="keywords" content="${escapeAttr(route.keywords)}" />`,
    'keywords',
  );
  html = replaceOnce(
    html,
    /<link\s[^>]*rel="canonical"[^>]*>/,
    `<link rel="canonical" href="${escapeAttr(url)}" />`,
    'canonical',
  );
  const metas = [
    ['property', 'og:type', route.price ? 'product' : 'website'],
    ['property', 'og:title', route.title],
    ['property', 'og:description', route.description],
    ['property', 'og:image', route.image],
    ['property', 'og:url', url],
    ['name', 'twitter:title', route.title],
    ['name', 'twitter:description', route.description],
    ['name', 'twitter:image', route.image],
  ];
  for (const [attr, key, value] of metas) {
    html = replaceOnce(
      html,
      new RegExp(`<meta\\s[^>]*${attr}="${key}"[^>]*>`),
      `<meta ${attr}="${key}" content="${escapeAttr(value)}" />`,
      key,
    );
  }

  html = html.replace(/\s*<meta\s[^>]*property="product:price:amount"[^>]*>/g, '');
  html = html.replace(/\s*<meta\s[^>]*property="product:price:currency"[^>]*>/g, '');
  if (route.price) {
    html = html.replace(
      '</head>',
      `    <meta property="product:price:amount" content="${escapeAttr(route.price)}" />\n    <meta property="product:price:currency" content="USD" />\n  </head>`,
    );
  }

  const json = JSON.stringify(route.jsonLd, null, 2);
  html = replaceOnce(
    html,
    /<script\s[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/,
    `<script id="seo-jsonld" type="application/ld+json">\n${json}\n    </script>`,
    'JSON-LD',
  );
  return html;
}

function sitemap(routes) {
  const urls = routes
    .map((route) => {
      const loc = route.path === '/' ? `${SITE}/` : `${SITE}${route.path}`;
      return `  <url><loc>${loc}</loc></url>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

async function loadRoutes(root) {
  const outfile = path.join(os.tmpdir(), `pawgrip-seo-${process.pid}.mjs`);
  const bundle = await rolldown({
    input: path.join(root, 'src/lib/seo.ts'),
    cwd: root,
  });
  await bundle.write({ file: outfile, format: 'esm' });
  const mod = await import(`${pathToFileURL(outfile).href}?t=${Date.now()}`);
  fs.rmSync(outfile, { force: true });
  if (!Array.isArray(mod.SEO_ROUTES) || mod.SEO_ROUTES.length === 0) {
    throw new Error('src/lib/seo.ts did not export SEO_ROUTES');
  }
  return mod.SEO_ROUTES;
}

export async function writeSeoShells(distDir) {
  const root = path.resolve(distDir, '..');
  const routes = await loadRoutes(root);
  const indexPath = path.join(distDir, 'index.html');
  const template = fs.readFileSync(indexPath, 'utf8');
  for (const route of routes) {
    const html = applyRoute(template, route);
    if (route.path === '/') {
      fs.writeFileSync(indexPath, html);
      continue;
    }
    const dir = path.join(distDir, route.path.replace(/^\//, ''));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), html);
  }
  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap(routes));
}
