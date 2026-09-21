import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import type { User, UserRole } from "@prisma/client";
import { getUser } from "./auth";
import { LOCALE_COOKIE, pickLocale, type Locale } from "./i18n";
import { apiFields, apiMsg } from "./i18n/api-messages";

/**
 * Spanish-first error copy; `code` is the stable, machine-readable part. `route()` answers in English when the
 * request asks for it — every message needs its English twin in lib/i18n/api-messages.ts.
 */
export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public fields?: Record<string, string>) {
    super(message);
  }
}

export const unauthorized = () => new ApiError(401, "unauthorized", "Inicia sesión para continuar.");
export const forbidden = () => new ApiError(403, "forbidden", "No tienes permiso para hacer esto.");
export const notFound = (what = "Recurso") => new ApiError(404, "not_found", `${what} no encontrado.`);

export async function requireUser(...roles: UserRole[]): Promise<User> {
  const user = await getUser();
  if (!user) throw unauthorized();
  if (roles.length && !roles.includes(user.role) && user.role !== "admin") throw forbidden();
  return user;
}

type Ctx<P> = { params: Promise<P> };

/** Cookie `pn_locale` (web), else `Accept-Language` (the mobile app sends no cookie), else Spanish. */
export function requestLocale(req: Request): Locale {
  const cookie = req.headers.get("cookie")?.match(new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}=(es|en)(?:;|$)`))?.[1];
  return pickLocale(cookie, null, req.headers.get("accept-language"));
}

/** Wraps a route handler: JSON out, ApiError/Zod errors mapped to status codes. */
export function route<P = Record<string, string>>(fn: (req: Request, params: P) => Promise<unknown>) {
  return async (req: Request, ctx: Ctx<P>) => {
    try {
      const out = await fn(req, await ctx.params);
      if (out instanceof Response) return out;
      return NextResponse.json(out ?? { ok: true });
    } catch (e) {
      const locale = requestLocale(req);
      if (e instanceof ApiError) {
        return NextResponse.json({ error: { code: e.code, message: apiMsg(locale, e.message), fields: apiFields(locale, e.fields) } }, { status: e.status });
      }
      if (e instanceof ZodError) {
        const fields: Record<string, string> = {};
        // Our own messages are Spanish; zod's built-in ones are English, so replace those.
        for (const i of e.issues) fields[i.path.join(".")] = apiMsg(locale, /^(Too |Invalid|Expected|Unrecognized)/.test(i.message) ? "Valor no válido." : i.message);
        return NextResponse.json({ error: { code: "invalid", message: apiMsg(locale, "Revisa los campos marcados."), fields } }, { status: 422 });
      }
      console.error(e);
      return NextResponse.json({ error: { code: "server", message: apiMsg(locale, "Algo salió mal. Inténtalo de nuevo.") } }, { status: 500 });
    }
  };
}

/** Tiny in-memory sliding window; fine for a single node, swap for Redis/Upstash when scaled out. */
const hits = new Map<string, number[]>();
export function rateLimit(key: string, max: number, windowMs = 60_000) {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (list.length >= max) throw new ApiError(429, "rate_limited", "Demasiadas solicitudes. Espera un momento.");
  list.push(now);
  hits.set(key, list);
}
