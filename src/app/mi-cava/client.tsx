"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { CellarPayload } from "@/lib/types";
import { fmt } from "@/lib/format";
import { Chakana } from "@/components/motifs";
import { PiscoRow } from "@/components/pisco-card";
import { api, useSession } from "@/components/session";

export function CellarView() {
  const [data, setData] = useState<CellarPayload | null>(null);
  const [tab, setTab] = useState<"tasted" | "wishlist" | "lists">("tasted");
  const { toast, t } = useSession();
  const { dec, shortDate } = fmt(t.locale);
  useEffect(() => { api<CellarPayload>("/cellar").then(setData).catch((e) => toast(e.message)); }, [toast]);

  const items = data ? (tab === "tasted" ? data.tasted : tab === "wishlist" ? data.wishlist : []) : [];
  return (
    <main className="page page-narrow">
      <h1 className="serif" style={{ fontSize: 34 }}>{t("cava.title")}</h1>
      <div className="mono" style={{ marginTop: 4 }}>{t("cava.sub", { n: data?.stats.tastedCount ?? "…" })}</div>
      <div className="cols-2" style={{ marginTop: 18 }}>
        <div className="panel panel-gold"><div className="mono">{t("cava.favVariety")}</div><div className="serif" style={{ fontSize: 22, marginTop: 4 }}>{data?.stats.favouriteVariety ?? "—"}</div></div>
        <div className="panel panel-gold"><div className="mono">{t("cava.topValley")}</div><div className="serif" style={{ fontSize: 22, marginTop: 4 }}>{data?.stats.topRegion ?? "—"}</div></div>
      </div>
      <div className="tabs" role="tablist" style={{ justifyContent: "flex-start" }}>
        {([["tasted", t("cava.tabTasted")], ["wishlist", t("cava.tabWishlist")], ["lists", t("cava.tabLists")]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l}</button>)}
      </div>

      {!data ? <div className="skeleton" style={{ height: 240, marginTop: 18 }} /> : tab === "lists" ? (
        <Empty text={t("cava.listsSoon")} help={t("cava.listsSoonHelp")} />
      ) : !items.length ? (
        <Empty text={t(tab === "tasted" ? "cava.emptyTasted" : "cava.emptyWishlist")} help={t("cava.emptyHelp")} cta={t("cava.goDiscover")} />
      ) : (
        <div className="rows">
          {items.map((i) => (
            <PiscoRow key={i.pisco.id} p={i.pisco} right={
              <div className="score">
                {i.state === "tasted" ? <><div className="mono" style={{ fontSize: 9, letterSpacing: "0.14em" }}>{t("cava.myScore")}</div>{dec(i.personalScore)}<div className="mono" style={{ fontSize: 9, letterSpacing: "0.08em" }}>{shortDate(i.tastedAt)}</div></> : dec(i.pisco.avgRating)}
              </div>} />
          ))}
        </div>
      )}
    </main>
  );
}

function Empty({ text, help, cta }: { text: string; help: string; cta?: string }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <Chakana size={56} />
      <p className="serif" style={{ fontSize: 24, marginTop: 16 }}>{text}</p>
      <p className="muted" style={{ marginTop: 4 }}>{help}</p>
      {cta && <Link href="/" className="btn btn-gold" style={{ marginTop: 20 }}>{cta}</Link>}
    </div>
  );
}
