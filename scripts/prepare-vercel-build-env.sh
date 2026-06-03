#!/usr/bin/env bash
# Merge GitHub Production vars into Vercel pulled env so prebuilt builds get NEXT_PUBLIC_* at build time.
set -euo pipefail

fail() {
  echo "::error::$1"
  exit 1
}

ENV_FILE=".vercel/.env.production.local"
mkdir -p .vercel
touch "$ENV_FILE"

set_var() {
  local key="$1"
  local value="${2:-}"
  if [ -z "$value" ]; then
    return
  fi
  if grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
  else
    printf '%s=%s\n' "$key" "$value" >> "$ENV_FILE"
  fi
}

[ -n "${NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN:-}" ] || fail "NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN is empty. Add it to GitHub Production variables and Vercel project env."

set_var "NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN" "${NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN:-}"
set_var "NEXT_PUBLIC_SUPABASE_URL" "${NEXT_PUBLIC_SUPABASE_URL:-}"
set_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}"
set_var "DATABASE_URL" "${DATABASE_URL:-}"
set_var "DIRECT_URL" "${DIRECT_URL:-}"
set_var "AUTH_SECRET" "${AUTH_SECRET:-}"
set_var "AUTH_TRUST_HOST" "${AUTH_TRUST_HOST:-true}"
set_var "EMBED_ALLOWED_ORIGINS" "${EMBED_ALLOWED_ORIGINS:-}"
set_var "AUTH_URL" "${AUTH_URL:-}"
set_var "NEXTAUTH_URL" "${NEXTAUTH_URL:-}"

echo "Vercel production env file ready (Mapbox token: yes)."
