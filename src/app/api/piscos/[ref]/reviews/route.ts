import { z } from "zod";
import { db } from "@/lib/db";
import { ApiError, notFound, rateLimit, requireUser, route } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { reindexPisco } from "@/lib/catalog";
import type { ReviewItem } from "@/lib/types";

type P = { ref: string };

const find = (ref: string) => db.pisco.findFirst({ where: { OR: [{ id: ref }, { slug: ref }], status: "published" }, select: { id: true } });

export const GET = route<P>(async (_req, { ref }) => {
  const pisco = await find(ref);
  if (!pisco) throw notFound("Pisco");
  const me = await getUser();
  const rows = await db.review.findMany({
    where: { piscoId: pisco.id, status: "visible" },
    include: { user: { select: { displayName: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return {
    items: rows.map((r): ReviewItem => ({
      id: r.id, score: r.score10 / 10, body: r.body,
      criteria: r.aroma && r.sabor && r.cuerpo && r.final && r.equilibrio ? { aroma: r.aroma, sabor: r.sabor, cuerpo: r.cuerpo, final: r.final, equilibrio: r.equilibrio } : null, createdAt: r.createdAt.toISOString(), author: r.user.displayName, mine: r.userId === me?.id,
    })),
  };
});

const star = z.number().int().min(1).max(5);
const body = z.object({
  /** Overall 1–5; ignored when `criteria` is sent (the mean of the five wins). */
  score: z.number().min(1).max(5).optional(),
  criteria: z.object({ aroma: star, sabor: star, cuerpo: star, final: star, equilibrio: star }).optional(),
  body: z.string().trim().max(1500).nullish(),
  noteIds: z.array(z.string()).max(12).optional(),
  tastedAt: z.string().datetime().optional(),
});

/** One review per user per bottle (upsert). Rating also files the bottle under CATADOS. */
export const POST = route<P>(async (req, { ref }) => {
  const user = await requireUser();
  rateLimit(`review:${user.id}`, 20);
  const pisco = await find(ref);
  if (!pisco) throw notFound("Pisco");
  const data = body.parse(await req.json());
  if (!data.criteria && data.score == null) throw new ApiError(422, "invalid", "Puntúa el pisco para guardar tu cata.", { score: "Requerido" });
  const c = data.criteria;
  const score10 = c ? Math.round(((c.aroma + c.sabor + c.cuerpo + c.final + c.equilibrio) / 5) * 10) : Math.round(data.score! * 10);
  const stars = c ?? { aroma: null, sabor: null, cuerpo: null, final: null, equilibrio: null };
  const key = { piscoId: pisco.id, userId: user.id };
  await db.$transaction([
    db.review.upsert({
      where: { piscoId_userId: key },
      update: { score10, ...stars, body: data.body ?? null, noteIds: data.noteIds ?? [] },
      create: { ...key, score10, ...stars, body: data.body ?? null, noteIds: data.noteIds ?? [] },
    }),
    db.cellarEntry.upsert({
      where: { userId_piscoId: key },
      update: { state: "tasted", personalScore10: score10, tastedAt: data.tastedAt ? new Date(data.tastedAt) : undefined },
      create: { ...key, state: "tasted", personalScore10: score10, tastedAt: data.tastedAt ? new Date(data.tastedAt) : new Date() },
    }),
  ]);
  await reindexPisco(pisco.id);
});
