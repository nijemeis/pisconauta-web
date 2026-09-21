"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Chakana } from "./motifs";
import type { Currency } from "@/lib/types";
import { api, useSession, useT } from "./session";

const NAV = [
  { href: "/catalogo", label: "nav.catalog" },
  { href: "/bodegas", label: "nav.bodegas" },
  { href: "/valles", label: "nav.valleys" },
  { href: "/guia", label: "nav.guide" },
] as const;

export function TopBar() {
  const path = usePathname();
  const router = useRouter();
  const { me, t } = useSession();
  const isProducer = me.user?.role === "producer";
  const isAdmin = me.user?.role === "admin";
  return (
    <header className="topbar">
      <div className="left">
        <Link href="/" className="wordmark"><Chakana size={22} /><span>PISCONAUTA<i>.</i></span></Link>
        <nav className="nav">
          {NAV.map((n) => <Link key={n.href} href={n.href} aria-current={path.startsWith(n.href) ? "page" : undefined}>{t(n.label)}</Link>)}
        </nav>
      </div>
      <div className="right">
        <form action="/catalogo" onSubmit={(e) => { e.preventDefault(); const q = new FormData(e.currentTarget).get("q"); router.push(`/catalogo${q ? `?q=${encodeURIComponent(String(q))}` : ""}`); }}>
          <input className="searchbox" name="q" placeholder={t("common.searchPlaceholder")} aria-label={t("common.search")} />
        </form>
        <Link href={isAdmin ? "/admin" : isProducer ? "/productor" : "/cuenta?rol=productor"} className="btn btn-goldline btn-sm producer-cta">{t(isAdmin ? "top.admin" : isProducer ? "top.myBodega" : "top.producerCta")}</Link>
        <LangToggle />
        <CurrencySelect />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}

/** Dark "Casa de Oro" ⇄ light "Valle Claro". Cookie for everyone, account preference when signed in. */
function applyTheme(theme: "dark" | "light", signedIn: boolean) {
  document.documentElement.dataset.theme = theme;
  document.cookie = `pn_theme=${theme};path=/;max-age=31536000;samesite=lax`;
  if (signedIn) api("/me", { method: "PATCH", body: { theme } }).catch(() => {});
}

/** Compact ES · EN switch; `setLocale` stores the cookie / account preference and refreshes server text. */
export function LangToggle() {
  const { locale, setLocale } = useSession();
  return (
    <div className="lang-toggle" role="group" aria-label="Idioma / Language">
      <button type="button" aria-pressed={locale === "es"} onClick={() => setLocale("es")} lang="es" title="Español">ES</button>
      <span aria-hidden>·</span>
      <button type="button" aria-pressed={locale === "en"} onClick={() => setLocale("en")} lang="en" title="English">EN</button>
    </div>
  );
}

function ThemeToggle() {
  const { me, t } = useSession();
  const flip = () => applyTheme(document.documentElement.dataset.theme === "light" ? "dark" : "light", !!me.user);
  return (
    <button className="theme-toggle" onClick={flip} aria-label={t("theme.aria")} title={t("theme.title")}>
      <span className="sun">☀</span><span className="moon">☾</span>
    </button>
  );
}

function CurrencySelect() {
  const { currency, setCurrency, t } = useSession();
  return (
    <select className="select pref-select" value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} aria-label={t("currency.label")} title={t("currency.label")}>
      <option value="PEN">S/ PEN</option>
      <option value="USD">US$ USD</option>
      <option value="EUR">€ EUR</option>
    </select>
  );
}

function UserMenu() {
  const { me, toast, t, locale, setLocale } = useSession();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const path = usePathname();
  useEffect(() => setOpen(false), [path]);

  if (!me.user) return <Link href="/cuenta" className="avatar" aria-label={t("menu.signIn")} />;

  const setTheme = (theme: "dark" | "light") => applyTheme(theme, true);
  const logout = async () => {
    await api("/auth/logout", { method: "POST" }).catch((e) => toast(e.message));
    router.push("/");
    router.refresh();
  };
  return (
    <div className="menu">
      <button className="avatar" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={t("menu.account")}>{me.user.displayName[0]?.toUpperCase()}</button>
      {open && (
        <div className="menu-panel">
          <span className="mono">{me.user.displayName}</span>
          <Link href="/mi-cava">{t("menu.cava")}</Link>
          {me.user.role === "producer" && <Link href="/productor">{t("top.myBodega")}</Link>}
          {me.user.role === "admin" && <Link href="/admin">{t("top.admin")}</Link>}
          <span className="mono">{t("menu.theme")}</span>
          <button onClick={() => setTheme("dark")}>{t("theme.dark")}</button>
          <button onClick={() => setTheme("light")}>{t("theme.light")}</button>
          <span className="mono">{t("lang.label")}</span>
          <button onClick={() => setLocale("es")} aria-pressed={locale === "es"} lang="es">Español{locale === "es" ? " ✓" : ""}</button>
          <button onClick={() => setLocale("en")} aria-pressed={locale === "en"} lang="en">English{locale === "en" ? " ✓" : ""}</button>
          <span className="mono">{t("menu.account")}</span>
          <a href="/api/me/export" download="pisconauta-datos.json">{t("menu.download")}</a>
          <Link href="/contacto">{t("menu.contact")}</Link>
          <Link href="/privacidad">{t("menu.privacy")}</Link>
          <button onClick={logout}>{t("menu.logout")}</button>
          <button style={{ color: "var(--terracotta)" }} onClick={async () => {
            if (!confirm(t("menu.deleteConfirm"))) return;
            try { await api("/me", { method: "DELETE" }); router.push("/"); router.refresh(); } catch (e) { toast((e as Error).message); }
          }}>{t("menu.delete")}</button>
        </div>
      )}
    </div>
  );
}

export function Footer() {
  const t = useT();
  return (
    <footer className="footer">
      <div className="footer-in">
        <div>
          <div className="wordmark" style={{ fontSize: 20 }}><Chakana size={18} /><span>PISCONAUTA<i>.</i></span></div>
          <p className="mono" style={{ marginTop: 10, letterSpacing: "0.14em", lineHeight: 1.8 }}>{t("footer.line")}<br />{t("common.health")} · 18+</p>
        </div>
        <nav aria-label={t("footer.navAria")}>
          <Link href="/contacto">{t("menu.contact")}</Link>
          <Link href="/cuenta?rol=productor">{t("top.producerCta")}</Link>
          <Link href="/privacidad">{t("menu.privacy")}</Link>
          <Link href="/terminos">{t("footer.terms")}</Link>
        </nav>
      </div>
    </footer>
  );
}

export function TabBar() {
  const path = usePathname();
  const { me, t } = useSession();
  const tabs = [
    { href: "/", label: t("tab.discover"), on: path === "/" },
    { href: "/catalogo", label: t("tab.search"), on: path.startsWith("/catalogo") },
    { href: "/escanear", label: t("tab.scan"), on: path.startsWith("/escanear") },
    { href: "/mi-cava", label: t("tab.cava"), on: path.startsWith("/mi-cava") },
    ...(me.user?.role === "producer" ? [{ href: "/productor", label: t("tab.bodega"), on: path.startsWith("/productor") }] : []),
    ...(me.user?.role === "admin" ? [{ href: "/admin", label: "Admin", on: path.startsWith("/admin") || path.startsWith("/productor") }] : []),
  ];
  return (
    <nav className="tabbar" aria-label={t("tab.aria")}>
      {tabs.map((t) => (
        <Link key={t.href} href={t.href} aria-current={t.on ? "page" : undefined}><Chakana size={13} color="currentColor" />{t.label}</Link>
      ))}
    </nav>
  );
}

/** 18+ gate on first visit (alcohol content). Remembered for a year. */
export function AgeGate({ passed }: { passed: boolean }) {
  const [ok, setOk] = useState(passed);
  const [denied, setDenied] = useState(false);
  const t = useT();
  if (ok) return null;
  return (
    <div className="scrim" style={{ alignItems: "center", background: "var(--bg)", zIndex: 100 }}>
      <div style={{ textAlign: "center", padding: 28, maxWidth: 420 }}>
        <Chakana size={56} />
        <h1 className="serif" style={{ fontSize: 40, letterSpacing: "0.06em", marginTop: 18 }}>PISCONAUTA</h1>
        <p className="serif" style={{ fontStyle: "italic", fontSize: 22, color: "var(--gold)" }}>{t("common.tagline")}</p>
        {denied ? (
          <p style={{ marginTop: 26, color: "var(--ink-3)" }}>{t("age.denied")}</p>
        ) : (
          <>
            <p style={{ marginTop: 26, color: "var(--ink-3)" }}>{t("age.question")}</p>
            <div className="mono" style={{ marginTop: 6 }}>{t("age.gloss")}</div>
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button className="btn btn-gold" style={{ flex: 1 }} onClick={() => { document.cookie = "pn_age=1;path=/;max-age=31536000;samesite=lax"; setOk(true); }}>{t("age.yes")}</button>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setDenied(true)}>{t("age.no")}</button>
            </div>
          </>
        )}
        <div className="mono" style={{ marginTop: 28 }}>{t("common.health")}</div>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 14 }}><LangToggle /></div>
      </div>
    </div>
  );
}
