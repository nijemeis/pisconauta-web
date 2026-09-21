import { z } from "zod";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { ApiError, rateLimit, route } from "@/lib/api";
import { SESSION_COOKIE, checkPassword, createSession, sessionCookieOptions } from "@/lib/auth";
import { buildMe } from "@/lib/me";

const body = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1) });

export const POST = route(async (req) => {
  const data = body.parse(await req.json());
  rateLimit(`login:${data.email}`, 8);
  const user = await db.user.findUnique({ where: { email: data.email } });
  if (user && !user.passwordHash && user.oauthProvider === "google") {
    throw new ApiError(401, "use_google", "Esta cuenta se creó con Google. Ingresa con el botón de Google.");
  }
  if (!user?.passwordHash || !(await checkPassword(data.password, user.passwordHash))) {
    throw new ApiError(401, "bad_credentials", "Correo o contraseña incorrectos.");
  }
  const token = await createSession(user.id, req.headers.get("user-agent"));
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions());
  return { token, ...(await buildMe(user)) };
});
