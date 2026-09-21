"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AuthResult } from "@/lib/types";
import { Chakana, SteppedBand } from "@/components/motifs";
import { ClientApiError, api, useSession } from "@/components/session";

type Role = "enthusiast" | "producer";

export function AccountForm({ initialRole, initialMode, next, google, oauthError }: { initialRole: Role; initialMode: "signup" | "login"; next?: string; google: boolean; oauthError?: string }) {
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

      {oauthError && !error && <p className="err" role="alert" style={{ textAlign: "center" }}>{t(oauthError === "google_cancelled" ? "account.googleCancelled" : oauthError === "google_off" ? "account.googleOff" : "account.googleFailed")}</p>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
        <button className="btn btn-outline" style={{ textTransform: "none", letterSpacing: 0, fontFamily: "var(--sans)", fontSize: 13 }} onClick={() => toast(t("account.socialSoon", { provider: "Apple" }))}>Apple</button>
        {google ? (
          // Full-page navigation on purpose: the OAuth round trip leaves the app and comes back with a session cookie.
          <a className="btn btn-outline" style={{ textTransform: "none", letterSpacing: 0, fontFamily: "var(--sans)", fontSize: 13 }}
            href={`/api/auth/google?role=${role}&locale=${t.locale}${next ? `&next=${encodeURIComponent(next)}` : ""}`}>
            <GoogleG /> {t("account.withGoogle")}
          </a>
        ) : (
          <button className="btn btn-outline" style={{ textTransform: "none", letterSpacing: 0, fontFamily: "var(--sans)", fontSize: 13 }} onClick={() => toast(t("account.socialSoon", { provider: "Google" }))}>Google</button>
        )}
      </div>
      {google && mode === "signup" && <p className="muted" style={{ fontSize: 11, marginTop: 8, textAlign: "center" }}>{t("account.googleRoleHint", { role: role === "producer" ? "Productor" : "Aficionado" })}</p>}
      <p style={{ textAlign: "center", marginTop: 18, fontSize: 12, color: "var(--ink-3)" }}>
        {t(mode === "signup" ? "account.haveAccount" : "account.noAccount")}
        <button className="gold" onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(null); }}>{t(mode === "signup" ? "account.signIn" : "account.create")}</button>
      </p>
    </main>
  );
}

function GoogleG() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.2C12.400 13.700 17.700 9.500 24 9.500z"/>
      <path fill="#4285F4" d="M46.100 24.500c0-1.600-.100-3.100-.400-4.500H24v9h12.400c-.500 2.900-2.200 5.300-4.600 7l7.200 5.600c4.200-3.900 7.100-9.700 7.100-17.100z"/>
      <path fill="#FBBC05" d="M10.500 28.600c-.500-1.500-.800-3-.800-4.600s.300-3.100.800-4.600l-7.900-6.200C.900 16.500 0 20.100 0 24s.900 7.500 2.600 10.800l7.900-6.200z"/>
      <path fill="#34A853" d="M24 48c6.500 0 11.900-2.100 15.900-5.800l-7.200-5.600c-2.200 1.500-5 2.400-8.700 2.400-6.300 0-11.600-4.200-13.500-9.900l-7.900 6.200C6.500 42.600 14.600 48 24 48z"/>
    </svg>
  );
}
