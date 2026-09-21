# Handoff: PISCONAUTA — Peruvian pisco discovery app

## Overview

PISCONAUTA is a catalogue and discovery app for Peruvian pisco: producers (bodegas) create accounts and publish their bottles with photo, description, tasting notes, style, grape variety, D.O. region, vintage, ABV, bottle size, rest period, awards and prices; drinkers search, scan labels, rate and keep a personal cellar ("Mi Cava"). Copy is bilingual — Spanish primary, English glosses on micro-labels.

Design language: dark "Casa de Oro" theme (standard) with a light "Valle Claro" theme, Cormorant Garamond display type, restrained Andean decoration (chakana stepped cross, stepped-mountain bands, stepped corner brackets) in gold and terracotta over espresso/bone grounds.

## About the design files

The files in this bundle are **design references created in HTML** — prototypes that show intended look, structure and behaviour. They are **not production code to copy**. The task is to recreate these designs in the target codebase's environment using its established patterns; if no codebase exists yet, pick the framework best suited to the stack described under "Backend & deployment" below (a React/Vite or Astro SPA/SSR app on Netlify is the assumed default) and implement the designs there.

The prototype is a single-file canvas containing every screen side by side. It is not an interactive app: navigation, forms, search and scanning are all static representations.

## Fidelity

**High fidelity.** Colours, type sizes, spacing, borders and copy are final and should be matched closely. Exact values are listed in "Design tokens" and per screen. Photography is placeholder imagery supplied by the client (real pisco bottle shots) — production needs proper 3:4 bottle photography per SKU.

---

## Screens

All mobile screens are designed at **402 × 874 px** (iPhone 16-class logical viewport), safe-area top 52–56 px, bottom tab bar 30–34 px of padding for the home indicator. The desktop view is designed at **1320 × 820 px** content area.

### 00 · Splash
- **Purpose**: brand entry while session/auth resolves.
- **Layout**: full-bleed background photo (vineyard rows) under a vertical scrim `linear-gradient(180deg, rgba(20,16,14,0.2), rgba(20,16,14,0.38) 38%, rgba(20,16,14,0.8) 100%)`; content centred in a column, padding `120px 34px 52px`.
- **Components (top to bottom)**: gold chakana 96 × 96; wordmark `PISCONAUTA` Cormorant Garamond 300, 44px, letter-spacing 0.07em, `#F4ECDE`, text-shadow `0 2px 24px rgba(0,0,0,0.6)`, followed by a period in `#B4552F`; stepped-mountain band 150 × 12; tagline `EL PISCO PERUANO, / CATALOGADO` IBM Plex Mono 11px, letter-spacing 0.3em, `#E0D6C6`; spacer; region line `ICA · PISCO · LIMA / AREQUIPA · MOQUEGUA · TACNA` mono 10px, 0.24em, `#C9A24A`, line-height 2; footer `D.O. PERÚ · v1.0` mono 10px, `#A79683`.
- **Behaviour**: hold ~1.2 s or until auth resolves, then fade (200 ms) to Discover (signed in) or Onboarding.

### 01 · Account / Onboarding
- **Purpose**: pick a role and create an account.
- **Layout**: column, padding `96px 28px 40px`. Stepped-mountain band at top; centred chakana 56px; `PISCONAUTA` Cormorant 46px / 0.06em centred; italic subtitle `El pisco peruano, catalogado.` Cormorant italic 22px `#C9A24A`; supporting paragraph Archivo 13px/1.6 `#CFC3B0`.
- **Role cards** (mono label `ENTRO COMO / I JOIN AS` above): two cards, padding 18px, title Cormorant 24px, helper Archivo 12px `#C3B4A0`, radio dot 16px circle. Selected card: border `1px solid #C9A24A`, fill `rgba(201,162,74,0.09)`, dot filled gold. Unselected: border `1px solid rgba(244,236,222,0.16)`, hollow dot.
  - `Aficionado` — "Descubro, cato y guardo piscos"
  - `Productor` — "Publico las botellas de mi bodega"
- **Footer**: primary button `CREAR CUENTA` (gold `#C9A24A`, ink `#14100E`, mono 11px/0.2em, padding 16px, square); three outline buttons `Apple / Google / Correo`; text link `Ya tengo cuenta · Ingresar`.
- **Behaviour**: role choice decides post-signup destination (producer → bodega claim flow; aficionado → Discover). Producer accounts require verification before bottles go public.

### 02 · Discover
- **Purpose**: editorial entry point.
- **Layout**: header (greeting mono 10px `#C9A24A`, `Descubre` Cormorant 34px, 34px avatar circle), search affordance (border `1px solid rgba(244,236,222,0.16)`, padding 13/14, placeholder `Busca pisco, bodega o variedad…`), then scrolling sections.
- **Sections**: "Cata del día" feature card (gold-tinted gradient panel, 78 × 112 bottle thumb, Cormorant 26px title, mono meta, one-line editorial); "Valles con D.O." horizontal chip rail (Ica selected = gold border); "Mosto Verde destacado" horizontal rail of 124px-wide cards with 150px 3:4 photo, Cormorant 18px title, mono meta.
- **Section headers**: mono 10px, 0.22em, `#C9A24A` + 1px rule `rgba(201,162,74,0.35)` + 11px chakana terminal.
- **Tab bar**: 5 items, 13px chakana icon over mono 9–10px label, active gold, inactive `#A79683` at 62% opacity. Items: `DESCUBRE · BUSCAR · ESCANEAR · MI CAVA · BODEGA` (the last only for producer accounts).

### 03 · Search + filters
- **Purpose**: faceted search across bottles, bodegas and varieties.
- **Layout**: search field (active state: gold border, query text, clear ✕), applied-filter row (`FILTROS · 3` gold pill + removable chips), results count + sort control (`MEJOR VALORADOS ▾`), result rows, and the filter sheet overlaying the lower half.
- **Result row**: 56 × 80 bottle photo, Cormorant 21px name, Archivo 12px bodega · valley, mono 9–10px `ABV · SIZE · VINTAGE`, right-aligned Cormorant 24px gold rating + mono count. Row separator `1px solid rgba(244,236,222,0.08)`.
- **Filter sheet**: panel `#1A1411`, border `rgba(201,162,74,0.35)`, title `Filtros` Cormorant 24px + `LIMPIAR`; facet groups `ESTILO`, `VARIEDAD` (chip multi-select; selected = gold fill, ink text), `ALC. VOL` dual-handle range (track 2px `rgba(244,236,222,0.14)`, active gold, 12px round handles), primary `VER 24 PISCOS`.
- **Facets**: style (Puro / Acholado / Mosto Verde), variety (Quebranta, Negra criolla, Mollar, Uvina, Italia, Moscatel, Albilla, Torontel), D.O. region, ABV range, price, rating, vintage.

### 04 · Scan a label
- **Purpose**: identify a bottle from its label.
- **Layout**: viewfinder fills the screen (camera feed; prototype uses a diagonal hairline texture), instruction `ALINEA LA ETIQUETA` mono 10px/0.24em at top, 230 × 320 frame with 30px gold corner brackets plus 14px inner stepped brackets and a centred scan line (`linear-gradient(90deg, transparent, #C9A24A, transparent)`).
- **Result sheet**: `#14100E` panel, top border `rgba(201,162,74,0.3)`, label `ETIQUETA RECONOCIDA`, 62 × 86 thumb, Cormorant 24px name, meta, `COINCIDENCIA 97 %`, gold rating; buttons `VER FICHA` (gold) and `NO ES ESTE` (outline → opens manual search prefilled).

### 1a / 1b · Pisco detail (Ficha) — dark standard and light theme
- **Purpose**: everything known about one bottle; the app's centre of gravity.
- **Header**: back ‹, centred `PISCO · D.O. PERÚ` flanked by two 12px chakanas, ♡ save.
- **Hero**: radial ground `radial-gradient(120% 80% at 50% 0%, #241A14, #14100E 70%)`; stepped-mountain band; 188 × 250 bottle vitrine with 1px gold border, 14px corner brackets + 9px inner steps; bodega name mono 10px/0.26em gold; bottle name Cormorant 42px; `Cosecha 2021 · Valle de Ica` Cormorant italic 22px `#C3B4A0`; rating block — Cormorant 30px gold score, 1px divider, review count + `RANKING #4 QUEBRANTA`.
- **Spec grid**: 2 columns, 1px gap on `rgba(201,162,74,0.22)` (grid lines), cells `#1A1411` padding 14/16, mono 9–10px label `#B0A08D` + Cormorant 20px value. Cells: ESTILO, VARIEDAD, ALCOHOL, BOTELLA, REPOSO, ALAMBIQUE. A woven textile band (`repeating-linear-gradient(90deg, #C9A24A 0 3px, transparent 3px 9px, #B4552F 9px 13px, transparent 13px 22px)`, 7px tall) sits above the grid.
- **Tasting notes**: section header + outlined chips (border `rgba(201,162,74,0.4)`, padding 7/12, Archivo 12–13px).
- **Flavour bars** (optional, prop-controlled): mono label + value, 3px track `rgba(244,236,222,0.12)`, gold fill; `DULZOR` uses terracotta.
- **Awards** (optional): panel with gold gradient wash, 36px chakana, Cormorant 19px award, 12px line for competition + year.
- **Same bodega**: 3 mini cards (76px photo, Cormorant 16px name, mono meta) linking to sibling bottles.
- **Action bar**: greca/stepped band strip, then price block (`S/ 89`, `DESDE · 4 TIENDAS`) + gold CTA `AÑADIR A MI CAVA` (hover `#E3C77F`).
- **Light theme (1b)** is the same composition with the light token set; the CTA pair becomes `CATAR / RATE` (solid ink) and `MI CAVA +` (outline).

### 05 · Bodega (producer) profile
- **Purpose**: the producer's storefront; their bottles next to their story.
- **Layout**: 186px cover photo with inset scrim `inset 0 -80px 70px -20px rgba(20,16,14,0.9)`; 86px circular crest (border gold, chakana 24px over initials Cormorant 22px) overlapping the cover by 43px; centred name Cormorant 32px; mono meta `VALLE DE ICA · DESDE 1908 · ✓ VERIFICADA`; 12px/1.55 description; 3-up stat strip (bordered top/bottom: 12 PISCOS · 4,6 PROMEDIO · 7 MEDALLAS, values Cormorant 26px); tabs `PISCOS / HISTORIA / VISITAS` (active gold with 1px underline).
- **Bottle grid**: 2 columns, 14px gap, 216px 3:4 photo tiles, Cormorant 18px name, mono `vintage · ABV · rating`. Grid scrolls.

### 06 · Producer: add a pisco
- **Purpose**: the publishing flow (step 2 of 3).
- **Layout**: modal-style header (`CANCELAR` / `Nueva botella` Cormorant 22px / `PASO 2/3` gold), scrolling form, sticky footer (`BORRADOR` outline + `SIGUIENTE · DESTILACIÓN` gold).
- **Fields**: two 96 × 132 dashed upload slots (`FOTO BOTELLA` required with gold dashed border, `ETIQUETA` optional) + a photo-guidance note card; `NOMBRE DE LA BOTELLA` (Cormorant 24px input on a gold 1px underline); three-up `ALC. VOL % / TAMAÑO ▾ / COSECHA`; `ESTILO` segmented control (3 options, active = gold fill); `VARIEDAD ▾` and `D.O. / VALLE ▾` selects; `NOTAS DE CATA` token input (selected notes = gold chips with ✕, `+ nota` dashed adder).
- **Field pattern**: mono 9–10px label 0.2em `#B0A08D`, value/input Cormorant 20–24px, 1px bottom border (`rgba(244,236,222,0.2)`, gold when focused/filled). No rounded corners, no filled inputs.
- **Validation**: name, style, ≥1 variety, D.O., ABV (35–48 %), size, one photo required to publish; vintage optional; drafts save anything.

### 07 · Mi Cava (my cellar)
- **Purpose**: personal tasting record.
- **Layout**: title `Mi cava` Cormorant 34px + mono `MY CELLAR · 47 CATADOS`; two stat cards (gold 30%-opacity border, mono label + Cormorant 22px value: favourite variety, most-tasted valley); tabs `CATADOS / DESEADOS / LISTAS`; list rows (50 × 72 photo, Cormorant 20px name, bodega · region, `CATADO 12 SET 2026`, right-side `MI NOTA` + Cormorant 24px gold score).

### 1d · Web catalogue (desktop, 1320 × 820)
- **Purpose**: buyers, sommeliers and importers browsing and comparing.
- **Layout**: top bar (chakana 22px + `PISCONAUTA.` Cormorant 24px/0.08em; nav mono 10–11px `CATÁLOGO · BODEGAS · VALLES D.O. · GUÍA`; 260px search field; `SOY PRODUCTOR` gold outline; avatar) over a `268px | 1fr` grid.
- **Sidebar**: stepped-mountain band, facet groups (ESTILO with counts, VARIEDAD chips, D.O. list, ABV range slider), 28px padding, right border `rgba(244,236,222,0.1)`.
- **Main**: page title Cormorant 40px (`Mosto Verde · Arequipa`), mono result meta, `COMPARAR (2)` + sort controls, then a 4-column card grid (22px gap; 200px 3:4 photo, Cormorant 22px name, bodega, mono `ABV · SIZE`, gold rating). Featured card carries a gold border, the rest `rgba(244,236,222,0.12)`.

---

## Interactions & behaviour

- **Navigation**: tab bar (Descubre / Buscar / Escanear / Mi Cava / Bodega — last item producer-only). Bottle cards → Ficha; bodega name/crest → Bodega profile; "De la misma bodega" cards → sibling Ficha.
- **Search**: debounce 250 ms, results update live; filter sheet is a bottom sheet (translateY, 240 ms `cubic-bezier(.2,.8,.2,1)`), facets apply immediately with a count on the CTA; applied filters render as removable chips.
- **Rating**: `CATAR / RATE` opens a rating sheet (score + optional notes + optional photo) and writes a cellar entry; rating a bottle moves it into `CATADOS`.
- **Save**: ♡ / `MI CAVA +` toggles a wishlist entry (optimistic, revert on failure).
- **Scan**: camera stream, frame-rate-limited match requests (~2/s), match confidence shown; `NO ES ESTE` falls back to search with an OCR-derived query; on no match, offer "sugerir botella" which queues a submission for the bodega/admin.
- **Producer publishing**: draft → validation → review (admin/verification) → published. Unverified bodegas can save drafts only.
- **Hover/focus** (desktop + pressable states): gold buttons lighten to `#E3C77F`; outline controls raise border to `rgba(244,236,222,0.32)`; focus ring = 1px gold offset 2px. Transitions 120–160 ms ease-out.
- **Loading**: skeleton = the striped placeholder pattern (`repeating-linear-gradient(135deg, rgba(201,162,74,0.13) 0 5px, transparent 5px 11px)`) in the photo box, plus 1px shimmer lines for text.
- **Empty states**: Mi Cava empty → chakana 56px + "Aún no has catado ningún pisco" + CTA to Descubre.
- **Errors**: inline under the field in `#B4552F` at 12px; network failure → bottom toast on `#1A1411` with gold border.
- **Responsive**: mobile layouts are fluid between 360–430 px (gutters stay 20px, photo boxes flex). The web catalogue collapses 4 → 3 → 2 columns at 1200 / 980 / 760 px and turns the sidebar into a filter sheet below 900 px.
- **Theme**: dark is default; light theme follows the token map below and is user-selectable (persist per account + `prefers-color-scheme` on first run).
- **i18n**: `es-PE` default, `en` secondary. Micro-labels are intentionally bilingual on some screens (e.g. `NOTAS DE CATA` / `TASTING NOTES`); keep pisco terminology in Spanish in both locales (Puro, Acholado, Mosto Verde, bodega, cava, cata).

## State

Client: session/role, theme, locale, search query + facet state + sort + pagination cursor, filter-sheet open, scan state (`idle | streaming | matching | matched | no-match`), cellar/wishlist membership sets (optimistic), producer draft form state (autosave every 5 s), image upload progress per slot.

Server-derived: bottle, bodega, review and cellar records; facet counts; aggregate ratings; award and price listings.

---

## Design tokens

### Dark theme ("Casa de Oro" — default)
| Role | Value |
| --- | --- |
| Background | `#14100E` |
| Bar / footer | `#100C0A` |
| Card / panel | `#1A1411` |
| Hero radial inner | `#241A14` |
| Ink primary | `#F4ECDE` |
| Ink secondary | `#E0D6C6` |
| Ink tertiary | `#D2C7B4` / `#CFC3B0` |
| Ink quaternary | `#C3B4A0` |
| Muted label | `#BCAC97`, `#B0A08D`, `#A79683` |
| Gold (primary accent) | `#C9A24A` (hover `#E3C77F`) |
| Terracotta (secondary) | `#B4552F` |
| Hairline | `rgba(244,236,222,0.08 / 0.10 / 0.12 / 0.16)` |
| Gold hairline | `rgba(201,162,74,0.22 / 0.25 / 0.30 / 0.35 / 0.42)` |
| Photo skeleton | `repeating-linear-gradient(135deg, rgba(201,162,74,0.13) 0 5px, transparent 5px 11px)` |

### Light theme ("Valle Claro")
`#14100E→#F7F1E6` · `#100C0A→#F0E7D8` · `#1A1411→#FFFCF6` · `#241A14→#EFE5D2` · `#F4ECDE→#221A15` · `#E0D6C6→#3A2E26` · `#D2C7B4/#CFC3B0→#4A3C32` · `#C3B4A0→#55463A` · muted greys → `#6B5A4B` · `#C9A24A→#A8451F` · ink hairlines → `rgba(34,26,21,α)` · gold hairlines → `rgba(168,69,31,α)`.

### Typography
- **Display / values**: Cormorant Garamond — 300 (wordmark, splash), 400 (titles, spec values), italic 300/400 (subtitles, pull quotes). Sizes 16 / 18 / 19 / 20 / 21 / 22 / 24 / 26 / 30 / 32 / 34 / 40 / 42 / 44 / 46 / 64 / 76.
- **UI text**: Archivo 300–600. Sizes 11 / 12 / 13 / 16; line-height 1.4–1.6.
- **Micro-labels, meta, buttons**: IBM Plex Mono 400/500, 9 / 10 / 11 px, letter-spacing 0.12–0.30em, usually uppercase.
- Minimum text size in production: 10 px for mono micro-labels, 12 px for body. Never place text below 4.5:1 contrast on its ground.

### Geometry
- Corner radius: **0** for cards, buttons, inputs, chips (light theme uses `999px` pills for tasting-note chips only); `50%` for avatars/crests; 2px on canvas id badges.
- Spacing scale: 6 / 8 / 10 / 12 / 14 / 18 / 20 / 22 / 26 / 34 px. Screen gutter 20 px (28 px on onboarding, 22 px light-theme ficha).
- Borders: 1px hairlines; 2px only on corner brackets.
- Shadows: avoided except the splash text-shadow. Depth comes from hairlines and ground shifts.

### Motifs (SVG, tileable, currentColor-able)
- **Chakana** (stepped cross), 24 × 24, gold: rects `(8.5,0,7,7) (0,8.5,7,7) (8.5,8.5,7,7) (17,8.5,7,7) (8.5,17,7,7)` plus corner steps `(4.5,4.5,3,3) (16.5,4.5,3,3) (4.5,16.5,3,3) (16.5,16.5,3,3)`. Used at 11 / 12 / 13 / 22 / 24 / 36 / 56 / 96 px.
- **Stepped-mountain band**, 30 × 12, repeat-x: rects `(0,7,7,5) (7.5,3.5,7,5) (15,0,7,5) (22.5,3.5,7,5)`.
- **Textile band**: `repeating-linear-gradient(90deg, #C9A24A 0 3px, transparent 3px 9px, #B4552F 9px 13px, transparent 13px 22px)`, 7 px tall.
- **Stepped corner bracket**: outer L 14 px (30 px on the scanner) at 2px gold + inner L 9 px (14 px) at `rgba(201,162,74,0.6)`, offset 9 px (11 px).
Ship these as inline SVG components with a colour prop, not as background-image data URIs.

---

## Backend

The prototype is static; everything below has to be built. Recommended shape: **Postgres + a thin REST/RPC API + object storage + a search index**, deployable on Netlify (see next section).

### Roles
`visitor` (browse), `enthusiast` (rate, cellar, wishlist), `producer` (owns a bodega, manages its bottles), `admin` (verification, moderation, taxonomy).

### Core tables
- `users` — id, email, password_hash or oauth identity, display_name, locale, theme, role, created_at.
- `producers` (bodegas) — id, slug, name, founded_year, region_id, valley, description, crest_initials, cover_image_id, website, ruc (tax id), verified_at, verified_by, owner_user_id, avg_rating, pisco_count.
- `producer_members` — producer_id, user_id, role (owner | editor) — so a bodega can have several staff accounts.
- `piscos` — id, producer_id, name, slug, style (`puro | acholado | mosto_verde`), region_id, valley, vintage, abv_pct (numeric 4,1), bottle_size_ml, rest_months, still_type (`falca | alambique_cobre | otro`), distillations, description, status (`draft | in_review | published | archived`), published_at, avg_rating, ratings_count, search_vector.
- `pisco_varieties` — pisco_id, variety_id, share_pct (nullable; acholados are blends).
- `varieties` — id, name, aromatic (bool), notes. Seed: Quebranta, Negra Criolla, Mollar, Uvina, Italia, Moscatel, Albilla, Torontel.
- `regions` — id, name (Lima, Ica, Arequipa, Moquegua, Tacna), valleys (jsonb).
- `pisco_photos` — id, pisco_id, storage_key, kind (`bottle | label | lifestyle`), width, height, sort, is_primary. Bottle shots are 3:4.
- `tasting_note_terms` — id, term_es, term_en, family (fruta | floral | herbal | especia | mineral | dulce). `pisco_tasting_notes` — pisco_id, term_id, added_by (`producer | community`), votes.
- `flavour_profiles` — pisco_id, axis (cuerpo | dulzor | herbal | citrico | floral | alcohol), value 0–5 (producer-declared, community-averaged variant stored separately).
- `awards` — id, pisco_id, competition, level (oro | plata | bronce | gran_oro), year, source_url.
- `retailers` + `price_listings` — pisco_id, retailer_id, price_cents, currency (PEN default, USD), url, in_stock, updated_at.
- `reviews` — id, pisco_id, user_id (unique per pair), score (1–5, 0.1 steps), body, notes (term ids), photo_id, created_at, status (`visible | flagged | removed`).
- `cellar_entries` — user_id, pisco_id, state (`tasted | wishlist`), personal_score, tasted_at, note.
- `lists` + `list_items` — user-curated collections ("LISTAS" tab).
- `label_scans` — id, user_id, storage_key, phash, ocr_text, matched_pisco_id, confidence, created_at (feeds match-quality tuning).
- `audit_log` — actor, action, entity, before/after (producer edits and verification decisions).

### API surface (REST; adapt to tRPC/GraphQL if the codebase prefers)
```
GET  /api/piscos?q=&style=&variety=&region=&abv_min=&abv_max=&price_max=&sort=&cursor=
GET  /api/piscos/:slug                       → ficha payload incl. photos, notes, awards, prices, bodega, siblings
GET  /api/facets?…                           → counts for the current query (sidebar/filter sheet)
GET  /api/producers/:slug                    → profile + published bottles
POST /api/producers                          → claim/create bodega (auth, role=producer) → status pending
PATCH/api/producers/:id                      → edit (owner/editor)
POST /api/piscos                             → create draft
PATCH/api/piscos/:id                         → update draft/published (owner)
POST /api/piscos/:id/publish                 → validation + review queue
POST /api/uploads/sign                       → signed upload target for photos
POST /api/scan                               → multipart image → { candidates:[{pisco, confidence}] }
POST /api/piscos/:id/reviews                 → rate + review (one per user, upsert)
PUT  /api/cellar/:piscoId                    → { state, personal_score, tasted_at }
DELETE /api/cellar/:piscoId
GET  /api/me                                 → session, role, producer memberships, cellar sets
```
Auth on mutations; rate-limit `/api/scan` (10/min/user) and review writes. All list endpoints cursor-paginated (25/page).

### Search
Start with Postgres: `search_vector` = weighted `to_tsvector('spanish', name || producer || varieties || notes)` + `pg_trgm` for fuzzy names, facet counts via `GROUP BY` on a materialised view refreshed on publish. Move to Typesense/Meilisearch only if facet latency exceeds ~150 ms.

### Label scanning
1. Client uploads a frame to `/api/scan`.
2. Server computes a perceptual hash and compares against stored label hashes (fast path, handles known SKUs).
3. In parallel run OCR (Google Cloud Vision or Tesseract in a background function); match bodega/variety/style tokens against the catalogue for the fallback path.
4. Return ranked candidates with confidence; store the scan for later tuning. Aim <1.5 s p95 for the hash path; OCR can return asynchronously.

### Jobs
Nightly: recompute `avg_rating`/`ratings_count`, refresh facet views, re-scrape price listings, expire stale stock flags. On publish: generate image derivatives (200/600/1200 px, WebP + JPEG), compute label hash, reindex.

### Non-functional
GDPR-style data export/delete for users; age gate on first launch (alcohol content, 18+); moderation queue for reviews and producer claims; audit trail on producer edits; image EXIF stripping; signed, short-lived upload URLs; Spanish-first error copy.

---

## Deployment on Netlify

Recommended stack: **Astro or Next.js (SSR adapter) or Vite + React SPA** for the front end, **Netlify Functions** for the API, **Neon Postgres** (Netlify DB) for data, **Netlify Blobs** (or Cloudinary/S3) for images, **Netlify Image CDN** for derivatives, **Netlify Identity or Supabase Auth/Clerk** for auth.

```
/
├─ src/                 # app (routes, components, themes)
├─ netlify/functions/    # api handlers: piscos, facets, producers, scan, reviews, cellar, uploads-sign
├─ netlify/edge-functions/  # locale + theme cookie, age gate redirect
├─ db/migrations/        # SQL migrations (drizzle/prisma/knex)
└─ netlify.toml
```

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[functions]
  node_bundler = "esbuild"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

Env vars (Netlify UI → Site configuration → Environment): `DATABASE_URL`, `AUTH_SECRET`, OAuth client id/secret pairs, `BLOBS_STORE`, `VISION_API_KEY`, `SENTRY_DSN`. Use deploy contexts so preview builds hit a branch database (Neon branching).

Notes and limits: Netlify Functions are stateless with a 10 s default timeout (26 s background) — run OCR as a **background function** and poll; use **scheduled functions** for the nightly jobs; keep DB access behind a pooled connection (Neon serverless driver) because each invocation is a fresh process; serve images through the Netlify Image CDN (`/.netlify/images?url=…&w=600&fit=cover`) rather than resizing at request time. If you prefer a single managed backend instead of functions, Supabase (Postgres + Auth + Storage + Edge Functions) also fronts cleanly from Netlify — the front end then deploys as a static SPA.

---

## Assets

- `Pisconauta App.dc.html` — the design canvas (all screens).
- `ios-frame.jsx`, `browser-window.jsx`, `support.js` — prototype scaffolding (device/browser chrome and the runtime the canvas needs to open). **Not** production code.
- `uploads/quebhda.jpg`, `uploads/itapremhe.jpg`, `uploads/mosc.jpg`, `uploads/ai_cabsauv_petverd.jpg` — client-supplied placeholder photography used in the mocks. Production needs per-SKU 3:4 bottle shots on neutral grounds plus one bodega cover per producer; the last file is a wine bottle and is used only as a cropped vineyard texture on the splash — replace it.
- `screenshots/` — rendered PNGs of the design (see below).
- Fonts: Google Fonts — Cormorant Garamond (300, 400, 500, 600 + italics), Archivo (300–600), IBM Plex Mono (400, 500). Self-host with `font-display: swap` in production.
- Motif SVGs are described under "Motifs" — rebuild them as components.

## Files in this bundle

```
design_handoff_pisconauta/
├─ README.md                    ← this document
├─ Pisconauta App.dc.html       ← design canvas (open in a browser)
├─ ios-frame.jsx
├─ browser-window.jsx
├─ support.js
├─ uploads/…                    ← placeholder photography
└─ screenshots/
   ├─ 01-ficha-dark.png         ← 1a pisco detail, dark standard theme
   ├─ 02-ficha-light.png        ← 1b pisco detail, light theme
   ├─ 03-core-screens.png       ← splash, onboarding, discover, search, scan, bodega, add-pisco, Mi Cava
   └─ 04-web-catalogue.png      ← desktop catalogue
```

## Suggested build order

1. Schema + seed taxonomy (regions, varieties, tasting-note terms) and auth with the two roles.
2. Ficha (detail) read path end to end, dark theme + tokens + motif components.
3. Discover and Search with facets.
4. Producer: bodega claim, add-a-pisco wizard, photo upload, review queue.
5. Cellar, ratings and reviews.
6. Label scan (hash path first, OCR fallback second).
7. Light theme, desktop catalogue, i18n pass.
