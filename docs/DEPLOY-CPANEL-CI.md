# CI/CD: GitHub → cPanel

Push to `main` → GitHub Actions builds the Next.js standalone bundle → ships it to
your cPanel Node app → restarts it. No more manual tar/upload.

The build runs on GitHub's runners on purpose. **Do not build on cPanel** — shared
hosting almost always runs out of memory building Next.js.

---

## 1. One-time: create the GitHub repo and push

You're currently on a local `master` branch with no remote. Create an **empty**
GitHub repo (no README/.gitignore), then:

```bash
git checkout -b main          # workflow deploys from main
git add -A
git commit -m "Add cPanel CI/CD pipeline"
git remote add origin https://github.com/<you>/astrochakra.git
git push -u origin main
```

The first push triggers the workflow. The **build** will run and succeed; the
**deploy** steps skip themselves until you add the secrets below.

---

## 2. One-time: set up the cPanel app (if not already done)

Follow `deploy/README-CPANEL.md`. In short — cPanel → **Setup Node.js App → Create**:

- Node.js version: 20.x
- Application mode: Production
- Application root: e.g. `astrochakra`  → this is your `CPANEL_APP_PATH`
- Application startup file: `web/server.js`

Note the **Application root** path. It's usually `/home/<cpaneluser>/astrochakra`.

---

## 3. Pick your transport: SSH (preferred) or FTP

Check cPanel's dashboard:

- **"Terminal"** or **"SSH Access"** present → use **SSH** (§4). Faster, cleaner restarts.
- Only **"FTP Accounts"** → use **FTP** (§5).

---

## 4. SSH path (uses the committed `deploy-cpanel.yml`)

### a. Generate a deploy key (on your machine)

```bash
ssh-keygen -t ed25519 -f astrochakra_deploy -N "" -C "github-actions"
```

This makes `astrochakra_deploy` (private) and `astrochakra_deploy.pub` (public).

### b. Authorize the public key on cPanel

cPanel → **SSH Access → Manage SSH Keys → Import Key**, paste the **`.pub`**
contents, then **Manage → Authorize**.
(Or append it to `~/.ssh/authorized_keys` via Terminal.)

### c. Add the secrets to GitHub

GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Value | Example |
|---|---|---|
| `CPANEL_SSH_HOST` | your server hostname or IP | `server123.web-host.com` |
| `CPANEL_SSH_PORT` | SSH port (omit if 22) | `22` or `21098` |
| `CPANEL_SSH_USER` | your cPanel username | `astroch1` |
| `CPANEL_SSH_KEY` | **entire** private key file `astrochakra_deploy` | `-----BEGIN OPENSSH...` |
| `CPANEL_APP_PATH` | the Application root from §2 | `/home/astroch1/astrochakra` |

> Many shared hosts (e.g. Namecheap) use a non-standard SSH port like `21098` — check
> SSH Access in cPanel.

Push to `main` (or run the workflow manually from the **Actions** tab) → it deploys.

---

## 5. FTP path (if you have no SSH)

Replace the contents of `.github/workflows/deploy-cpanel.yml` with this, then add the
FTP secrets:

```yaml
name: Deploy to cPanel (FTP)

on:
  push:
    branches: [main]
  workflow_dispatch:

concurrency:
  group: deploy-cpanel
  cancel-in-progress: false

jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build:cpanel

      # Bump a file so Passenger restarts after the upload (mtime/content changes).
      - name: Stamp restart trigger
        run: |
          mkdir -p web/.next/standalone/tmp
          date -u +%s > web/.next/standalone/tmp/restart.txt

      - name: Deploy via FTP
        uses: SamKirkland/FTP-Deploy-Action@v4.3.5
        with:
          server: ${{ secrets.FTP_SERVER }}
          username: ${{ secrets.FTP_USERNAME }}
          password: ${{ secrets.FTP_PASSWORD }}
          local-dir: web/.next/standalone/
          server-dir: ${{ secrets.FTP_SERVER_DIR }}   # e.g. astrochakra/  (relative to FTP home)
          # Only changed files are uploaded; the action keeps a state file on the server.
```

FTP secrets:

| Secret | Value |
|---|---|
| `FTP_SERVER` | FTP host, e.g. `ftp.yourdomain.com` |
| `FTP_USERNAME` | FTP account user |
| `FTP_PASSWORD` | FTP account password |
| `FTP_SERVER_DIR` | path to the app root **relative to the FTP login home**, with trailing slash, e.g. `astrochakra/` |

FTP is slower (uploads thousands of `node_modules` files the first time) and the
restart relies on re-uploading `tmp/restart.txt`. It works, but SSH is nicer if you
can get it.

---

## Verify after deploy

1. Open your Application URL.
2. Generate a chart and confirm the server-computed sections (KP, Jaimini, Transit,
   Varshaphal) populate — those only render from the live server build.
3. If the page errors, check the Node app log in cPanel → Setup Node.js App.

## How updates work from now on

Edit code → commit → `git push`. That's the whole deploy. To update the calc library,
remember it's compiled (`dist/`); the workflow rebuilds it automatically via
`npm run build:cpanel`.
