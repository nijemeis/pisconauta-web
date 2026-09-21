import "server-only";
import { createHash, randomBytes } from "node:crypto";
import type { User } from "@prisma/client";
import { db } from "./db";

export const sha256url = (s: string) => createHash("sha256").update(s).digest("base64url");
export const randomToken = (bytes = 24) => randomBytes(bytes).toString("base64url");

export const googleConfigured = () => !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

/** Public origin of this deployment — APP_URL wins, else the proxy/tunnel headers, else the request URL. */
export function publicOrigin(req: Request): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/+$/, "");
  const h = req.headers;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) return `${h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https")}://${host}`;
  return new URL(req.url).origin;
}

export const googleRedirectUri = (req: Request) => `${publicOrigin(req)}/api/auth/google/callback`;

export interface OAuthProfile { provider: "google"; subject: string; email: string; emailVerified: boolean; name: string | null; locale?: string | null }

/** Exchanges the authorization code with Google and returns the verified identity from the ID token. */
export async function googleProfile(code: string, redirectUri: string): Promise<OAuthProfile> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code, redirect_uri: redirectUri, grant_type: "authorization_code",
      client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    signal: AbortSignal.timeout(8000),
  });
  const json = await res.json();
  if (!res.ok || !json.id_token) throw new Error(`google token exchange failed: ${json.error ?? res.status}`);
  // The ID token came straight from Google over TLS in exchange for our client secret, so per OIDC
  // (core §3.1.3.7) its signature need not be re-verified; the claims still are.
  const claims = JSON.parse(Buffer.from(String(json.id_token).split(".")[1], "base64url").toString());
  const issOk = claims.iss === "https://accounts.google.com" || claims.iss === "accounts.google.com";
  if (!issOk || claims.aud !== process.env.GOOGLE_CLIENT_ID || Number(claims.exp) * 1000 < Date.now() || !claims.sub || !claims.email) {
    throw new Error("google id token rejected");
  }
  return { provider: "google", subject: String(claims.sub), email: String(claims.email).toLowerCase(), emailVerified: claims.email_verified === true || claims.email_verified === "true", name: claims.name ?? null, locale: claims.locale ?? null };
}

/**
 * Finds the account for an OAuth identity, links it to an existing e-mail account, or creates one.
 * Linking by e-mail only happens when the provider vouches for the address.
 */
export async function userForProfile(p: OAuthProfile, opts: { role: "enthusiast" | "producer"; locale?: string }): Promise<{ user: User; created: boolean }> {
  const linked = await db.user.findUnique({ where: { oauthProvider_oauthSubject: { oauthProvider: p.provider, oauthSubject: p.subject } } });
  if (linked) return { user: linked, created: false };
  if (!p.emailVerified) throw new Error("unverified email");
  const byEmail = await db.user.findUnique({ where: { email: p.email } });
  if (byEmail) {
    // Don't overwrite a link to a different identity of the same provider.
    if (byEmail.oauthProvider && byEmail.oauthProvider !== p.provider) return { user: byEmail, created: false };
    return { user: await db.user.update({ where: { id: byEmail.id }, data: { oauthProvider: p.provider, oauthSubject: p.subject } }), created: false };
  }
  const user = await db.user.create({
    data: {
      email: p.email, displayName: p.name?.trim() || p.email.split("@")[0], role: opts.role,
      oauthProvider: p.provider, oauthSubject: p.subject, locale: opts.locale === "en" ? "en" : "es-PE",
    },
  });
  return { user, created: true };
}
