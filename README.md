# AninfPush Management Frontend

Management console for the AninfPush multi-channel messaging API (Email, SMS, WhatsApp).

## Features

- 📊 **Dashboard analytics** — messaging statistics, trends and cost analysis
- 📨 **Messages** — browse every channel, with filters on template, recipient, campaign, status, dates and cost
- 📝 **Templates** — create, edit, and **export / import** templates as JSON or TXT between applications
- 🏢 **Applications** — manage businesses; the API key and secret are generated automatically on creation
- 👥 **Users** — internal user management, with managers assigned globally or to specific applications (admin only)
- 🔔 **Live notifications** — failed deliveries, undelivered webhooks and broken SMTP configurations, straight in the header
- 🩺 **Queue health banner** — warns when the worker is stopped, paused or falling behind, because nothing goes out without it
- 📚 **API documentation** — the backend's Swagger UI embedded in the sidebar
- 🔐 **Internal authentication** — JWT access tokens with rotating refresh tokens, and mandatory Google Authenticator
- 🎨 Material-UI v7, React 19, Vite

## Tech stack

- **React 19** + **TypeScript**
- **Material-UI v7**
- **Vite 6**
- **Axios** — with transparent token refresh
- **React Router v7**
- **ApexCharts**

## Prerequisites

- Node.js **20 – 24**
- The AninfPush Laravel backend, by default on http://localhost:8000

## Installation

```bash
npm install
```

`.npmrc` sets `legacy-peer-deps=true` (the CKEditor 5 build packages still declare peers against an
older `@ckeditor/ckeditor5-*` line). Do not pass the flag manually — the file keeps `npm install`,
`npm ci` and the Docker build on the exact same tree.

Copy the environment template and point it at your API:

```bash
cp .env.example .env
```

```env
# Backend the console talks to. Include the /api/v1 suffix.
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_API_TIMEOUT=30000

# Swagger UI embedded in the sidebar. Empty means "the API origin +
# /api/documentation", which is right in almost every deployment.
VITE_API_DOCS_URL=

VITE_APP_NAME=AninfPush Management
VITE_APP_VERSION=1.0.0
VITE_FACEBOOK_APP_ID=
```

> The backend must know this console's origin in return: set `FRONTEND_URL` on
> the API side. It drives both the CORS allow-list and the permission for this
> console to embed the API documentation.

## Development

```bash
npm run dev
```

Available at **http://localhost:3039**.

Create the first account from the backend, then sign in with it:

```bash
php artisan admin:create --email=admin@example.com --password='Secret123' --name="Administrator"
```

Google Authenticator is mandatory: the first login opens a guided setup (QR code, manual key,
confirmation code, recovery codes).

## Build

```bash
npm run build     # tsc -b && vite build, output in dist/
npm run start     # preview the built bundle
npm run re:build  # wipe node_modules and dist, reinstall, rebuild
```

> The fragile packages (`react`, `@types/react`, `@mui/material`, `@mui/lab`, `apexcharts`,
> `typescript`, `vite`, `vite-plugin-checker`) are **pinned to exact versions**, because their minor
> releases have broken this build before. Upgrade them one at a time and run `npm run build` after each.

## Docker

```bash
docker build -t aninfpush-frontend .
docker compose up -d
```

The bundle reads `window.__APP_CONFIG__` from `/config.js`, rewritten by the container entrypoint on
every start, so a single image serves any environment:

```bash
docker run -p 80:8080 -e VITE_API_BASE_URL=https://api.example.com/api/v1 aninfpush-frontend
```

Join the backend stack's network (start the backend first):

```bash
docker compose -f docker-compose.yml -f docker-compose.shared.yml up -d
```

## Project structure

```
src/
├── auth/                    # Session, guards and token storage
│   ├── auth-context.tsx     # AuthProvider + useAuth()
│   ├── auth-guard.tsx       # AuthGuard / GuestGuard / RoleGuard
│   ├── tokens.ts            # Access + refresh token storage
│   └── types.ts
├── config/
│   └── env.config.ts        # Runtime config, then VITE_*, then defaults
├── services/                # API layer
│   ├── api.client.ts        # Axios client, bearer token, silent refresh
│   ├── auth.service.ts      # Login, 2FA, profile, password
│   ├── user.service.ts      # User management + manager assignment
│   ├── template-transfer.service.ts   # Template export / import
│   └── …
├── pages/                   # Route entry points
├── sections/                # Screens
│   ├── auth/                # Sign-in and the 2FA setup wizard
│   ├── profile/             # Profile, password, two-factor
│   ├── users/               # User management (admin)
│   ├── templates/           # Templates, editors, import dialog
│   ├── messages/            # Message list
│   ├── businesses/          # Applications and their settings
│   └── overview/            # Dashboard
├── components/
│   ├── table-filters/       # Filter bar shared by every list screen
│   └── …
├── layouts/                 # Dashboard and auth layouts
└── routes/sections.tsx      # Route definitions and guards
```

## Authentication

| File | Role |
|---|---|
| `src/auth/auth-context.tsx` | Holds the session, exposes `useAuth()` |
| `src/auth/tokens.ts` | Stores the JWT pair in `localStorage` |
| `src/services/api.client.ts` | Adds the bearer token; refreshes it once on a 401 and replays the request |
| `src/auth/auth-guard.tsx` | `AuthGuard` (signed in + 2FA done), `GuestGuard`, `RoleGuard` |

Sign-in flow:

1. `POST /auth/login` with email + password.
2. If 2FA was never configured, the user is sent to `/two-factor-setup` with a short lived setup token.
3. Otherwise a challenge token is returned and the 6 digit code is asked. A recovery code also works.
4. Tokens are stored, and the refresh token is rotated on every refresh.

## Template export / import

- **Export** — from the Templates table, per row or on a multi-selection, as JSON or TXT.
- **Import** — drop a `.json` or `.txt` export; the file carries the template type, so the only
  choice is which application to attach it to. Imported templates land as inactive drafts, and a
  name already taken is suffixed automatically.

## Filters

Every table uses the shared `TableFilters` bar: all filters combine, active ones are shown as
removable chips, and columns are sortable.

| Screen | Filters |
|---|---|
| Messages | search, channel, status, application, **template**, template vs free form, recipient, campaign, errors, date range, cost range |
| Templates | search, channel, status, category, application, enabled, language, date range, minimum uses |
| Applications | search (name, email, phone, city, app key), status, verification, city, country, date range |
| Users | search, role, access scope, application, status, 2FA state, date range |

Every list guards against out-of-order responses: when filters change faster than
the API answers, a stale response can no longer repaint the table
(`src/hooks/use-latest-request.ts`).

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Type check and production build |
| `npm run start` | Preview the built bundle |
| `npm run lint` / `lint:fix` | ESLint |
| `npm run fm:check` / `fm:fix` | Prettier |
| `npm run fix:all` | Lint and format |
| `npm run re:build` | Clean reinstall and rebuild |

## Environment variables

Build-time variables are prefixed with `VITE_`. In Docker the same names are read at **runtime** by
the entrypoint and written into `/config.js`.

| Variable | Description | Default |
|---|---|---|
| `VITE_API_BASE_URL` | API root, **including** `/api/v1` | `http://localhost:8000/api/v1` |
| `VITE_API_DOCS_URL` | Swagger UI embedded in the sidebar. Derived from the API origin when empty | *(derived)* |
| `VITE_API_TIMEOUT` | Request timeout (ms) | `30000` |
| `VITE_APP_NAME` | Application name | `AninfPush Management` |
| `VITE_APP_VERSION` | Application version | `1.0.0` |
| `VITE_FACEBOOK_APP_ID` | Facebook app for the WhatsApp connection flow | *(empty)* |

See [SETUP.md](SETUP.md) for the step by step guide and troubleshooting.

## License

MIT
