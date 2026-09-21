import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser, route } from "@/lib/api";
import { reindexPisco } from "@/lib/catalog";

const body = z.object({ decision: z.enum(["publish", "return"]), note: z.string().trim().max(600).nullish() });

export const POST = route<{ id: string }>(async (req, { id }) => {
  const admin = await requireUser("admin");
  const { decision, note } = body.parse(await req.json());
  await db.pisco.update({
    where: { id },
    data: decision === "publish" ? { status: "published", publishedAt: new Date(), reviewNote: null } : { status: "draft", reviewNote: note ?? "Revisa los datos y vuelve a enviar." },
  });
  await db.auditLog.create({ data: { actorId: admin.id, action: `pisco.${decision}`, entity: "pisco", entityId: id, after: { note } } });
  await reindexPisco(id);
});
