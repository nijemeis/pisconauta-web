#!/usr/bin/env bash
# Netlify build: run Prisma migrations (unless SKIP_MIGRATIONS=1), then build Next.js.
# DATABASE_URL is a site env var (read-write Neon URL). Netlify DB's own NETLIFY_DATABASE_URL is only
# injected at runtime, so it cannot be relied on here. Migrations use the direct endpoint when given.
set -eo pipefail
export DATABASE_URL="${DATABASE_URL:-${NETLIFY_DATABASE_URL:-}}"
export DIRECT_DATABASE_URL="${DIRECT_DATABASE_URL:-${NETLIFY_DATABASE_URL_UNPOOLED:-${DATABASE_URL/-pooler/}}}"
if [ "${SKIP_MIGRATIONS:-0}" = "1" ] || [ -z "$DATABASE_URL" ]; then
  echo "Skipping migrations (SKIP_MIGRATIONS=${SKIP_MIGRATIONS:-0}, DATABASE_URL ${DATABASE_URL:+set}${DATABASE_URL:-unset})"
else
  npx prisma migrate deploy
fi
npm run build
