import Link from "next/link";
import { discover } from "@/lib/catalog";
import { getUser } from "@/lib/auth";
import { fmt } from "@/lib/format";
import { getT } from "@/lib/i18n/server";
import { SectionHead } from "@/components/motifs";
import { Photo, PiscoCard } from "@/components/pisco-card";

const greeting = () => {
  const h = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "America/Lima" }).format(new Date()));
  return h < 12 ? "home.morning" : h < 19 ? "home.afternoon" : "home.evening";
};

export default async function Descubre() {
  const [d, user, t] = await Promise.all([discover(), getUser(), getT()]);
  const { dec } = fmt(t.locale);
  const pick = d.cataDelDia;
  return (
    <main className="page">
      <div className="mono gold">{t(greeting())}{user ? `, ${user.displayName.split(" ")[0]}` : ""}</div>
      <h1 className="title" style={{ marginTop: 4 }}>{t("home.title")}</h1>

      <form action="/catalogo" className="only-mobile" style={{ marginTop: 16 }}>
        <input name="q" className="searchbox" style={{ width: "100%", padding: "13px 14px" }} placeholder={t("common.searchPlaceholder")} aria-label={t("common.search")} />
      </form>

      {pick && (
        <>
          <SectionHead label={t("home.pick")} gloss={t("home.pickGloss")} />
          <Link href={`/pisco/${pick.slug}`} className="feature">
            <div className="ph"><Photo src={pick.photo} alt={pick.name} w={400} /></div>
            <div>
              <div className="mono gold">{t("home.pick")}</div>
              <div className="serif" style={{ fontSize: 26, lineHeight: 1.1, marginTop: 6 }}>{pick.name}<br />{pick.producer.name}</div>
              <div className="mono" style={{ letterSpacing: "0.12em", marginTop: 8 }}>{pick.varieties.join(" + ")} · {dec(pick.abvPct)} %</div>
              <p style={{ marginTop: 10, color: "var(--ink-2)", maxWidth: "60ch" }}>{pick.description}</p>
            </div>
          </Link>
        </>
      )}

      <SectionHead label={t("home.valleys")} gloss={t("home.valleysGloss")} />
      <div className="rail">
        {d.regions.map((r) => <Link key={r.slug} href={`/catalogo?region=${r.slug}`} className="chip" style={{ padding: "9px 14px", fontSize: 13 }}>{r.name}</Link>)}
      </div>

      <SectionHead label={t("home.mostoVerde")} />
      <div className="rail">{d.mostoVerde.map((p) => <PiscoCard key={p.id} p={p} />)}</div>

      <SectionHead label={t("home.newest")} gloss={t("home.newestGloss")} />
      <div className="rail">{d.newest.map((p) => <PiscoCard key={p.id} p={p} />)}</div>

      <div className="panel panel-gold" style={{ marginTop: 40, display: "flex", gap: 20, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
        <div>
          <div className="serif" style={{ fontSize: 26 }}>{t("home.producerTitle")}</div>
          <p className="muted" style={{ marginTop: 4 }}>{t("home.producerText")}</p>
        </div>
        <Link href="/cuenta?rol=productor" className="btn btn-goldline">{t("top.producerCta")}</Link>
      </div>
    </main>
  );
}
