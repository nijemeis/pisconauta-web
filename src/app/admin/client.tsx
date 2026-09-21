"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { NoteFamily, PiscoCard, PiscoDetail, PiscoStatus, ProducerCard, ProducerStatus } from "@/lib/types";
import { fmt, labels } from "@/lib/format";
import type { Key } from "@/lib/i18n";
import { SectionHead } from "@/components/motifs";
import { Photo } from "@/components/pisco-card";
import { ClientApiError, api, useSession, useT } from "@/components/session";

type Tab = "pendientes" | "bodegas" | "piscos" | "notas" | "mensajes";
type Member = { email: string; displayName: string; role?: string };
type AdminProducer = ProducerCard & { ruc: string | null; website: string | null; contactEmail: string | null; contactPhone: string | null; createdAt: string; members: Member[]; counts: Record<"published" | "in_review" | "draft", number> };
type AdminPisco = PiscoCard & { producerId: string; updatedAt: string };
interface Queue {
  openMessages: number;
  producers: (ProducerCard & { ruc: string | null; website: string | null; contactEmail: string | null; description: string | null; claimants: Member[] })[];
  piscos: PiscoDetail[];
  suggestions: { id: string; name: string; producerName: string | null; note: string | null }[];
}
interface Message { id: string; name: string; email: string; topic: string; message: string; handled: boolean; createdAt: string }

const P_STATUS: Record<ProducerStatus, Key> = { pending: "admin.pStatusPending", verified: "admin.pStatusVerified", rejected: "admin.pStatusRejected" };

function useAct(reload: () => void) {
  const { toast } = useSession();
  return async (path: string, body: unknown, done?: string) => {
    try { await api(path, { body }); if (done) toast(done); reload(); } catch (e) { toast((e as Error).message); }
  };
}

export function AdminConsole({ initialTab }: { initialTab: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [queue, setQueue] = useState<Queue | null>(null);
  const router = useRouter();
  const { toast, t } = useSession();
  const loadQueue = useCallback(() => api<Queue>("/admin/queue").then(setQueue).catch((e) => toast(e.message)), [toast]);
  useEffect(() => { loadQueue(); }, [loadQueue]);
  const go = (t: Tab) => { setTab(t); router.replace(`/admin?tab=${t}`, { scroll: false }); };
  const pending = queue ? queue.producers.length + queue.piscos.length + queue.suggestions.length : 0;

  return (
    <main className="page" style={{ maxWidth: 1200 }}>
      <h1 className="title">{t("admin.title")}</h1>
      <div className="tabs" role="tablist" style={{ justifyContent: "flex-start", flexWrap: "wrap" }}>
        {([["pendientes", `${t("admin.tabPending")}${pending ? ` · ${pending}` : ""}`], ["bodegas", t("admin.tabBodegas")], ["piscos", t("admin.tabPiscos")], ["notas", t("admin.tabNotes")], ["mensajes", `${t("admin.tabMessages")}${queue?.openMessages ? ` · ${queue.openMessages}` : ""}`]] as const).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => go(k)}>{l}</button>
        ))}
      </div>
      {tab === "pendientes" && <Pending q={queue} reload={loadQueue} />}
      {tab === "bodegas" && <Bodegas onChange={loadQueue} />}
      {tab === "piscos" && <Piscos onChange={loadQueue} />}
      {tab === "notas" && <Notes />}
      {tab === "mensajes" && <Messages onChange={loadQueue} />}
    </main>
  );
}

function Pending({ q, reload }: { q: Queue | null; reload: () => void }) {
  const act = useAct(reload);
  const t = useT();
  const { STYLE } = labels(t.locale);
  const { cardMeta } = fmt(t.locale);
  if (!q) return <div className="skeleton" style={{ height: 200, marginTop: 20 }} />;
  return (
    <>
      <SectionHead label={t("admin.toVerify")} />
      {!q.producers.length && <p className="muted" style={{ marginTop: 12 }}>{t("admin.nothing")}</p>}
      {q.producers.map((b) => (
        <div key={b.id} className="panel" style={{ marginTop: 12 }}>
          <div className="serif" style={{ fontSize: 24 }}>{b.name}</div>
          <div className="mono" style={{ marginTop: 4, letterSpacing: "0.1em" }}>RUC {b.ruc ?? "—"} · {b.region?.name ?? t("admin.noRegion")} · {b.valley ?? ""} · {b.website ?? t("admin.noWeb")}</div>
          <p className="muted" style={{ marginTop: 8 }}>{b.description}</p>
          <p style={{ marginTop: 8 }}>{t("admin.requestedBy", { who: b.claimants.map((c) => `${c.displayName} <${c.email}>`).join(", ") || t("admin.byAdmin") })}</p>
          <div className="toolbar">
            <button className="btn btn-gold btn-sm" onClick={() => act(`/admin/producers/${b.id}`, { decision: "verify" }, t("admin.verifiedToast"))}>{t("admin.verify")}</button>
            <button className="btn btn-outline btn-sm" onClick={() => act(`/admin/producers/${b.id}`, { decision: "reject" })}>{t("admin.reject")}</button>
            <Link className="btn btn-outline btn-sm" href={`/productor?bodega=${b.id}`}>{t("admin.openBodega")}</Link>
          </div>
        </div>
      ))}

      <SectionHead label={t("admin.inReview")} />
      {!q.piscos.length && <p className="muted" style={{ marginTop: 12 }}>{t("admin.nothing")}</p>}
      {q.piscos.map((p) => (
        <div key={p.id} className="panel" style={{ marginTop: 12, display: "flex", gap: 16 }}>
          <div style={{ width: 90, height: 120, flexShrink: 0, overflow: "hidden" }}><Photo src={p.photo} alt={p.name} w={200} /></div>
          <div style={{ flex: 1 }}>
            <div className="serif" style={{ fontSize: 24 }}>{p.name}</div>
            <div className="muted">{p.producer.name} · {p.style ? STYLE[p.style] : ""} · {p.varieties.join(", ")} · {p.region?.name}</div>
            <div className="mono" style={{ marginTop: 4, letterSpacing: "0.1em" }}>{cardMeta(p)}</div>
            <p className="muted" style={{ marginTop: 6 }}>{p.description}</p>
            <div className="toolbar">
              <button className="btn btn-gold btn-sm" onClick={() => act(`/admin/piscos/${p.id}`, { decision: "publish" }, t("admin.publishedToast"))}>{t("admin.publish")}</button>
              <button className="btn btn-outline btn-sm" onClick={() => { const note = prompt(t("admin.returnPrompt")); if (note !== null) act(`/admin/piscos/${p.id}`, { decision: "return", note }); }}>{t("admin.return")}</button>
              <Link className="btn btn-outline btn-sm" href={`/productor/pisco/${p.id}`}>{t("admin.edit")}</Link>
            </div>
          </div>
        </div>
      ))}

      <SectionHead label={t("admin.suggested")} />
      {q.suggestions.map((s) => <div key={s.id} className="row"><div><div className="n">{s.name}</div><div className="muted">{s.producerName} {s.note ? `· ${s.note}` : ""}</div></div></div>)}
      {!q.suggestions.length && <p className="muted" style={{ marginTop: 12 }}>{t("admin.nothing")}</p>}
    </>
  );
}

function Bodegas({ onChange }: { onChange: () => void }) {
  const [items, setItems] = useState<AdminProducer[] | null>(null);
  const [filter, setFilter] = useState<"all" | ProducerStatus>("all");
  const [q, setQ] = useState("");
  const { toast, t } = useSession();
  const { shortDate } = fmt(t.locale);
  const load = useCallback(() => { api<{ items: AdminProducer[] }>("/admin/producers").then((r) => setItems(r.items)).catch((e) => toast(e.message)); onChange(); }, [toast, onChange]);
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  const act = useAct(load);

  const shown = useMemo(() => (items ?? []).filter((b) => (filter === "all" || b.status === filter) && (!q || `${b.name} ${b.ruc ?? ""} ${b.members.map((m) => m.email).join(" ")}`.toLowerCase().includes(q.toLowerCase()))), [items, filter, q]);
  const count = (s: ProducerStatus) => items?.filter((b) => b.status === s).length ?? 0;

  const assign = (b: AdminProducer) => {
    const ownerEmail = prompt(t("admin.assignPrompt", { name: b.name }));
    if (ownerEmail) act(`/admin/producers/${b.id}`, { ownerEmail }, t("admin.assignedToast"));
  };

  return (
    <>
      <div className="toolbar">
        <input className="searchbox" style={{ display: "block", width: 240 }} placeholder={t("admin.searchBodega")} value={q} onChange={(e) => setQ(e.target.value)} />
        {([["all", t("admin.filterAll", { n: items?.length ?? 0 })], ["pending", t("admin.filterPending", { n: count("pending") })], ["verified", t("admin.filterVerified", { n: count("verified") })], ["rejected", t("admin.filterRejected", { n: count("rejected") })]] as const).map(([k, l]) => (
          <button key={k} className="chip" aria-pressed={filter === k} onClick={() => setFilter(k)}>{l}</button>
        ))}
        <Link href="/productor?nueva=1" className="btn btn-goldline btn-sm" style={{ marginLeft: "auto" }}>{t("admin.registerBodega")}</Link>
      </div>
      {!items ? <div className="skeleton" style={{ height: 200, marginTop: 20 }} /> : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>{t("admin.thBodega")}</th><th>{t("admin.thStatus")}</th><th>{t("admin.thOwners")}</th><th>{t("admin.thPiscos")}</th><th>{t("admin.thCreated")}</th><th /></tr></thead>
            <tbody>
              {shown.map((b) => (
                <tr key={b.id}>
                  <td><div className="n">{b.name}</div><div className="mono" style={{ letterSpacing: "0.08em", marginTop: 3 }}>{[b.region?.name, b.valley, b.ruc ? `RUC ${b.ruc}` : t("admin.noRuc")].filter(Boolean).join(" · ")}</div></td>
                  <td><span className={`badge ${b.status}`}>{t(P_STATUS[b.status])}</span></td>
                  <td style={{ fontSize: 12 }}>{b.members.length ? b.members.map((m) => <div key={m.email}>{m.displayName}<br /><span className="muted">{m.email}</span></div>) : <button className="gold" onClick={() => assign(b)}>{t("admin.assign")}</button>}</td>
                  <td className="mono" style={{ letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{t("admin.counts", { pub: b.counts.published, rev: b.counts.in_review, draft: b.counts.draft })}</td>
                  <td className="mono" style={{ letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{shortDate(b.createdAt)}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
                      {b.status !== "verified" && <button className="btn btn-gold btn-sm" onClick={() => act(`/admin/producers/${b.id}`, { decision: "verify" }, t("admin.verifiedToast"))}>{t("admin.verify")}</button>}
                      {b.status === "verified" && <button className="btn btn-outline btn-sm" onClick={() => confirm(t("admin.unverifyConfirm", { name: b.name })) && act(`/admin/producers/${b.id}`, { decision: "unverify" })}>{t("admin.unverify")}</button>}
                      {b.status === "pending" && <button className="btn btn-outline btn-sm" onClick={() => act(`/admin/producers/${b.id}`, { decision: "reject" })}>{t("admin.reject")}</button>}
                      <Link className="btn btn-goldline btn-sm" href={`/productor?bodega=${b.id}`}>{t("admin.manage")}</Link>
                      {b.members.length > 0 && <button className="btn btn-outline btn-sm" onClick={() => assign(b)}>{t("admin.addOwner")}</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!shown.length && <p className="muted" style={{ marginTop: 16 }}>{t("admin.noBodegas")}</p>}
        </div>
      )}
    </>
  );
}

function Piscos({ onChange }: { onChange: () => void }) {
  const [items, setItems] = useState<AdminPisco[] | null>(null);
  const [status, setStatus] = useState<"" | PiscoStatus>("");
  const [q, setQ] = useState("");
  const { toast, t } = useSession();
  const { STATUS, STYLE } = labels(t.locale);
  const { cardMeta, dec, shortDate } = fmt(t.locale);
  const load = useCallback(() => {
    const sp = new URLSearchParams(); if (status) sp.set("status", status); if (q.trim()) sp.set("q", q.trim());
    api<{ items: AdminPisco[] }>(`/admin/piscos?${sp}`).then((r) => setItems(r.items)).catch((e) => toast(e.message));
  }, [status, q, toast]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);
  const act = useAct(() => { load(); onChange(); });

  return (
    <>
      <div className="toolbar">
        <input className="searchbox" style={{ display: "block", width: 240 }} placeholder={t("admin.searchPisco")} value={q} onChange={(e) => setQ(e.target.value)} />
        {([["", t("admin.pAll")], ["published", t("admin.pPublished")], ["in_review", t("admin.pInReview")], ["draft", t("admin.pDrafts")], ["archived", t("admin.pArchived")]] as const).map(([k, l]) => (
          <button key={k} className="chip" aria-pressed={status === k} onClick={() => setStatus(k)}>{l}</button>
        ))}
        <span className="mono" style={{ marginLeft: "auto" }}>{items ? t.n("common.bottles", items.length) : "…"}</span>
      </div>
      {!items ? <div className="skeleton" style={{ height: 200, marginTop: 20 }} /> : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th /><th>{t("admin.thPisco")}</th><th>{t("admin.thBodega")}</th><th>{t("admin.thStatus")}</th><th>{t("admin.thData")}</th><th>{t("admin.thScore")}</th><th>{t("admin.thEdited")}</th><th /></tr></thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id}>
                  <td style={{ width: 44 }}><div style={{ width: 36, height: 48, overflow: "hidden" }}><Photo src={p.photo} alt="" w={200} /></div></td>
                  <td><div className="n">{p.name}</div><div className="muted" style={{ fontSize: 12 }}>{[p.style ? STYLE[p.style] : null, p.varieties.join(", ")].filter(Boolean).join(" · ")}</div></td>
                  <td><Link className="gold" href={`/productor?bodega=${p.producerId}`}>{p.producer.name}</Link></td>
                  <td><span className={`badge ${p.status}`}>{STATUS[p.status]}</span></td>
                  <td className="mono" style={{ letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{cardMeta(p) || "—"}</td>
                  <td className="serif gold" style={{ fontSize: 18 }}>{p.status === "published" ? dec(p.avgRating) : "—"}</td>
                  <td className="mono" style={{ letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{shortDate(p.updatedAt)}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      {p.status === "in_review" && <button className="btn btn-gold btn-sm" onClick={() => act(`/admin/piscos/${p.id}`, { decision: "publish" }, t("admin.publishedToast"))}>{t("admin.publish")}</button>}
                      {p.status === "published" && <Link className="btn btn-outline btn-sm" href={`/pisco/${p.slug}`}>{t("admin.view")}</Link>}
                      <Link className="btn btn-goldline btn-sm" href={`/productor/pisco/${p.id}`}>{t("admin.edit")}</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!items.length && <p className="muted" style={{ marginTop: 16 }}>{t("admin.noPiscos")}</p>}
        </div>
      )}
    </>
  );
}

const TOPIC: Record<string, Key> = { general: "admin.topicGeneral", productor: "admin.topicProducer", datos: "contact.topicData", prensa: "contact.topicPress", error: "contact.topicError" };

function Messages({ onChange }: { onChange: () => void }) {
  const [items, setItems] = useState<Message[] | null>(null);
  const { toast, t } = useSession();
  const { shortDate } = fmt(t.locale);
  const load = useCallback(() => { api<{ items: Message[] }>("/admin/messages").then((r) => setItems(r.items)).catch((e) => toast(e.message)); onChange(); }, [toast, onChange]);
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  const act = useAct(load);
  if (!items) return <div className="skeleton" style={{ height: 200, marginTop: 20 }} />;
  if (!items.length) return <p className="muted" style={{ marginTop: 20 }}>{t("admin.noMessages")}</p>;
  return (
    <>
      {items.map((m) => (
        <div key={m.id} className="panel" style={{ marginTop: 12, opacity: m.handled ? 0.55 : 1 }}>
          <div className="mono" style={{ letterSpacing: "0.1em" }}>{TOPIC[m.topic] ? t(TOPIC[m.topic]) : m.topic} · {shortDate(m.createdAt)}</div>
          <div className="serif" style={{ fontSize: 20, marginTop: 4 }}>{m.name} · <a className="gold" href={`mailto:${m.email}`}>{m.email}</a></div>
          <p style={{ marginTop: 8, whiteSpace: "pre-line", color: "var(--ink-2)" }}>{m.message}</p>
          <div className="toolbar"><button className="btn btn-outline btn-sm" onClick={() => act("/admin/messages", { id: m.id, handled: !m.handled })}>{t(m.handled ? "admin.markPending" : "admin.markHandled")}</button></div>
        </div>
      ))}
    </>
  );
}

const FAMILIES: NoteFamily[] = ["fruta", "floral", "herbal", "especia", "mineral", "dulce"];
interface AdminNote { id: string; es: string; en: string; family: NoteFamily; uses: number }
type NoteDraft = { es: string; en: string; family: NoteFamily };

/** Tasting-note vocabulary: add, rename, re-file or remove terms. */
function Notes() {
  const t = useT();
  const { toast } = useSession();
  const [items, setItems] = useState<AdminNote[] | null>(null);
  const [family, setFamily] = useState<"all" | NoteFamily>("all");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<NoteDraft>({ es: "", en: "", family: "fruta" });
  const [fresh, setFresh] = useState<NoteDraft>({ es: "", en: "", family: "fruta" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const load = useCallback(() => api<{ items: AdminNote[] }>("/admin/notes").then((r) => setItems(r.items)).catch((e) => toast(e.message)), [toast]);
  useEffect(() => { load(); }, [load]);

  const fail = (e: unknown) => { const err = e as ClientApiError; setErrors(err.fields ?? {}); toast(err.message); };
  const create = async (e: React.FormEvent) => {
    e.preventDefault(); setErrors({});
    try { await api("/admin/notes", { body: fresh }); toast(t("admin.noteAdded")); setFresh({ es: "", en: "", family: fresh.family }); load(); } catch (err) { fail(err); }
  };
  const save = async (id: string) => {
    setErrors({});
    try { await api(`/admin/notes/${id}`, { method: "PATCH", body: draft }); toast(t("admin.noteSaved")); setEditing(null); load(); } catch (err) { fail(err); }
  };
  const remove = async (n: AdminNote) => {
    if (!confirm(n.uses ? t("admin.noteConfirmUsed", { name: n.es, n: n.uses }) : t("admin.noteConfirmUnused", { name: n.es }))) return;
    try { await api(`/admin/notes/${n.id}`, { method: "DELETE" }); toast(t("admin.noteDeleted")); load(); } catch (err) { fail(err); }
  };

  const shown = useMemo(() => (items ?? []).filter((n) => (family === "all" || n.family === family) && (!q || `${n.es} ${n.en}`.toLowerCase().includes(q.toLowerCase()))), [items, family, q]);
  const FamilySelect = ({ value, onChange }: { value: NoteFamily; onChange: (f: NoteFamily) => void }) => (
    <select className="select" value={value} onChange={(e) => onChange(e.target.value as NoteFamily)} aria-label={t("admin.noteFamily")}>
      {FAMILIES.map((f) => <option key={f} value={f}>{t(`family.${f}` as Key)}</option>)}
    </select>
  );
  const cell = { display: "block", width: "100%", minWidth: 120, padding: "8px 10px" } as const;

  return (
    <>
      <p className="muted" style={{ marginTop: 18, maxWidth: "70ch" }}>{t("admin.notesIntro")}</p>

      <form className="panel panel-gold toolbar" onSubmit={create} style={{ alignItems: "flex-end" }}>
        <label style={{ flex: "1 1 160px" }}><span className="mono">{t("admin.noteEs")}</span><input className="searchbox" style={cell} value={fresh.es} onChange={(e) => setFresh({ ...fresh, es: e.target.value })} placeholder="Membrillo" required minLength={2} maxLength={40} />{errors.es && editing === null && <span className="err">{errors.es}</span>}</label>
        <label style={{ flex: "1 1 160px" }}><span className="mono">{t("admin.noteEn")}</span><input className="searchbox" style={cell} value={fresh.en} onChange={(e) => setFresh({ ...fresh, en: e.target.value })} placeholder="Quince" required minLength={2} maxLength={40} /></label>
        <label><span className="mono" style={{ display: "block", marginBottom: 2 }}>{t("admin.noteFamily")}</span><FamilySelect value={fresh.family} onChange={(f) => setFresh({ ...fresh, family: f })} /></label>
        <button className="btn btn-gold btn-sm">+ {t("admin.noteAdd")}</button>
      </form>

      <div className="toolbar">
        <input className="searchbox" style={{ display: "block", width: 220 }} placeholder={t("admin.noteSearch")} value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="chip" aria-pressed={family === "all"} onClick={() => setFamily("all")}>{t("admin.noteAll")} · {items?.length ?? 0}</button>
        {FAMILIES.map((f) => <button key={f} className="chip" aria-pressed={family === f} onClick={() => setFamily(f)}>{t(`family.${f}` as Key)} · {items?.filter((n) => n.family === f).length ?? 0}</button>)}
      </div>

      {!items ? <div className="skeleton" style={{ height: 200, marginTop: 20 }} /> : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>{t("admin.noteEs")}</th><th>{t("admin.noteEn")}</th><th>{t("admin.noteFamily")}</th><th>{t("admin.noteUses")}</th><th /></tr></thead>
            <tbody>
              {shown.map((n) => editing === n.id ? (
                <tr key={n.id}>
                  <td><input className="searchbox" style={cell} value={draft.es} onChange={(e) => setDraft({ ...draft, es: e.target.value })} autoFocus />{errors.es && <span className="err">{errors.es}</span>}</td>
                  <td><input className="searchbox" style={cell} value={draft.en} onChange={(e) => setDraft({ ...draft, en: e.target.value })} />{errors.en && <span className="err">{errors.en}</span>}</td>
                  <td><FamilySelect value={draft.family} onChange={(f) => setDraft({ ...draft, family: f })} /></td>
                  <td className="mono" style={{ letterSpacing: "0.06em" }}>{t.n("admin.noteBottles", n.uses)}</td>
                  <td><div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button className="btn btn-gold btn-sm" onClick={() => save(n.id)}>{t("admin.noteSave")}</button>
                    <button className="btn btn-outline btn-sm" onClick={() => { setEditing(null); setErrors({}); }}>{t("admin.noteCancel")}</button>
                  </div></td>
                </tr>
              ) : (
                <tr key={n.id}>
                  <td><div className="n">{n.es}</div></td>
                  <td className="muted">{n.en}</td>
                  <td><span className="badge">{t(`family.${n.family}` as Key)}</span></td>
                  <td className="mono" style={{ letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{n.uses ? t.n("admin.noteBottles", n.uses) : "—"}</td>
                  <td><div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button className="btn btn-goldline btn-sm" onClick={() => { setEditing(n.id); setDraft({ es: n.es, en: n.en, family: n.family }); setErrors({}); }}>{t("admin.noteEdit")}</button>
                    <button className="btn btn-outline btn-sm" onClick={() => remove(n)}>{t("admin.noteDelete")}</button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
