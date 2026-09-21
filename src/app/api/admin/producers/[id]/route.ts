import { z } from "zod";
import { db } from "@/lib/db";
import { ApiError, requireUser, route } from "@/lib/api";

const body = z.object({
  decision: z.enum(["verify", "reject", "unverify"]).optional(),
  /** Hand the bodega to an existing account (e.g. one the admin set up on the producer's behalf). */
  ownerEmail: z.string().trim().toLowerCase().email().optional(),
});

export const POST = route<{ id: string }>(async (req, { id }) => {
  const admin = await requireUser("admin");
  const { decision, ownerEmail } = body.parse(await req.json());
  if (decision) {
    await db.producer.update({
      where: { id },
      data: decision === "verify" ? { status: "verified", verifiedAt: new Date(), verifiedBy: admin.id }
        : { status: decision === "reject" ? "rejected" : "pending", verifiedAt: null, verifiedBy: null },
    });
    await db.auditLog.create({ data: { actorId: admin.id, action: `producer.${decision}`, entity: "producer", entityId: id } });
  }
  if (ownerEmail) {
    const user = await db.user.findUnique({ where: { email: ownerEmail } });
    if (!user) throw new ApiError(404, "not_found", "No hay ninguna cuenta con ese correo. Pídele que se registre primero.", { ownerEmail: "Cuenta no encontrada" });
    await db.producerMember.upsert({ where: { producerId_userId: { producerId: id, userId: user.id } }, update: { role: "owner" }, create: { producerId: id, userId: user.id, role: "owner" } });
    if (user.role === "enthusiast") await db.user.update({ where: { id: user.id }, data: { role: "producer" } });
    await db.auditLog.create({ data: { actorId: admin.id, action: "producer.assign_owner", entity: "producer", entityId: id, after: { ownerEmail } } });
  }
});
