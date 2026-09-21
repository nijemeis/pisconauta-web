"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AuthResult } from "@/lib/types";
import { Chakana, SteppedBand } from "@/components/motifs";
import { ClientApiError, api, useSession } from "@/components/session";

type Role = "enthusiast" | "producer";

export function AccountForm({ initialRole, initialMode, next }: { initialRole: Role; initialMode: "signup" | "login"; next?: string }) {
  const [mode, setMode] = useState(initialMode);
  const [role, setRole] = useState<Role>(initialRole);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { setMe, toast, t, locale } = useSession();
  const router = useRouter();

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true); setError(null); setFields({});
    try {
      const body = mode === "signup"
        ? { email: f.get("email"), password: f.get("password"), displayName: f.get("displayName"), role, birthYear: Number(f.get("birthYear")) || undefined, locale: locale === "en" ? "en" : "es-PE" }
        : { email: f.get("email"), password: f.get("password") };
      const { token: _t, ...me } = await api<AuthResult>(`/auth/${mode}`, { body });
      setMe(me);
      router.push(me.user?.role === "producer" ? "/productor" : next ?? (me.user?.role === "admin" ? "/admin" : "/"));
      router.refresh();
    } catch (err) {
      const e2 = err as ClientApiError;
      setError(e2.message); setFields(e2.fields ?? {});
    }
    setBusy(false);
  };

  return (
    <main className="page" style={{ maxWidth: 460 }}>
      <SteppedBand />
      <div style={{ textAlign: "center", marginTop: 26 }}>
        <Chakana size={56} />
        <h1 className="serif" style={{ fontSize: 46, letterSpacing: "0.06em", lineHeight: 1.1, marginTop: 10 }}>PISCONAUTA</h1>
        <p className="serif" style={{ fontStyle: "italic", fontSize: 22, color: "var(--gold)" }}>{t("common.tagline")}</p>
      </div>
      <p style={{ color: "var(--ink-3)", lineHeight: 1.6, marginTop: 18 }}>{t("account.lead")}</p>

      <form onSubmit={submit}>
        {mode === "signup" && (
          <>
            <div className="mono" style={{ marginTop: 26 }}>{t("account.joinAs")}</div>
            {([["enthusiast", t("account.enthusiast"), t("account.enthusiastHelp")], ["producer", t("account.producer"), t("account.producerHelp")]] as const).map(([value, title, help]) => (
              <button type="button" key={value} className="role-card" aria-pressed={role === value} onClick={() => setRole(value)}>
                <span><span className="serif" style={{ fontSize: 24, display: "block" }}>{title}</span><span style={{ fontSize: 12, color: "var(--ink-4)" }}>{help}</span></span>
                <span className="dot" />
              </button>
            ))}
            <label className="field"><span className="mono">{t("account.name")}</span><input className="input" name="displayName" required minLength={2} autoComplete="name" />{fields.displayName && <span className="err">{fields.displayName}</span>}</label>
          </>
        )}
        <label className="field"><span className="mono">{t("account.email")}</span><input className="input" name="email" type="email" required autoComplete="email" />{fields.email && <span className="err">{fields.email}</span>}</label>
        <label className="field"><span className="mono">{t("account.password")}</span><input className="input" name="password" type="password" required minLength={mode === "signup" ? 8 : 1} autoComplete={mode === "signup" ? "new-password" : "current-password"} />{fields.password && <span className="err">{fields.password}</span>}</label>
        {mode === "signup" && (
          <label className="field"><span className="mono">{t("account.birthYear")}</span><input className="input" name="birthYear" type="number" required min={1900} max={new Date().getFullYear()} inputMode="numeric" /></label>
        )}
        {mode === "signup" && <p className="muted" style={{ fontSize: 12, marginTop: 18 }}>{t("account.acceptPre")}<a className="gold" href="/terminos" target="_blank">{t("account.acceptTerms")}</a>{t("account.acceptMid")}<a className="gold" href="/privacidad" target="_blank">{t("account.acceptPrivacy")}</a>{t("account.acceptPost")}</p>}
        {error && <p className="err" role="alert">{error}</p>}
        <button className="btn btn-gold btn-block" style={{ marginTop: 26 }} disabled={busy}>{busy ? t("account.wait") : t(mode === "signup" ? "account.create" : "account.signIn")}</button>
      </form>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
        {["Apple", "Google"].map((p) => <button key={p} className="btn btn-outline" style={{ textTransform: "none", letterSpacing: 0, fontFamily: "var(--sans)", fontSize: 13 }} onClick={() => toast(t("account.socialSoon", { provider: p }))}>{p}</button>)}
      </div>
      <p style={{ textAlign: "center", marginTop: 18, fontSize: 12, color: "var(--ink-3)" }}>
        {t(mode === "signup" ? "account.haveAccount" : "account.noAccount")}
        <button className="gold" onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(null); }}>{t(mode === "signup" ? "account.signIn" : "account.create")}</button>
      </p>
    </main>
  );
}
