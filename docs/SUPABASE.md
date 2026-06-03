# Supabase setup — SIP

Use placeholders below; copy **your** values from the Supabase dashboard. Do not commit real project IDs, passwords, or connection strings.

| Field | Where to find it |
|-------|------------------|
| Project ID | Project Settings → General |
| Region | Project Settings → General |
| Pooler host | Database → Connection string (often `aws-1-<region>.pooler.supabase.com`) |
| API URL | `https://YOUR_PROJECT_REF.supabase.co` |

SIP uses **Prisma → PostgreSQL only**. You do **not** need `@supabase/supabase-js` unless you add Supabase client features later.

## 1. Unpause the project (if needed)

On the Supabase dashboard home, confirm the project is **Active** (free projects pause when idle).

## 2. Copy connection strings (do not build URLs by hand)

**Project Settings** → **Database** → **Connection string** → **URI**

Copy these two and paste into `.env`:

| Variable | Supabase label | Port |
|----------|----------------|------|
| `DIRECT_URL` | **Session mode** or **Direct connection** | 5432 |
| `DATABASE_URL` | **Transaction mode** (add `?pgbouncer=true`) | 6543 |

Use **Connect → ORM → Prisma**. The pooler host is project-specific.

**Special characters in password:** URL-encode them (e.g. `#` → `%23`).

**Or:** reset the database password to letters/numbers only to avoid encoding issues.

## 3. Update `.env`

```env
DATABASE_URL="<paste Transaction pooler URI>"
DIRECT_URL="<paste Session or Direct URI>"
```

See `.env.example` for the full template.

## 4. Initialize the database

```bash
npx prisma migrate deploy
npm run db:seed
npm run import:counties
npm run dev
```

## 5. Vercel (production)

Use **Connection pooling** (port `6543`) for `DATABASE_URL` in Vercel env vars.  
Keep **direct** connection (`5432`) for `DIRECT_URL` when running migrations from your machine or CI.

Copy the exact strings from: **Settings → Database → Connection string**.
