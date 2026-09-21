"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ApiErrorBody, Currency, Me, Rates } from "@/lib/types";
import { convert, fmt } from "@/lib/format";
import { LOCALE_COOKIE, makeT, toLocale, translate, userLocale, type Locale, type T } from "@/lib/i18n";

export class ClientApiError extends Error {
  constructor(public status: number, public code: string, message: string, public fields?: Record<string, string>) { super(message); }
}

/** The page language as rendered by the server (`<html lang>`); kept in sync by `setLocale`. */
const pageLocale = (): Locale => (typeof document === "undefined" ? "es" : toLocale(document.documentElement.lang) ?? "es");

/** fetch wrapper for /api: JSON in/out, API errors thrown with their message in the visitor's language. */
export async function api<T = unknown>(path: string, init: { method?: string; body?: unknown; form?: FormData } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method: init.method ?? (init.body || init.form ? "POST" : "GET"),
      headers: { "accept-language": pageLocale(), ...(init.body ? { "content-type": "application/json" } : {}) },
      body: init.form ?? (init.body ? JSON.stringify(init.body) : undefined),
    });
  } catch {
    throw new ClientApiError(0, "network", translate(pageLocale(), "err.network"));
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = (json as ApiErrorBody).error;
    throw new ClientApiError(res.status, e?.code ?? "server", e?.message ?? translate(pageLocale(), "err.generic"), e?.fields);
  }
  return json as T;
}

interface Ctx {
  me: Me;
  setMe: (me: Me) => void;
  toast: (msg: string) => void;
  /** Optimistic ♡ toggle; reverts on failure. Returns false when the visitor must sign in first. */
  toggleWishlist: (piscoId: string) => boolean;
  requireAccount: () => boolean;
  /** Display currency (cookie for visitors, account preference when signed in) and the weekly rates. */
  currency: Currency;
  setCurrency: (c: Currency) => void;
  rates: Rates;
  /** UI language: cookie `pn_locale` for everyone, account preference when signed in. */
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: T;
}
const SessionCtx = createContext<Ctx | null>(null);
export const useSession = () => useContext(SessionCtx)!;
/** Bound translator for client components: `const t = useT()` → `t("key", vars)`, `t.n("plural", count)`, `t.locale`. */
export const useT = () => useContext(SessionCtx)!.t;

export function SessionProvider({ initial, initialCurrency, initialLocale, rates, children }: { initial: Me; initialCurrency: Currency; initialLocale: Locale; rates: Rates; children: React.ReactNode }) {
  const [me, setMe] = useState(initial);
  const [currency, setCurrencyState] = useState(initialCurrency);
  const [locale, setLocaleState] = useState(initialLocale);
  const t = useMemo(() => makeT(locale), [locale]);
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const router = useRouter();
  useEffect(() => setMe(initial), [initial]);
  useEffect(() => setLocaleState(initialLocale), [initialLocale]);

  const toast = useCallback((m: string) => {
    setMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 3200);
  }, []);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    document.cookie = `pn_currency=${c};path=/;max-age=31536000;samesite=lax`;
    if (me.user) api("/me", { method: "PATCH", body: { currency: c } }).catch(() => {});
  }, [me.user]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    document.documentElement.lang = l === "en" ? "en" : "es-PE";
    document.cookie = `${LOCALE_COOKIE}=${l};path=/;max-age=31536000;samesite=lax`;
    const done = me.user ? api("/me", { method: "PATCH", body: { locale: userLocale(l) } }).catch(() => {}) : Promise.resolve();
    // Server-rendered text follows the cookie: refresh it in place, no full reload.
    done.then(() => router.refresh());
  }, [me.user, router]);

  const requireAccount = useCallback(() => {
    if (me.user) return true;
    router.push(`/cuenta?next=${encodeURIComponent(location.pathname)}`);
    return false;
  }, [me.user, router]);

  const toggleWishlist = useCallback((piscoId: string) => {
    if (!requireAccount()) return false;
    const had = me.cellar.wishlist.includes(piscoId);
    if (me.cellar.tasted.includes(piscoId)) { toast(t("toast.alreadyTasted")); return true; }
    const apply = (on: boolean) => setMe((m) => ({ ...m, cellar: { ...m.cellar, wishlist: on ? [...m.cellar.wishlist, piscoId] : m.cellar.wishlist.filter((x) => x !== piscoId) } }));
    apply(!had);
    (had ? api(`/cellar/${piscoId}`, { method: "DELETE" }) : api(`/cellar/${piscoId}`, { method: "PUT", body: { state: "wishlist" } }))
      .then(() => toast(t(had ? "toast.removedFromCava" : "toast.addedWishlist")))
      .catch((e: Error) => { apply(had); toast(e.message); });
    return true;
  }, [me.cellar, requireAccount, toast, t]);

  return (
    <SessionCtx.Provider value={{ me, setMe, toast, toggleWishlist, requireAccount, currency, setCurrency, rates, locale, setLocale, t }}>
      {children}
      {msg && <div className="toast" role="status">{msg}</div>}
    </SessionCtx.Provider>
  );
}

/**
 * A price in the visitor's preferred currency. Converted amounts carry "≈" and keep the
 * original on hover, since they move with the weekly exchange rate.
 */
export function Price({ cents, currency, digits = 2 }: { cents: number; currency: string; digits?: number }) {
  const { currency: pref, rates, t } = useSession();
  const { money } = fmt(t.locale);
  if (currency === pref) return <>{money(cents, currency, digits)}</>;
  return <span title={`${money(cents, currency)} · ${t("price.weeklyRate")}`}>≈ {money(convert(cents, currency, pref, rates), pref, digits)}</span>;
}
