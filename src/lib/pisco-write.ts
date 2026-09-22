import "server-only";
import { z } from "zod";
import type { User } from "@prisma/client";
import { db } from "./db";
import { ApiError, forbidden, notFound } from "./api";
import { canEditProducer } from "./auth";
import { reindexPisco } from "./catalog";
import { uniqueSlug } from "./slug";

const AXES = ["cuerpo", "dulzor", "herbal", "citrico", "floral", "alcohol"] as const;

export const piscoInput = z.object({
  producerId: z.string().optional(),
  name: z.string().trim().max(120).optional(),
  style: z.enum(["puro", "acholado", "mosto_verde"]).nullish(),
  regionSlug: z.string().nullish(),
  valley: z.string().trim().max(80).nullish(),
  vintage: z.number().int().min(1950).max(new Date().getFullYear()).nullish(),
  abvPct: z.number().min(30).max(55).nullish(),
  bottleSizeMl: z.number().int().min(50).max(5000).nullish(),
  restMonths: z.number().int().min(0).max(240).nullish(),
  stillType: z.enum(["falca", "alambique_cobre", "otro"]).nullish(),
  distillations: z.number().int().min(1).max(5).nullish(),
  description: z.string().trim().max(2000).nullish(),
  varieties: z.array(z.object({ slug: z.string(), sharePct: z.number().int().min(1).max(100).nullish() })).max(8).optional(),
  noteIds: z.array(z.string()).max(12).optional(),
  flavours: z.array(z.object({ axis: z.enum(AXES), value: z.number().min(0).max(5) })).optional(),
  awards: z.array(z.object({
    competition: z.string().trim().min(2).max(160),
    level: z.enum(["gran_oro", "oro", "plata", "bronce"]),
    year: z.number().int().min(1950).max(new Date().getFullYear()),
    sourceUrl: z.string().url().nullish(),
  })).max(30).optional(),
  photos: z.array(z.object({
    key: z.string().regex(/^piscos\/[\w-]+\.jpg$/),
    kind: z.enum(["bottle", "label", "lifestyle"]),
    width: z.number().int().optional(),
    height: z.number().int().optional(),
    phash: z.string().length(16).optional(),
  })).max(8).optional(),
  priceSoles: z.number().min(1).max(10000).nullish(),
});
export type PiscoInputData = z.infer<typeof piscoInput>;

const OWN_RETAILER = "Precio sugerido por la bodega";

export async function loadEditable(user: User, piscoId: string) {
  const pisco = await db.pisco.findUnique({ where: { id: piscoId } });
  if (!pisco) throw notFound("Pisco");
  if (!(await canEditProducer(user, pisco.producerId))) throw forbidden();
  return pisco;
}

/** Create (no id) or update a bottle. Relations passed in are replaced wholesale. */
export async function savePisco(user: User, data: PiscoInputData, piscoId?: string) {
  let producerId: string;
  if (piscoId) producerId = (await loadEditable(user, piscoId)).producerId;
  else {
    if (!data.producerId) throw new ApiError(422, "invalid", "Falta la bodega.", { producerId: "Requerido" });
    if (!(await canEditProducer(user, data.producerId))) throw forbidden();
    producerId = data.producerId;
  }

  const region = data.regionSlug ? await db.region.findUnique({ where: { slug: data.regionSlug } }) : undefined;
  const scalar = {
    name: data.name,
    style: data.style,
    regionId: data.regionSlug === undefined ? undefined : region?.id ?? null,
    valley: data.valley,
    vintage: data.vintage,
    abvPct: data.abvPct,
    bottleSizeMl: data.bottleSizeMl,
    restMonths: data.restMonths,
    stillType: data.stillType,
    distillations: data.distillations,
    description: data.description,
  };

  const id = await db.$transaction(async (tx) => {
    let id = piscoId;
    if (!id) {
      const name = data.name || "Nueva botella";
      const producer = await tx.producer.findUniqueOrThrow({ where: { id: producerId } });
      const slug = await uniqueSlug(`${name} ${producer.name}`, async (s) => !!(await tx.pisco.findUnique({ where: { slug: s } })));
      id = (await tx.pisco.create({ data: { ...scalar, name, slug, producerId } })).id;
    } else {
      const before = await tx.pisco.findUniqueOrThrow({ where: { id } });
      await tx.pisco.update({ where: { id }, data: scalar });
      await tx.auditLog.create({ data: { actorId: user.id, action: "pisco.update", entity: "pisco", entityId: id, before: JSON.parse(JSON.stringify(before)), after: JSON.parse(JSON.stringify(data)) } });
    }

    if (data.varieties) {
      const rows = await tx.variety.findMany({ where: { slug: { in: data.varieties.map((v) => v.slug) } } });
      await tx.piscoVariety.deleteMany({ where: { piscoId: id } });
      await tx.piscoVariety.createMany({
        data: data.varieties.flatMap((v) => {
          const row = rows.find((r) => r.slug === v.slug);
          return row ? [{ piscoId: id!, varietyId: row.id, sharePct: v.sharePct ?? null }] : [];
        }),
      });
    }
    if (data.noteIds) {
      await tx.piscoTastingNote.deleteMany({ where: { piscoId: id, addedBy: "producer" } });
      await tx.piscoTastingNote.createMany({ data: data.noteIds.map((termId) => ({ piscoId: id!, termId })), skipDuplicates: true });
    }
    if (data.flavours) {
      await tx.flavourProfile.deleteMany({ where: { piscoId: id } });
      await tx.flavourProfile.createMany({ data: data.flavours.map((f) => ({ piscoId: id!, ...f })) });
    }
    if (data.awards) {
      await tx.award.deleteMany({ where: { piscoId: id } });
      await tx.award.createMany({ data: data.awards.map((a) => ({ piscoId: id!, ...a, sourceUrl: a.sourceUrl ?? null })) });
    }
    if (data.photos) {
      // Clients may resend a kept photo by key only — carry its stored size and hash over.
      const kept = new Map((await tx.piscoPhoto.findMany({ where: { piscoId: id } })).map((ph) => [ph.storageKey, ph]));
      await tx.piscoPhoto.deleteMany({ where: { piscoId: id } });
      const firstBottle = data.photos.findIndex((p) => p.kind === "bottle");
      await tx.piscoPhoto.createMany({
        data: data.photos.map((p, i) => ({ piscoId: id!, storageKey: p.key, kind: p.kind, width: p.width ?? kept.get(p.key)?.width, height: p.height ?? kept.get(p.key)?.height, phash: p.phash ?? kept.get(p.key)?.phash, sort: i, isPrimary: i === firstBottle })),
      });
    }
    if (data.priceSoles !== undefined) {
      const retailer = await tx.retailer.upsert({ where: { name_city: { name: OWN_RETAILER, city: "" } }, update: {}, create: { name: OWN_RETAILER, kind: "webshop" } });
      if (data.priceSoles == null) await tx.priceListing.deleteMany({ where: { piscoId: id, retailerId: retailer.id } });
      else {
        const priceCents = Math.round(data.priceSoles * 100);
        await tx.priceListing.upsert({
          where: { piscoId_retailerId: { piscoId: id, retailerId: retailer.id } },
          update: { priceCents },
          create: { piscoId: id, retailerId: retailer.id, priceCents, source: "producer" },
        });
      }
    }
    return id;
  });

  await reindexPisco(id);
  return id;
}

/**
 * Publishes a bottle straight away — the bodega itself was verified by an admin, so its bottles need no
 * second review. Required: name, style, ≥1 variety, D.O., ABV 35–48, size and one bottle photo.
 */
export async function publishPisco(user: User, piscoId: string) {
  await loadEditable(user, piscoId);
  const p = await db.pisco.findUniqueOrThrow({ where: { id: piscoId }, include: { producer: true, varieties: true, photos: true } });
  if (p.producer.status !== "verified") {
    throw new ApiError(409, "producer_unverified", "Tu bodega aún no está verificada. Puedes guardar borradores mientras tanto.");
  }
  const fields: Record<string, string> = {};
  if (!p.name || p.name === "Nueva botella") fields.name = "Ponle nombre a la botella.";
  if (!p.style) fields.style = "Elige un estilo.";
  if (!p.varieties.length) fields.varieties = "Indica al menos una variedad.";
  if (p.style === "puro" && p.varieties.length > 1) fields.varieties = "Un pisco puro lleva una sola variedad.";
  if (!p.regionId) fields.regionSlug = "Elige la región con D.O.";
  const abv = p.abvPct == null ? null : Number(p.abvPct);
  if (abv == null || abv < 35 || abv > 48) fields.abvPct = "El grado alcohólico debe estar entre 35 y 48 %.";
  if (!p.bottleSizeMl) fields.bottleSizeMl = "Indica el tamaño de la botella.";
  if (!p.photos.some((ph) => ph.kind === "bottle")) fields.photos = "Sube al menos una foto de la botella.";
  if (Object.keys(fields).length) throw new ApiError(422, "invalid", "Faltan datos para publicar.", fields);

  await db.pisco.update({ where: { id: piscoId }, data: { status: "published", publishedAt: p.publishedAt ?? new Date(), reviewNote: null } });
  await db.auditLog.create({ data: { actorId: user.id, action: "pisco.publish", entity: "pisco", entityId: piscoId } });
  await reindexPisco(piscoId);
}
