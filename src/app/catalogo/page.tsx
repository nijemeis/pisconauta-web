import type { Metadata } from "next";
import Link from "next/link";
import { facets, parseSearch, searchPiscos } from "@/lib/catalog";
import { labels } from "@/lib/format";
import { getT } from "@/lib/i18n/server";
import type { PiscoStyle } from "@/lib/types";
import { SteppedBand } from "@/components/motifs";
import { CatalogueGrid, FilterToggle, RangeFacet, SearchField, SortSelect } from "./client";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("cat.title") };
}

type SP = Record<string, string | string[] | undefined>;

function toParams(sp: SP) {
  const out = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) for (const x of [v].flat()) if (x) out.append(k, x);
  out.delete("cursor");
  return out;
}

/** Link target that toggles one value of a multi-value facet. */
function toggle(base: URLSearchParams, key: string, value: string) {
  const next = new URLSearchParams(base);
  const values = next.getAll(key).flatMap((v) => v.split(","));
  next.delete(key);
  const out = values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
  if (out.length) next.set(key, out.join(","));
  const qs = next.toString();
  return `/catalogo${qs ? `?${qs}` : ""}`;
}

export default async function Catalogo({ searchParams }: { searchParams: Promise<SP> }) {
  const qs = toParams(await searchParams);
  const params = parseSearch(qs);
  const [result, f, t] = await Promise.all([searchPiscos(params), facets(params), getT()]);
  const { STYLE } = labels(t.locale);

  const styleSlug = (s: string) => s.replace("_", "-");
  const regionNames = f.region.filter((r) => params.region.includes(r.value)).map((r) => r.label!);
  const varietyNames = f.variety.filter((v) => params.variety.includes(v.value)).map((v) => v.label!);
  const heading = [...params.style.map((s) => STYLE[s]), ...varietyNames, ...regionNames].join(" · ") || (params.q ? `“${params.q}”` : t("cat.all"));

  const applied = [
    ...params.style.map((s) => ({ label: STYLE[s], href: toggle(qs, "style", styleSlug(s)) })),
    ...params.variety.map((v, i) => ({ label: varietyNames[i] ?? v, href: toggle(qs, "variety", v) })),
    ...params.region.map((r, i) => ({ label: regionNames[i] ?? r, href: toggle(qs, "region", r) })),
  ];

  return (
    <div className="catalogue">
      <aside className="sidebar" id="filtros">
        <div className="sheet-head only-mobile" style={{ marginBottom: 18 }}>
          <span className="sheet-title">{t("cat.filters")}</span>
          <Link href="/catalogo" className="mono gold">{t("cat.clear")}</Link>
        </div>
        <SteppedBand style={{ marginBottom: 24 }} />
        <div className="mono">{t("cat.style")}</div>
        <div className="facet-list">
          {f.style.map((s) => (
            <Link key={s.value} href={toggle(qs, "style", styleSlug(s.value))} className={params.style.includes(s.value as PiscoStyle) ? "on" : ""} scroll={false}>
              <span>{STYLE[s.value as PiscoStyle]}</span><span className="n">{s.count}</span>
            </Link>
          ))}
        </div>
        <div className="group mono">{t("cat.variety")}</div>
        <div className="chips">
          {f.variety.map((v) => (
            <Link key={v.value} href={toggle(qs, "variety", v.value)} className={`chip${params.variety.includes(v.value) ? " on" : ""}`} scroll={false}>
              {v.label} <span className="chip-count">{v.count}</span>
            </Link>
          ))}
        </div>
        <div className="group mono">{t("cat.region")}</div>
        <div className="facet-list">
          {f.region.map((r) => (
            <Link key={r.value} href={toggle(qs, "region", r.value)} className={params.region.includes(r.value) ? "on" : ""} scroll={false}>
              <span>{r.label}</span><span className="n">{r.count}</span>
            </Link>
          ))}
        </div>
        <RangeFacet min={f.abv.min} max={f.abv.max} from={params.abvMin} to={params.abvMax} />
        <FilterToggle variant="apply" count={result.total} />
      </aside>

      <main className="catalogue-main">
        <SearchField initial={params.q ?? ""} />
        <div className="catalogue-head" style={{ marginTop: 4 }}>
          <div>
            <h1 className="title">{heading}</h1>
            <div className="subtitle">{t.n("common.bottles", result.total)} · {t.n("common.bodegas", result.producerCount)}</div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <FilterToggle variant="open" count={applied.length} />
            <SortSelect value={params.sort} />
          </div>
        </div>
        {applied.length > 0 && (
          <div className="applied">
            {applied.map((a) => <Link key={a.href} href={a.href} className="chip" scroll={false}>{a.label} ✕</Link>)}
          </div>
        )}
        <CatalogueGrid key={qs.toString()} initial={result} query={qs.toString()} />
      </main>
    </div>
  );
}
