import { z } from "zod";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { ApiError, rateLimit, route } from "@/lib/api";
import { SESSION_COOKIE, createSession, hashPassword, sessionCookieOptions } from "@/lib/auth";
import { buildMe } from "@/lib/me";

const body = z.object({
  email: z.string().trim().toLowerCase().email("Correo no válido."),
  password: z.string().min(8, "Usa al menos 8 caracteres."),
  displayName: z.string().trim().min(2, "Dinos tu nombre.").max(60),
  role: z.enum(["enthusiast", "producer"]).default("enthusiast"),
  birthYear: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
  locale: z.enum(["es-PE", "en"]).optional(),
});

export const POST = route(async (req) => {
  rateLimit(`signup:${req.headers.get("x-forwarded-for") ?? "local"}`, 10);
  const data = body.parse(await req.json());
  if (data.birthYear && new Date().getFullYear() - data.birthYear < 18) {
    throw new ApiError(403, "underage", "PISCONAUTA es solo para mayores de 18 años.");
  }
  if (await db.user.findUnique({ where: { email: data.email } })) {
    throw new ApiError(409, "email_taken", "Ya existe una cuenta con este correo.", { email: "Ya registrado" });
  }
  const user = await db.user.create({
    data: { email: data.email, passwordHash: await hashPassword(data.password), displayName: data.displayName, role: data.role, birthYear: data.birthYear, locale: data.locale },
  });
  const token = await createSession(user.id, req.headers.get("user-agent"));
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions());
  return { token, ...(await buildMe(user)) };
});
