# Deploying PISCONAUTA to DigitalOcean

Target: **App Platform** next to Dealiteful and Nije3d, sharing the **managed Postgres cluster**
(separate database) and the **Spaces** account (own bucket). The spec is `.do/app.yaml`.

| Thing | Why |
| --- | --- |
| `npm run start:prod` | Runs migrations + the base seed (taxonomy, admin) before starting; idempotent |
| `/api/health` touches the DB | A deploy that can't reach Postgres rolls back |
| Spaces storage driver (`S3_*`) | App Platform disks are ephemeral; production refuses local disk |
| `PORT` | App Platform injects 8080 |

## Steps

1. **Database** — DO → Databases → the cluster → Users & Databases → add database `pisconauta`.
2. **Spaces** — Spaces → Create Space in `ams3` named `pisconauta-media`, **private** (the app serves
   images itself via `/media/<key>?w=`). Reuse the existing Spaces key pair or create one under API → Spaces Keys.
3. **App** — Apps → Create App → GitHub `nijemeis/pisconauta-web`, or paste `.do/app.yaml` into the spec editor
   with `cluster_name` set to the cluster's exact name. Fill the SECRET values (ADMIN_PASSWORD, AUTH_SECRET,
   GOOGLE_CLIENT_SECRET, S3 keys) in the UI. Add the app to the cluster's **Trusted Sources**.
4. **Data** — from a machine with `pg_dump`/`pg_restore` and access to both databases:
   ```bash
   pg_dump --no-owner --no-privileges -Fc "$NEON_URL" -f pisconauta.dump
   pg_restore --no-owner --no-privileges -d "$DO_URL" pisconauta.dump
   ```
   Images: `npx tsx scripts/copy-blobs-to-spaces.ts` with `NETLIFY_SITE_ID`, `NETLIFY_AUTH_TOKEN` and the `S3_*` vars set.
5. **Domain** — Apps → Settings → Domains → add `pisconauta.com` + `www`. At TransIP point `www` (CNAME) at the
   app's `.ondigitalocean.app` host and the apex at the address DO shows. Keep `APP_URL=https://pisconauta.com`
   and the Google OAuth redirect URI as they are.
6. **Retire Netlify** — once DNS has moved: Netlify → project → Settings → Delete project (Neon can stay as a backup for a while).
