import "server-only";
import { db } from "./db";
import type { Currency, Rates } from "./types";

const WEEK = 7 * 86400_000;
/** Last-resort values (Sept 2026) so prices still convert if the feed has never been reachable. */
const FALLBACK: Record<Exclude<Currency, "PEN">, number> = { USD: 0.296, EUR: 0.258 };
let refreshing: Promise<void> | null = null;

async function refresh() {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/PEN", { signal: AbortSignal.timeout(6000), cache: "no-store" });
    const json = await res.json();
    if (json?.result !== "success") return;
    for (const currency of ["USD", "EUR"] as const) {
      const perPen = Number(json.rates?.[currency]);
      if (perPen > 0) await db.exchangeRate.upsert({ where: { currency }, update: { perPen, fetchedAt: new Date() }, create: { currency, perPen } });
    }
  } catch { /* keep the stored rates */ } finally { refreshing = null; }
}

/**
 * Exchange rates against the sol, refreshed weekly. Stale-while-revalidate: a request never
 * waits on the feed unless there is nothing stored yet.
 */
export async function getRates(): Promise<Rates> {
  let rows = await db.exchangeRate.findMany();
  const stale = !rows.length || rows.some((r) => Date.now() - r.fetchedAt.getTime() > WEEK);
  if (stale && !refreshing) refreshing = refresh();
  if (!rows.length) { await refreshing; rows = await db.exchangeRate.findMany(); }
  const get = (c: "USD" | "EUR") => rows.find((r) => r.currency === c)?.perPen ?? FALLBACK[c];
  return {
    base: "PEN",
    perPen: { PEN: 1, USD: get("USD"), EUR: get("EUR") },
    updatedAt: rows.length ? new Date(Math.min(...rows.map((r) => r.fetchedAt.getTime()))).toISOString() : null,
  };
}

export const toPenCents = (cents: number, currency: string, rates: Rates) =>
  Math.round(cents / (rates.perPen[currency as Currency] ?? 1));
