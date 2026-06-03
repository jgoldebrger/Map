# Shipping Intelligence Platform (SIP)

Fabuwood's unified shipping territory management platform. Replace static shipping maps (CCLT, CCDT, FT, Common Carrier) with one live nationwide map and admin portal.

## Stack

- **Frontend:** Next.js 15, TypeScript, TailwindCSS, shadcn/ui, React Query, React Hook Form, Zod
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** PostgreSQL + PostGIS
- **Auth:** Auth.js (credentials) with RBAC
- **Maps:** Mapbox GL JS, GeoJSON, Turf.js

## Quick Start (Local)

### Prerequisites

- Node.js 20+
- Docker Desktop
- Mapbox access token ([account.mapbox.com](https://account.mapbox.com/))

### 1. Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://sip:sip@localhost:5432/sip?schema=public"
AUTH_SECRET="your-secret-at-least-32-chars"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN="pk.your_token"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="changeme"
```

Generate `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

### 2. Database

**Option A — Docker** (if Docker Desktop is installed):

```bash
docker compose up -d
npx prisma migrate deploy
npm run db:seed
```

**Option B — Windows installer** (no Docker; requires admin once):

The installer may already be at `%TEMP%\postgresql-16-installer.exe` from setup.

1. Open **PowerShell as Administrator**
2. Run:

```powershell
cd "C:\Users\jgoldberger\Desktop\Online Map"
.\scripts\install-postgresql.ps1
```

3. Update `.env` with:

```env
DATABASE_URL="postgresql://sip:sip@localhost:5432/sip?schema=public"
```

4. Then:

```bash
npx prisma migrate deploy
npm run db:seed
```

**Option C — Cloud (no install):** Create a free Postgres database at [Neon](https://neon.tech) or [Railway](https://railway.app), paste the connection string into `.env` as `DATABASE_URL`, then run migrate + seed.

### 3. Import geographic data

```bash
npm run import:counties   # ~3,143 US counties + GeoJSON
npm run import:zips       # ZIP codes (Census crosswalk)
npm run build:pmtiles     # Optional: requires tippecanoe
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

| Route | Description |
|-------|-------------|
| `/map` | Public interactive territory map |
| `/lookup` | ZIP / county / dealer lookup |
| `/login` | Admin sign-in |
| `/admin` | Dashboard (requires auth) |
| `/admin/map` | Territory map editor |

**Default admin:** credentials from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env`

## Roles

| Role | Access |
|------|--------|
| Super Admin | Full CRUD, imports, map editor |
| Logistics Manager | Territories, map editor, dealers, ZIP import |
| Read Only | View dashboard, audit, territories |

## E2E tests (Playwright)

```bash
# Full suite (requires database — start Docker first)
docker compose up -d
npx prisma migrate deploy
npm run db:seed
npm run import:counties   # optional but needed for map/county API tests

npx playwright install chromium
npm run test:e2e
```

Without Docker/Postgres, UI smoke tests still run; API and auth tests are skipped automatically.

| Command | Purpose |
|---------|---------|
| `npm run test` | Lint + production build + Playwright E2E |
| `npm run test:e2e` | Run Playwright tests (starts dev server) |
| `npm run test:e2e:ui` | Interactive Playwright UI |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run db:seed` | Seed shipping methods + sample territories |
| `npm run import:counties` | Import US counties from Plotly GeoJSON |
| `npm run import:zips` | Import ZIP codes from Census crosswalk |
| `npm run import:all` | Counties + ZIPs |
| `npm run build:pmtiles` | Build vector tiles (optional) |
| `npm run create-admin` | Bootstrap admin user |

## Production Deployment

### Vercel (Frontend + API)

### Branch workflow

| Branch | What happens |
|--------|----------------|
| `develop` | Push here → full CI → auto-merge to `main` → Vercel production deploy |
| `main` | Updated automatically by CI after `develop` passes (do not push directly) |

Work on **`develop` only**. Pushes to `develop` run [`.github/workflows/ci-deploy.yml`](.github/workflows/ci-deploy.yml): tests, merge to `main`, then deploy. PRs run lint + build only (no merge/deploy).

**GitHub repo settings:** allow GitHub Actions to push to `main` (Settings → Actions → General → Workflow permissions → *Read and write*).

**Automatic deploy** requires these [GitHub Actions secrets](https://github.com/jgoldebrger/Map/settings/secrets/actions):

| Secret | Purpose |
|--------|---------|
| `DATABASE_URL` | Supabase pooler URL |
| `DIRECT_URL` | Supabase direct URL (migrations) |
| `AUTH_SECRET` | Auth.js secret |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | E2E + seed admin |
| `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` | Mapbox |
| `VERCEL_TOKEN` | [Vercel account token](https://vercel.com/account/settings/tokens) |
| `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` | From `vercel link` or project settings |

Set the same app env vars on the Vercel project (`AUTH_URL` / `NEXTAUTH_URL` = your `*.vercel.app` URL, `AUTH_TRUST_HOST=true`).

**Manual setup:**

1. Push repo to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Set environment variables:
   - `DATABASE_URL` — Railway PostgreSQL connection string
   - `AUTH_SECRET`
   - `NEXTAUTH_URL` — `https://your-domain.vercel.app`
   - `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`
4. Deploy; run migrations against production DB:

```bash
DATABASE_URL="postgresql://..." npx prisma migrate deploy
DATABASE_URL="postgresql://..." npm run db:seed
DATABASE_URL="postgresql://..." npm run import:all
```

### Railway (PostgreSQL + PostGIS)

1. Create PostgreSQL service on [Railway](https://railway.app)
2. Enable PostGIS: connect and run `CREATE EXTENSION IF NOT EXISTS postgis;`
3. Copy `DATABASE_URL` to Vercel env vars
4. Run seed + import scripts from CI or local machine against production URL

### PMTiles / GeoJSON hosting

County geometry is served from `public/geo/us-counties.geojson` (generated by `import:counties`). For production CDN:

- Upload `public/geo/us-counties.geojson` to Vercel (included in deploy) or Cloudflare R2
- Optional: run `npm run build:pmtiles` with [tippecanoe](https://github.com/felt/tippecanoe) installed

## CSV Import (Admin)

`/admin/import` supports:

- **Territories:** `name,method,color,shipday,cutoffday,notes`
- **Counties:** `fips,territory`
- **ZIPs:** `zip,city,county,state`
Preview validates all rows before commit. Failed imports roll back.

## Partner map embed

Partners can embed the live territory map on their website via iframe.

| Route | Purpose |
|-------|---------|
| `/embed/map` | Chromeless map for partner iframes (minimal header, no admin link) |
| `/map` | Full public map with site navigation (cannot be iframe'd) |

**Setup (production):**

1. Set `EMBED_ALLOWED_ORIGINS` in Vercel — comma-separated partner origins, e.g. `https://dealer.example.com,https://www.dealer.example.com`
2. Rebuild/deploy (CSP `frame-ancestors` is baked in at build time)
3. Open **Admin → Partner Embed** to copy the iframe snippet and share with partners

**Partner iframe example:**

```html
<iframe
  src="https://YOUR-PRODUCTION-DOMAIN/embed/map"
  width="100%"
  height="600"
  style="border:0;"
  loading="lazy"
  title="Fabuwood shipping territory map"
></iframe>
```

Recommended size: **900×600** minimum (height 600–800). Mapbox token URL restrictions should list **your** SIP domain only — partner domains load the map from your origin inside the iframe.

## Architecture

Every US county belongs to exactly one **Territory**. Territories belong to a **Shipping Method** (CCLT, CCDT, FT, Common Carrier). The map colors counties client-side from `/api/counties/assignments` — territory edits do not require tile regeneration.

## Security

- **RBAC:** Admin APIs enforce permissions (`audit:read`, `territory:write`, etc.). `READ_ONLY` users see dashboard, lists, ZIP codes, and audit log only — write actions and Import/Map Editor are hidden and blocked server-side.
- **Rate limits (middleware):** Login attempts — 10 per IP per 15 minutes; public `/api/search` and `/api/lookup` — 60 per IP per minute.
- **Secrets:** Store `DATABASE_URL`, `AUTH_SECRET`, `ADMIN_PASSWORD`, and Mapbox tokens in [GitHub Actions secrets](https://github.com/jgoldebrger/Map/settings/secrets/actions), not repository variables. CI reads secrets first, then falls back to variables during migration.
- **Production:** Set `ADMIN_PASSWORD` on Vercel (never use default credentials). Rotate any secrets that were ever committed or exposed in logs.

## License

Proprietary — Fabuwood internal use.
