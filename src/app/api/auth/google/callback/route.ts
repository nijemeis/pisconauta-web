import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { SESSION_COOKIE, createSession, sessionCookieOptions } from "@/lib/auth";
import { googleProfile, googleRedirectUri, publicOrigin, randomToken, sha256url, userForProfile } from "@/lib/oauth";

const APP_SCHEME = "pisconauta://auth";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = publicOrigin(req);
  const jar = await cookies();
  let flow: { state: string; role: "enthusiast" | "producer"; next: string | null; app: boolean; challenge: string | null; locale: string } | null = null;
  try { flow = JSON.parse(jar.get("pn_oauth")?.value ?? "null"); } catch { /* fall through */ }

  const fail = (code: string) => {
    const res = NextResponse.redirect(flow?.app ? `${APP_SCHEME}?error=${code}` : `${origin}/cuenta?error=${code}`, 302);
    res.cookies.delete({ name: "pn_oauth", path: "/api/auth" });
    return res;
  };

  if (url.searchParams.get("error")) return fail("google_cancelled");
  const code = url.searchParams.get("code");
  if (!flow || !code || url.searchParams.get("state") !== flow.state) return fail("google_state");
  if (flow.app && !flow.challenge) return fail("google_state");

  let user;
  try {
    const profile = await googleProfile(code, googleRedirectUri(req));
    ({ user } = await userForProfile(profile, { role: flow.role, locale: flow.locale }));
  } catch (e) {
    console.error(e);
    return fail("google_failed");
  }

  let res: NextResponse;
  if (flow.app) {
    // Hand over with a one-time code; the app redeems it at /api/auth/exchange with its verifier.
    const handoff = randomToken(24);
    await db.authCode.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    await db.authCode.create({ data: { codeHash: sha256url(handoff), userId: user.id, challenge: flow.challenge!, expiresAt: new Date(Date.now() + 120_000) } });
    res = NextResponse.redirect(`${APP_SCHEME}?code=${handoff}`, 302);
  } else {
    const token = await createSession(user.id, req.headers.get("user-agent"));
    const dest = user.role === "producer" ? "/productor" : flow.next ?? (user.role === "admin" ? "/admin" : "/");
    res = NextResponse.redirect(`${origin}${dest}`, 302);
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  }
  res.cookies.delete({ name: "pn_oauth", path: "/api/auth" });
  return res;
}
