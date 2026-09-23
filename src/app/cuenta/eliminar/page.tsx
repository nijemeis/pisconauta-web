import type { Metadata } from "next";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { SITE } from "@/lib/site";
import { SteppedBand } from "@/components/motifs";
import { DeleteAccount } from "./client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("del.title"), description: t("del.metaDesc") };
}

/** Public account-deletion page (required by Google Play / App Store policies). */
export default async function EliminarCuenta() {
  const [user, t] = await Promise.all([getUser(), getT()]);
  return (
    <main className="page page-narrow legal">
      <SteppedBand style={{ marginBottom: 22 }} />
      <h1 className="title">{t("del.title")}</h1>
      <div className="subtitle">{t("del.subtitle")}</div>
      <p>{t("del.intro", { app: SITE.name })}</p>

      <h2>{t("del.whatHeading")}</h2>
      <ul>
        <li>{t("del.what1")}</li>
        <li>{t("del.what2")}</li>
        <li>{t("del.what3")}</li>
      </ul>
      <p>{t("del.keeps")}</p>

      <h2>{t("del.howHeading")}</h2>
      <p>{t("del.howApp")}</p>
      <p>{t("del.howWeb")}</p>

      <div className="panel panel-gold" style={{ marginTop: 22 }}>
        {user ? (
          <DeleteAccount email={user.email} isAdmin={user.role === "admin"} />
        ) : (
          <>
            <p style={{ marginTop: 0 }}>{t("del.signInFirst")}</p>
            <Link href="/cuenta?modo=ingresar&next=/cuenta/eliminar" className="btn btn-gold" style={{ marginTop: 14 }}>{t("account.signIn")}</Link>
          </>
        )}
      </div>

      <h2>{t("del.mailHeading")}</h2>
      <p>{t("del.mailBody")} <a href={`mailto:${SITE.privacyEmail}?subject=${encodeURIComponent(t("del.mailSubject"))}`}>{SITE.privacyEmail}</a>. {t("del.mailSla")}</p>
      <p><Link href="/privacidad">{t("del.privacyLink")}</Link></p>
    </main>
  );
}
