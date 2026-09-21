import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { getProducer } from "@/lib/catalog";
import { fmt, labels } from "@/lib/format";
import { getT } from "@/lib/i18n/server";
import { Photo } from "@/components/pisco-card";
import { BodegaForm, NewBottleButton } from "./client";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("prod.title") };
}

export default async function Productor({ searchParams }: { searchParams: Promise<{ bodega?: string; nueva?: string }> }) {
  const sp = await searchParams;
  const [user, t] = await Promise.all([getUser(), getT()]);
  const { STATUS } = labels(t.locale);
  const { cardMeta, dec } = fmt(t.locale);
  if (!user) redirect("/cuenta?rol=productor");
  const isAdmin = user.role === "admin";
  // Admins step into any bodega with ?bodega=<id> to help a producer; ?nueva=1 registers one on their behalf.
  if (isAdmin && !sp.bodega && !sp.nueva) redirect("/admin?tab=bodegas");
  const membership = isAdmin ? (sp.bodega ? { producerId: sp.bodega } : null) : await db.producerMember.findFirst({ where: { userId: user.id } });
  const regions = await db.region.findMany({ orderBy: { sort: "asc" } });
  const regionOpts = regions.map((r) => ({ slug: r.slug, name: r.name, valleys: r.valleys as string[] }));

  if (!membership) {
    return (
      <main className="page page-narrow">
        <div className="mono gold">{t(isAdmin ? "prod.adminOnBehalf" : "prod.step1")}</div>
        <h1 className="title" style={{ marginTop: 4 }}>{t(isAdmin ? "prod.registerAdmin" : "prod.registerOwn")}</h1>
        <p className="prose" style={{ marginTop: 12 }}>{t("prod.registerIntro")}</p>
        <BodegaForm regions={regionOpts} />
      </main>
    );
  }

  const b = await getProducer(membership.producerId, { includeDrafts: true });
  if (!b) redirect(isAdmin ? "/admin?tab=bodegas" : "/");
  const q = isAdmin ? `?bodega=${b.id}` : "";
  return (
    <main className="page" style={{ maxWidth: 1000 }}>
      {isAdmin && <div className="panel panel-gold" style={{ marginBottom: 22, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><span>{t("prod.adminBanner")}</span><Link href="/admin?tab=bodegas" className="mono gold">{t("prod.backToAdmin")}</Link></div>}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div className="mono gold">{t(b.status === "verified" ? "prod.statusVerified" : b.status === "pending" ? "prod.statusPending" : "prod.statusRejected")}</div>
          <h1 className="title" style={{ marginTop: 4 }}>{b.name}</h1>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href={`/productor/bodega${q}`} className="btn btn-outline btn-sm">{t("prod.editProfile")}</Link>
          {b.verified && <Link href={`/bodega/${b.slug}`} className="btn btn-outline btn-sm">{t("prod.viewPublic")}</Link>}
          <NewBottleButton producerId={b.id} />
        </div>
      </div>

      {b.status !== "verified" && !isAdmin && (
        <div className="panel panel-gold" style={{ marginTop: 22 }}>
          {b.status === "pending"
            ? t("prod.pendingNote")
            : t("prod.rejectedNote")}
        </div>
      )}

      <div className="stats">
        <div><div className="v">{b.piscos.filter((p) => p.status === "published").length}</div><div className="mono">{t("prod.statPublished")}</div></div>
        <div><div className="v">{b.piscos.filter((p) => p.status === "in_review").length}</div><div className="mono">{t("prod.statInReview")}</div></div>
        <div><div className="v">{b.piscos.filter((p) => p.status === "draft").length}</div><div className="mono">{t("prod.statDrafts")}</div></div>
      </div>

      <div className="rows" style={{ marginTop: 14 }}>
        {b.piscos.map((p) => (
          <Link key={p.id} href={`/productor/pisco/${p.id}`} className="row">
            <div className="ph"><Photo src={p.photo} alt={p.name} w={200} /></div>
            <div>
              <div className="n">{p.name === "Nueva botella" ? t("common.newBottle") : p.name}</div>
              <div className="mono" style={{ letterSpacing: "0.1em", marginTop: 5 }}>{cardMeta(p) || t("prod.noData")}</div>
            </div>
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <span className={`badge ${p.status}`}>{STATUS[p.status]}</span>
              {p.status === "published" && <div className="serif gold" style={{ fontSize: 22, marginTop: 4 }}>{dec(p.avgRating)}</div>}
            </div>
          </Link>
        ))}
        {!b.piscos.length && <p className="muted" style={{ padding: "40px 0", textAlign: "center" }}>{t("prod.noBottles")}</p>}
      </div>
    </main>
  );
}
