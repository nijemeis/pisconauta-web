import { db } from "@/lib/db";
import { requireUser, route } from "@/lib/api";
import { toCard } from "@/lib/catalog";
import type { CellarItem, CellarPayload } from "@/lib/types";

const top = (values: (string | null | undefined)[]) => {
  const counts = new Map<string, number>();
  for (const v of values) if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
};

export const GET = route(async (): Promise<CellarPayload> => {
  const user = await requireUser();
  const rows = await db.cellarEntry.findMany({
    where: { userId: user.id },
    include: {
      pisco: {
        include: {
          producer: { select: { slug: true, name: true } },
          region: { select: { slug: true, name: true } },
          varieties: { include: { variety: { select: { slug: true, name: true } } } },
          photos: { where: { kind: "bottle" }, orderBy: [{ isPrimary: "desc" }, { sort: "asc" }], take: 1 },
        },
      },
    },
    orderBy: [{ tastedAt: "desc" }, { createdAt: "desc" }],
  });
  const items = rows.map((r): CellarItem => ({
    pisco: toCard(r.pisco),
    state: r.state,
    personalScore: r.personalScore10 == null ? null : r.personalScore10 / 10,
    tastedAt: r.tastedAt?.toISOString() ?? null,
    note: r.note,
  }));
  const tasted = items.filter((i) => i.state === "tasted");
  return {
    tasted,
    wishlist: items.filter((i) => i.state === "wishlist"),
    stats: {
      tastedCount: tasted.length,
      favouriteVariety: top(tasted.flatMap((i) => i.pisco.varieties)),
      topRegion: top(tasted.map((i) => i.pisco.region?.name)),
    },
  };
});
