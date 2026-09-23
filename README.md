# PISCONAUTA · web + API

Catalogue and discovery platform for Peruvian pisco — an initiative of FIA International (Leusden, NL). Producers (bodegas) publish their bottles; drinkers search, scan labels, rate with stars and keep a personal cellar ("Mi Cava").

This repo is the **responsive web app, the admin console and the REST API** (Next.js 16 + Prisma + Postgres). The iOS and Android apps live in [nijemeis/pisconauta-apps](https://github.com/nijemeis/pisconauta-apps) and talk to this API.

```
src/app/            pages + /api/* route handlers + /media image server
src/lib/            catalog (search, facets), auth, storage, rates, i18n, types.ts (the API contract)
prisma/             schema, migrations, seed
design/             Claude Design handoff (README, canvas, screenshots) — the source of truth for UI
```

## Run it locally

```bash
cp .env.example .env        # set DATABASE_URL + AUTH_SECRET (and ADMIN_PASSWORD)
createdb pisconauta
npm install
npm run setup               # migrate + seed (taxonomy, admin, demo catalogue)
npm run dev                 # http://localhost:3100
```

The seed creates `admin@pisconauta.pe` with `ADMIN_PASSWORD` from `.env` (or prints a generated one once). With the demo catalogue it also adds two demo logins, password `pisco-demo-2026`: `bodega@pisconauta.pe` (producer owning the demo "Bodega Cerro Lúcumo") and `catador@pisconauta.pe` (aficionado with a small cellar). The five demo bodegas are **fictional**. For production seed with `npm run db:seed -- --base` (taxonomy + admin only).

## How it fits together

- **Roles**: visitor → `enthusiast` (rate, cellar, add places) · `producer` (owns a bodega) · `admin`.
- **Producer onboarding**: sign up as *Productor* → register the bodega (`pending`) → admin verifies it → the bodega publishes bottles itself (`draft → published`, no per-bottle review). Unverified bodegas can only save drafts. Admins can still unpublish a bottle with a note. Admins can register bodegas on a producer's behalf, assign the owner by e-mail and edit any bottle.
- **Admin console** (`/admin`): pending queue, all bodegas, all piscos, tasting-note vocabulary, contact messages.
- **Ratings**: five criteria (aroma, sabor, cuerpo, final, equilibrio) × 5 stars; the overall score is their mean.
- **Where to buy**: listings per bottle (store → maps, webshop → link), added by bodegas, admins or the community, in PEN/USD/EUR. Prices display in the visitor's preferred currency using weekly PEN-based exchange rates (`src/lib/rates.ts`).
- **Auth**: opaque session tokens stored hashed. Web uses an httpOnly cookie, the apps send the same token as `Authorization: Bearer`. Apple/Google sign-in is not wired yet.
- **Search**: Postgres `pg_trgm` + `unaccent` over a denormalised `searchText` column; facet counts lift their own filter.
- **Images**: `src/lib/storage.ts` writes to local disk (`STORAGE_DIR`); `/media/<key>?w=` serves WebP derivatives. Swap that one file for S3 / Netlify Blobs in production.
- **Label scan**: `POST /api/scan` — perceptual hash against stored bottle/label photos, then Google Vision OCR fallback when `VISION_API_KEY` is set.
- **i18n**: Spanish default, English via the ES · EN switch (`src/lib/i18n`); API errors follow `pn_locale` / `Accept-Language`.
- **Legal**: `/privacidad`, `/terminos`, `/contacto` — drafts, to be reviewed by a lawyer. Operator identity comes from `src/lib/site.ts` / `NEXT_PUBLIC_OPERATOR*`.

## Deploy

DigitalOcean App Platform — see [docs/deploy-digitalocean.md](docs/deploy-digitalocean.md). Spec in `.do/app.yaml`; `npm run start:prod` runs migrations + the base seed before starting.

## Not built yet

OAuth (Apple/Google), e-mail (verification, password reset, notifications), user lists ("LISTAS"), retailer price scraping + nightly jobs, review moderation UI, production object storage.
