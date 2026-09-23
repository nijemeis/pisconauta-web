import { db } from "@/lib/db";
import { memoize, route } from "@/lib/api";
import type { Taxonomy } from "@/lib/types";

export const GET = route((): Promise<Taxonomy> => memoize("taxonomy", 300_000, async () => {
  const [regions, varieties, terms] = await Promise.all([
    db.region.findMany({ orderBy: { sort: "asc" } }),
    db.variety.findMany({ orderBy: { sort: "asc" } }),
    db.tastingNoteTerm.findMany({ orderBy: [{ family: "asc" }, { termEs: "asc" }] }),
  ]);
  return {
    regions: regions.map((r) => ({ id: r.id, slug: r.slug, name: r.name, valleys: r.valleys as string[] })),
    varieties: varieties.map((v) => ({ id: v.id, slug: v.slug, name: v.name, aromatic: v.aromatic })),
    noteTerms: terms.map((t) => ({ id: t.id, es: t.termEs, en: t.termEn, family: t.family })),
  };
}), { cache: true });
