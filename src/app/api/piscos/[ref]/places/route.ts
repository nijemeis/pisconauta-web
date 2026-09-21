import { z } from "zod";
import { db } from "@/lib/db";
import { ApiError, notFound, rateLimit, requireUser, route } from "@/lib/api";
import { canEditProducer } from "@/lib/auth";
import { getPisco, reindexPisco } from "@/lib/catalog";

const body = z.object({
  kind: z.enum(["store", "webshop"]),
  name: z.string().trim().min(2, "¿Cómo se llama la tienda?").max(120),
  price: z.number().min(1, "Indica el precio.").max(100000),
  currency: z.enum(["PEN", "USD", "EUR"]).default("PEN"),
  url: z.string().trim().url("Enlace no válido.").regex(/^https?:\/\//i, "El enlace debe empezar por http(s)://").max(500).nullish(),
  address: z.string().trim().max(200).nullish(),
  city: z.string().trim().max(80).nullish(),
  lat: z.number().min(-90).max(90).nullish(),
  lng: z.number().min(-180).max(180).nullish(),
});

/** "Lo encontré aquí": any signed-in taster can add where they saw the bottle and at what price. */
export const POST = route<{ ref: string }>(async (req, { ref }) => {
  const user = await requireUser();
  rateLimit(`place:${user.id}`, 10, 600_000);
  const pisco = await db.pisco.findFirst({ where: { OR: [{ id: ref }, { slug: ref }], status: "published" }, select: { id: true, producerId: true } });
  if (!pisco) throw notFound("Pisco");
  const d = body.parse(await req.json());
  if (d.kind === "webshop" && !d.url) throw new ApiError(422, "invalid", "Añade el enlace de la tienda online.", { url: "Requerido" });
  if (d.kind === "store" && !d.address && !d.city) throw new ApiError(422, "invalid", "Indica la dirección o la ciudad de la tienda.", { address: "Requerido" });

  const city = d.kind === "store" ? d.city ?? "" : "";
  const place = { kind: d.kind, address: d.address ?? undefined, lat: d.lat ?? undefined, lng: d.lng ?? undefined, website: d.kind === "webshop" && d.url ? new URL(d.url).origin : undefined };
  const retailer = await db.retailer.upsert({ where: { name_city: { name: d.name, city } }, update: place, create: { name: d.name, city, ...place } });

  const source = user.role === "admin" ? "admin" : (await canEditProducer(user, pisco.producerId)) ? "producer" : "community";
  const fields = { priceCents: Math.round(d.price * 100), currency: d.currency, url: d.url ?? null, inStock: true, source, addedById: user.id } as const;
  await db.priceListing.upsert({
    where: { piscoId_retailerId: { piscoId: pisco.id, retailerId: retailer.id } },
    update: fields,
    create: { piscoId: pisco.id, retailerId: retailer.id, ...fields },
  });
  await reindexPisco(pisco.id);
  return { prices: (await getPisco(pisco.id))!.prices };
});
