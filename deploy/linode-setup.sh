#!/usr/bin/env bash
# deploy/linode-setup.sh — one-time setup of the Linode VPS to serve pawgrip.app
# (static Vite build). Run AS ROOT on the VPS. Safe to re-run.
#
# Usage (after you generate a deploy keypair locally, see DEPLOYMENT.md):
#   DEPLOY_PUBKEY="ssh-ed25519 AAAA... github-actions" bash deploy/linode-setup.sh
#
# Direction of trust: GitHub Actions holds the PRIVATE key (repo secret
# VPS_SSH_KEY); this script installs the matching PUBLIC key for the 'deploy'
# user on the VPS, so GitHub can push the build in.
set -euo pipefail

DOMAIN="pawgrip.app"
WEBROOT="/var/www/${DOMAIN}"
DEPLOY_USER="deploy"
DEPLOY_PUBKEY="${DEPLOY_PUBKEY:-}"

echo "==> Installing packages (nginx, rsync)"
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y nginx rsync

echo "==> Creating deploy user '${DEPLOY_USER}'"
id -u "${DEPLOY_USER}" >/dev/null 2>&1 || useradd -m -s /bin/bash "${DEPLOY_USER}"

echo "==> Webroot ${WEBROOT}"
mkdir -p "${WEBROOT}"
chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "${WEBROOT}"
chmod -R 755 "${WEBROOT}"

echo "==> Authorized key for the deploy user"
install -m 700 -o "${DEPLOY_USER}" -g "${DEPLOY_USER}" -d "/home/${DEPLOY_USER}/.ssh"
touch "/home/${DEPLOY_USER}/.ssh/authorized_keys"
if [ -n "${DEPLOY_PUBKEY}" ]; then
  grep -qxF "${DEPLOY_PUBKEY}" "/home/${DEPLOY_USER}/.ssh/authorized_keys" || \
    echo "${DEPLOY_PUBKEY}" >> "/home/${DEPLOY_USER}/.ssh/authorized_keys"
else
  echo "    (no DEPLOY_PUBKEY given — add the GitHub Actions public key to"
  echo "     /home/${DEPLOY_USER}/.ssh/authorized_keys before the first deploy)"
fi
chmod 600 "/home/${DEPLOY_USER}/.ssh/authorized_keys"
chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "/home/${DEPLOY_USER}/.ssh"

echo "==> nginx site for ${DOMAIN} (SPA + security headers + asset caching)"
cat > "/etc/nginx/sites-available/${DOMAIN}" <<'NGINX'
server {
    listen 80;
    server_name pawgrip.app www.pawgrip.app;

    root /var/www/pawgrip.app;
    index index.html;

    # Security headers (mirror public/.htaccess)
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # Hashed assets: immutable, long cache. index.html: never cached.
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
    # Root and per-route shells (dist/<path>/index.html). An exact match
    # only covered /, so a cached product shell could keep an old title.
    location ~* /index\.html$ {
        add_header Cache-Control "no-store";
    }

    # SPA catch-all; real files/dirs (e.g. /shipping/, /guide/) still win.
    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINX
ln -sf "/etc/nginx/sites-available/${DOMAIN}" "/etc/nginx/sites-enabled/${DOMAIN}"
rm -f /etc/nginx/sites-enabled/default

echo "==> Firewall"
ufw allow 80/tcp || true
# Keep SSH open! (do NOT run 'ufw deny 22')

echo "==> nginx test + reload"
if nginx -t; then
  systemctl reload nginx || systemctl restart nginx
else
  echo "nginx -t FAILED — config NOT reloaded. A common cause is 'listen [::]:80' on a host without IPv6 (this script no longer adds it)."
  exit 1
fi

cat <<EOF

Done. Next:
  1. Cloudflare: A record '${DOMAIN}' -> this server's public IPv4, proxy ON.
  2. GitHub repo Settings > Secrets and variables > Actions:
       Secrets: VPS_HOST, VPS_USER=${DEPLOY_USER}, VPS_PORT=22,
                VPS_DEPLOY_PATH=${WEBROOT}, VPS_SSH_KEY (the PRIVATE key half).
       Variables: VITE_SHOPIFY_STOREFRONT_DOMAIN, VITE_SHOPIFY_STOREFRONT_TOKEN,
                  VITE_GA_MEASUREMENT_ID, VITE_GOOGLE_ADS_CONVERSION_ID,
                  VITE_META_PIXEL_ID, VITE_MICROSOFT_UET_TAG_ID.
  3. Push to main (or Actions > Deploy -> Linode > Run) and check
     curl -I https://${DOMAIN}/  -> 200.
  If Cloudflare SSL mode is Full(strict), install a Cloudflare Origin cert on
  this VPS and add a 443 server block (the visit-log track.php needs php-fpm).
EOF
