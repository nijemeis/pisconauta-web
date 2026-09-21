"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Currency, CriteriaScores, PlaceInput, PlaceListing, ReviewItem } from "@/lib/types";
import { CRITERIA, SYMBOL, fmt, labels, mapsUrl } from "@/lib/format";
import { ClientApiError, Price, api, useSession, useT } from "@/components/session";

export function SaveHeart({ piscoId }: { piscoId: string }) {
  const { me, toggleWishlist, t } = useSession();
  const saved = me.cellar.wishlist.includes(piscoId) || me.cellar.tasted.includes(piscoId);
  return (
    <button onClick={() => toggleWishlist(piscoId)} aria-pressed={saved} aria-label={t("ficha.saveAria")} style={{ fontSize: 18, color: saved ? "var(--gold)" : "var(--ink-2)" }}>
      {saved ? "♥" : "♡"}
    </button>
  );
}

export function FichaActions({ piscoId, piscoName }: { piscoId: string; piscoName: string }) {
  const { me, toggleWishlist, requireAccount, t } = useSession();
  const [open, setOpen] = useState(false);
  const tasted = me.cellar.tasted.includes(piscoId);
  const wished = me.cellar.wishlist.includes(piscoId);
  return (
    <>
      <button className="btn btn-gold" style={{ flex: 1 }} onClick={() => requireAccount() && setOpen(true)}>{t(tasted ? "rate.edit" : "rate.cta")}</button>
      {!tasted && <button className="btn btn-outline hide-mobile" onClick={() => toggleWishlist(piscoId)}>{t(wished ? "rate.inCava" : "rate.addCava")}</button>}
      {open && createPortal(<RateSheet piscoId={piscoId} piscoName={piscoName} onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}

function Stars({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const t = useT();
  return (
    <div className="stars" role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={t("rate.starsOf", { n })} className={n <= value ? "on" : ""} onClick={() => onChange(n)}>
          <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden><path d="M12 2.5l2.9 6.2 6.6.8-4.9 4.6 1.3 6.6L12 17.4l-5.9 3.3 1.3-6.6L2.5 9.5l6.6-.8z" /></svg>
        </button>
      ))}
    </div>
  );
}

const EMPTY: CriteriaScores = { aroma: 0, sabor: 0, cuerpo: 0, final: 0, equilibrio: 0 };

function RateSheet({ piscoId, piscoName, onClose }: { piscoId: string; piscoName: string; onClose: () => void }) {
  const { me, setMe, toast, t } = useSession();
  const criteria = labels(t.locale).CRITERIA;
  const { dec } = fmt(t.locale);
  const router = useRouter();
  const [stars, setStars] = useState<CriteriaScores>(EMPTY);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editing an earlier cata: start from what was saved.
  useEffect(() => {
    api<{ items: ReviewItem[] }>(`/piscos/${piscoId}/reviews`).then((r) => {
      const mine = r.items.find((i) => i.mine);
      if (mine?.criteria) setStars(mine.criteria);
      if (mine?.body) setBody(mine.body);
    }).catch(() => {});
  }, [piscoId]);

  const complete = CRITERIA.every((k) => stars[k] > 0);
  const overall = complete ? CRITERIA.reduce((sum, k) => sum + stars[k], 0) / CRITERIA.length : null;

  const save = async () => {
    setBusy(true); setError(null);
    try {
      await api(`/piscos/${piscoId}/reviews`, { body: { criteria: stars, body: body || null } });
      setMe({ ...me, cellar: { tasted: [...new Set([...me.cellar.tasted, piscoId])], wishlist: me.cellar.wishlist.filter((x) => x !== piscoId) } });
      toast(t("rate.savedToast"));
      onClose();
      router.refresh();
    } catch (e) { setError((e as Error).message); }
    setBusy(false);
  };

  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={t("rate.aria")}>
        <div className="sheet-head"><span className="sheet-title">{t("rate.title")}</span><button className="mono" onClick={onClose}>{t("common.close")}</button></div>
        <p className="muted" style={{ marginTop: 4 }}>{piscoName}</p>
        <div style={{ textAlign: "center", marginTop: 18 }}>
          <div className="serif gold" style={{ fontSize: 64, lineHeight: 1 }}>{overall == null ? "—" : dec(overall)}</div>
          <div className="mono" style={{ marginTop: 6 }}>{t("rate.myScore")}</div>
        </div>
        <div style={{ marginTop: 18 }}>
          {criteria.map((c) => (
            <div key={c.key} className="star-row">
              <div><div className="serif" style={{ fontSize: 20, lineHeight: 1.1 }}>{c.label}</div><div className="mono" style={{ letterSpacing: "0.16em" }}>{c.gloss}</div></div>
              <Stars value={stars[c.key]} label={c.label} onChange={(v) => setStars({ ...stars, [c.key]: v })} />
            </div>
          ))}
        </div>
        <label className="field"><span className="mono">{t("rate.notes")}</span>
          <textarea className="input" value={body} onChange={(e) => setBody(e.target.value)} maxLength={1500} placeholder={t("rate.notesPlaceholder")} />
        </label>
        {error && <p className="err">{error}</p>}
        <button className="btn btn-gold btn-block" style={{ marginTop: 20 }} onClick={save} disabled={busy || !complete}>{busy ? t("common.saving") : complete ? t("rate.save") : t("rate.incomplete")}</button>
      </div>
    </div>
  );
}

/** "Dónde comprar": stores open the maps app, webshops open their site; tasters add where they found it. */
export function Places({ piscoId, producerId, initial }: { piscoId: string; producerId: string; initial: PlaceListing[] }) {
  const { me, toast, requireAccount, currency, rates, t } = useSession();
  const { money, shortDate } = fmt(t.locale);
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [open, setOpen] = useState(false);
  useEffect(() => setItems(initial), [initial]);

  const canRemove = (l: PlaceListing) => !!me.user && (l.addedById === me.user.id || me.user.role === "admin" || me.producers.some((p) => p.id === producerId));
  const remove = async (l: PlaceListing) => {
    if (!confirm(t("place.removeConfirm", { name: l.retailer }))) return;
    try { await api(`/places/${l.id}`, { method: "DELETE" }); setItems((x) => x.filter((i) => i.id !== l.id)); router.refresh(); } catch (e) { toast((e as Error).message); }
  };

  return (
    <>
      <div className="rows">
        {items.filter((l) => l.inStock).map((l) => (
          <div key={l.id} className="row place">
            <div style={{ minWidth: 0 }}>
              <div className="serif" style={{ fontSize: 20, lineHeight: 1.15 }}>{l.retailer === "Precio sugerido por la bodega" ? t("place.ownRetailer") : l.retailer}</div>
              <div className="mono" style={{ letterSpacing: "0.1em", marginTop: 4, lineHeight: 1.6 }}>
                {[t(l.kind === "store" ? "place.store" : "place.web"), [l.address, l.city].filter(Boolean).join(", ") || null, l.source === "community" ? t("place.community") : l.source === "producer" ? t("place.producer") : null].filter(Boolean).join(" · ")}
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
                {l.url && <a className="mono gold" href={l.url} target="_blank" rel="noopener noreferrer nofollow">{t("place.goWeb")}</a>}
                {l.kind === "store" && (l.address || l.city || l.lat != null) && <a className="mono gold" href={mapsUrl(l)} target="_blank" rel="noopener noreferrer">{t("place.directions")}</a>}
                {canRemove(l) && <button className="mono" onClick={() => remove(l)}>{t("place.remove")}</button>}
              </div>
            </div>
            <div style={{ marginLeft: "auto", textAlign: "right", whiteSpace: "nowrap" }}>
              <div className="serif" style={{ fontSize: 22 }}><Price cents={l.priceCents} currency={l.currency} /></div>
              {l.currency !== currency && <div className="mono" style={{ letterSpacing: "0.08em", marginTop: 2 }}>{money(l.priceCents, l.currency)}</div>}
            </div>
          </div>
        ))}
        {!items.length && <p className="muted" style={{ marginTop: 10 }}>{t("place.none")}</p>}
      </div>
      {items.some((l) => l.currency !== currency) && <p className="mono" style={{ marginTop: 10, letterSpacing: "0.08em", lineHeight: 1.6 }}>{rates.updatedAt ? t("place.conversionDate", { date: shortDate(rates.updatedAt) }) : t("place.conversion")}</p>}
      <button className="btn btn-outline btn-block" style={{ marginTop: 14 }} onClick={() => requireAccount() && setOpen(true)}>{t("place.addCta")}</button>
      {open && createPortal(<PlaceSheet piscoId={piscoId} onClose={() => setOpen(false)} onSaved={(prices) => { setItems(prices); setOpen(false); toast(t("place.thanks")); router.refresh(); }} />, document.body)}
    </>
  );
}

function PlaceSheet({ piscoId, onClose, onSaved }: { piscoId: string; onClose: () => void; onSaved: (prices: PlaceListing[]) => void }) {
  const [kind, setKind] = useState<"store" | "webshop">("store");
  const { currency: pref, t } = useSession();
  const [currency, setCurrency] = useState<Currency>(pref);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const locate = () => navigator.geolocation?.getCurrentPosition(
    (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
    () => setError(t("place.locError")),
    { enableHighAccuracy: true, timeout: 8000 },
  );

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const s = (k: string) => String(f.get(k) ?? "").trim() || null;
    let url = s("url");
    if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;
    const body: PlaceInput = {
      kind, name: s("name") ?? "", price: Number(String(f.get("price") ?? "").replace(",", ".")) || 0, currency,
      url, address: kind === "store" ? s("address") : null, city: kind === "store" ? s("city") : null,
      ...(kind === "store" && coords ? coords : {}),
    };
    setBusy(true); setError(null); setFields({});
    try { onSaved((await api<{ prices: PlaceListing[] }>(`/piscos/${piscoId}/places`, { body })).prices); }
    catch (err) { const e2 = err as ClientApiError; setError(e2.message); setFields(e2.fields ?? {}); }
    setBusy(false);
  };
  const E = (k: string) => (fields[k] ? <span className="err" style={{ display: "block" }}>{fields[k]}</span> : null);

  return (
    <div className="scrim" onClick={onClose}>
      <form className="sheet" onClick={(e) => e.stopPropagation()} onSubmit={submit} role="dialog" aria-label={t("place.addAria")}>
        <div className="sheet-head"><span className="sheet-title">{t("place.sheetTitle")}</span><button type="button" className="mono" onClick={onClose}>{t("common.close")}</button></div>
        <p className="muted" style={{ marginTop: 4 }}>{t("place.sheetHelp")}</p>
        <div className="segmented" style={{ gridTemplateColumns: "1fr 1fr", marginTop: 16 }}>
          <button type="button" aria-pressed={kind === "store"} onClick={() => setKind("store")}>{t("place.physical")}</button>
          <button type="button" aria-pressed={kind === "webshop"} onClick={() => setKind("webshop")}>{t("place.online")}</button>
        </div>
        <label className="field"><span className="mono">{t("place.shopName")}</span><input className="input" name="name" required minLength={2} maxLength={120} />{E("name")}</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 170px", gap: 18, alignItems: "end" }}>
          <label className="field"><span className="mono">{t("place.price")}</span><input className="input" name="price" required inputMode="decimal" placeholder={t("place.pricePlaceholder")} />{E("price")}</label>
          <div className="segmented">
            {(["PEN", "USD", "EUR"] as const).map((c) => <button key={c} type="button" aria-pressed={currency === c} onClick={() => setCurrency(c)}>{SYMBOL[c]}</button>)}
          </div>
        </div>
        {kind === "store" ? (
          <>
            <label className="field"><span className="mono">{t("place.address")}</span><input className="input" name="address" maxLength={200} placeholder="Av. Grau 123" style={{ fontSize: 18 }} />{E("address")}</label>
            <label className="field"><span className="mono">{t("place.city")}</span><input className="input" name="city" maxLength={80} placeholder="Ica" style={{ fontSize: 18 }} /></label>
            <button type="button" className="mono gold" style={{ marginTop: 14 }} onClick={locate}>{t(coords ? "place.locSaved" : "place.useLoc")}</button>
            <label className="field"><span className="mono">{t("place.shopWeb")}</span><input className="input" name="url" inputMode="url" placeholder="https://" style={{ fontSize: 18 }} />{E("url")}</label>
          </>
        ) : (
          <label className="field"><span className="mono">{t("place.productLink")}</span><input className="input" name="url" required inputMode="url" placeholder={t("place.productLinkPlaceholder")} style={{ fontSize: 18 }} />{E("url")}</label>
        )}
        {error && <p className="err" role="alert">{error}</p>}
        <button className="btn btn-gold btn-block" style={{ marginTop: 22 }} disabled={busy}>{busy ? t("common.saving") : t("place.add")}</button>
      </form>
    </div>
  );
}

export function Reviews({ piscoId }: { piscoId: string }) {
  const [items, setItems] = useState<ReviewItem[] | null>(null);
  const { me, t } = useSession();
  const criteria = labels(t.locale).CRITERIA;
  const { dec, shortDate } = fmt(t.locale);
  useEffect(() => {
    api<{ items: ReviewItem[] }>(`/piscos/${piscoId}/reviews`).then((r) => setItems(r.items)).catch(() => setItems([]));
  }, [piscoId, me.cellar.tasted.length]);
  if (!items) return <div className="skeleton" style={{ height: 60, marginTop: 14 }} />;
  if (!items.length) return <p className="muted" style={{ marginTop: 14 }}>{t("rev.none")}</p>;
  return (
    <div className="rows">
      {items.map((r) => (
        <div key={r.id} className="row" style={{ alignItems: "flex-start" }}>
          <div className="serif gold" style={{ fontSize: 24, width: 44 }}>{dec(r.score)}</div>
          <div>
            <div className="mono" style={{ letterSpacing: "0.12em" }}>{r.author}{r.mine ? ` · ${t("rev.you")}` : ""} · {shortDate(r.createdAt)}</div>
            {r.criteria && <div className="mono" style={{ letterSpacing: "0.08em", marginTop: 4, color: "var(--ink-4)" }}>{criteria.map((c) => `${c.label.split(" ")[0]} ${r.criteria![c.key]}`).join(" · ")}</div>}
            {r.body && <p style={{ marginTop: 5, color: "var(--ink-2)" }}>{r.body}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
