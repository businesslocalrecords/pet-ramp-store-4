# Deployment — pawgrip.app on a Linode VPS (Cloudflare-fronted)

> **UPDATE 2026-10-13 — migration off Network Solutions.** The storefront now
> runs on the dedicated domain **pawgrip.app** (Cloudflare DNS + SSL) served
> from a **Linode VPS** (nginx, static Vite build). Deploys are
> **GitHub Actions → build → rsync `dist/` to the VPS**; a push to `main`
> auto-deploys. Everything after the *Archived* marker below is the previous
> `pawgrip.businesslocalrecords.com` (Network Solutions) pipeline, kept for
> history and rollback only.

## Current architecture (pawgrip.app → Linode)

| Piece | Setup |
|---|---|
| Domain / TLS | Cloudflare: `pawgrip.app` **A** → the Linode public IPv4, proxy ON. Cloudflare terminates public TLS. |
| Origin | Linode VPS, **nginx** serving the static build from `/var/www/pawgrip.app` (port 80 to Cloudflare; add 443 + a Cloudflare Origin cert if the Cloudflare SSL mode is Full(strict)). |
| CI/CD | `.github/workflows/deploy-linode.yml` — on push to `main`, build with the `VITE_*` secrets inlined, then rsync `dist/` → the VPS over SSH as the `deploy` user. |
| Deploy key | An **ed25519** pair: PUBLIC key → the `deploy` user's `~/.ssh/authorized_keys` on the VPS (installed by the bootstrap); **private** key, base64-encoded to a single line, → GitHub secret `VPS_SSH_KEY_B64`. GitHub pushes *to* the VPS with it. |
| One-time VPS setup | `deploy/linode-setup.sh` (run as root on the VPS) installs nginx, the webroot, the site config and the deploy public key. |
| Auto-update | Push to `main` or `workflow_dispatch` rebuilds and redeploys in one Actions run (~3–5 min, mostly Tailwind). |

### GitHub repo settings — set once, never committed
Settings → Secrets and variables → Actions.
- **Secrets:** `VITE_SHOPIFY_STOREFRONT_DOMAIN`, `VITE_SHOPIFY_STOREFRONT_TOKEN`, `VPS_HOST`, `VPS_USER`, `VPS_PORT`, `VPS_DEPLOY_PATH`, `VPS_SSH_KEY_B64` (base64 of the deploy private key — see the bootstrap below).
- **Variables:** `VITE_GA_MEASUREMENT_ID`, `VITE_GOOGLE_ADS_CONVERSION_ID`, `VITE_META_PIXEL_ID`, `VITE_MICROSOFT_UET_TAG_ID`.
- `VPS_HOST` is the **Linode public IP** (Cloudflare does not proxy SSH). `VPS_DEPLOY_PATH` defaults to `/var/www/pawgrip.app`.

### One-time VPS bootstrap
1. Generate the deploy keypair locally: `ssh-keygen -t ed25519 -N "" -f linode_deploy -C github-actions`. Put the **base64 of the private key** in GitHub secret `VPS_SSH_KEY_B64` — `base64 -w0 linode_deploy` (Linux/macOS) or `[Convert]::ToBase64String([IO.File]::ReadAllBytes('linode_deploy'))` (Windows PowerShell). You paste the **public** key in step 2.
2. Copy `deploy/linode-setup.sh` to the VPS and run, as root:
   `DEPLOY_PUBKEY="<public key from step 1>" bash linode-setup.sh`
3. Cloudflare: add **A** `pawgrip.app` → this VPS public IPv4, proxy ON. SSL mode Flexible (origin HTTP) or Full(strict) + a Cloudflare Origin cert on the VPS.
4. Push to `main` (or Run the workflow). Verify `curl -I https://pawgrip.app/` → `200`.

### Notes / follow-ups
- The **visit log** (`public/track.php` → `clicks.txt`) is inert on static nginx — it needs php-fpm. Add php-fpm + a `location ~ \.php$` block if you want it; until then `click-tracker.ts` fails harmlessly.
- `public/.htaccess` still ships in `dist/` but nginx ignores it — the SPA / security / cache behavior is mirrored in `deploy/linode-setup.sh`.
- No `base` change: the build keeps Vite's default `base: '/'`, correct for a domain-root docroot.
- Point the **ad-platform allowlists** (Google Ads/Meta landing page, GA4 stream, Shopify Customer Events pixel, Merchant Center claim) at `https://pawgrip.app`. `index.html` `canonical`/`og:*`/JSON-LD now point at `https://pawgrip.app/`. The support email `support@pawgrippro.com` was left unchanged — forward/spin it up on `pawgrip.app` separately if you switch contact addresses.
- **Rollback** = revert the commit on `main` and push; the workflow redeploys. There is no artifact history — keep known-good commit hashes.

---

> **_Archived — the previous Network Solutions (cPanel) pipeline that served
> `pawgrip.businesslocalrecords.com`. Kept for history / rollback only; it is no
> longer the live path._**

# Deployment — Network Solutions (cPanel) subdomain hosting

**Status:** Netlify is retired from this project's workflow. The NetSol route
below was **superseded on 2026-10-13** by the Linode/`pawgrip.app` pipeline
described at the top of this file.

Current environment facts (confirmed with the owner):

| Item | Value |
|---|---|
| Host type | cPanel (Apache) behind an openresty proxy, Network Solutions |
| Temporary cPanel host | `122846c.netsolhost.com` |
| Subdomain | `pawgrip` (created in cPanel → Domains) |
| Document root | `htdocs/pawgrip` (as shown in the File Manager) |
| DNS | **Verified resolving** on 2026-10-13: `pawgrip.businesslocalrecords.com`, `businesslocalrecords.com` and the temp host all answer from `74.91.138.133`. The subdomain's *vhost* was still not mapped to its docroot that day (404 from the wrong backend) — Network Solutions quotes up to 24 h |
| Deploy account | SFTP account `sftp_agent_01`, directory `/htdocs` — usable from ordinary (home) connections only; see "Why the deploy pulls instead of pushes" below |
| Pipeline shape | **Two-stage, 443-only:** GitHub Actions builds and pushes to the public `publish` branch, then calls `deploy.php` on the host, which pulls the tarball and mirrors it into `htdocs/pawgrip` |
| Visit log | `track.php` (in the site payload) appends one line per visit to `clicks.txt` beside it; read via File Manager, or `track.php?view=1` with a hand-made `clicks-view-token.txt` |

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

## Why the deploy pulls instead of pushes

The obvious pipeline — Actions builds and uploads over SFTP — **cannot work
against this host**, verified on 2026-10-13 with `.github/workflows/probe.yml`
(dispatch it any time to re-check):

| Target | Result from a GitHub-hosted runner | Meaning |
|---|---|---|
| `github.com:22` (control) | **OPEN** | the probe and the runner's egress are fine |
| `122846c.netsolhost.com:443` (control) | **OPEN** | web traffic passes |
| `122846c.netsolhost.com:21 / :22 / :2222` | closed/filtered | FTP/SFTP are blocked from datacenter IPs |
| `122846c.netsolhost.com:2083 / :2082` | closed/filtered | cPanel API ports blocked too |
| `122846c.netsolhost.com/execute/…`, `/login/`, `/cpanelwebcall/` | `403` from the proxy | cPanel API not proxied on 443 either |

Network Solutions' firewall drops non-443 traffic from cloud/datacenter
ranges — the classic Newfold posture. Only 443 works, so the deploy has to
travel over 443 in the **pull** direction: the server fetching from GitHub is
ordinary outbound web traffic and bypasses the block entirely. (The SFTP
account still works from a normal home/office connection, which is why it is
kept as a manual/fallback path.)

The same link is also what makes the host's own "10-minute activation delay"
irrelevant to the pipeline — nothing connects to the host's file ports at
all.

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
| 1 | **The SFTP account** — Network Solutions issues SFTP accounts (not classic FTP): user ID, password, and the directory it may access | Manual deploys / fallback only. The automated pipeline does **not** need it — the host blocks datacenter IPs, so GitHub pulls nothing through it | The "Create SFTP Account" dialog you already used → `sftp_agent_01` |
| 2 | *(Optional)* **cPanel login** (username `122846c` + hosting password from the Account Manager) | The one-time cron setup, if done through the UI instead of by you | Account Manager → hosting → Manage |

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

`.github/workflows/deploy.yml` is committed and live. The build stage is the
same as Netlify's was (Node 22, `npm ci`, `npm run build` with the `VITE_*`
secrets inlined). What changed is the **delivery**: instead of pushing files
to the host over SFTP (impossible here — see above), the workflow pushes the
built `dist/` to this repo's public **`publish` branch**, and the host pulls
it.

### Stage 1 — Actions → `publish` branch (over 443, done)

After a green build, the workflow creates an orphan `publish` branch holding
the contents of `dist/` at its root (`.htaccess` included) and force-pushes
it. This repo is public, so the branch is anonymously downloadable at:

```
https://codeload.github.com/businesslocalrecords/pet-ramp-store-4/tar.gz/publish
```

### Stage 2 — `deploy.php` on the host (one-time, ~30 seconds)

The host accepts only ports 80/443 from datacenter IPs, so the trigger must
be an ordinary HTTP request. `server/deploy.php` in this repo (canonical
source) is a small, token-protected endpoint that does the pull: compare the
`deploy-version.txt` marker on the publish branch against the last applied
version, download the tarball if it changed, extract it, and mirror it into
`htdocs/pawgrip`. Install it **once, by hand**:

1. File Manager → `htdocs/pawgrip` → **New File** → name it `deploy.php`
2. Paste the contents of `server/deploy.php` **with the `TOKEN` placeholder
   replaced** by the deploy token (also stored as this repo's `DEPLOY_TOKEN`
   secret)
3. Save. Done — no scheduling UI, no server configuration.

The workflow's final step then calls, after every publish:

```
http://pawgrip.businesslocalrecords.com/deploy.php?token=<DEPLOY_TOKEN>
```

(retried 3×; HTTP until AutoSSL issues a certificate for the subdomain,
then the URL flips to `https` in `deploy.yml` — one-line change).

**What the endpoint does, in order:** auth via `hash_equals` (403 without
the token) → version gate against `?expect=<sha>` (409 "stale payload" when
the marker the CDN serves doesn't match the commit that just built)
→ consistency check that the tarball's own `deploy-version.txt` matches the
expected version (409 otherwise — `raw` and `codeload` are separate CDNs
behind one push, and a fresh marker over a stale tarball is what poisoned
the version state on 2026-10-13 before this check existed) → download the
tarball from codeload → extract (`tar` via `exec`, falling back to PHP's
`PharData`, then a pure-PHP gzopen+tar-header parser) → mirror into its own
directory (`rsync --delete`, falling back to a pure-PHP mirror; the
server-side state files are always excluded) → strip `deploy-version.txt`
from the live copy, record the version in `.deploy-version` → append a line
to `deploy.log` next to itself. It is idempotent and can be re-run at any
time from a browser; `deploy.log` is the first thing to check when something
looks stale. If the hosting account ever turns out to have PHP disabled,
the fallback is the manual WinSCP upload (or the cron variant below).

**Files that exist only on the server** (excluded from the mirror's delete
pass, so they survive every deploy): `deploy.php` itself, `deploy.log`,
`clicks.txt` (the visit log written by `track.php`), the optional
`clicks-view-token.txt` (guards the log's read-back endpoint), and the
`.deploy-version` marker. Everything else that the payload doesn't contain
**should** be deleted on deploy — that is what keeps removals in sync.

### The visit log (clicks.txt)

`public/track.php` ships inside the site payload: the same POST-only,
path-validated visit logger the root domain runs, appending one
pipe-delimited line per visit (ET time, city from `?city=` or the first path
segment, IP, path, user agent) to `clicks.txt` next to itself. The SPA fires
it on every page load via `navigator.sendBeacon` (`src/lib/click-tracker.ts`).
Reading it back: File Manager opens `clicks.txt` directly; this host answers
403 for `.txt` over HTTP (writes are unaffected — a 403 there rather than
the SPA catch-all's 200 proves the file exists). `track.php?view=1&token=…`
also serves it, guarded by `clicks-view-token.txt` — a file the owner
creates by hand once (absent = the read path stays closed).

### Alternative: cron polling (if the panel has Cron Jobs)

If you prefer a pull-based timer over the webhook, add this command as a
once-per-minute cron job (cPanel → Cron Jobs) instead of installing
`deploy.php`. Same payload, polled instead of triggered:

```
V=$(curl -sf https://raw.githubusercontent.com/businesslocalrecords/pet-ramp-store-4/publish/deploy-version.txt); if [ -n "$V" ] && [ -f "$HOME/.pawgrip-version" ] && [ "$V" = "$(cat $HOME/.pawgrip-version)" ]; then exit 0; fi; cd $HOME && curl -sfL https://codeload.github.com/businesslocalrecords/pet-ramp-store-4/tar.gz/publish -o /tmp/pawgrip.tgz && rm -rf /tmp/pawgrip-src && mkdir -p /tmp/pawgrip-src && tar -xzf /tmp/pawgrip.tgz -C /tmp/pawgrip-src --strip-components=1 && rsync -a --delete /tmp/pawgrip-src/ "$HOME/htdocs/pawgrip/" && rm -f "$HOME/htdocs/pawgrip/deploy-version.txt" && if [ -n "$V" ]; then echo "$V" > "$HOME/.pawgrip-version"; fi; echo "$(date): applied v=$V" >> "$HOME/pawgrip-deploy.log" 2>&1
```

### Latency and semantics

| Event | Delay |
|---|---|
| push to `main` → publish branch updated | one Actions run (~3–5 min, mostly the Tailwind build) |
| publish branch → live on the subdomain | **seconds** — the deploy hook fires at the end of the same run |

That is Netlify-equivalent behavior ("push → live"), just with a puller
instead of a webhook, and it survives host firewalls entirely. Manual
redeploy of an old build = re-run the workflow, `gh workflow run`, or hit
the `deploy.php` URL in a browser.

### Repo secrets (fallback + build inputs)

| Secret | Value / status |
|---|---|
| `VITE_SHOPIFY_STOREFRONT_DOMAIN` / `VITE_SHOPIFY_STOREFRONT_TOKEN` | set — the live storefront values (public by design; the site cannot query products without them) |
| `VITE_MICROSOFT_UET_TAG_ID` | set — the Microsoft UET tag (`343278405`), passed into the build step in `deploy.yml`; on this account UET alone activates Microsoft Clarity (owner-verified on the Clarity dashboard) |
| `VITE_GA_MEASUREMENT_ID`, `VITE_GOOGLE_ADS_CONVERSION_ID`, `VITE_META_PIXEL_ID` | unset until the owner supplies them; an unset var behaves as empty, so the build is unaffected |
| `SFTP_SERVER` / `SFTP_PORT` / `SFTP_USERNAME` / `SFTP_PASSWORD` / `SFTP_DIR` | set but **not used by the pipeline** — kept for the manual path (below) and so the SFTP upload step can be restored in one edit if the host ever allowlists GitHub's runner IP ranges (published at `https://api.github.com/meta`) |
| `DEPLOY_TOKEN` | set — the shared secret in the deploy hook URL; must equal the `TOKEN` constant in the server's `deploy.php`. Rotate by changing both |

The analytics `VITE_*` IDs stay unset until the owner supplies them — an
unset variable behaves the same as an empty one, so the build is unaffected.

### Manual / fallback deploy (SFTP from a normal connection)

The `sftp_agent_01` account works from a home/office connection (the block
is datacenter-IP-specific), so the fastest way to hand-upload is WinSCP or
FileZilla: host `122846c.netsolhost.com`, **SFTP**, port **22** (Network
Solutions' doc for this product says 22, not the legacy 2222), user
`sftp_agent_01`, and the target directory `htdocs/pawgrip`. Credentials are
in `ns.env`. This path is also the sanity check that the account actually
activated — if FileZilla lists `/htdocs` contents, it is live.

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
| Push-to-deploy webhook | **Two-stage, 443-only:** Actions publishes `dist/` to the public `publish` branch, then calls `deploy.php` on the host, which pulls the tarball and mirrors it into `htdocs/pawgrip`. Direct SFTP/FTP/cPanel-API from GitHub is impossible on this host (all non-80/443 ports filtered from datacenter IPs — see "Why the deploy pulls instead of pushes"). |
| `netlify.toml` redirects + headers | `public/.htaccess` **— shipped, inert until Apache serves the site.** |
| Environment variables in dashboard | GitHub Actions secrets/variables **— user creates these once.** |
| **Netlify Forms** (contact + founding-tester forms) | **BLOCKER — needs a decision.** The forms in `public/contact/` and `public/guide/` POST via `data-netlify="true"` and are detected through the hidden forms in `index.html`. Apache will not process them; submissions will silently die. Options: (a) small PHP mail handler on the subdomain (cPanel ships PHP), (b) third-party endpoint (Formspree, Basin, Getform). Owner picks one before cutover; AGENTS.md/README point here. |
| Deploy previews / branch previews | None. Optionally add a PR workflow that runs `npm ci && npm run build` (no secrets) so pull requests still get build signal. |
| Instant rollback | None — no previous-deploy switcher. Rollback = revert the commit and push; the pipeline redeploys automatically. Keep the last known-good commit handy. |

---

## 4. Cutover checklist

1. [x] Subdomain created: `pawgrip.businesslocalrecords.com` — DNS verified
       resolving from the workspace (remote resolvers may lag up to 24 h).
2. [x] Deploy account created: SFTP `sftp_agent_01` → `/htdocs` (manual path
       only; the pipeline does not use it).
3. [ ] Run AutoSSL (cPanel → SSL/TLS Status) so the subdomain gets a
       certificate — required before any Shopify checkout redirect or Ads
       traffic touches it.
4. [x] GitHub side built: `.github/workflows/deploy.yml` (build → publish
       branch) and repo secrets for the `VITE_*` build inputs.
5. [ ] **Owner installs `server/deploy.php`** → File Manager → `htdocs/pawgrip`
       → New File → `deploy.php` → paste with the real TOKEN (matches the
       `DEPLOY_TOKEN` repo secret) → Save. Then run the workflow
       (`gh workflow run deploy.yml`) to fire the hook for the first time.
6. [x] Deploy chain **verified end-to-end on 2026-10-13**: `deploy.log` shows
       the applied version, the hook body reports `deployed 08eb7da… via php`
       (pure-PHP extractor — this host has `exec` disabled and no `phar`), and
       from GitHub's network: `index.html` 200, hashed asset 200, bogus path
       200 (SPA catch-all via `.htaccess`), `/shipping/` 200, repeat trigger
       "already up to date". The site is live at
       `http://122846c.netsolhost.com/pawgrip/` meanwhile.
7. [ ] **Subdomain routing** — `pawgrip.businesslocalrecords.com` still
       answers 404 from a backend that is not the subdomain's docroot (it
       moved from a proxy-wide 403 to a 404, so propagation is progressing).
       Host-side, quoted "up to 24 h" by Network Solutions. When it serves
       the directory, flip the hook URL in `deploy.yml` from the temp host's
       `/pawgrip/` path to the subdomain, then `https` once AutoSSL has
       issued its certificate (probe.yml verifies both).
7. [ ] Decide the forms replacement (Netlify Forms, §3) and implement it.
8. [ ] Repoint Google Ads / Meta landing-page URLs to the new domain; update
       any domain allowlists (GA4 data streams, Meta pixel domains, Shopify
       customer-events pixel, Merchant Center claim).
9. [ ] Delete `netlify.toml` (kept until this point as reference) and the
       Netlify site. `probe.yml` can be deleted once the cron deploy has
       succeeded for a week.

### Rollback

`git revert <bad-commit>` on `main` → the workflow redeploys the last good
version automatically. There is no artifact history, so keep known-good commit
hashes handy.
