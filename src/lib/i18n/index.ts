import { es, type Key } from "./es";
import { en } from "./en";

/** Shared by server and client code: no `server-only`, no next/headers in here. */
export type Locale = "es" | "en";
export type { Key };
export type Vars = Record<string, string | number>;
/** Base of a `<key>_one` / `<key>_other` plural pair. */
export type PluralKey = { [K in Key]: K extends `${infer B}_one` ? B : never }[Key];

export const LOCALES: Locale[] = ["es", "en"];
export const LOCALE_COOKIE = "pn_locale";
const DICTS: Record<Locale, Record<Key, string>> = { es, en };

export const isLocale = (v: unknown): v is Locale => v === "es" || v === "en";
/** "es-PE" | "en-GB" | "en" | … → Locale, or null when it is neither Spanish nor English. */
export const toLocale = (v: string | null | undefined): Locale | null => {
  const s = v?.trim().toLowerCase();
  return !s ? null : s.startsWith("en") ? "en" : s.startsWith("es") ? "es" : null;
};
/** The value stored in `User.locale`. */
export const userLocale = (l: Locale): "es-PE" | "en" => (l === "en" ? "en" : "es-PE");
/** Locale from request signals, in order: cookie, then the account, then Accept-Language; Spanish by default. */
export function pickLocale(cookie?: string | null, account?: string | null, acceptLanguage?: string | null): Locale {
  if (isLocale(cookie)) return cookie;
  return toLocale(account) ?? (toLocale(acceptLanguage) === "en" ? "en" : "es");
}

const fill = (s: string, vars?: Vars) => (vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : s);

export function translate(locale: Locale, key: Key, vars?: Vars): string {
  return fill(DICTS[locale][key] ?? es[key] ?? key, vars);
}
/** `{n}` is filled with the count. Spanish and English share the one/other split. */
export function plural(locale: Locale, base: PluralKey, count: number, vars?: Vars): string {
  return translate(locale, `${base}_${count === 1 ? "one" : "other"}` as Key, { n: count, ...vars });
}

export interface T {
  (key: Key, vars?: Vars): string;
  n: (base: PluralKey, count: number, vars?: Vars) => string;
  locale: Locale;
}
export function makeT(locale: Locale): T {
  const t = ((key: Key, vars?: Vars) => translate(locale, key, vars)) as T;
  t.n = (base, count, vars) => plural(locale, base, count, vars);
  t.locale = locale;
  return t;
}
