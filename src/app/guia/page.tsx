import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { SectionHead } from "@/components/motifs";
import { getT } from "@/lib/i18n/server";
import type { Key } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("guia.title") };
}

const STYLES = [
  ["puro", "Puro", "guia.puro"],
  ["acholado", "Acholado", "guia.acholado"],
  ["mosto-verde", "Mosto Verde", "guia.mostoVerde"],
] as const;

export default async function Guia() {
  const [varieties, t] = await Promise.all([db.variety.findMany({ orderBy: { sort: "asc" } }), getT()]);
  // The eight D.O. grapes have translated notes; anything else falls back to the database text.
  const notes = (v: { slug: string; notes: string | null }) => t(`variety.${v.slug}` as Key).replace(`variety.${v.slug}`, "") || v.notes;
  return (
    <main className="page page-narrow">
      <h1 className="title">{t("guia.title")}</h1>
      <div className="subtitle">{t("guia.subtitle")}</div>
      <p className="prose" style={{ marginTop: 18 }}>{t("guia.intro")}</p>

      <SectionHead label={t("guia.styles")} gloss={t("guia.stylesGloss")} />
      {STYLES.map(([slug, name, key]) => (
        <Link key={slug} href={`/catalogo?style=${slug}`} className="row" style={{ display: "block" }}>
          <div className="n">{name}</div><p className="muted" style={{ marginTop: 4 }}>{t(key)}</p>
        </Link>
      ))}

      {[false, true].map((aromatic) => (
        <div key={String(aromatic)}>
          <SectionHead label={t(aromatic ? "guia.aromatic" : "guia.nonAromatic")} gloss={t(aromatic ? "guia.aromaticGloss" : "guia.nonAromaticGloss")} />
          {varieties.filter((v) => v.aromatic === aromatic).map((v) => (
            <Link key={v.id} href={`/catalogo?variety=${v.slug}`} className="row" style={{ display: "block" }}>
              <div className="n">{v.name}</div><p className="muted" style={{ marginTop: 4 }}>{notes(v)}</p>
            </Link>
          ))}
        </div>
      ))}
    </main>
  );
}
