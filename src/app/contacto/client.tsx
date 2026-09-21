"use client";
import Link from "next/link";
import { useState } from "react";
import { Chakana } from "@/components/motifs";
import { ClientApiError, api, useT } from "@/components/session";

const TOPICS = [["general", "contact.topicGeneral"], ["productor", "contact.topicProducer"], ["error", "contact.topicError"], ["datos", "contact.topicData"], ["prensa", "contact.topicPress"]] as const;

export function ContactForm({ name, email, topic }: { name: string; email: string; topic: string }) {
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const t = useT();

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true); setError(null); setFields({});
    try {
      await api("/contact", { body: { name: f.get("name"), email: f.get("email"), topic: f.get("topic"), message: f.get("message"), website: f.get("website") || undefined } });
      setSent(true);
    } catch (err) { const e2 = err as ClientApiError; setError(e2.message); setFields(e2.fields ?? {}); }
    setBusy(false);
  };

  if (sent) {
    return (
      <div style={{ textAlign: "center", padding: "50px 0" }}>
        <Chakana size={56} />
        <p className="serif" style={{ fontSize: 26, marginTop: 16 }}>{t("contact.sentTitle")}</p>
        <p className="muted" style={{ marginTop: 4 }}>{t("contact.sentHelp")}</p>
      </div>
    );
  }
  return (
    <form onSubmit={submit}>
      <div className="cols-2">
        <label className="field"><span className="mono">{t("contact.name")}</span><input className="input" name="name" defaultValue={name} required minLength={2} autoComplete="name" />{fields.name && <span className="err">{fields.name}</span>}</label>
        <label className="field"><span className="mono">{t("contact.email")}</span><input className="input" name="email" type="email" defaultValue={email} required autoComplete="email" />{fields.email && <span className="err">{fields.email}</span>}</label>
      </div>
      <label className="field"><span className="mono">{t("contact.topic")}</span>
        <select className="input filled" name="topic" defaultValue={TOPICS.some(([v]) => v === topic) ? topic : "general"} style={{ fontSize: 18 }}>{TOPICS.map(([v, l]) => <option key={v} value={v}>{t(l)}</option>)}</select>
      </label>
      <label className="field"><span className="mono">{t("contact.message")}</span><textarea className="input" name="message" required minLength={10} maxLength={3000} style={{ minHeight: 150 }} />{fields.message && <span className="err">{fields.message}</span>}</label>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden style={{ position: "absolute", left: -9999 }} />
      <p className="muted" style={{ fontSize: 12, marginTop: 16 }}>{t("contact.usePre")}<Link className="gold" href="/privacidad">{t("contact.useLink")}</Link>{t("contact.usePost")}</p>
      {error && <p className="err" role="alert">{error}</p>}
      <button className="btn btn-gold btn-block" style={{ marginTop: 20 }} disabled={busy}>{busy ? t("contact.sending") : t("contact.send")}</button>
    </form>
  );
}
