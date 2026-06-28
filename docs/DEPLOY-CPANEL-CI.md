# CI/CD: GitHub → cPanel

Push to `main` → GitHub Actions builds the Next.js standalone bundle → uploads it to
your cPanel Node app over **SFTP** → restarts the app. No more manual tar/upload.

The build runs on GitHub's runners on purpose. **Do not build on cPanel** — shared
hosting almost always runs out of memory building Next.js.

> This host has **shell access disabled** but allows **SFTP with an SSH key**, so the
> pipeline uploads over SFTP (not rsync, which needs a shell).

---

## How it works

`.github/workflows/deploy-cpanel.yml`:

1. `npm ci`
2. `npm run build:cpanel` — builds the `@prisri/jyotish` lib (`tsc → dist/`) and the
   Next.js app, then assembles `web/.next/standalone/` (server + node_modules + static).
3. Writes `tmp/restart.txt` (touching it restarts the Passenger app).
4. Uploads via `lftp` over SFTP:
   - `node_modules/` — skipped unless changed (compared by size; npm packages are
     immutable per version).
   - everything else (app code, build output, `package.json`, `tmp/restart.txt`) —
     always refreshed, so server code is never stale.

The deploy steps are gated on `CPANEL_SSH_HOST` existing, so before the secrets are set
every push still runs and **validates the build** (deploy just skips).

---

## The cPanel app

cPanel → **Setup Node.js App**. The app must be configured as:

- **Application root:** `kundli.astrochakra.co`  → `/home/bnrqpozr/kundli.astrochakra.co`
- **Application startup file:** `web/server.js`
- **Node.js version:** 20.x, **mode:** Production

The upload target (`CPANEL_APP_PATH`) must equal the Application root. The bundle's
layout (`node_modules/`, `package.json`, `web/server.js`) lands there so the startup
file `web/server.js` resolves correctly.

---

## The SSH key (already done)

A no-passphrase RSA key pair is used:

- **Public** key imported + **authorized** in cPanel → SSH Access → Manage SSH Keys
  (`github_deploy`).
- **Private** key stored in the GitHub secret `CPANEL_SSH_KEY`.

To rotate: generate a new pair (`ssh-keygen -t rsa -b 4096 -N "" -f key`), authorize the
`.pub` in cPanel, replace the `CPANEL_SSH_KEY` secret. **The private key must have no
passphrase** — its second line must start with `b3BlbnNzaC1rZXktdjEAAAAABG5vbmU` (= "none").

---

## GitHub secrets

Repo → **Settings → Secrets and variables → Actions**:

| Secret | Value |
|---|---|
| `CPANEL_SSH_KEY` | the entire private key (incl. BEGIN/END lines), no passphrase |
| `CPANEL_SSH_HOST` | `190.92.174.127` |
| `CPANEL_SSH_USER` | `bnrqpozr` |
| `CPANEL_SSH_PORT` | `22` |
| `CPANEL_APP_PATH` | `/home/bnrqpozr/kundli.astrochakra.co` |

---

## Verify after deploy

1. Open https://kundli.astrochakra.co
2. Generate a chart and confirm the server-computed sections (KP, Jaimini, Transit,
   Varshaphal) populate — those only render from the live server build.
3. If the page errors, check the Node app log in cPanel → Setup Node.js App.

## From now on

Edit code → commit → `git push`. That's the whole deploy. The library is recompiled
automatically by `npm run build:cpanel`.
