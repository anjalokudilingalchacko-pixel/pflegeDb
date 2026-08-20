# Deploying pflegeDb (2-month budget plan)

Everything the app needs — the Node/Express API, the built React frontend, the LiveKit video
server, and the Python speech-to-text service — runs on **one small VPS**, fronted by Caddy for
free automatic HTTPS. Total cost for 2 months should land around **$10-25** depending on provider
(see below); nothing here needs a credit card on file with more than one company.

## 0. What you'll need

- A VPS: **Hetzner CX22** (2 vCPU / 4GB RAM / 40GB disk, ~€4.5/mo ≈ **~€9-10 for 2 months**) is the
  best value — [hetzner.com/cloud](https://www.hetzner.com/cloud). DigitalOcean's $12/mo 2GB
  droplet works too (~$24 for 2 months) if you'd rather use a US-based provider. **Use at least
  2GB RAM** — the Whisper speech-to-text model needs real memory alongside Node and LiveKit; a
  1GB "starter" box will likely swap or crash under load.
- A domain name pointed at the VPS (needed for real HTTPS and for LiveKit's video/audio to work
  in the browser — browsers block insecure connections from an https page). Any cheap registrar
  is fine (~$10-15/year — Namecheap, Cloudflare Registrar, Porkbun). If you don't want to buy one,
  a free subdomain from something like DuckDNS also works.
- Your code is already on GitHub at `anjalokudilingalchacko-pixel/pflegeDb`, so the VPS can just
  `git clone` it.

## 1. Create the VPS

Spin up an **Ubuntu 22.04 or 24.04** server on whichever provider you picked. Note its public IP.

## 2. Point your domain at it

In your domain's DNS settings, add two **A records** pointing at the VPS's IP:
- `yourdomain.com` → `<VPS IP>`
- `livekit.yourdomain.com` → `<VPS IP>`

(DNS can take a few minutes to an hour to propagate — you can start step 3 while you wait.)

## 3. Get the code onto the server and run setup

SSH into the VPS as root, then:

```bash
git clone https://github.com/anjalokudilingalchacko-pixel/pflegeDb.git
cd pflegeDb
bash deploy/setup-vps.sh yourdomain.com you@youremail.com
```

This one script (idempotent — safe to re-run) installs Node 20, Python, Caddy, pm2, and the
LiveKit server binary; builds the frontend; creates a Python venv for the speech-to-text service;
generates a fresh `.env` with a real random `JWT_SECRET` and real random LiveKit API
key/secret (not the well-known `devkey`/`secret` defaults LiveKit ships with — those must never be
used on a public server, since anyone who knows them could mint valid access tokens for your video
rooms); configures Caddy for automatic HTTPS on both domains; opens only the firewall ports that
are actually needed; and starts everything under pm2.

At the end it prints a `pm2 startup ...` command — run that one line so the app survives a reboot.

## 4. Turn on real email sending (optional but recommended)

Right now unconfirmed signups just log the confirmation link to the server console instead of
emailing it. To send real emails, edit `.env` on the server and fill in **one** of:
- `SMTP_HOST` / `SMTP_USER` / `SMTP_PASSWORD` (any provider — SendGrid, Mailgun, your school's
  mail server, etc.), or
- `GMAIL_USER` / `GMAIL_APP_PASSWORD` (needs 2-Step Verification + an
  [App Password](https://myaccount.google.com/apppasswords) on that Google account)

Then: `pm2 restart pflegedb-app`.

## 5. Verify

- Visit `https://yourdomain.com` — you should see the app over a real TLS certificate.
- Log in with a seed account (see below) or register a new one.
- `pm2 status` — all three processes (`pflegedb-app`, `pflegedb-whisper`, `pflegedb-livekit`)
  should show `online`. `pm2 logs <name>` to tail any of them.
- Start a video meeting to confirm LiveKit actually connects (this is the part most likely to need
  a second look — see Troubleshooting).

**Seed accounts** (change these passwords once you're live, or deactivate/delete them from the
admin panel — anyone who reads this file or the public GitHub repo knows them):
`schueler@pflege.de` / `student123`, `lehrer@pflege.de` / `teacher123`,
`praxisanleiter@pflege.de` / `praxis123`, `admin@pflege.de` / `admin123`.

## Updating the app later

```bash
cd pflegeDb
git pull
npm ci
npm run build
pm2 restart pflegedb-app
```

## When the 2 months are up

Destroy the VPS (or just let it lapse if it's a monthly plan) — there's no ongoing subscription
tied to anything else. Your JSON data files live only on that server, so pull a copy first
(`scp` the `*_db.json` files and `public/uploads/` down) if you want to keep the data.

## Troubleshooting

- **LiveKit video doesn't connect**: almost always the firewall or DNS. Confirm
  `livekit.yourdomain.com` resolves to the VPS IP, and that UDP `50000:50100` and TCP `7881` are
  open (`ufw status`). Some VPS providers *also* have a separate cloud firewall in their web
  dashboard that overrides `ufw` — check there too.
- **Whisper/document processing seems "basic"**: the Python service uses `faster-whisper`
  (lightweight, CPU-friendly) rather than the full `openai-whisper`+torch stack, to fit a small
  VPS. Quality is good for a small deployment; if `pflegedb-whisper` is down, `server.cjs` silently
  falls back to a simpler local text-structuring path instead of failing outright, so the feature
  keeps working either way — check `pm2 logs pflegedb-whisper` if transcription quality seems off.
- **Out of memory**: `free -h` on the VPS. If the Whisper service is getting OOM-killed, the
  Hetzner CX22 (4GB) has headroom others may not — this is the main reason a 1GB box isn't
  recommended.

## Deliberately left out of this deployment

`local_audio_server.py` isn't wired into the running app at all (nothing in `server.cjs` or the
frontend calls it — it's a separate local experiment expecting a locally-running Ollama server),
so it isn't part of this setup. If you want it live later, it needs its own plan (it loads a
heavier "medium" Whisper model and expects an LLM server).
