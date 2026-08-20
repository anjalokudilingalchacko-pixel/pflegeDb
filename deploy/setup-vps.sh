#!/usr/bin/env bash
# One-time bootstrap for a fresh Ubuntu 22.04/24.04 VPS. Run as root (or with sudo) FROM THE
# pflegeDb REPO ROOT after the code is already on the server (git clone or rsync from your machine).
#
# Usage: sudo bash deploy/setup-vps.sh yourdomain.com you@example.com
#
# Safe to re-run — each step checks whether it already applied.
set -euo pipefail

DOMAIN="${1:?Usage: setup-vps.sh <domain> <acme-email>}"
ACME_EMAIL="${2:?Usage: setup-vps.sh <domain> <acme-email>}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "==> Deploying $REPO_ROOT for domain $DOMAIN"

# --- System packages ---
apt-get update -y
apt-get install -y curl ca-certificates gnupg ufw ffmpeg python3 python3-venv python3-pip build-essential

# --- Node.js 20 LTS ---
if ! command -v node >/dev/null || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt 20 ]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

# --- pm2 ---
command -v pm2 >/dev/null || npm install -g pm2

# --- Caddy ---
if ! command -v caddy >/dev/null; then
  apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -y
  apt-get install -y caddy
fi

# --- LiveKit server binary ---
command -v livekit-server >/dev/null || curl -sSL https://get.livekit.io | bash

# --- App dependencies + production build ---
npm ci
npm run build

# --- Python venv for the Whisper/document service (faster-whisper, not full torch — much lighter) ---
if [ ! -d deploy/venv ]; then
  python3 -m venv deploy/venv
fi
deploy/venv/bin/pip install --upgrade pip
deploy/venv/bin/pip install -r deploy/requirements.txt

# --- .env: create from example on first run, auto-filling generated secrets ---
if [ ! -f .env ]; then
  cp .env.example .env
  JWT_SECRET_VAL="$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")"
  LIVEKIT_KEY="lkapi_$(node -e "console.log(require('crypto').randomBytes(12).toString('hex'))")"
  LIVEKIT_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
  sed -i "s|^JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET_VAL}|" .env
  sed -i "s|^APP_BASE_URL=.*|APP_BASE_URL=https://${DOMAIN}|" .env
  {
    echo ""
    echo "LIVEKIT_URL=wss://livekit.${DOMAIN}"
    echo "LIVEKIT_API_KEY=${LIVEKIT_KEY}"
    echo "LIVEKIT_API_SECRET=${LIVEKIT_SECRET}"
  } >> .env
  echo "==> Wrote a new .env with generated JWT/LiveKit secrets."
  echo "    Still needed: SMTP_HOST/SMTP_USER/SMTP_PASSWORD (or GMAIL_USER/GMAIL_APP_PASSWORD) for real verification emails."
else
  echo "==> .env already exists, leaving it untouched."
fi

# --- livekit.yaml from template, using the same key/secret as .env ---
LIVEKIT_KEY="$(grep '^LIVEKIT_API_KEY=' .env | cut -d= -f2-)"
LIVEKIT_SECRET="$(grep '^LIVEKIT_API_SECRET=' .env | cut -d= -f2-)"
sed -e "s|__LIVEKIT_API_KEY__|${LIVEKIT_KEY}|" -e "s|__LIVEKIT_API_SECRET__|${LIVEKIT_SECRET}|" \
  deploy/livekit.yaml.template > deploy/livekit.yaml

# --- Caddyfile ---
sed -e "s|__DOMAIN__|${DOMAIN}|g" -e "s|__ACME_EMAIL__|${ACME_EMAIL}|" \
  deploy/Caddyfile.template > /etc/caddy/Caddyfile
systemctl reload caddy 2>/dev/null || systemctl restart caddy

# --- Firewall: HTTP/S, LiveKit media (UDP), LiveKit TCP fallback. Keep 22/SSH open first. ---
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 7881/tcp
ufw allow 50000:50100/udp
ufw --force enable

# --- Start everything under pm2 ---
pm2 start deploy/ecosystem.config.cjs
pm2 save
echo ""
echo "==> Run the command pm2 just printed above (starts with 'sudo env PATH=...') so pm2 survives a reboot."
echo "==> Done. Point DNS A records for ${DOMAIN} and livekit.${DOMAIN} at this server's IP if you haven't already."
echo "==> Then check: https://${DOMAIN}"
