import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit, route } from "@/lib/api";
import { getUser } from "@/lib/auth";

const body = z.object({
  name: z.string().trim().min(2).max(160),
  producerName: z.string().trim().max(160).nullish(),
  photoKey: z.string().nullish(),
  note: z.string().trim().max(600).nullish(),
});

/** "Sugerir botella" — queued for admins when a scan or search finds nothing. */
export const POST = route(async (req) => {
  const user = await getUser();
  rateLimit(`suggest:${user?.id ?? "anon"}`, 5);
  await db.bottleSuggestion.create({ data: { ...body.parse(await req.json()), userId: user?.id } });
});
