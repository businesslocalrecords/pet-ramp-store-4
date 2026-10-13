# Deployment — Network Solutions (cPanel) subdomain hosting

**Status:** Netlify is retired from this project's workflow. Deploys now
target the owner's paid **Network Solutions cPanel** subscription under the
**`pawgrip.businesslocalrecords.com`** subdomain. The root of the account
keeps serving the main application; nothing here touches it.

Current environment facts (confirmed with the owner):

| Item | Value |
|---|---|
| Host type | cPanel (Apache), Network Solutions |
| Temporary cPanel host | `122846c.netsolhost.com` |
| Subdomain | `pawgrip` (created in cPanel → Domains) |
| Document root | `htdocs/pawgrip` (as shown in the File Manager) |
| DNS | **Verified resolving** on 2026-10-13: `pawgrip.businesslocalrecords.com`, `businesslocalrecords.com` and the temp host all answer from `74.91.138.133`. Network Solutions quotes up to 24 h, so remote resolvers may still catch up |
| Credentials | **SFTP account created**: user `sftp_agent_01`, directory `/htdocs` (Network Solutions applies an up-to-10-minute activation delay). Values live in `ns.env` (gitignored) and become GitHub Actions repository secrets |

DNS verification means the subdomain should serve files the moment they
land in `htdocs/pawgrip` — the propagation wait affects visitors' resolvers,
not the upload, so there is no reason to stage the store anywhere else. The
temp host also mirrors the docroot at `122846c.netsolhost.com/pawgrip/`,
**but it renders broken there on purpose**: Vite builds with the default
`base: '/'`, so assets are requested from `/assets/…`, which only exist
under a dedicated document root. Do not "fix" that by changing `base` — it
would break the real subdomain deploy. The correct browser check is the real
domain; note its HTTPS certificate is not issued yet (AutoSSL owed).

---

## 1. Credentials needed from the Network Solutions hosting account

Network Solutions shared hosting is **cPanel** (Apache) fronted by an
openresty proxy. It has no Netlify-style
deploy API, so push-to-deploy has to be rebuilt from two halves:

- the **trigger** (what Netlify's webhook did) → **GitHub Actions**, in this
  repo, runs on every push to `main`;
- the **write** (what Netlify's deploy API did) → **one credential from the
  host** that authorizes uploading the built files over FTP/SFTP or SSH.

Only two things are actually needed, and both come from the cPanel account:

| # | Credential | Used for | Where it is found |
|---|---|---|---|
| 1 | **The SFTP account** — Network Solutions issues SFTP accounts (not classic FTP): user ID, password, and the directory it may access | The GitHub Actions workflow authenticates with this on every push | The "Create SFTP Account" dialog you already used → `sftp_agent_01` |
| 2 | *(Optional)* **cPanel login** (username `122846c` + hosting password from the Account Manager) | One-time setup only — not needed for deploys | Account Manager → hosting → Manage |

**Account details that matter for the workflow:** the account was created with
Directory `/htdocs`, which means an SFTP login lands **directly in /htdocs** —
the live document root of `businesslocalrecords.com`. The deploy target is
therefore the `pawgrip` subfolder *relative to the login*, never the login
root itself (see "Do not deploy to /htdocs" below).

`ns.env` in the repo root is the fill-in template for these — it is
gitignored, holds the exact formats and the cPanel page where each value is
found, and its keys map one-to-one to the secret names below. It is **never
committed** (`UNTRACKED.md` records why).

A **GitHub PAT with `repo` scope** is only needed if you would rather use
cPanel's own "Git Version Control" pull-based workflow; it is not needed for
the GitHub Actions route.

One more input the pipeline needs: this repo's `VITE_*` build variables
(Shopify + analytics IDs from `.env.example`), because Vite inlines them at
build time — same gotcha as Netlify. Those live as **GitHub Actions
secrets/variables** on this repo, not as hosting-account credentials.

### Where the credentials are stored

Everything goes in **GitHub → `businesslocalrecords/pet-ramp-store-4` →
Settings → Secrets and variables → Actions**. They are never committed, never
put in `.env` files in the repo, and never need to be pasted into a chat —
once the secrets exist, the workflow uses them without anyone re-sending them.

### One-time cPanel setup (subdomain fork)

1. ~~Create subdomain~~ **DONE** — `pawgrip` exists in cPanel → Domains with
   document root `htdocs/pawgrip`. The root app at `businesslocalrecords.com`
   is untouched — that is the "fork by subdomain" split. DNS was already
   verified as resolving (see below).
2. ~~Create the deploy account~~ **DONE** — SFTP account `sftp_agent_01`
   (directory `/htdocs`; activation takes up to 10 minutes). Its values are
   in `ns.env`.
3. After DNS resolves, cPanel → **SSL/TLS Status → Run AutoSSL** so the
   subdomain gets its own certificate (required — Shopify checkout redirects
   and Ads both reject insecure origins). HTTPS to the subdomain was not yet
   serving during setup, so this is expected to be owed until then.
4. Repeat this pattern per future storefront: one subdomain, one document
   root, one deploy account, one GitHub workflow.

### Do not deploy to /htdocs — ever

Deploying the store into the SFTP login root (`/htdocs`) would put it on
`businesslocalrecords.com` itself. Evidence gathered on 2026-10-13:

- `businesslocalrecords.com` → `74.91.138.133`
- `122846c.netsolhost.com` (this account's temp host) → `74.91.138.133`

…the **same server**, so `/htdocs` is the live docroot of the root domain. It
currently answers `403` (no index file), but the moment the main app's files
land there — or the store's do — they are the root website. The store's own
`.htaccess` (SPA catch-all to `index.html`) would actively break whatever the
root site serves.

`pawgrip.businesslocalrecords.com` also already resolves to `74.91.138.133`
and its vhost answers `403` (an empty directory) — the subdomain is live
server-side and is simply waiting for files. Uploading to `htdocs/pawgrip`
now is safe and lossless: the files sit there and the store appears at the
subdomain the moment a visitor's DNS catches up. There is nothing to gain
from targeting `/htdocs`, and it would defeat the entire fork-by-subdomain
plan.

---

## 2. The pipeline (what replaces Netlify)

**`.github/workflows/deploy.yml` is committed and live** (2026-10-13). The
snippet below is kept here as reference; the file is the source of truth. It
is intentionally boring: no Netlify-specific anything.

```yaml
name: Deploy to Network Solutions subdomain

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
        uses: wlixcc/SFTP-Deploy-Action@v1.2.6
        with:
          username: ${{ secrets.SFTP_USERNAME }}
          server: ${{ secrets.SFTP_SERVER }}
          port: ${{ secrets.SFTP_PORT }}
          password: ${{ secrets.SFTP_PASSWORD }}
          local_path: './dist/*'
          remote_path: ${{ secrets.SFTP_DIR }}   # `pawgrip` — relative to the SFTP login, which is /htdocs
          sftp_only: true                         # this account has no shell access
          sftpArgs: '-o ConnectTimeout=30'
```

The upload step is **SFTP with password auth** because that is the account
type Network Solutions issues. It uses `wlixcc/SFTP-Deploy-Action@v1.2.6`
(latest release; password login supported since v1.2.4). `sftp_only: true`
matters — a sub-account has no shell, so rsync-over-SSH would fail.

Secret names used above (values come from `ns.env`) — **all six are now set
as repository secrets** on `businesslocalrecords/pet-ramp-store-4`:

| Secret | Value |
|---|---|
| `SFTP_SERVER` | `122846c.netsolhost.com` |
| `SFTP_PORT` | `2222` — SFTP rides SSH, not FTP port 21; confirm on the host if a connect fails |
| `SFTP_USERNAME` | `sftp_agent_01` (the full generated ID, not the bare name) |
| `SFTP_PASSWORD` | the password set in the dialog |
| `SFTP_DIR` | `pawgrip` (relative to the SFTP login, which lands in `/htdocs`) |
| `VITE_SHOPIFY_STOREFRONT_DOMAIN` / `VITE_SHOPIFY_STOREFRONT_TOKEN` | the live storefront values (public by design; the site cannot query products without them) |

The analytics `VITE_*` IDs stay unset until the owner supplies them — an
unset variable behaves the same as an empty one, so the build is unaffected.

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
| Push-to-deploy webhook | **GitHub Actions workflow `.github/workflows/deploy.yml` — committed and live.** |
| `netlify.toml` redirects + headers | `public/.htaccess` **— shipped, inert until Apache serves the site.** |
| Environment variables in dashboard | GitHub Actions secrets/variables **— user creates these once.** |
| **Netlify Forms** (contact + founding-tester forms) | **BLOCKER — needs a decision.** The forms in `public/contact/` and `public/guide/` POST via `data-netlify="true"` and are detected through the hidden forms in `index.html`. Apache will not process them; submissions will silently die. Options: (a) small PHP mail handler on the subdomain (cPanel ships PHP), (b) third-party endpoint (Formspree, Basin, Getform). Owner picks one before cutover; AGENTS.md/README point here. |
| Deploy previews / branch previews | None. Optionally add a PR workflow that runs `npm ci && npm run build` (no secrets) so pull requests still get build signal. |
| Instant rollback | None — no previous-deploy switcher. Rollback = revert the commit and push; the pipeline redeploys automatically. Keep the last known-good commit handy. |

---

## 4. Cutover checklist

1. [x] Subdomain created: `pawgrip.businesslocalrecords.com` — DNS verified
       resolving from the workspace (remote resolvers may lag up to 24 h).
2. [x] Deploy account created: SFTP `sftp_agent_01` → `/htdocs`, deploy
       target `pawgrip` relative to the login (values in `ns.env`).
3. [ ] Run AutoSSL (cPanel → SSL/TLS Status) so the subdomain gets a
       certificate — required before any Shopify checkout redirect or Ads
       traffic touches it.
4. [x] Repository secrets created: `SFTP_SERVER`, `SFTP_PORT`, `SFTP_USERNAME`,
       `SFTP_PASSWORD`, `SFTP_DIR` and the two Shopify `VITE_*` storefront
       values (via `gh secret set`; `ns.env` is the source).
5. [ ] Decide the forms replacement (Netlify Forms, §3) and implement it.
6. [x] Commit `.github/workflows/deploy.yml` — done. Still to do after the
       first successful deploy: delete `netlify.toml`.
7. [ ] Verify: site loads on `https://pawgrip.businesslocalrecords.com`,
       static policy pages work, Shopify checkout redirects land, console is
       clean. First workflow run doubles as the connectivity test for the
       SFTP account (activation can lag the creation dialog by ~10 minutes).
8. [ ] Repoint Google Ads / Meta landing-page URLs to the new domain; update
       any domain allowlists (GA4 data streams, Meta pixel domains, Shopify
       customer-events pixel, Merchant Center claim).
9. [ ] Let DNS/proxy settle, then delete the Netlify site.

### Rollback

`git revert <bad-commit>` on `main` → the workflow redeploys the last good
version automatically. There is no artifact history, so keep known-good commit
hashes handy.
