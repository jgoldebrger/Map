# Routes

**Framework:** Next.js 15 App Router  
**Root layout:** `src/app/layout.tsx` (Inter font, QueryProvider, globals.css)

## Public Routes

| URL | Page File | Layout | Summary |
|-----|-----------|--------|---------|
| `/` | `src/app/page.tsx` | root | Home hero with links to Map and ZIP Lookup; SiteHeader |
| `/map` | `src/app/(public)/map/page.tsx` | root | **Primary shipping map** — MapPageContent variant="full" |
| `/lookup` | `src/app/(public)/lookup/page.tsx` | root | ZIP/county/city/territory/state lookup form + results |
| `/embed/map` | `src/app/(public)/embed/map/page.tsx` | root | Embeddable map (MapPageContent variant="embed") for partners |

## Auth Routes

| URL | Page File | Layout | Summary |
|-----|-----------|--------|---------|
| `/login` | `src/app/(auth)/login/page.tsx` | `(auth)/layout.tsx` → SessionProvider + Suspense | Admin login form |

## Admin Routes (auth required)

**Layout:** `src/app/admin/layout.tsx` — AdminSidebar + SessionProvider, redirects to `/login` if unauthenticated

| URL | Page File | Extra Layout | Summary |
|-----|-----------|--------------|---------|
| `/admin` | `src/app/admin/page.tsx` | — | Dashboard with stats cards and recent audit log |
| `/admin/shipping-methods` | `src/app/admin/shipping-methods/page.tsx` | — | CRUD for shipping methods |
| `/admin/territories` | `src/app/admin/territories/page.tsx` | — | Territory management table |
| `/admin/live-map` | `src/app/admin/live-map/page.tsx` | — | Admin live map view |
| `/admin/export` | `src/app/admin/export/page.tsx` | — | Map export / PDF generation |
| `/admin/map` | `src/app/admin/map/page.tsx` | `admin/map/layout.tsx` (requires `county:assign`) | **Map editor** — county/zip assignment tools |
| `/admin/zipcodes` | `src/app/admin/zipcodes/page.tsx` | — | ZIP code data table |
| `/admin/import` | `src/app/admin/import/page.tsx` | `admin/import/layout.tsx` | Data import wizard |
| `/admin/audit` | `src/app/admin/audit/page.tsx` | — | Audit log viewer |
| `/admin/embed` | `src/app/admin/embed/page.tsx` | — | Partner embed code generator |

## Layout Hierarchy

```
src/app/layout.tsx                    # Root: html, body, Inter, QueryProvider
├── src/app/page.tsx                  # /
├── src/app/(public)/map/page.tsx     # /map
├── src/app/(public)/lookup/page.tsx  # /lookup
├── src/app/(public)/embed/map/page.tsx
├── src/app/(auth)/layout.tsx         # SessionProvider + Suspense
│   └── src/app/(auth)/login/page.tsx
└── src/app/admin/layout.tsx          # AdminSidebar + auth gate
    ├── src/app/admin/page.tsx
    ├── src/app/admin/map/layout.tsx  # requireAdminPermission("county:assign")
    │   └── src/app/admin/map/page.tsx
    └── src/app/admin/import/layout.tsx
        └── src/app/admin/import/page.tsx
```

## API Routes (reference)

API routes under `src/app/api/` support map data, lookup, search, territories, counties, auth, and admin operations. Not page routes — used by client components via `fetch`.
