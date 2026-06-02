#!/usr/bin/env bash
# Validates required CI secrets before Prisma migrate (does not print secret values).
set -euo pipefail

trim() {
  local v="$1"
  v="${v#\"}"
  v="${v%\"}"
  v="${v#\'}"
  v="${v%\'}"
  printf '%s' "$v" | tr -d '\r\n'
}

fail() {
  echo "::error::$1"
  exit 1
}

DATABASE_URL="$(trim "${DATABASE_URL:-}")"
DIRECT_URL="$(trim "${DIRECT_URL:-}")"
AUTH_SECRET="$(trim "${AUTH_SECRET:-}")"
ADMIN_EMAIL="$(trim "${ADMIN_EMAIL:-}")"
ADMIN_PASSWORD="$(trim "${ADMIN_PASSWORD:-}")"

[ -n "$DATABASE_URL" ] || fail "DATABASE_URL is empty. Add it under Settings → Environments → Production → Variables (or repository Secrets)."

[ -n "$DIRECT_URL" ] || fail "DIRECT_URL is empty. Add Supabase Session/Direct URI (port 5432) — separate from DATABASE_URL."

if echo "$DIRECT_URL" | grep -qE 'pgbouncer=true|:6543'; then
  fail "DIRECT_URL must be port 5432 session/direct URL, not the Transaction pooler (6543 / pgbouncer=true)."
fi

if ! echo "$DATABASE_URL" | grep -qE ':6543|pgbouncer=true'; then
  echo "::warning::DATABASE_URL does not look like the Supabase pooler (6543). App may still work if this URL is correct."
fi

[ -n "$AUTH_SECRET" ] || fail "AUTH_SECRET is empty."

[ -n "$ADMIN_EMAIL" ] || fail "ADMIN_EMAIL is empty."

[ -n "$ADMIN_PASSWORD" ] || fail "ADMIN_PASSWORD is empty."

echo "CI environment secrets OK (DATABASE_URL + DIRECT_URL + auth + admin)."
