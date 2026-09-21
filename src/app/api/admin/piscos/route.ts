import type { Prisma, PiscoStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser, route } from "@/lib/api";
import { toCard } from "@/lib/catalog";

const STATUSES = ["draft", "in_review", "published", "archived"];

/** All bottles in any state; ?status= ?producer= ?q= narrow it down. */
export const GET = route(async (req) => {
  await requireUser("admin");
  const sp = new URL(req.url).searchParams;
  const where: Prisma.PiscoWhereInput = {};
  if (STATUSES.includes(sp.get("status") ?? "")) where.status = sp.get("status") as PiscoStatus;
  if (sp.get("producer")) where.producerId = sp.get("producer")!;
  const q = sp.get("q")?.trim();
  if (q) where.OR = [{ name: { contains: q, mode: "insensitive" } }, { producer: { name: { contains: q, mode: "insensitive" } } }];
  const rows = await db.pisco.findMany({
    where,
    include: {
      producer: { select: { id: true, slug: true, name: true } },
      region: { select: { slug: true, name: true } },
      varieties: { include: { variety: { select: { slug: true, name: true } } } },
      photos: { where: { kind: "bottle" }, orderBy: [{ isPrimary: "desc" }, { sort: "asc" }], take: 1 },
    },
    orderBy: [{ updatedAt: "desc" }],
    take: 500,
  });
  return { items: rows.map((r) => ({ ...toCard(r), producerId: r.producer.id, updatedAt: r.updatedAt.toISOString() })) };
});
