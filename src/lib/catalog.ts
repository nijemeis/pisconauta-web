import "server-only";
import { Prisma, type PiscoStyle } from "@prisma/client";
import { db } from "./db";
import { forget } from "./api";
import { getRates, toPenCents } from "./rates";
import { mediaUrl } from "./storage";
import type { Facets, PiscoCard, PiscoDetail, ProducerCard, ProducerDetail, SearchParams, SearchResult } from "./types";

/** 24 fills the 4-, 3- and 2-column grids evenly. */
export const PAGE_SIZE = 24;
const STYLES: PiscoStyle[] = ["puro", "acholado", "mosto_verde"];

const num = (d: Prisma.Decimal | null | undefined) => (d == null ? null : Number(d));

const cardInclude = {
  producer: { select: { slug: true, name: true } },
  region: { select: { slug: true, name: true } },
  varieties: { include: { variety: { select: { slug: true, name: true } } } },
  photos: { where: { kind: "bottle" as const }, orderBy: [{ isPrimary: "desc" as const }, { sort: "asc" as const }], take: 1 },
} satisfies Prisma.PiscoInclude;

type CardRow = Prisma.PiscoGetPayload<{ include: typeof cardInclude }>;

export function toCard(p: CardRow): PiscoCard {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    style: p.style,
    vintage: p.vintage,
    abvPct: num(p.abvPct),
    bottleSizeMl: p.bottleSizeMl,
    avgRating: num(p.avgRating),
    ratingsCount: p.ratingsCount,
    minPriceCents: p.minPriceCents,
    featured: p.featured,
    status: p.status,
    reviewNote: p.reviewNote,
    photo: mediaUrl(p.photos[0]?.storageKey),
    producer: p.producer,
    region: p.region,
    valley: p.valley,
    varieties: p.varieties.map((v) => v.variety.name),
  };
}

/** Parses the public query-string contract (?q=&style=&variety=&region=&abv_min=…). */
export function parseSearch(sp: URLSearchParams): SearchParams {
  const list = (k: string) => sp.getAll(k).flatMap((v) => v.split(",")).map((v) => v.trim()).filter(Boolean);
  const n = (k: string) => (sp.get(k) && !Number.isNaN(Number(sp.get(k))) ? Number(sp.get(k)) : undefined);
  const sort = sp.get("sort");
  return {
    q: sp.get("q")?.trim() || undefined,
    style: list("style").map((s) => s.replace(/-/g, "_")).filter((s): s is PiscoStyle => (STYLES as string[]).includes(s)),
    variety: list("variety"),
    region: list("region"),
    abvMin: n("abv_min"),
    abvMax: n("abv_max"),
    priceMax: n("price_max"),
    ratingMin: n("rating_min"),
    vintage: n("vintage"),
    sort: sort === "new" || sort === "price" || sort === "name" ? sort : "rating",
    cursor: sp.get("cursor") || undefined,
  };
}

/** Accent-insensitive substring + trigram match over the denormalised search text. */
async function idsForQuery(q: string): Promise<string[]> {
  const rows = await db.$queryRaw<{ id: string }[]>`
    SELECT id FROM "Pisco"
    WHERE status = 'published'
      AND (f_unaccent(lower("searchText")) LIKE '%' || f_unaccent(lower(${q})) || '%'
           OR word_similarity(f_unaccent(lower(${q})), f_unaccent(lower("searchText"))) > 0.45)
    ORDER BY word_similarity(f_unaccent(lower(${q})), f_unaccent(lower("searchText"))) DESC
    LIMIT 500`;
  return rows.map((r) => r.id);
}

type FacetKey = "style" | "variety" | "region";

function buildWhere(p: SearchParams, ids: string[] | null, skip?: FacetKey): Prisma.PiscoWhereInput {
  const where: Prisma.PiscoWhereInput = { status: "published" };
  if (ids) where.id = { in: ids };
  if (p.style.length && skip !== "style") where.style = { in: p.style };
  if (p.variety.length && skip !== "variety") where.varieties = { some: { variety: { slug: { in: p.variety } } } };
  if (p.region.length && skip !== "region") where.region = { slug: { in: p.region } };
  if (p.abvMin != null || p.abvMax != null) where.abvPct = { gte: p.abvMin, lte: p.abvMax };
  if (p.priceMax != null) where.minPriceCents = { lte: Math.round(p.priceMax * 100) };
  if (p.ratingMin != null) where.avgRating = { gte: p.ratingMin };
  if (p.vintage != null) where.vintage = p.vintage;
  return where;
}

const ORDER: Record<SearchParams["sort"], Prisma.PiscoOrderByWithRelationInput[]> = {
  rating: [{ avgRating: { sort: "desc", nulls: "last" } }, { ratingsCount: "desc" }, { id: "asc" }],
  new: [{ publishedAt: "desc" }, { id: "asc" }],
  price: [{ minPriceCents: { sort: "asc", nulls: "last" } }, { id: "asc" }],
  name: [{ name: "asc" }, { id: "asc" }],
};

export async function searchPiscos(p: SearchParams): Promise<SearchResult> {
  const ids = p.q ? await idsForQuery(p.q) : null;
  const where = buildWhere(p, ids);
  const offset = p.cursor ? Math.max(0, parseInt(Buffer.from(p.cursor, "base64url").toString(), 10) || 0) : 0;
  const [rows, total, producers] = await Promise.all([
    db.pisco.findMany({ where, include: cardInclude, orderBy: ORDER[p.sort], skip: offset, take: PAGE_SIZE + 1 }),
    db.pisco.count({ where }),
    db.pisco.groupBy({ by: ["producerId"], where }),
  ]);
  const more = rows.length > PAGE_SIZE;
  return {
    items: rows.slice(0, PAGE_SIZE).map(toCard),
    total,
    producerCount: producers.length,
    nextCursor: more ? Buffer.from(String(offset + PAGE_SIZE)).toString("base64url") : null,
  };
}

/** Each facet is counted with its own filter lifted, so options never zero each other out. */
export async function facets(p: SearchParams): Promise<Facets> {
  const ids = p.q ? await idsForQuery(p.q) : null;
  const [styles, regionRows, varietyRows, regions, varieties, abv] = await Promise.all([
    db.pisco.groupBy({ by: ["style"], where: buildWhere(p, ids, "style"), _count: true }),
    db.pisco.groupBy({ by: ["regionId"], where: buildWhere(p, ids, "region"), _count: true }),
    db.piscoVariety.groupBy({ by: ["varietyId"], where: { pisco: buildWhere(p, ids, "variety") }, _count: true }),
    db.region.findMany({ orderBy: { sort: "asc" } }),
    db.variety.findMany({ orderBy: { sort: "asc" } }),
    db.pisco.aggregate({ where: { status: "published" }, _min: { abvPct: true }, _max: { abvPct: true } }),
  ]);
  return {
    style: STYLES.map((s) => ({ value: s, count: styles.find((r) => r.style === s)?._count ?? 0 })),
    region: regions.map((r) => ({ value: r.slug, label: r.name, count: regionRows.find((x) => x.regionId === r.id)?._count ?? 0 })),
    variety: varieties.map((v) => ({ value: v.slug, label: v.name, count: varietyRows.find((x) => x.varietyId === v.id)?._count ?? 0 })),
    abv: { min: Math.floor(num(abv._min.abvPct) ?? 38), max: Math.ceil(num(abv._max.abvPct) ?? 48) },
  };
}

export async function getPisco(ref: string, opts: { includeUnpublished?: boolean } = {}): Promise<PiscoDetail | null> {
  const p = await db.pisco.findFirst({
    where: { OR: [{ slug: ref }, { id: ref }], ...(opts.includeUnpublished ? {} : { status: "published" }) },
    include: {
      ...cardInclude,
      photos: { orderBy: [{ isPrimary: "desc" }, { sort: "asc" }] },
      producer: { select: { id: true, slug: true, name: true, crestInitials: true, valley: true, status: true } },
      notes: { include: { term: true }, orderBy: { votes: "desc" } },
      flavours: true,
      awards: { orderBy: [{ year: "desc" }] },
      prices: { include: { retailer: true }, orderBy: { priceCents: "asc" } },
    },
  });
  if (!p) return null;

  const mainVariety = p.varieties[0];
  const [siblings, rank, crit] = await Promise.all([
    db.pisco.findMany({
      where: { producerId: p.producerId, status: "published", id: { not: p.id } },
      include: cardInclude,
      orderBy: ORDER.rating,
      take: 6,
    }),
    // Ranking within the bottle's lead variety, by average rating.
    mainVariety && p.avgRating != null
      ? db.pisco.count({
          where: { status: "published", avgRating: { gt: p.avgRating }, varieties: { some: { varietyId: mainVariety.varietyId } } },
        })
      : Promise.resolve(null),
    db.review.aggregate({
      where: { piscoId: p.id, status: "visible", aroma: { not: null } },
      _avg: { aroma: true, sabor: true, cuerpo: true, final: true, equilibrio: true },
      _count: true,
    }),
  ]);
  const r1 = (n: number | null) => Math.round((n ?? 0) * 10) / 10;
  const rates = await getRates();

  return {
    ...toCard({ ...p, photos: p.photos.filter((ph) => ph.kind === "bottle").slice(0, 1) }),
    producerId: p.producerId,
    description: p.description,
    restMonths: p.restMonths,
    stillType: p.stillType,
    distillations: p.distillations,
    varietyShares: p.varieties.map((v) => ({ slug: v.variety.slug, name: v.variety.name, sharePct: v.sharePct })),
    photos: p.photos.map((ph) => ({ id: ph.id, key: ph.storageKey, url: mediaUrl(ph.storageKey)!, kind: ph.kind, isPrimary: ph.isPrimary, phash: ph.phash })),
    notes: p.notes.map((n) => ({ id: n.termId, es: n.term.termEs, en: n.term.termEn, family: n.term.family })),
    flavours: p.flavours.map((f) => ({ axis: f.axis, value: Number(f.value) })),
    awards: p.awards.map((a) => ({ id: a.id, competition: a.competition, level: a.level, year: a.year, sourceUrl: a.sourceUrl })),
    // Cheapest first, comparing every listing in soles.
    prices: [...p.prices].sort((a, b) => toPenCents(a.priceCents, a.currency, rates) - toPenCents(b.priceCents, b.currency, rates)).map((l) => ({
      id: l.id, retailer: l.retailer.name, kind: l.retailer.kind, priceCents: l.priceCents, currency: l.currency,
      url: l.url ?? l.retailer.website, address: l.retailer.address, city: l.retailer.city || null, lat: l.retailer.lat, lng: l.retailer.lng,
      inStock: l.inStock, source: l.source, addedById: l.addedById, updatedAt: l.updatedAt.toISOString(),
    })),
    criteria: crit._count
      ? { count: crit._count, averages: { aroma: r1(crit._avg.aroma), sabor: r1(crit._avg.sabor), cuerpo: r1(crit._avg.cuerpo), final: r1(crit._avg.final), equilibrio: r1(crit._avg.equilibrio) } }
      : null,
    ranking: rank != null && mainVariety ? { position: rank + 1, variety: mainVariety.variety.name } : null,
    producerInfo: { ...p.producer, verified: p.producer.status === "verified" },
    siblings: siblings.map(toCard),
  };
}

type ProducerRow = Prisma.ProducerGetPayload<{ include: { region: true } }>;

export function toProducerCard(b: ProducerRow): ProducerCard {
  return {
    id: b.id,
    slug: b.slug,
    name: b.name,
    foundedYear: b.foundedYear,
    region: b.region ? { slug: b.region.slug, name: b.region.name } : null,
    valley: b.valley,
    crestInitials: b.crestInitials ?? initials(b.name),
    cover: mediaUrl(b.coverPhotoKey),
    logo: mediaUrl(b.logoPhotoKey),
    verified: b.status === "verified",
    status: b.status,
    avgRating: num(b.avgRating),
    piscoCount: b.piscoCount,
    medalCount: b.medalCount,
  };
}

const FILLER = new Set(["de", "del", "la", "las", "los", "el", "y", "e", "of", "the", "and", "da", "do", "dos", "das", "bodega", "hacienda", "destileria", "destilería", "casa", "viña", "vina"]);
/** "Spirit of the Incas" → SI, "Bodega Cerro Lúcumo" → CL: first letters of the meaningful words. */
export const initials = (name: string) => {
  const words = name.split(/\s+/).filter((w) => w && !FILLER.has(w.toLowerCase()));
  return (words.length ? words : name.split(/\s+/)).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
};

export async function listProducers(region?: string): Promise<ProducerCard[]> {
  const rows = await db.producer.findMany({
    where: { status: "verified", ...(region ? { region: { slug: region } } : {}) },
    include: { region: true },
    orderBy: [{ piscoCount: "desc" }, { name: "asc" }],
  });
  return rows.map(toProducerCard);
}

export async function getProducer(ref: string, opts: { includeDrafts?: boolean } = {}): Promise<ProducerDetail | null> {
  const b = await db.producer.findFirst({ where: { OR: [{ slug: ref }, { id: ref }] }, include: { region: true } });
  if (!b) return null;
  if (b.status !== "verified" && !opts.includeDrafts) return null;
  const piscos = await db.pisco.findMany({
    where: { producerId: b.id, ...(opts.includeDrafts ? { status: { not: "archived" } } : { status: "published" }) },
    include: cardInclude,
    orderBy: opts.includeDrafts ? [{ updatedAt: "desc" }] : ORDER.rating,
  });
  return {
    ...toProducerCard(b),
    description: b.description,
    history: b.history,
    visitInfo: b.visitInfo,
    website: b.website,
    contactEmail: opts.includeDrafts ? b.contactEmail : null,
    contactPhone: opts.includeDrafts ? b.contactPhone : null,
    ruc: opts.includeDrafts ? b.ruc : null,
    piscos: piscos.map(toCard),
  };
}

/** Editorial home: a daily pick (stable per day), the D.O. regions, and a Mosto Verde rail. */
export async function discover() {
  const [pool, regions, mostoVerde, newest] = await Promise.all([
    db.pisco.findMany({ where: { status: "published", description: { not: null } }, select: { id: true }, orderBy: { id: "asc" } }),
    db.region.findMany({ orderBy: { sort: "asc" } }),
    db.pisco.findMany({ where: { status: "published", style: "mosto_verde" }, include: cardInclude, orderBy: ORDER.rating, take: 10 }),
    db.pisco.findMany({ where: { status: "published" }, include: cardInclude, orderBy: ORDER.new, take: 10 }),
  ]);
  const day = Math.floor(Date.now() / 86400_000);
  const pick = pool.length ? await getPisco(pool[day % pool.length].id) : null;
  return {
    cataDelDia: pick,
    regions: regions.map((r) => ({ slug: r.slug, name: r.name, valleys: r.valleys as string[] })),
    mostoVerde: mostoVerde.map(toCard),
    newest: newest.map(toCard),
  };
}

/** Keeps the denormalised columns (search text, min price, ratings, bodega stats) in step. */
export async function reindexPisco(piscoId: string) {
  forget("discover"); forget("facets:"); forget("search:"); forget("pisco:");
  const p = await db.pisco.findUnique({
    where: { id: piscoId },
    include: {
      producer: true,
      region: true,
      varieties: { include: { variety: true } },
      notes: { include: { term: true } },
      prices: { where: { inStock: true } },
    },
  });
  if (!p) return;
  const rates = await getRates();
  const agg = await db.review.aggregate({ where: { piscoId, status: "visible" }, _avg: { score10: true }, _count: true });
  const searchText = [
    p.name, p.producer.name, p.style?.replace("_", " "), p.region?.name, p.valley, p.vintage,
    ...p.varieties.map((v) => v.variety.name),
    ...p.notes.flatMap((n) => [n.term.termEs, n.term.termEn]),
  ].filter(Boolean).join(" ");
  await db.pisco.update({
    where: { id: piscoId },
    data: {
      searchText,
      // Always in PEN cents; euro/dollar listings are converted at the weekly rate.
      minPriceCents: p.prices.length ? Math.min(...p.prices.map((l) => toPenCents(l.priceCents, l.currency, rates))) : null,
      // Seeded catalogue ratings stand until real reviews exist.
      ...(agg._count ? { avgRating: (agg._avg.score10 ?? 0) / 10, ratingsCount: agg._count } : {}),
    },
  });
  await reindexProducer(p.producerId);
}

export async function reindexProducer(producerId: string) {
  const [agg, medals] = await Promise.all([
    db.pisco.aggregate({ where: { producerId, status: "published" }, _avg: { avgRating: true }, _count: true }),
    db.award.count({ where: { pisco: { producerId, status: "published" } } }),
  ]);
  await db.producer.update({
    where: { id: producerId },
    data: { piscoCount: agg._count, avgRating: agg._avg.avgRating, medalCount: medals },
  });
}
