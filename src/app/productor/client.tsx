"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PiscoDetail, ProducerDetail } from "@/lib/types";
import { ClientApiError, api, useSession } from "@/components/session";

type RegionOpt = { slug: string; name: string; valleys: string[] };

export function NewBottleButton({ producerId }: { producerId: string }) {
  const router = useRouter();
  const { toast, t } = useSession();
  const [busy, setBusy] = useState(false);
  const create = async () => {
    setBusy(true);
    try {
      const p = await api<PiscoDetail>("/piscos", { body: { producerId } });
      router.push(`/productor/pisco/${p.id}`);
    } catch (e) { toast((e as Error).message); setBusy(false); }
  };
  return <button className="btn btn-gold btn-sm" onClick={create} disabled={busy}>{t("prod.newBottle")}</button>;
}

export function BodegaForm({ regions, existing }: { regions: RegionOpt[]; existing?: ProducerDetail }) {
  const [region, setRegion] = useState(existing?.region?.slug ?? "");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cover, setCover] = useState<{ key?: string; url: string | null }>({ url: existing?.cover ?? null });
  const [logo, setLogo] = useState<{ key?: string; url: string | null }>({ url: existing?.logo ?? null });
  const router = useRouter();
  const { toast, me, t } = useSession();

  const upload = (kind: "cover" | "logo") => async (file?: File) => {
    if (!file) return;
    const form = new FormData(); form.append("file", file); form.append("kind", kind);
    try { const r = await api<{ key: string; url: string }>("/uploads", { form }); (kind === "cover" ? setCover : setLogo)(r); } catch (e) { toast((e as Error).message); }
  };
  const uploadCover = upload("cover");

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const s = (k: string) => String(f.get(k) ?? "").trim() || null;
    const body = {
      name: s("name"), regionSlug: region || null, valley: s("valley"), foundedYear: Number(f.get("foundedYear")) || null,
      description: s("description"), history: s("history"), visitInfo: s("visitInfo"), website: s("website"), ruc: s("ruc"),
      contactEmail: s("contactEmail"), contactPhone: s("contactPhone"), ...(cover.key ? { coverPhotoKey: cover.key } : {}), ...(logo.key ? { logoPhotoKey: logo.key } : {}),
    };
    setBusy(true); setError(null); setFields({});
    try {
      const saved = await api<ProducerDetail>(existing ? `/producers/${existing.id}` : "/producers", { method: existing ? "PATCH" : "POST", body });
      const admin = me.user?.role === "admin";
      toast(t(existing ? "bform.savedProfile" : admin ? "bform.registeredAdmin" : "bform.registered"));
      router.push(admin ? `/productor?bodega=${saved.id}` : "/productor"); router.refresh();
    } catch (err) { const e2 = err as ClientApiError; setError(e2.message); setFields(e2.fields ?? {}); }
    setBusy(false);
  };

  const valleys = regions.find((r) => r.slug === region)?.valleys ?? [];
  const F = ({ name, label, type = "text", def, ...rest }: { name: string; label: string; type?: string; def?: string | number | null } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <label className="field"><span className="mono">{label}</span><input className="input" name={name} type={type} defaultValue={def ?? ""} {...rest} />{fields[name] && <span className="err">{fields[name]}</span>}</label>
  );

  return (
    <form onSubmit={submit}>
      {F({ name: "name", label: t("bform.name"), def: existing?.name, required: true })}
      <div className="cols-3">
        <label className="field"><span className="mono">{t("bform.region")}</span>
          <select className="input" value={region} onChange={(e) => setRegion(e.target.value)}><option value="">—</option>{regions.map((r) => <option key={r.slug} value={r.slug}>{r.name}</option>)}</select>
        </label>
        <label className="field"><span className="mono">{t("bform.valley")}</span>
          <input className="input" name="valley" list="valles" defaultValue={existing?.valley ?? ""} /><datalist id="valles">{valleys.map((v) => <option key={v} value={v} />)}</datalist>
        </label>
        {F({ name: "foundedYear", label: t("bform.founded"), type: "number", def: existing?.foundedYear, min: 1500, max: new Date().getFullYear() })}
      </div>
      <div className="cols-2">
        {F({ name: "ruc", label: t("bform.ruc"), def: existing?.ruc, inputMode: "numeric", pattern: "\\d{11}" })}
        {F({ name: "website", label: t("bform.website"), type: "url", def: existing?.website, placeholder: "https://" })}
        {F({ name: "contactEmail", label: t("bform.contactEmail"), type: "email", def: existing?.contactEmail })}
        {F({ name: "contactPhone", label: t("bform.contactPhone"), def: existing?.contactPhone })}
      </div>
      <label className="field"><span className="mono">{t("bform.description")}</span><textarea className="input" name="description" maxLength={600} defaultValue={existing?.description ?? ""} /></label>
      {existing && (
        <>
          <label className="field"><span className="mono">{t("bform.history")}</span><textarea className="input" name="history" maxLength={4000} defaultValue={existing.history ?? ""} /></label>
          <label className="field"><span className="mono">{t("bform.visits")}</span><textarea className="input" name="visitInfo" maxLength={2000} defaultValue={existing.visitInfo ?? ""} /></label>
          <div className="field"><span className="mono">{t("bform.logo")}</span>
            <div style={{ display: "flex", gap: 16, alignItems: "center", marginTop: 10 }}>
              <label className="slot" style={{ width: 96, height: 96, borderRadius: "50%" }}>
                {logo.url ? <img src={`${logo.url}?w=200`} alt="" style={{ borderRadius: "50%" }} /> : <span className="mono">{t("bform.logoAdd")}</span>}
                <input type="file" accept="image/*" hidden onChange={(e) => upload("logo")(e.target.files?.[0])} />
              </label>
              <p className="muted" style={{ fontSize: 12, flex: 1 }}>{t("bform.logoHint")}</p>
            </div>
          </div>
          <div className="field"><span className="mono">{t("bform.cover")}</span>
            <label className="slot" style={{ width: "100%", height: 140, marginTop: 10 }}>
              {cover.url ? <img src={`${cover.url}?w=600`} alt="" /> : <span className="mono">{t("bform.coverAdd")}</span>}
              <input type="file" accept="image/*" hidden onChange={(e) => uploadCover(e.target.files?.[0])} />
            </label>
          </div>
        </>
      )}
      {error && <p className="err" role="alert">{error}</p>}
      <button className="btn btn-gold btn-block" style={{ marginTop: 26 }} disabled={busy}>{busy ? t("common.saving") : t(existing ? "bform.saveProfile" : "bform.register")}</button>
    </form>
  );
}
