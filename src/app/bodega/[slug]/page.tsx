import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProducer } from "@/lib/catalog";
import { fmt } from "@/lib/format";
import { getT } from "@/lib/i18n/server";
import { Chakana } from "@/components/motifs";
import { Photo } from "@/components/pisco-card";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ tab?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const b = await getProducer((await params).slug);
  return b ? { title: b.name, description: b.description ?? undefined } : {};
}

export default async function Bodega({ params, searchParams }: Props) {
  const [b, t] = await Promise.all([getProducer((await params).slug), getT()]);
  if (!b) notFound();
  const { cardMeta, dec } = fmt(t.locale);
  const tab = (await searchParams).tab ?? "piscos";
  const tabs = [["piscos", t("bodega.tabPiscos")], ["historia", t("bodega.tabHistory")], ["visitas", t("bodega.tabVisits")]];
  return (
    <main className="page" style={{ maxWidth: 1000 }}>
      <div className={`cover${b.cover ? "" : " skeleton"}`} style={b.cover ? { backgroundImage: `url(${b.cover}?w=1200)` } : undefined} />
      <div className="crest"><Chakana size={24} />{b.crestInitials}</div>
      <div style={{ textAlign: "center" }}>
        <h1 className="serif" style={{ fontSize: 32, marginTop: 12 }}>{b.name}</h1>
        <div className="mono gold" style={{ marginTop: 6 }}>
          {[b.valley ? t("common.valleyOf", { valley: b.valley }) : b.region?.name, b.foundedYear ? t("common.since", { year: b.foundedYear }) : null, b.verified ? t("common.verified") : null].filter(Boolean).join(" · ")}
        </div>
        {b.description && <p style={{ fontSize: 12, lineHeight: 1.55, color: "var(--ink-3)", maxWidth: 520, margin: "12px auto 0" }}>{b.description}</p>}
        {b.website && <a className="mono gold" style={{ display: "inline-block", marginTop: 10 }} href={b.website} target="_blank" rel="noopener">{t("bodega.website")}</a>}
      </div>
      <div className="stats">
        <div><div className="v">{b.piscoCount}</div><div className="mono">{t("bodega.statPiscos")}</div></div>
        <div><div className="v gold">{dec(b.avgRating)}</div><div className="mono">{t("bodega.statAverage")}</div></div>
        <div><div className="v">{b.medalCount}</div><div className="mono">{t("bodega.statMedals")}</div></div>
      </div>
      <div className="tabs" role="tablist">
        {tabs.map(([k, label]) => <Link key={k} href={`?tab=${k}`} role="tab" aria-selected={tab === k} scroll={false}>{label}</Link>)}
      </div>

      {tab === "piscos" && (
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14 }}>
          {b.piscos.map((p) => (
            <Link key={p.id} href={`/pisco/${p.slug}`}>
              <div style={{ aspectRatio: "3/4", overflow: "hidden", border: "1px solid rgba(var(--line-rgb),0.1)" }}><Photo src={p.photo} alt={p.name} /></div>
              <div className="serif" style={{ fontSize: 18, marginTop: 8 }}>{p.name}</div>
              <div className="mono" style={{ letterSpacing: "0.06em", marginTop: 2 }}>{cardMeta(p)} · {dec(p.avgRating)}</div>
            </Link>
          ))}
        </div>
      )}
      {tab === "historia" && <p className="prose" style={{ margin: "28px auto 0" }}>{b.history ?? t("bodega.noHistory")}</p>}
      {tab === "visitas" && <p className="prose" style={{ margin: "28px auto 0" }}>{b.visitInfo ?? t("bodega.noVisits")}</p>}
    </main>
  );
}
