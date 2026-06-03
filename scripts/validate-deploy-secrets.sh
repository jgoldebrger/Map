#!/usr/bin/env bash
# Validates Vercel deploy secrets (does not print values).
set -euo pipefail

fail() {
  echo "::error::$1"
  exit 1
}

[ -n "${VERCEL_TOKEN:-}" ] || fail "VERCEL_TOKEN is empty. Add it under GitHub → Settings → Secrets and variables → Actions → Secrets (not Variables). Create a token at https://vercel.com/account/settings/tokens"

[ -n "${VERCEL_ORG_ID:-}" ] || fail "VERCEL_ORG_ID is empty. Find it in Vercel project Settings → General, or in .vercel/project.json after 'vercel link'."

[ -n "${VERCEL_PROJECT_ID:-}" ] || fail "VERCEL_PROJECT_ID is empty. Find it in Vercel project Settings → General, or in .vercel/project.json after 'vercel link'."

echo "Vercel deploy secrets OK."
