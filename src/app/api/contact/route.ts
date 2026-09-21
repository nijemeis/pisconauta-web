import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit, route } from "@/lib/api";
import { getUser } from "@/lib/auth";

const body = z.object({
  name: z.string().trim().min(2, "Dinos tu nombre.").max(80),
  email: z.string().trim().toLowerCase().email("Correo no válido."),
  topic: z.enum(["general", "productor", "datos", "prensa", "error"]).default("general"),
  message: z.string().trim().min(10, "Cuéntanos un poco más.").max(3000),
  /** Honeypot — real people leave it empty. */
  website: z.string().max(0).optional(),
});

export const POST = route(async (req) => {
  rateLimit(`contact:${req.headers.get("x-forwarded-for") ?? "local"}`, 5, 600_000);
  const { website: _trap, ...data } = body.parse(await req.json());
  const user = await getUser();
  await db.contactMessage.create({ data: { ...data, userId: user?.id } });
});
