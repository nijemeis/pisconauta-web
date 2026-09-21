import type { Metadata } from "next";
import { getUser } from "@/lib/auth";
import { SITE } from "@/lib/site";
import { SteppedBand } from "@/components/motifs";
import { getT } from "@/lib/i18n/server";
import { ContactForm } from "./client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("contact.title"), description: t("contact.metaDesc") };
}

export default async function Contacto({ searchParams }: { searchParams: Promise<{ tema?: string }> }) {
  const [user, sp, t] = await Promise.all([getUser(), searchParams, getT()]);
  return (
    <main className="page page-narrow">
      <SteppedBand style={{ marginBottom: 22 }} />
      <h1 className="title">{t("contact.title")}</h1>
      <div className="subtitle">{t("contact.subtitle")}</div>
      <p className="prose" style={{ marginTop: 16 }}>{t("contact.intro")}<a className="gold" href={`mailto:${SITE.email}`}>{SITE.email}</a>.</p>
      <ContactForm name={user?.displayName ?? ""} email={user?.email ?? ""} topic={sp.tema ?? "general"} />
    </main>
  );
}
