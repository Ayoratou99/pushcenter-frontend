# Quick Setup Guide

## Prerequisites

- Node.js **20 – 24** (the Docker image builds on Node 22)
- The AninfPush API (`aninfpush_wsl`) reachable, by default on port 8000

## Quick start

### 1. Install dependencies

```bash
npm install
```

`.npmrc` pins `legacy-peer-deps=true`, because the CKEditor 5 build packages still declare peers
against an older `@ckeditor/ckeditor5-*` line. Do not pass the flag by hand: the file keeps
`npm install`, `npm ci` and the Docker build on the exact same tree.

### 2. Configure the environment

```bash
cp .env.example .env
```

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000/api/v1` | API root, **including** the `/api/v1` prefix |
| `VITE_API_TIMEOUT` | `30000` | Request timeout, in milliseconds |
| `VITE_APP_NAME` | `AninfPush Management` | Shown in page titles |
| `VITE_APP_VERSION` | `1.0.0` | Displayed in the UI |
| `VITE_FACEBOOK_APP_ID` | *(empty)* | Only needed for the WhatsApp connection flow |

### 3. Start the dev server

```bash
npm run dev
```

The app is served on **http://localhost:3039**.

### 4. Create an administrator

Authentication is internal, so the first account is created from the API side:

```bash
# in the aninfpush_wsl repository
php artisan admin:create --email=admin@example.com --password='Secret123' --name="Administrator"

# or, with the stack running in Docker
docker compose exec app php artisan admin:create --email=admin@example.com --password='Secret123' --name="Administrator"
```

Sign in with those credentials. Google Authenticator is mandatory, so the first login opens the
setup wizard: scan the QR code (or type the key), confirm a 6 digit code, and save the recovery
codes it hands back.

## Authentication in the app

- `src/auth/auth-context.tsx` holds the session and exposes `useAuth()`.
- `src/auth/tokens.ts` stores the JWT pair; the access token is refreshed transparently by the axios
  interceptor in `src/services/api.client.ts`.
- `src/auth/auth-guard.tsx` gates the routes: `AuthGuard` (signed in **and** 2FA confirmed),
  `GuestGuard` (sign-in page) and `RoleGuard` (admin-only areas such as `/users`).

## Build

```bash
npm run build     # type check + production bundle into dist/
npm run start     # serve the built bundle locally
npm run re:build  # wipe node_modules and dist, reinstall, rebuild
```

The fragile packages (`react`, `@types/react`, `@mui/material`, `@mui/lab`, `apexcharts`, `typescript`,
`vite`) are pinned to exact versions, because their minor releases have broken this build before.
Upgrade them deliberately, one at a time, and run `npm run build` after each.

## Docker

```bash
docker build -t aninfpush-frontend .
docker compose up -d
```

The bundle reads `window.__APP_CONFIG__` from `/config.js`, which the container entrypoint rewrites
from the environment on every start. One image therefore serves any environment:

```bash
docker run -p 80:8080 -e VITE_API_BASE_URL=https://api.example.com/api/v1 aninfpush-frontend
```

To put the frontend on the same network as the backend stack (start the backend first):

```bash
docker compose -f docker-compose.yml -f docker-compose.shared.yml up -d
```

## Troubleshooting

**`npm ci` fails with "package.json and package-lock.json are not in sync"**
Regenerate the lockfile with `npm install` (never `npm install --legacy-peer-deps`; the flag already
lives in `.npmrc`), then commit `package-lock.json`.

**The build fails with type errors in `node_modules` or in MUI layout files**
A transitive package drifted. Check `npm ls @types/react @mui/material` against the pinned versions
in `package.json` and run `npm run re:build`.

**Every request answers 401**
`VITE_API_BASE_URL` is wrong, or misses the `/api/v1` suffix. In Docker, check the entrypoint log
line `Runtime config written to ...`.

**Every request answers 403 `two_factor_setup_required`**
The account has not finished the Google Authenticator enrolment. Sign out and back in to reopen the
wizard, or ask an administrator to reset it from **Users**.
