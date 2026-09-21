import { NextResponse } from "next/server";
import { googleConfigured, googleRedirectUri, randomToken } from "@/lib/oauth";


/**
 * Starts Google sign-in. Web: /api/auth/google?role=&next=  ·  Apps: add app=1&challenge=<sha256 of a
 * verifier the app keeps>; the flow then ends on pisconauta://auth?code=… instead of a session cookie.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  if (!googleConfigured()) return NextResponse.redirect(new URL("/cuenta?error=google_off", url), 302);
  const state = randomToken(18);
  const next = url.searchParams.get("next");
  const flow = {
    state,
    role: url.searchParams.get("role") === "producer" ? "producer" : "enthusiast",
    next: next?.startsWith("/") && !next.startsWith("//") ? next : null,
    app: url.searchParams.get("app") === "1",
    challenge: url.searchParams.get("challenge")?.slice(0, 64) ?? null,
    locale: url.searchParams.get("locale") === "en" ? "en" : "es",
  };
  const auth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  auth.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!, redirect_uri: googleRedirectUri(req), response_type: "code",
    scope: "openid email profile", state, prompt: "select_account", hl: flow.locale,
  }).toString();
  const res = NextResponse.redirect(auth, 302);
  res.cookies.set("pn_oauth", JSON.stringify(flow), { httpOnly: true, sameSite: "lax", secure: googleRedirectUri(req).startsWith("https://"), path: "/api/auth", maxAge: 600 });
  return res;
}
