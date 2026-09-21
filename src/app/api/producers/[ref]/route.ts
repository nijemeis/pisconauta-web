import { db } from "@/lib/db";
import { forbidden, notFound, requireUser, route } from "@/lib/api";
import { canEditProducer, getUser } from "@/lib/auth";
import { getProducer } from "@/lib/catalog";
import { producerInput } from "@/lib/producer-input";

type P = { ref: string };

/** `?manage=1` returns drafts and private fields to members of the bodega. */
export const GET = route<P>(async (req, { ref }) => {
  const manage = new URL(req.url).searchParams.get("manage") === "1";
  if (manage) {
    const user = await getUser();
    const full = user ? await getProducer(ref, { includeDrafts: true }) : null;
    if (!full || !(await canEditProducer(user!, full.id))) throw notFound("Bodega");
    return full;
  }
  const producer = await getProducer(ref);
  if (!producer) throw notFound("Bodega");
  return producer;
});

export const PATCH = route<P>(async (req, { ref }) => {
  const user = await requireUser("producer");
  const before = await db.producer.findFirst({ where: { OR: [{ id: ref }, { slug: ref }] } });
  if (!before) throw notFound("Bodega");
  if (!(await canEditProducer(user, before.id))) throw forbidden();
  const { regionSlug, ...data } = producerInput.partial().parse(await req.json());
  const region = regionSlug ? await db.region.findUnique({ where: { slug: regionSlug } }) : undefined;
  await db.producer.update({
    where: { id: before.id },
    data: { ...data, website: data.website === "" ? null : data.website, ruc: data.ruc === "" ? null : data.ruc, contactEmail: data.contactEmail === "" ? null : data.contactEmail, regionId: regionSlug === undefined ? undefined : region?.id ?? null },
  });
  await db.auditLog.create({ data: { actorId: user.id, action: "producer.update", entity: "producer", entityId: before.id, before: JSON.parse(JSON.stringify(before)), after: JSON.parse(JSON.stringify(data)) } });
  return getProducer(before.id, { includeDrafts: true });
});
