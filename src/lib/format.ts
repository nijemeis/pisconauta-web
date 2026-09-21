import { translate, type Key, type Locale } from "./i18n";
import type { AwardLevel, Currency, Rates, PlaceListing, RatingCriterion, FlavourAxis, PiscoCard, PiscoStatus, PiscoStyle, StillType } from "./types";

const decimal = (locale: Locale, n: number | null | undefined, digits = 1) =>
  n == null ? "—" : locale === "en" ? n.toFixed(digits) : n.toFixed(digits).replace(".", ",");

export const SYMBOL: Record<Currency, string> = { PEN: "S/", USD: "US$", EUR: "€" };
export const img = (path: string | null | undefined, w: number) => (path ? `${path}?w=${w}` : null);

/** Locale-aware formatters: decimal comma (4,6 · 42,8) in Spanish, decimal point in English. */
export function fmt(locale: Locale) {
  const dec = (n: number | null | undefined, digits = 1) => decimal(locale, n, digits);
  return {
    dec,
    money: (cents: number, currency: string, digits = 2) => `${SYMBOL[currency as Currency] ?? currency} ${dec(cents / 100, digits)}`,
    shortDate: (iso: string | null) =>
      iso ? new Date(iso).toLocaleDateString(locale === "en" ? "en-GB" : "es-PE", { day: "2-digit", month: "short", year: "numeric" }).replace(/\./g, "").toUpperCase() : "",
    cardMeta: (p: Pick<PiscoCard, "abvPct" | "bottleSizeMl" | "vintage">) =>
      [p.abvPct != null ? `${dec(p.abvPct)} %` : null, p.bottleSizeMl ? `${p.bottleSizeMl} ml` : null, p.vintage].filter(Boolean).join(" · "),
  };
}

const STYLES: PiscoStyle[] = ["puro", "acholado", "mosto_verde"];
const STILLS: StillType[] = ["falca", "alambique_cobre", "otro"];
const AWARDS: AwardLevel[] = ["gran_oro", "oro", "plata", "bronce"];
const AXES: FlavourAxis[] = ["cuerpo", "dulzor", "herbal", "citrico", "floral", "alcohol"];
const STATUSES: PiscoStatus[] = ["draft", "in_review", "published", "archived"];
const CRITERIA_KEYS: RatingCriterion[] = ["aroma", "sabor", "cuerpo", "final", "equilibrio"];
export const CRITERIA = CRITERIA_KEYS;

const map = <K extends string>(locale: Locale, prefix: string, keys: K[]) =>
  Object.fromEntries(keys.map((k) => [k, translate(locale, `${prefix}.${k}` as Key)])) as Record<K, string>;

/** Label maps in the given language. Domain terms (Puro, Acholado, Mosto Verde) stay Spanish in both. */
export function labels(locale: Locale) {
  return {
    STYLE: map(locale, "style", STYLES),
    STILL: map(locale, "still", STILLS),
    AWARD: map(locale, "award", AWARDS),
    AXIS: map(locale, "axis", AXES),
    STATUS: map(locale, "status", STATUSES),
    /** `label` is the primary name in this language; `gloss` is the same criterion in the other one. */
    CRITERIA: CRITERIA_KEYS.map((key) => ({ key, label: translate(locale, `criteria.${key}` as Key), gloss: translate(locale, `criteria.${key}.gloss` as Key) })),
  };
}

/** Converts between any two supported currencies through the sol. */
export function convert(cents: number, from: string, to: Currency, rates: Rates): number {
  if (from === to) return cents;
  const pen = cents / (rates.perPen[from as Currency] ?? 1);
  return Math.round(pen * rates.perPen[to]);
}

/** Opens the maps app / Google Maps with directions to a physical store. */
export function mapsUrl(l: Pick<PlaceListing, "retailer" | "address" | "city" | "lat" | "lng">): string {
  const dest = l.lat != null && l.lng != null ? `${l.lat},${l.lng}` : [l.retailer, l.address, l.city].filter(Boolean).join(", ");
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`;
}
