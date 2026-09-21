import type { Metadata } from "next";
import Link from "next/link";
import { getPisco } from "@/lib/catalog";
import { fmt, labels } from "@/lib/format";
import { getT } from "@/lib/i18n/server";
import { Price } from "@/components/session";
import type { PiscoDetail } from "@/lib/types";
import { Photo } from "@/components/pisco-card";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("cmp.title") };
}

export default async function Comparar({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
  const ids = ((await searchParams).ids ?? "").split(",").filter(Boolean).slice(0, 4);
  const piscos = (await Promise.all(ids.map((id) => getPisco(id)))).filter((p): p is PiscoDetail => !!p);
  const t = await getT();
  const { STILL, STYLE } = labels(t.locale);
  const { dec } = fmt(t.locale);

  const rows: [string, (p: PiscoDetail) => React.ReactNode][] = [
    [t("cmp.bodega"), (p) => p.producer.name],
    [t("spec.style"), (p) => (p.style ? STYLE[p.style] : null)],
    [t("spec.variety"), (p) => p.varieties.join(" · ")],
    [t("cat.region"), (p) => [p.region?.name, p.valley].filter(Boolean).join(" · ")],
    [t("cmp.vintage"), (p) => (p.vintage ? String(p.vintage) : null)],
    [t("spec.alcohol"), (p) => (p.abvPct != null ? `${dec(p.abvPct)} %` : null)],
    [t("spec.bottle"), (p) => (p.bottleSizeMl ? `${p.bottleSizeMl} ml` : null)],
    [t("spec.rest"), (p) => (p.restMonths != null ? t.n("common.months", p.restMonths) : null)],
    [t("spec.still"), (p) => (p.stillType ? STILL[p.stillType] : null)],
    [t("cmp.rating"), (p) => `${dec(p.avgRating)} (${p.ratingsCount})`],
    [t("cmp.awards"), (p) => (p.awards.length ? String(p.awards.length) : null)],
    [t("cmp.notes"), (p) => p.notes.map((n) => (t.locale === "en" ? n.en : n.es)).join(", ")],
    [t("common.from"), (p) => (p.minPriceCents != null ? <Price cents={p.minPriceCents} currency="PEN" digits={0} /> : null)],
  ];

  return (
    <main className="page">
      <h1 className="title">{t("cmp.title")}</h1>
      <div className="subtitle">{t.n("cmp.subtitle", piscos.length)}</div>
      {piscos.length < 2 ? (
        <p className="muted" style={{ marginTop: 24 }}>{t("cmp.pickPre")}<Link className="gold" href="/catalogo">{t("cmp.pickLink")}</Link>{t("cmp.pickPost")}</p>
      ) : (
        <div style={{ overflowX: "auto", marginTop: 28 }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 180 + piscos.length * 190 }}>
            <thead>
              <tr>
                <th />
                {piscos.map((p) => (
                  <th key={p.id} style={{ padding: "0 14px 16px", textAlign: "left", fontWeight: 400, verticalAlign: "bottom" }}>
                    <Link href={`/pisco/${p.slug}`}>
                      <div style={{ width: 120, aspectRatio: "3/4", border: "1px solid rgba(var(--gold-rgb),0.3)", overflow: "hidden" }}><Photo src={p.photo} alt={p.name} w={200} /></div>
                      <div className="serif" style={{ fontSize: 22, marginTop: 10, lineHeight: 1.1 }}>{p.name}</div>
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, get]) => (
                <tr key={label} style={{ borderTop: "1px solid rgba(var(--gold-rgb),0.22)" }}>
                  <td className="mono" style={{ padding: "14px 14px 14px 0", whiteSpace: "nowrap" }}>{label}</td>
                  {piscos.map((p) => <td key={p.id} className="serif" style={{ padding: 14, fontSize: 18, verticalAlign: "top" }}>{get(p) || "—"}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
