import { db } from "@/lib/db";
import { requireUser, route } from "@/lib/api";
import { toProducerCard } from "@/lib/catalog";

/** Every bodega regardless of status, with who manages it and how many bottles sit in each state. */
export const GET = route(async () => {
  await requireUser("admin");
  const rows = await db.producer.findMany({
    include: {
      region: true,
      members: { include: { user: { select: { email: true, displayName: true } } } },
      piscos: { select: { status: true } },
    },
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });
  return {
    items: rows.map((p) => ({
      ...toProducerCard(p),
      ruc: p.ruc, website: p.website, contactEmail: p.contactEmail, contactPhone: p.contactPhone,
      createdAt: p.createdAt.toISOString(),
      members: p.members.map((m) => ({ ...m.user, role: m.role })),
      counts: {
        published: p.piscos.filter((x) => x.status === "published").length,
        in_review: p.piscos.filter((x) => x.status === "in_review").length,
        draft: p.piscos.filter((x) => x.status === "draft").length,
      },
    })),
  };
});
