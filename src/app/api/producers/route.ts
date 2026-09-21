import { db } from "@/lib/db";
import { requireUser, route } from "@/lib/api";
import { getProducer, initials, listProducers } from "@/lib/catalog";
import { uniqueSlug } from "@/lib/slug";
import { producerInput } from "@/lib/producer-input";

export const GET = route(async (req) => ({ items: await listProducers(new URL(req.url).searchParams.get("region") ?? undefined) }));


/** Claim/create a bodega. It starts `pending`; an admin verifies it before bottles can go public. */
export const POST = route(async (req) => {
  const user = await requireUser("producer");
  const { regionSlug, ...data } = producerInput.parse(await req.json());
  const region = regionSlug ? await db.region.findUnique({ where: { slug: regionSlug } }) : null;
  const slug = await uniqueSlug(data.name, async (s) => !!(await db.producer.findUnique({ where: { slug: s } })));
  const producer = await db.producer.create({
    data: {
      ...data,
      website: data.website || null, ruc: data.ruc || null, contactEmail: data.contactEmail || (user.role === "admin" ? null : user.email),
      slug, regionId: region?.id, crestInitials: initials(data.name),
      // Admins register bodegas on a producer's behalf and assign the owner later from /admin.
      ...(user.role === "admin" ? {} : { members: { create: { userId: user.id, role: "owner" as const } } }),
    },
  });
  await db.auditLog.create({ data: { actorId: user.id, action: "producer.claim", entity: "producer", entityId: producer.id } });
  return getProducer(producer.id, { includeDrafts: true });
});
