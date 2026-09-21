import { z } from "zod";
import { db } from "@/lib/db";
import { notFound, requireUser, route } from "@/lib/api";

type P = { piscoId: string };

const body = z.object({
  state: z.enum(["tasted", "wishlist"]),
  personalScore: z.number().min(1).max(5).nullish(),
  tastedAt: z.string().datetime().nullish(),
  note: z.string().trim().max(1000).nullish(),
});

export const PUT = route<P>(async (req, { piscoId }) => {
  const user = await requireUser();
  const data = body.parse(await req.json());
  if (!(await db.pisco.findFirst({ where: { id: piscoId, status: "published" }, select: { id: true } }))) throw notFound("Pisco");
  const fields = {
    state: data.state,
    personalScore10: data.personalScore == null ? null : Math.round(data.personalScore * 10),
    tastedAt: data.tastedAt ? new Date(data.tastedAt) : data.state === "tasted" ? new Date() : null,
    note: data.note ?? null,
  };
  await db.cellarEntry.upsert({
    where: { userId_piscoId: { userId: user.id, piscoId } },
    update: fields,
    create: { userId: user.id, piscoId, ...fields },
  });
});

export const DELETE = route<P>(async (_req, { piscoId }) => {
  const user = await requireUser();
  await db.cellarEntry.deleteMany({ where: { userId: user.id, piscoId } });
});
