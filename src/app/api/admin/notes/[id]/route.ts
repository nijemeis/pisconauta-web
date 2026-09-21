import { z } from "zod";
import { db } from "@/lib/db";
import { ApiError, notFound, requireUser, route } from "@/lib/api";
import { reindexPisco } from "@/lib/catalog";

type P = { id: string };
const FAMILIES = ["fruta", "floral", "herbal", "especia", "mineral", "dulce"] as const;
const body = z.object({
  es: z.string().trim().min(2, "Escribe la nota en español.").max(40),
  en: z.string().trim().min(2, "Escribe la nota en inglés.").max(40),
  family: z.enum(FAMILIES),
});

/** Search text embeds the note names, so bottles using the term are reindexed after a change. */
async function reindexUsers(termId: string) {
  const users = await db.piscoTastingNote.findMany({ where: { termId }, select: { piscoId: true } });
  return users.map((u) => u.piscoId);
}

export const PATCH = route<P>(async (req, { id }) => {
  const admin = await requireUser("admin");
  const before = await db.tastingNoteTerm.findUnique({ where: { id } });
  if (!before) throw notFound("Nota");
  const d = body.parse(await req.json());
  if (await db.tastingNoteTerm.findFirst({ where: { id: { not: id }, termEs: { equals: d.es, mode: "insensitive" } } })) {
    throw new ApiError(409, "note_exists", "Esa nota de cata ya existe.", { es: "Ya existe" });
  }
  await db.tastingNoteTerm.update({ where: { id }, data: { termEs: d.es, termEn: d.en, family: d.family } });
  await db.auditLog.create({ data: { actorId: admin.id, action: "note.update", entity: "note", entityId: id, before: { es: before.termEs, en: before.termEn, family: before.family }, after: d } });
  for (const piscoId of await reindexUsers(id)) await reindexPisco(piscoId);
});

/** Removing a term also takes it off every bottle that used it. */
export const DELETE = route<P>(async (_req, { id }) => {
  const admin = await requireUser("admin");
  const before = await db.tastingNoteTerm.findUnique({ where: { id } });
  if (!before) throw notFound("Nota");
  const affected = await reindexUsers(id);
  await db.$transaction([
    db.piscoTastingNote.deleteMany({ where: { termId: id } }),
    db.tastingNoteTerm.delete({ where: { id } }),
  ]);
  await db.auditLog.create({ data: { actorId: admin.id, action: "note.delete", entity: "note", entityId: id, before: { es: before.termEs, en: before.termEn, family: before.family, uses: affected.length } } });
  for (const piscoId of affected) await reindexPisco(piscoId);
  return { removedFrom: affected.length };
});
