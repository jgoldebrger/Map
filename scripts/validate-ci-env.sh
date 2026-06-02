#!/usr/bin/env bash
# Validates required CI secrets before Prisma migrate (does not print secret values).
set -euo pipefail

fail() {
  echo "::error::$1"
  exit 1
}

[ -n "${DATABASE_URL:-}" ] || fail "DATABASE_URL is empty. Add it in GitHub → Settings → Secrets and variables → Actions."

[ -n "${DIRECT_URL:-}" ] || fail "DIRECT_URL is empty. Add the Supabase Session/Direct URI (port 5432) — not the Transaction pooler (6543)."

if echo "$DIRECT_URL" | grep -qE 'pgbouncer|:6543'; then
  fail "DIRECT_URL looks like the pooler URL. Use Session mode / Direct connection (port 5432) from Supabase → Database → Connection string."
fi

[ -n "${AUTH_SECRET:-}" ] || fail "AUTH_SECRET is empty."

[ -n "${ADMIN_EMAIL:-}" ] || fail "ADMIN_EMAIL is empty."

[ -n "${ADMIN_PASSWORD:-}" ] || fail "ADMIN_PASSWORD is empty."

echo "CI environment secrets are present and DIRECT_URL format looks valid."
