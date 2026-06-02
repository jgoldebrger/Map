# Supabase setup — SIP (project Map)

| Field | Value |
|-------|--------|
| Project name | Map |
| Project ID | `qwhpipqyemykqipqvfgg` |
| Region | `us-east-1` (East US / North Virginia) |
| Pooler host | `aws-1-us-east-1.pooler.supabase.com` (use **aws-1**, not aws-0) |
| API URL | `https://qwhpipqyemykqipqvfgg.supabase.co` |

SIP uses **Prisma → PostgreSQL only**. You do **not** need `@supabase/supabase-js` or the anon key from the "Connect → Framework" wizard.

## 1. Unpause the project (if needed)

On the Supabase dashboard home, confirm the project is **Active** (free projects pause when idle).

## 2. Copy connection strings (do not build URLs by hand)

**Project Settings** → **Database** → **Connection string** → **URI**

Copy these two and paste into `.env`:

| Variable | Supabase label | Port |
|----------|----------------|------|
| `DIRECT_URL` | **Session mode** or **Direct connection** | 5432 |
| `DATABASE_URL` | **Transaction mode** (add `?pgbouncer=true`) | 6543 |

Use **Connect → ORM → Prisma**. The pooler host is project-specific (this project uses `aws-1-us-east-1`, not `aws-0`).

**Password with `#`:** URL-encode as `%23` (e.g. `JoelAmrom#2003` → `JoelAmrom%232003`).

**Or:** reset the database password to letters/numbers only (no `#`) to avoid encoding issues.

## 3. Update `.env`

```env
DATABASE_URL="<paste Transaction pooler URI>"
DIRECT_URL="<paste Session or Direct URI>"
```

## 3. Initialize the database

```bash
npx prisma migrate deploy
npm run db:seed
npm run import:counties
npm run dev
```

## 4. Vercel (production)

Use **Connection pooling** (port `6543`) for `DATABASE_URL` in Vercel env vars.  
Keep **direct** connection (`5432`) for `DIRECT_URL` when running migrations from your machine or CI.

Copy the exact strings from: **Settings → Database → Connection string**.
