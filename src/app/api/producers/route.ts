import { db } from "@/lib/db";
import { requireUser, route } from "@/lib/api";
import { getProducer, listProducers } from "@/lib/catalog";
import { uniqueSlug } from "@/lib/slug";
import { producerInput } from "@/lib/producer-input";

export const GET = route(async (req) => ({ items: await listProducers(new URL(req.url).searchParams.get("region") ?? undefined) }), { cache: true });


/** Claim/create a bodega. It starts `pending`; an admin verifies it before bottles can go public. */
export const POST = route(async (req) => {
  // Any signed-in account can register a bodega; an aficionado becomes a producer by doing so.
  const user = await requireUser();
  const { regionSlug, ...data } = producerInput.parse(await req.json());
  const region = regionSlug ? await db.region.findUnique({ where: { slug: regionSlug } }) : null;
  const slug = await uniqueSlug(data.name, async (s) => !!(await db.producer.findUnique({ where: { slug: s } })));
  const producer = await db.producer.create({
    data: {
      ...data,
      website: data.website || null, ruc: data.ruc || null, contactEmail: data.contactEmail || (user.role === "admin" ? null : user.email),
      slug, regionId: region?.id,
      // Admins register bodegas on a producer's behalf and assign the owner later from /admin.
      ...(user.role === "admin" ? {} : { members: { create: { userId: user.id, role: "owner" as const } } }),
    },
  });
  if (user.role === "enthusiast") await db.user.update({ where: { id: user.id }, data: { role: "producer" } });
  await db.auditLog.create({ data: { actorId: user.id, action: "producer.claim", entity: "producer", entityId: producer.id } });
  return getProducer(producer.id, { includeDrafts: true });
});
