#!/usr/bin/env bash
# Netlify build: run Prisma migrations against Neon, then build Next.js.
# Netlify DB provides the pooled URL as NETLIFY_DATABASE_URL; migrations need the direct
# endpoint, which on Neon is the same host without the "-pooler" suffix.
set -euo pipefail
export DATABASE_URL="${DATABASE_URL:-$NETLIFY_DATABASE_URL}"
export DIRECT_DATABASE_URL="${DIRECT_DATABASE_URL:-${NETLIFY_DATABASE_URL_UNPOOLED:-${DATABASE_URL/-pooler/}}}"
if [ "${SKIP_MIGRATIONS:-0}" = "1" ]; then echo "Skipping migrations (SKIP_MIGRATIONS=1)"; else npx prisma migrate deploy; fi
npm run build
