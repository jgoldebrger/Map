#!/usr/bin/env bash
# Copy assets required by Next.js standalone server (CI E2E).
set -euo pipefail

if [ ! -f .next/standalone/server.js ]; then
  echo "No standalone build found — run npm run build first."
  exit 1
fi

cp -r public .next/standalone/public
mkdir -p .next/standalone/.next
cp -r .next/static .next/standalone/.next/static
echo "Standalone E2E server files ready."
