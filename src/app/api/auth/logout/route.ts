import { cookies } from "next/headers";
import { route } from "@/lib/api";
import { SESSION_COOKIE, currentToken, destroySession } from "@/lib/auth";

export const POST = route(async () => {
  const token = await currentToken();
  if (token) await destroySession(token);
  (await cookies()).delete(SESSION_COOKIE);
});
