"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { PiscoCard as Card, SearchResult } from "@/lib/types";
import { PiscoCard } from "@/components/pisco-card";
import { Chakana } from "@/components/motifs";
import { api, useSession, useT } from "@/components/session";

function useSetParam() {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  return (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(sp);
    for (const [k, v] of Object.entries(changes)) v == null || v === "" ? next.delete(k) : next.set(k, v);
    next.delete("cursor");
    router.replace(`${path}${next.size ? `?${next}` : ""}`, { scroll: false });
  };
}

/** Mobile search field — live results, debounced 250 ms. */
export function SearchField({ initial }: { initial: string }) {
  const [q, setQ] = useState(initial);
  const t = useT();
  const set = useSetParam();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const t = setTimeout(() => set({ q: q.trim() || null }), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);
  return (
    <div className="only-mobile" style={{ display: "flex", alignItems: "center", gap: 10, border: `1px solid ${q ? "var(--gold)" : "rgba(var(--line-rgb),0.16)"}`, padding: "13px 14px", marginBottom: 18 }}>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("common.searchPlaceholder")} aria-label={t("common.search")} style={{ flex: 1, background: "none", border: 0, outline: "none", fontSize: 14 }} />
      {q && <button onClick={() => setQ("")} aria-label={t("cat.clearSearch")}>✕</button>}
    </div>
  );
}

export function SortSelect({ value }: { value: string }) {
  const set = useSetParam();
  const t = useT();
  return (
    <select className="select" value={value} onChange={(e) => set({ sort: e.target.value === "rating" ? null : e.target.value })} aria-label={t("cat.sortAria")}>
      <option value="rating">{t("cat.sortRating")}</option>
      <option value="new">{t("cat.sortNew")}</option>
      <option value="price">{t("cat.sortPrice")}</option>
      <option value="name">{t("cat.sortName")}</option>
    </select>
  );
}

export function RangeFacet({ min, max, from, to }: { min: number; max: number; from?: number; to?: number }) {
  const [lo, setLo] = useState(from ?? min);
  const [hi, setHi] = useState(to ?? max);
  const t = useT();
  const set = useSetParam();
  useEffect(() => { setLo(from ?? min); setHi(to ?? max); }, [from, to, min, max]);
  const commit = () => set({ abv_min: lo > min ? String(lo) : null, abv_max: hi < max ? String(hi) : null });
  const pct = (v: number) => ((v - min) / (max - min || 1)) * 100;
  return (
    <div className="group">
      <div className="mono" style={{ display: "flex", justifyContent: "space-between" }}><span>{t("cat.abv")}</span><span className="gold">{lo} – {hi} %</span></div>
      <div className="range">
        <div className="track" /><div className="fill" style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }} />
        <input type="range" min={min} max={max} step={1} value={lo} aria-label={t("cat.abvMin")} onChange={(e) => setLo(Math.min(Number(e.target.value), hi))} onPointerUp={commit} onKeyUp={commit} />
        <input type="range" min={min} max={max} step={1} value={hi} aria-label={t("cat.abvMax")} onChange={(e) => setHi(Math.max(Number(e.target.value), lo))} onPointerUp={commit} onKeyUp={commit} />
      </div>
    </div>
  );
}

/** Below 900px the sidebar becomes a bottom sheet; these two buttons open and close it. */
export function FilterToggle({ variant, count }: { variant: "open" | "apply"; count: number }) {
  const t = useT();
  const flip = (open: boolean) => document.getElementById("filtros")?.classList.toggle("open", open);
  if (variant === "apply") return <button className="btn btn-gold btn-block only-mobile" style={{ marginTop: 26 }} onClick={() => flip(false)}>{t.n("cat.show", count)}</button>;
  return <button className="btn btn-sm only-mobile" style={{ background: "var(--gold)", color: "var(--on-gold)" }} onClick={() => flip(true)}>{t("cat.filters")}{count ? ` · ${count}` : ""}</button>;
}

export function CatalogueGrid({ initial, query }: { initial: SearchResult; query: string }) {
  const [items, setItems] = useState<Card[]>(initial.items);
  const [cursor, setCursor] = useState(initial.nextCursor);
  const [loading, setLoading] = useState(false);
  const [compare, setCompare] = useState<string[]>([]);
  const { toast, t } = useSession();

  const more = async () => {
    setLoading(true);
    try {
      const next = await api<SearchResult>(`/piscos?${query}${query ? "&" : ""}cursor=${cursor}`);
      setItems((x) => [...x, ...next.items]);
      setCursor(next.nextCursor);
    } catch (e) { toast((e as Error).message); }
    setLoading(false);
  };
  const tick = (id: string) => setCompare((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length >= 4 ? (toast(t("cat.compareMax")), c) : [...c, id]));

  if (!items.length) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <Chakana size={56} />
        <p className="serif" style={{ fontSize: 26, marginTop: 18 }}>{t("cat.emptyTitle")}</p>
        <p className="muted" style={{ marginTop: 6 }}>{t("cat.emptyHelp")}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 22 }}>
          <Link href="/catalogo" className="btn btn-outline btn-sm">{t("cat.clearFilters")}</Link>
          <Link href="/escanear?sugerir=1" className="btn btn-goldline btn-sm">{t("cat.suggest")}</Link>
        </div>
      </div>
    );
  }
  return (
    <>
      <div className="grid">
        {items.map((p) => (
          <PiscoCard key={p.id} p={p}>
            <button className={`compare-tick${compare.includes(p.id) ? " on" : ""}`} aria-label={t("cat.compareAria", { name: p.name })} aria-pressed={compare.includes(p.id)}
              onClick={(e) => { e.preventDefault(); tick(p.id); }}>{compare.includes(p.id) ? "✓" : "+"}</button>
          </PiscoCard>
        ))}
      </div>
      {cursor && <div style={{ textAlign: "center", marginTop: 32 }}><button className="btn btn-outline" onClick={more} disabled={loading}>{loading ? t("cat.loading") : t("cat.more")}</button></div>}
      {compare.length > 0 && (
        <div className="toast" style={{ display: "flex", gap: 14, alignItems: "center", bottom: 84 }}>
          <span className="mono" style={{ color: "var(--ink-2)" }}>{t.n("cat.selected", compare.length)}</span>
          {compare.length > 1 && <Link className="btn btn-gold btn-sm" href={`/comparar?ids=${compare.join(",")}`}>{t("cat.compare", { n: compare.length })}</Link>}
          <button className="mono" onClick={() => setCompare([])}>✕</button>
        </div>
      )}
    </>
  );
}
