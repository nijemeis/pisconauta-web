import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPisco } from "@/lib/catalog";
import { fmt, img, labels } from "@/lib/format";
import { getT } from "@/lib/i18n/server";
import { Brackets, Chakana, SectionHead, SteppedBand } from "@/components/motifs";
import { Photo } from "@/components/pisco-card";
import { Price } from "@/components/session";
import { FichaActions, Places, Reviews, SaveHeart } from "./client";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [p, t] = await Promise.all([getPisco((await params).slug), getT()]);
  if (!p) return {};
  return {
    title: `${p.name} · ${p.producer.name}`,
    description: p.description ?? t("ficha.metaDesc", { name: p.name, producer: p.producer.name }),
    openGraph: { images: p.photo ? [img(p.photo, 1200)!] : [] },
  };
}

export default async function Ficha({ params }: Props) {
  const [p, t] = await Promise.all([getPisco((await params).slug), getT()]);
  if (!p) notFound();
  const { AWARD, AXIS, CRITERIA, STILL, STYLE } = labels(t.locale);
  const { dec } = fmt(t.locale);

  const varieties = p.varietyShares.map((v) => (v.sharePct ? `${v.name} ${v.sharePct} %` : v.name)).join(" · ");
  const specs: [string, string | null][] = [
    [t("spec.style"), p.style ? STYLE[p.style] : null],
    [t(p.varietyShares.length > 1 ? "spec.varieties" : "spec.variety"), varieties || null],
    [t("spec.alcohol"), p.abvPct != null ? `${dec(p.abvPct)} % vol` : null],
    [t("spec.bottle"), p.bottleSizeMl ? `${p.bottleSizeMl} ml` : null],
    [t("spec.rest"), p.restMonths != null ? t.n("common.months", p.restMonths) : null],
    [t("spec.still"), p.stillType ? STILL[p.stillType] : null],
  ];
  const inStock = p.prices.filter((l) => l.inStock);

  return (
    <main className="page">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <Link href="/catalogo" className="mono" style={{ fontSize: 18, letterSpacing: 0, color: "var(--ink-2)" }} aria-label={t("ficha.back")}>‹</Link>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <Chakana size={12} /><span className="mono" style={{ letterSpacing: "0.26em", color: "var(--ink-4)" }}>{t("ficha.header")}</span><Chakana size={12} />
        </div>
        <SaveHeart piscoId={p.id} />
      </div>

      <div className="ficha">
        <section className="ficha-hero">
          <SteppedBand />
          <div className="vitrine"><Photo src={p.photo} alt={p.name} w={600} eager /><Brackets /></div>
          <Link href={`/bodega/${p.producerInfo.slug}`} className="ficha-bodega">{p.producer.name}{p.producerInfo.verified ? " ✓" : ""}</Link>
          <h1 className="ficha-name">{p.name}</h1>
          <p className="ficha-sub">{[p.vintage ? t("ficha.vintage", { year: p.vintage }) : null, p.valley ? t("common.valleyOf", { valley: p.valley }) : p.region?.name].filter(Boolean).join(" · ")}</p>
          <div className="rating-block">
            <span className="score">{dec(p.avgRating)}</span><span className="div" />
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 12, color: "var(--ink-2)" }}>{t.n("ficha.reviews", p.ratingsCount)}</div>
              {p.ranking && <div className="mono" style={{ letterSpacing: "0.12em", color: "var(--muted-2)" }}>{t("ficha.ranking", { pos: p.ranking.position, variety: p.ranking.variety })}</div>}
            </div>
          </div>
        </section>

        <section className="ficha-body">
          <div className="textile" />
          <div className="spec">
            {specs.filter(([, v]) => v).map(([k, v]) => <div key={k}><div className="mono">{k}</div><div className="v">{v}</div></div>)}
          </div>

          {p.description && <p className="prose" style={{ marginTop: 22 }}>{p.description}</p>}

          {p.notes.length > 0 && (
            <>
              <SectionHead label={t("ficha.notes")} gloss={t("ficha.notesGloss")} />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
                {p.notes.map((n) => <span key={n.id} className="chip chip-note" title={t.locale === "en" ? n.es : n.en}>{t.locale === "en" ? n.en : n.es}</span>)}
              </div>
            </>
          )}

          {p.flavours.length > 0 && (
            <div className="bars">
              {p.flavours.map((f) => (
                <div key={f.axis}>
                  <div className="bar-label"><span>{AXIS[f.axis]}</span><span>{dec(f.value)}</span></div>
                  <div className="bar"><i className={f.axis === "dulzor" ? "t" : ""} style={{ width: `${(f.value / 5) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          )}

          {p.awards.length > 0 && (
            <>
              <SectionHead label={t("ficha.awards")} gloss={t("ficha.awardsGloss")} />
              {p.awards.map((a) => (
                <div key={a.id} className="award">
                  <Chakana size={36} />
                  <div><div className="n">{AWARD[a.level]}</div><div style={{ fontSize: 12, color: "var(--ink-4)", marginTop: 2 }}>{a.competition} · {a.year}</div></div>
                </div>
              ))}
            </>
          )}

          <SectionHead label={t("ficha.whereToBuy")} gloss={t("ficha.whereToBuyGloss")} />
          <Places piscoId={p.id} initial={p.prices} producerId={p.producerId} />

          <div className="actionbar">
            <SteppedBand opacity={0.6} style={{ position: "absolute", left: 0, right: 0, top: -12 }} />
            {p.minPriceCents != null && (
              <div>
                <div className="price"><Price cents={p.minPriceCents} currency="PEN" digits={0} /></div>
                <div className="mono" style={{ letterSpacing: "0.14em", marginTop: 3, whiteSpace: "nowrap" }}>{t.n("ficha.fromShops", inStock.length)}</div>
              </div>
            )}
            <FichaActions piscoId={p.id} piscoName={p.name} />
          </div>

          {p.siblings.length > 0 && (
            <>
              <SectionHead label={t("ficha.sameBodega")} />
              <div className="minis">
                {p.siblings.slice(0, 3).map((s) => (
                  <Link key={s.id} href={`/pisco/${s.slug}`} className="mini">
                    <div className="ph"><Photo src={s.photo} alt={s.name} w={200} /></div>
                    <div className="n">{s.name}</div>
                    <div className="mono" style={{ letterSpacing: "0.04em", marginTop: 3 }}>{dec(s.avgRating)} · {dec(s.abvPct)} %</div>
                  </Link>
                ))}
              </div>
            </>
          )}

          {p.criteria && (
            <>
              <SectionHead label={t("ficha.byCriterion")} gloss={t("ficha.byCriterionGloss")} />
              <div className="bars" style={{ marginTop: 14 }}>
                {CRITERIA.map((c) => (
                  <div key={c.key}>
                    <div className="bar-label"><span>{c.label} / {c.gloss}</span><span>{dec(p.criteria!.averages[c.key])}</span></div>
                    <div className="bar"><i style={{ width: `${(p.criteria!.averages[c.key] / 5) * 100}%` }} /></div>
                  </div>
                ))}
              </div>
              <div className="mono" style={{ marginTop: 10, letterSpacing: "0.12em" }}>{t.n("ficha.starCatas", p.criteria.count)}</div>
            </>
          )}

          <SectionHead label={t("ficha.reviews")} gloss={t("ficha.reviewsGloss")} />
          <Reviews piscoId={p.id} />
        </section>
      </div>
    </main>
  );
}
