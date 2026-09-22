#!/usr/bin/env bash
# Netlify build: run Prisma migrations (unless SKIP_MIGRATIONS=1), then build Next.js.
# DATABASE_URL is a site env var (Neon, pooled). Migrations use the direct endpoint (host without "-pooler").
set -eo pipefail
export DATABASE_URL="${DATABASE_URL:-}"
export DIRECT_DATABASE_URL="${DIRECT_DATABASE_URL:-${DATABASE_URL/-pooler/}}"
if [ "${SKIP_MIGRATIONS:-0}" = "1" ] || [ -z "$DATABASE_URL" ]; then
  echo "Skipping migrations (SKIP_MIGRATIONS=${SKIP_MIGRATIONS:-0}, DATABASE_URL ${DATABASE_URL:+set}${DATABASE_URL:-unset})"
else
  npx prisma migrate deploy
  # Idempotent: upserts the taxonomy (regions, varieties, tasting notes) and the admin account. No demo data.
  npx tsx prisma/seed.ts --base
fi
npm run build
