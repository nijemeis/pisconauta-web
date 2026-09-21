import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { SteppedBand } from "@/components/motifs";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("valles.title") };
}

export default async function Valles() {
  const regions = await db.region.findMany({ orderBy: { sort: "asc" }, include: { _count: { select: { piscos: { where: { status: "published" } }, producers: { where: { status: "verified" } } } } } });
  const t = await getT();
  return (
    <main className="page">
      <h1 className="title">{t("valles.title")}</h1>
      <div className="subtitle">{t("valles.subtitle")}</div>
      <p className="prose" style={{ marginTop: 18 }}>{t("valles.intro")}</p>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
        {regions.map((r) => (
          <Link key={r.id} href={`/catalogo?region=${r.slug}`} className="card">
            <SteppedBand />
            <div className="serif" style={{ fontSize: 32, marginTop: 14 }}>{r.name}</div>
            <div className="mono" style={{ marginTop: 6, letterSpacing: "0.12em" }}>{t.n("common.piscos", r._count.piscos)} · {t.n("common.bodegas", r._count.producers)}</div>
            <p className="muted" style={{ marginTop: 12 }}>{(r.valleys as string[]).join(" · ")}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
