"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import type { ScanResult } from "@/lib/types";
import { fmt } from "@/lib/format";
import { Brackets } from "@/components/motifs";
import { Photo } from "@/components/pisco-card";
import { api, useSession } from "@/components/session";

type State = "idle" | "matching" | "matched" | "no-match" | "suggest" | "sent";

/** Web scanner: the phone's camera via a capture input (the native apps stream frames instead). */
export function Scanner({ startSuggest }: { startSuggest: boolean }) {
  const [state, setState] = useState<State>(startSuggest ? "suggest" : "idle");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [index, setIndex] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const { toast, t } = useSession();
  const { dec } = fmt(t.locale);

  const onFile = async (file?: File) => {
    if (!file) return;
    setState("matching");
    const form = new FormData();
    form.append("file", file);
    try {
      const r = await api<ScanResult>("/scan", { form });
      setResult(r); setIndex(0);
      setState(r.candidates.length ? "matched" : "no-match");
    } catch (e) { toast((e as Error).message); setState("idle"); }
  };
  const suggest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await api("/suggestions", { body: { name: f.get("name"), producerName: f.get("producerName") || null, note: f.get("note") || null } });
      setState("sent");
    } catch (err) { toast((err as Error).message); }
  };

  const hit = result?.candidates[index];
  return (
    <main className="page" style={{ maxWidth: 520, textAlign: "center" }}>
      <div className="mono" style={{ letterSpacing: "0.24em" }}>{t("scan.align")}</div>
      <button onClick={() => input.current?.click()} aria-label={t("scan.openCamera")}
        style={{ position: "relative", width: 230, height: 320, margin: "28px auto 0", display: "block", backgroundImage: "repeating-linear-gradient(135deg, rgba(var(--line-rgb),0.05) 0 1px, transparent 1px 14px)" }}>
        <Brackets outer={30} inner={14} offset={11} />
        <span style={{ position: "absolute", left: 16, right: 16, top: "50%", height: 1, background: "linear-gradient(90deg, transparent, var(--gold), transparent)" }} />
        <span className="mono" style={{ position: "absolute", left: 0, right: 0, bottom: 40 }}>{t(state === "matching" ? "scan.searching" : "scan.tap")}</span>
      </button>
      <input ref={input} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />

      {state === "matched" && hit && (
        <div className="panel panel-gold" style={{ marginTop: 28, textAlign: "left" }}>
          <div className="mono">{t("scan.recognised")}</div>
          <div style={{ display: "flex", gap: 14, marginTop: 12, alignItems: "center" }}>
            <div style={{ width: 62, height: 86, overflow: "hidden", flexShrink: 0 }}><Photo src={hit.pisco.photo} alt={hit.pisco.name} w={200} /></div>
            <div>
              <div className="serif" style={{ fontSize: 24, lineHeight: 1.1 }}>{hit.pisco.name}{hit.pisco.vintage ? ` ${hit.pisco.vintage}` : ""}</div>
              <div style={{ fontSize: 12, color: "var(--ink-4)" }}>{hit.pisco.producer.name}{hit.pisco.region ? ` · ${hit.pisco.region.name}` : ""}</div>
              <div className="mono gold" style={{ marginTop: 4, letterSpacing: "0.12em" }}>{t("scan.match", { pct: Math.round(hit.confidence * 100) })}</div>
            </div>
            <div className="serif gold" style={{ fontSize: 24, marginLeft: "auto" }}>{dec(hit.pisco.avgRating)}</div>
          </div>
          <div className="cols-2" style={{ marginTop: 16, gap: 10 }}>
            <Link className="btn btn-gold" href={`/pisco/${hit.pisco.slug}`}>{t("scan.view")}</Link>
            {index + 1 < (result?.candidates.length ?? 0)
              ? <button className="btn btn-outline" onClick={() => setIndex(index + 1)}>{t("scan.notThis")}</button>
              : <Link className="btn btn-outline" href={`/catalogo${result?.ocrQuery ? `?q=${encodeURIComponent(result.ocrQuery)}` : ""}`}>{t("scan.notThis")}</Link>}
          </div>
        </div>
      )}

      {state === "no-match" && (
        <div className="panel" style={{ marginTop: 28 }}>
          <p className="serif" style={{ fontSize: 22 }}>{t("scan.noMatch")}</p>
          <div className="cols-2" style={{ marginTop: 16, gap: 10 }}>
            <Link className="btn btn-outline" href={`/catalogo${result?.ocrQuery ? `?q=${encodeURIComponent(result.ocrQuery)}` : ""}`}>{t("scan.searchByHand")}</Link>
            <button className="btn btn-goldline" onClick={() => setState("suggest")}>{t("scan.suggest")}</button>
          </div>
        </div>
      )}

      {state === "suggest" && (
        <form className="panel" style={{ marginTop: 28, textAlign: "left" }} onSubmit={suggest}>
          <div className="sheet-title">{t("scan.suggest")}</div>
          <p className="muted">{t("scan.suggestHelp")}</p>
          <label className="field"><span className="mono">{t("scan.bottleName")}</span><input className="input" name="name" required minLength={2} /></label>
          <label className="field"><span className="mono">{t("scan.bodega")}</span><input className="input" name="producerName" /></label>
          <label className="field"><span className="mono">{t("scan.more")}</span><textarea className="input" name="note" /></label>
          <button className="btn btn-gold btn-block" style={{ marginTop: 20 }}>{t("scan.send")}</button>
        </form>
      )}
      {state === "sent" && <p className="serif" style={{ fontSize: 22, marginTop: 28 }}>{t("scan.thanks")}</p>}
    </main>
  );
}
