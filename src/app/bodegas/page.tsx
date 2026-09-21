import type { Metadata } from "next";
import Link from "next/link";
import { listProducers } from "@/lib/catalog";
import { fmt } from "@/lib/format";
import { getT } from "@/lib/i18n/server";
import { Chakana } from "@/components/motifs";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("bodegas.title") };
}

export default async function Bodegas() {
  const [items, t] = await Promise.all([listProducers(), getT()]);
  const { dec } = fmt(t.locale);
  return (
    <main className="page">
      <h1 className="title">{t("bodegas.title")}</h1>
      <div className="subtitle">{t.n("bodegas.subtitle", items.length)}</div>
      <div className="grid">
        {items.map((b) => (
          <Link key={b.id} href={`/bodega/${b.slug}`} className="card" style={{ padding: 0 }}>
            <div style={{ height: 120, backgroundImage: b.cover ? `url(${b.cover}?w=600)` : undefined, backgroundSize: "cover", backgroundPosition: "center" }} className={b.cover ? "" : "skeleton"} />
            <div style={{ padding: 16, textAlign: "center" }}>
              <div className="crest" style={{ width: 56, height: 56, marginTop: -44, fontSize: 16 }}><Chakana size={14} />{b.crestInitials}</div>
              <div className="name">{b.name}</div>
              <div className="mono gold" style={{ marginTop: 6, letterSpacing: "0.14em" }}>{[b.valley ? t("common.valleyOf", { valley: b.valley }) : b.region?.name, b.foundedYear ? t("common.since", { year: b.foundedYear }) : null].filter(Boolean).join(" · ")}</div>
              <div className="meta" style={{ marginTop: 10 }}>{t.n("common.piscos", b.piscoCount)} · {dec(b.avgRating)} · {t.n("common.medals", b.medalCount)}</div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
