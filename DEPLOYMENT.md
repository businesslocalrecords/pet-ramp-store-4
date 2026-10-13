# Deployment — domain.com (cPanel) subdomain hosting

**Status:** Netlify is being retired from this project's workflow. This file is
the working agreement for the replacement: a push-to-deploy pipeline from this
GitHub repo to a **subdomain** on the owner's paid domain.com (cPanel) hosting.

Target: **`<store>.businesslocalrecords.com`** (subdomain name to be confirmed —
`pawgrip` is the working example). The root of that hosting account keeps
serving the main application at `businesslocalrecords.com`; nothing in this
repo touches the root document root.

---

## 1. Credentials needed from domain.com's hosting section

domain.com shared hosting is **cPanel** (Apache). It has no Netlify-style
deploy API, so push-to-deploy has to be rebuilt from two halves:

- the **trigger** (what Netlify's webhook did) → **GitHub Actions**, in this
  repo, runs on every push to `main`;
- the **write** (what Netlify's deploy API did) → **one credential from the
  host** that authorizes uploading the built files over FTP/SFTP or SSH.

Only three things are actually needed, and only the first two come from
domain.com:

| # | Credential | From | Used for |
|---|---|---|---|
| 1 | **cPanel login** — cPanel URL, username, password (domain.com dashboard → hosting → cPanel) | domain.com | One-time setup only: create the subdomain + its document root, create a scoped FTP account, enable SSH/AutoSSL. You can do these three steps yourself in cPanel (5 minutes) and never hand over the master password — then I only need item 2. |
| 2 | **Deploy credential** (one of): **FTP account** (cPanel → FTP Accounts) scoped to the subdomain's directory — host, port, username, password, directory; **or SSH access** for the cPanel user (enable in cPanel → Security → SSH Access, import a public key so no password is shared) | domain.com | This is what the GitHub Actions workflow authenticates with on every push. |
| 3 | **GitHub PAT with `repo` scope** | GitHub | **Optional** — only for cPanel's own "Git Version Control" pull-based workflow. Not needed for the GitHub Actions route. |

One more input the pipeline needs: this repo's `VITE_*` build variables
(Shopify + analytics IDs from `.env.example`), because Vite inlines them at
build time — same gotcha as Netlify. Those live as **GitHub Actions
secrets/variables** on this repo, not as domain.com credentials.

### Where the credentials are stored

Everything goes in **GitHub → `businesslocalrecords/pet-ramp-store-4` →
Settings → Secrets and variables → Actions**. They are never committed, never
put in `.env` files in the repo, and never need to be pasted into a chat —
once the secrets exist, the workflow uses them without anyone re-sending them.

### One-time cPanel setup (subdomain fork)

1. cPanel → **Domains → Create subdomain**: `pawgrip` for domain
   `businesslocalrecords.com`. It auto-creates the document root (typically
   `~/pawgrip`) and the DNS record. The root app at `businesslocalrecords.com`
   is untouched — that is exactly the "fork by subdomain" split.
2. If the domain's DNS is hosted somewhere else (Cloudflare, etc.), add the
   `pawgrip` record pointing at the same server there instead.
3. cPanel → **SSL/TLS Status → Run AutoSSL** so the subdomain gets its own
   certificate (required — Shopify checkout redirects and Ads both reject
   insecure origins).
4. Repeat these steps per future storefront: one subdomain, one document
   root, one set of credentials, one GitHub workflow.

---

## 2. The pipeline (what replaces Netlify)

`.github/workflows/deploy.yml` — committed once the subdomain name and the
deploy credential are confirmed. Until then the file lives here so it is
reviewable. It is intentionally boring: no Netlify-specific anything.

```yaml
name: Deploy to domain.com subdomain

on:
  push:
    branches: [main]
  workflow_dispatch:          # manual redeploy button, same as Netlify's

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22    # matches local tooling
          cache: npm

      - run: npm ci
      - run: npm run build     # tsc -b && vite build → dist/
        env:
          VITE_SHOPIFY_STOREFRONT_DOMAIN: ${{ secrets.VITE_SHOPIFY_STOREFRONT_DOMAIN }}
          VITE_SHOPIFY_STOREFRONT_TOKEN: ${{ secrets.VITE_SHOPIFY_STOREFRONT_TOKEN }}
          VITE_GA_MEASUREMENT_ID: ${{ secrets.VITE_GA_MEASUREMENT_ID }}
          VITE_GOOGLE_ADS_CONVERSION_ID: ${{ secrets.VITE_GOOGLE_ADS_CONVERSION_ID }}
          VITE_META_PIXEL_ID: ${{ secrets.VITE_META_PIXEL_ID }}
          VITE_REQUIRE_BUSINESS_INFO: ${{ vars.VITE_REQUIRE_BUSINESS_INFO }}

      - name: Upload dist/ to the subdomain document root
        uses: SamKirkland/FTP-Deploy-Action@v4.3.14
        with:
          server: ${{ secrets.FTP_SERVER }}
          username: ${{ secrets.FTP_USERNAME }}
          password: ${{ secrets.FTP_PASSWORD }}
          server-dir: ${{ secrets.FTP_SERVER_DIR }}   # e.g. /pawgrip/
          local-dir: ./dist/
          protocol: ftps            # change to 'ftp' only if the server lacks FTPS
          dangerous-clean-slate: false
```

Secret names used above (adjust once the account details are real):

| Secret | Value |
|---|---|
| `FTP_SERVER` | server hostname or dedicated IP |
| `FTP_USERNAME` | the scoped FTP account's username |
| `FTP_PASSWORD` | that account's password |
| `FTP_SERVER_DIR` | the subdomain's base directory (ends with `/`) |
| `VITE_…` | the build-time variables from `.env.example` |

If SSH is chosen instead of FTP, swap the upload step for an `rsync`/`scp`
action using `secrets.SSH_PRIVATE_KEY` — no other change.

### netlify.toml → `.htaccess`

`public/.htaccess` ships in the repo and Vite copies it into `dist/`, so it
deploys with the site. It is inert until the site is served by Apache (Netlify
ignores it). It translates the three `netlify.toml` concerns:

1. **Catch-all SPA rewrite** → `RewriteCond %{REQUEST_FILENAME} !-f` / `!-d`
   first, so the real static files (`/shipping/`, `/about/`, the guide, hashed
   assets) keep working exactly as they did; only unknown paths fall through
   to `index.html`.
2. **Security headers** → `Header always set …` for the same five headers.
3. **Hashed-asset caching** → `mod_expires`/`Header set Cache-Control` for the
   asset file types plus `no-cache` on `index.html`.

---

## 3. What Netlify did that must be replaced (migration blockers)

| Netlify feature | Replacement / status |
|---|---|
| Push-to-deploy webhook | GitHub Actions workflow above **— done in code, awaiting credential.** |
| `netlify.toml` redirects + headers | `public/.htaccess` **— shipped, inert until Apache serves the site.** |
| Environment variables in dashboard | GitHub Actions secrets/variables **— user creates these once.** |
| **Netlify Forms** (contact + founding-tester forms) | **BLOCKER — needs a decision.** The forms in `public/contact/` and `public/guide/` POST via `data-netlify="true"` and are detected through the hidden forms in `index.html`. Apache will not process them; submissions will silently die. Options: (a) small PHP mail handler on the subdomain (cPanel ships PHP), (b) third-party endpoint (Formspree, Basin, Getform). Owner picks one before cutover; AGENTS.md/README point here. |
| Deploy previews / branch previews | None. Optionally add a PR workflow that runs `npm ci && npm run build` (no secrets) so pull requests still get build signal. |
| Instant rollback | None — no previous-deploy switcher. Rollback = revert the commit and push; the pipeline redeploys automatically. Keep the last known-good commit handy. |

---

## 4. Cutover checklist

1. [ ] Confirm the subdomain name (working example: `pawgrip`).
2. [ ] Create subdomain + document root + AutoSSL in cPanel (or send me the
       cPanel login and I will do it).
3. [ ] Create the scoped FTP account (or enable SSH + share a public key).
4. [ ] Add the deploy secrets and the `VITE_*` variables in GitHub repo
       settings.
5. [ ] Decide the forms replacement (#3 above) and implement it.
6. [ ] Commit `.github/workflows/deploy.yml`, retire `netlify.toml` (delete
       after the first successful deploy), push to `main`.
7. [ ] Verify: site loads on `https://<store>.businesslocalrecords.com`,
       static policy pages work, Shopify checkout redirects land, console is
       clean.
8. [ ] Repoint Google Ads / Meta landing-page URLs to the new domain; update
       any domain allowlists (GA4 data streams, Meta pixel domains, Shopify
       customer-events pixel, Merchant Center claim).
9. [ ] Let DNS/proxy settle, then delete the Netlify site.

### Rollback

`git revert <bad-commit>` on `main` → the workflow redeploys the last good
version automatically. There is no artifact history, so keep known-good commit
hashes handy.
