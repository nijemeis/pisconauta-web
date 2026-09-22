"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AwardLevel, FlavourAxis, PiscoDetail, PiscoInput, PiscoStyle, StillType, Taxonomy } from "@/lib/types";
import { fmt, labels } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { Spinner } from "@/components/motifs";
import { ClientApiError, api, useSession } from "@/components/session";

type PhotoIn = NonNullable<PiscoInput["photos"]>[number] & { url: string };
const AXES: FlavourAxis[] = ["cuerpo", "dulzor", "herbal", "citrico", "floral", "alcohol"];
const STEP_KEYS = ["ed.step1", "ed.step2", "ed.step3"] as const;

/** Draft state mirrors PiscoInput; numbers are kept as strings while typing. */
function initial(p: PiscoDetail, locale: Locale = "es") {
  return {
    name: p.name === "Nueva botella" ? "" : p.name,
    style: p.style as PiscoStyle | null,
    regionSlug: p.region?.slug ?? "",
    valley: p.valley ?? "",
    vintage: p.vintage?.toString() ?? "",
    abvPct: (locale === "en" ? p.abvPct?.toString() : p.abvPct?.toString().replace(".", ",")) ?? "",
    bottleSizeMl: p.bottleSizeMl?.toString() ?? "700",
    restMonths: p.restMonths?.toString() ?? "",
    stillType: p.stillType as StillType | null,
    distillations: p.distillations?.toString() ?? "1",
    description: p.description ?? "",
    varieties: p.varietyShares.map((v) => v.slug),
    noteIds: p.notes.map((n) => n.id),
    flavours: Object.fromEntries(AXES.map((a) => [a, p.flavours.find((f) => f.axis === a)?.value ?? null])) as Record<FlavourAxis, number | null>,
    awards: p.awards.map((a) => ({ competition: a.competition, level: a.level, year: a.year })),
    priceSoles: p.prices.find((l) => l.retailer.startsWith("Precio sugerido"))?.priceCents ? String(p.prices.find((l) => l.retailer.startsWith("Precio sugerido"))!.priceCents / 100) : "",
    photos: p.photos.filter((ph) => ph.kind !== "cover").map((ph) => ({ key: ph.url.replace(/^\/media\//, ""), kind: ph.kind as PhotoIn["kind"], url: ph.url })) as PhotoIn[],
  };
}
type Draft = ReturnType<typeof initial>;

const n = (s: string) => { const v = Number(s.replace(",", ".")); return s.trim() === "" || Number.isNaN(v) ? null : v; };

function toInput(d: Draft): PiscoInput {
  return {
    name: d.name.trim() || undefined, style: d.style, regionSlug: d.regionSlug || null, valley: d.valley.trim() || null,
    vintage: n(d.vintage), abvPct: n(d.abvPct), bottleSizeMl: n(d.bottleSizeMl), restMonths: n(d.restMonths), stillType: d.stillType,
    distillations: n(d.distillations), description: d.description.trim() || null,
    varieties: d.varieties.map((slug) => ({ slug })), noteIds: d.noteIds,
    flavours: AXES.flatMap((axis) => (d.flavours[axis] == null ? [] : [{ axis, value: d.flavours[axis]! }])),
    awards: d.awards.filter((a) => a.competition.trim().length > 1), priceSoles: n(d.priceSoles),
    photos: d.photos.map(({ url: _u, ...p }) => p),
  };
}

export function BottleEditor({ pisco, taxonomy }: { pisco: PiscoDetail; taxonomy: Taxonomy }) {
  const { toast, me, t } = useSession();
  const [d, setD] = useState<Draft>(() => initial(pisco, t.locale));
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState(pisco.status);
  const [saveState, setSaveState] = useState<"saved" | "dirty" | "saving" | "error">("saved");
  // Which footer button is waiting on the server, so it can show a spinner and block double taps.
  const [busy, setBusy] = useState<"draft" | "next" | "publish" | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(pisco.reviewNote);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [noteOpen, setNoteOpen] = useState(false);
  const latest = useRef(d);
  const dirty = useRef(false);
  const { AWARD, AXIS, STATUS, STILL, STYLE } = labels(t.locale);
  const { dec } = fmt(t.locale);
  const STEPS = STEP_KEYS.map((k) => t(k));
  const note = (x: { es: string; en: string }) => (t.locale === "en" ? x.en : x.es);
  const router = useRouter();
  const home = me.user?.role === "admin" ? `/productor?bodega=${pisco.producerId}` : "/productor";

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => { setD((x) => { const next = { ...x, [k]: v }; latest.current = next; return next; }); dirty.current = true; setSaveState("dirty"); };

  const save = useCallback(async () => {
    if (!dirty.current) return true;
    dirty.current = false; setSaveState("saving");
    try { await api(`/piscos/${pisco.id}`, { method: "PATCH", body: toInput(latest.current) }); setSaveState(dirty.current ? "dirty" : "saved"); return true; }
    catch (e) {
      dirty.current = true; setSaveState("error");
      const err = e as ClientApiError; if (err.fields) setErrors(err.fields); else toast(err.message);
      return false;
    }
  }, [pisco.id, toast]);

  // Autosave every 5 s while there are unsaved changes.
  useEffect(() => { const t = setInterval(save, 5000); return () => clearInterval(t); }, [save]);

  const upload = async (kind: "bottle" | "label", file?: File) => {
    if (!file) return;
    setUploading((u) => ({ ...u, [kind]: true }));
    const form = new FormData(); form.append("file", file); form.append("kind", "pisco");
    try {
      const r = await api<{ key: string; url: string; width: number; height: number; phash: string }>("/uploads", { form });
      set("photos", [...latest.current.photos.filter((p) => p.kind !== kind), { key: r.key, kind, width: r.width, height: r.height, phash: r.phash, url: r.url }]);
    } catch (e) { toast((e as Error).message); }
    setUploading((u) => ({ ...u, [kind]: false }));
  };

  const publish = async () => {
    if (busy) return;
    setBusy("publish"); setErrors({}); setBanner(null);
    if (!(await save())) { setBusy(null); return; }
    try {
      await api(`/piscos/${pisco.id}/publish`, { method: "POST" });
      setStatus("published"); toast(t("ed.submitted"));
      router.push(home); router.refresh();
    } catch (e) {
      const err = e as ClientApiError;
      setBanner(err.message);
      if (err.fields) { setErrors(err.fields); const f = Object.keys(err.fields); setStep(f.some((k) => ["name", "photos"].includes(k)) ? 0 : 1); }
    } finally { setBusy(null); }
  };
  const saveDraft = async () => {
    if (busy) return;
    setBusy("draft");
    try { if (await save()) toast(t("ed.draftSaved")); } finally { setBusy(null); }
  };
  const nextStep = async () => {
    if (busy) return;
    setBusy("next");
    try { await save(); } finally { setBusy(null); }
    setStep(step + 1); window.scrollTo(0, 0);
  };

  const toggleVariety = (slug: string) => set("varieties", d.style === "puro" ? [slug] : d.varieties.includes(slug) ? d.varieties.filter((v) => v !== slug) : [...d.varieties, slug]);
  const E = ({ k }: { k: string }) => (errors[k] ? <span className="err" style={{ display: "block" }}>{errors[k]}</span> : null);
  const valleys = taxonomy.regions.find((r) => r.slug === d.regionSlug)?.valleys ?? [];
  const photo = (kind: string) => d.photos.find((p) => p.kind === kind);

  return (
    <main className="page page-narrow" style={{ paddingBottom: 140 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href={home} className="mono" onClick={() => save()}>‹ {t(me.user?.role === "admin" ? "ed.backAdmin" : "ed.backOwn")}</Link>
        <span className="serif" style={{ fontSize: 22 }}>{d.name || t("common.newBottle")}</span>
        <span className="mono gold">{t("ed.stepOf", { n: step + 1 })}</span>
      </div>
      <div className="tabs" role="tablist">
        {STEPS.map((s, i) => <button key={s} role="tab" aria-selected={step === i} onClick={() => setStep(i)}>{i + 1} · {s}</button>)}
      </div>
      <div className="mono" style={{ textAlign: "center", marginTop: 12 }}>
        <span className={`badge ${status}`}>{STATUS[status]}</span>{" "}
        {t(saveState === "saved" ? "ed.saved" : saveState === "saving" ? "common.saving" : saveState === "error" ? "ed.saveError" : "ed.unsaved")}
      </div>
      {banner && <div className="panel" style={{ marginTop: 16, borderColor: "var(--terracotta)", color: "var(--ink-2)" }}>{banner}</div>}

      {step === 0 && (
        <>
          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            {(["bottle", "label"] as const).map((kind) => (
              <label key={kind} className={`slot${kind === "bottle" ? " req" : ""}`}>
                {photo(kind) ? <img src={`${photo(kind)!.url}?w=200`} alt="" /> : <span className="mono" style={{ letterSpacing: "0.14em", fontSize: 9 }}>{uploading[kind] ? t("ed.uploading") : <>+<br />{t(kind === "bottle" ? "ed.photoBottle" : "ed.photoLabel")}</>}</span>}
                <input type="file" accept="image/*" hidden onChange={(e) => upload(kind, e.target.files?.[0])} />
              </label>
            ))}
            <div className="panel" style={{ flex: 1, padding: 12 }}>
              <div className="mono gold">{t("ed.tip")}</div>
              <p style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 6 }}>{t("ed.tipText")}</p>
            </div>
          </div>
          <E k="photos" />
          <label className="field"><span className="mono">{t("ed.name")}</span>
            <input className={`input${d.name ? " filled" : ""}`} style={{ fontSize: 24 }} value={d.name} onChange={(e) => set("name", e.target.value)} placeholder="Quebranta Puro" /><E k="name" />
          </label>
          <label className="field"><span className="mono">{t("ed.description")}</span>
            <textarea className="input" value={d.description} onChange={(e) => set("description", e.target.value)} maxLength={2000} placeholder={t("ed.descriptionPlaceholder")} />
          </label>
        </>
      )}

      {step === 1 && (
        <>
          <div className="cols-3">
            <label className="field"><span className="mono">{t("ed.abv")}</span><input className={`input${d.abvPct ? " filled" : ""}`} inputMode="decimal" value={d.abvPct} onChange={(e) => set("abvPct", e.target.value)} placeholder={t("ed.abvPlaceholder")} /><E k="abvPct" /></label>
            <label className="field"><span className="mono">{t("ed.size")}</span>
              <select className="input filled" value={d.bottleSizeMl} onChange={(e) => set("bottleSizeMl", e.target.value)}>{[50, 200, 375, 500, 700, 750, 1000, 1750].map((s) => <option key={s} value={s}>{s} ml</option>)}</select><E k="bottleSizeMl" />
            </label>
            <label className="field"><span className="mono">{t("ed.vintage")}</span><input className={`input${d.vintage ? " filled" : ""}`} inputMode="numeric" value={d.vintage} onChange={(e) => set("vintage", e.target.value)} placeholder="2024" /><E k="vintage" /></label>
          </div>
          <div className="field"><span className="mono">{t("ed.style")}</span>
            <div className="segmented">{(Object.keys(STYLE) as PiscoStyle[]).map((s) => <button key={s} type="button" aria-pressed={d.style === s} onClick={() => { set("style", s); if (s === "puro" && latest.current.varieties.length > 1) set("varieties", latest.current.varieties.slice(0, 1)); }}>{STYLE[s]}</button>)}</div><E k="style" />
          </div>
          <div className="field"><span className="mono">{t(d.style !== "puro" ? "ed.varietyMulti" : "ed.variety")}</span>
            <div className="chips">{taxonomy.varieties.map((v) => <button key={v.slug} type="button" className="chip" aria-pressed={d.varieties.includes(v.slug)} onClick={() => toggleVariety(v.slug)}>{v.name}</button>)}</div><E k="varieties" />
          </div>
          <div className="cols-2">
            <label className="field"><span className="mono">{t("ed.region")}</span>
              <select className={`input${d.regionSlug ? " filled" : ""}`} value={d.regionSlug} onChange={(e) => set("regionSlug", e.target.value)}><option value="">—</option>{taxonomy.regions.map((r) => <option key={r.slug} value={r.slug}>{r.name}</option>)}</select><E k="regionSlug" />
            </label>
            <label className="field"><span className="mono">{t("ed.valley")}</span><input className={`input${d.valley ? " filled" : ""}`} list="valleys" value={d.valley} onChange={(e) => set("valley", e.target.value)} /><datalist id="valleys">{valleys.map((v) => <option key={v} value={v} />)}</datalist></label>
          </div>
          <div className="field"><span className="mono">{t("ed.notes")}</span>
            <div className="chips">
              {d.noteIds.map((id) => { const term = taxonomy.noteTerms.find((x) => x.id === id); return term ? <button key={id} type="button" className="chip on" onClick={() => set("noteIds", d.noteIds.filter((x) => x !== id))}>{note(term)} ✕</button> : null; })}
              <button type="button" className="chip" style={{ borderStyle: "dashed" }} onClick={() => setNoteOpen(!noteOpen)}>{t("ed.addNote")}</button>
            </div>
            {noteOpen && <div className="chips panel" style={{ marginTop: 10 }}>{taxonomy.noteTerms.filter((x) => !d.noteIds.includes(x.id)).map((x) => <button key={x.id} type="button" className="chip" title={t.locale === "en" ? x.es : x.en} onClick={() => d.noteIds.length < 12 && set("noteIds", [...d.noteIds, x.id])}>{note(x)}</button>)}</div>}
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div className="cols-3">
            <label className="field"><span className="mono">{t("ed.rest")}</span><input className={`input${d.restMonths ? " filled" : ""}`} inputMode="numeric" value={d.restMonths} onChange={(e) => set("restMonths", e.target.value)} placeholder="12" /></label>
            <label className="field"><span className="mono">{t("ed.still")}</span>
              <select className={`input${d.stillType ? " filled" : ""}`} value={d.stillType ?? ""} onChange={(e) => set("stillType", (e.target.value || null) as StillType | null)}><option value="">—</option>{(Object.keys(STILL) as StillType[]).map((s) => <option key={s} value={s}>{STILL[s]}</option>)}</select>
            </label>
            <label className="field"><span className="mono">{t("ed.price")}</span><input className={`input${d.priceSoles ? " filled" : ""}`} inputMode="decimal" value={d.priceSoles} onChange={(e) => set("priceSoles", e.target.value)} placeholder="89" /></label>
          </div>
          <div className="field"><span className="mono">{t("ed.flavour")}</span>
            <div className="bars" style={{ marginTop: 12 }}>
              {AXES.map((a) => (
                <div key={a}>
                  <div className="bar-label"><span>{AXIS[a]}</span><span>{d.flavours[a] == null ? "—" : dec(d.flavours[a])}</span></div>
                  <div className="range"><div className="track" /><div className="fill" style={{ left: 0, right: `${100 - ((d.flavours[a] ?? 0) / 5) * 100}%`, background: a === "dulzor" ? "var(--terracotta)" : undefined }} />
                    <input type="range" min={0} max={5} step={0.5} value={d.flavours[a] ?? 0} aria-label={AXIS[a]} onChange={(e) => set("flavours", { ...d.flavours, [a]: Number(e.target.value) })} /></div>
                </div>
              ))}
            </div>
          </div>
          <div className="field"><span className="mono">{t("ed.awards")}</span>
            {d.awards.map((a, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 150px 80px 24px", gap: 10, alignItems: "end", marginTop: 8 }}>
                <input className="input" style={{ fontSize: 16 }} placeholder={t("ed.competition")} value={a.competition} onChange={(e) => set("awards", d.awards.map((x, j) => (j === i ? { ...x, competition: e.target.value } : x)))} />
                <select className="input" style={{ fontSize: 16 }} value={a.level} onChange={(e) => set("awards", d.awards.map((x, j) => (j === i ? { ...x, level: e.target.value as AwardLevel } : x)))}>{(Object.keys(AWARD) as AwardLevel[]).map((l) => <option key={l} value={l}>{AWARD[l]}</option>)}</select>
                <input className="input" style={{ fontSize: 16 }} inputMode="numeric" value={a.year} onChange={(e) => set("awards", d.awards.map((x, j) => (j === i ? { ...x, year: Number(e.target.value) || x.year } : x)))} />
                <button type="button" aria-label={t("ed.removeAward")} onClick={() => set("awards", d.awards.filter((_, j) => j !== i))}>✕</button>
              </div>
            ))}
            <button type="button" className="chip" style={{ borderStyle: "dashed", marginTop: 12 }} onClick={() => set("awards", [...d.awards, { competition: "", level: "oro", year: new Date().getFullYear() }])}>{t("ed.addAward")}</button>
          </div>
        </>
      )}

      <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, background: "var(--bar)", borderTop: "1px solid rgba(var(--gold-rgb),0.25)", padding: "14px 20px calc(14px + env(safe-area-inset-bottom))", zIndex: 35 }}>
        <div style={{ display: "flex", gap: 10, maxWidth: 720, margin: "0 auto" }}>
          <button className="btn btn-outline" onClick={saveDraft} disabled={!!busy} aria-busy={busy === "draft"}>{busy === "draft" && <Spinner />}{t("ed.draft")}</button>
          {step < 2
            ? <button className="btn btn-gold" style={{ flex: 1 }} onClick={nextStep} disabled={!!busy} aria-busy={busy === "next"}>{busy === "next" && <Spinner />}{t("ed.next", { step: STEPS[step + 1] })}</button>
            : <button className="btn btn-gold" style={{ flex: 1 }} onClick={publish} disabled={!!busy} aria-busy={busy === "publish"}>{busy === "publish" && <Spinner />}{t(status === "published" ? "ed.resubmit" : "ed.submit")}</button>}
        </div>
      </div>
    </main>
  );
}
