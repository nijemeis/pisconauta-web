import { z } from "zod";
import { db } from "@/lib/db";
import { ApiError, requireUser, route } from "@/lib/api";


const FAMILIES = ["fruta", "floral", "herbal", "especia", "mineral", "dulce"] as const;
const body = z.object({
  es: z.string().trim().min(2, "Escribe la nota en español.").max(40),
  en: z.string().trim().min(2, "Escribe la nota en inglés.").max(40),
  family: z.enum(FAMILIES),
});

/** Every tasting-note term with how many bottles use it. */
export const GET = route(async () => {
  await requireUser("admin");
  const rows = await db.tastingNoteTerm.findMany({ include: { _count: { select: { piscos: true } } }, orderBy: [{ family: "asc" }, { termEs: "asc" }] });
  return { items: rows.map((r) => ({ id: r.id, es: r.termEs, en: r.termEn, family: r.family, uses: r._count.piscos })) };
});

export const POST = route(async (req) => {
  const admin = await requireUser("admin");
  const d = body.parse(await req.json());
  if (await db.tastingNoteTerm.findFirst({ where: { termEs: { equals: d.es, mode: "insensitive" } } })) {
    throw new ApiError(409, "note_exists", "Esa nota de cata ya existe.", { es: "Ya existe" });
  }
  const row = await db.tastingNoteTerm.create({ data: { termEs: d.es, termEn: d.en, family: d.family } });
  await db.auditLog.create({ data: { actorId: admin.id, action: "note.create", entity: "note", entityId: row.id, after: d } });
  return { id: row.id };
});
