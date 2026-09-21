import { z } from "zod";
import { db } from "@/lib/db";
import { ApiError, rateLimit, route } from "@/lib/api";
import { createSession } from "@/lib/auth";
import { buildMe } from "@/lib/me";
import { sha256url } from "@/lib/oauth";

const body = z.object({ code: z.string().min(10).max(200), verifier: z.string().min(20).max(200) });

/** Apps redeem the one-time code from pisconauta://auth?code=… for a bearer token. */
export const POST = route(async (req) => {
  rateLimit(`exchange:${req.headers.get("x-forwarded-for") ?? "local"}`, 10);
  const { code, verifier } = body.parse(await req.json());
  const codeHash = sha256url(code);
  const row = await db.authCode.findUnique({ where: { codeHash } });
  if (row) await db.authCode.delete({ where: { codeHash } }); // single use, whatever happens next
  if (!row || row.expiresAt < new Date() || row.challenge !== sha256url(verifier)) {
    throw new ApiError(401, "bad_code", "No pudimos completar el ingreso. Inténtalo de nuevo.");
  }
  const user = await db.user.findUnique({ where: { id: row.userId } });
  if (!user) throw new ApiError(401, "bad_code", "No pudimos completar el ingreso. Inténtalo de nuevo.");
  const token = await createSession(user.id, req.headers.get("user-agent"));
  return { token, ...(await buildMe(user)) };
});
