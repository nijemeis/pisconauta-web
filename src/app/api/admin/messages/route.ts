import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser, route } from "@/lib/api";

export const GET = route(async () => {
  await requireUser("admin");
  return { items: await db.contactMessage.findMany({ orderBy: [{ handled: "asc" }, { createdAt: "desc" }], take: 200 }) };
});

export const POST = route(async (req) => {
  await requireUser("admin");
  const { id, handled } = z.object({ id: z.string(), handled: z.boolean() }).parse(await req.json());
  await db.contactMessage.update({ where: { id }, data: { handled } });
});
