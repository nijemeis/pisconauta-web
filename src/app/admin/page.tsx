import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { AdminConsole } from "./client";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("admin.title") };
}

export default async function Admin({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await getUser();
  if (!user) redirect("/cuenta?modo=ingresar&next=/admin");
  if (user.role !== "admin") {
    const t = await getT();
    return (
      <main className="page page-narrow">
        <h1 className="title">{t("admin.reviewTitle")}</h1>
        <p className="prose" style={{ marginTop: 14 }}>{t("admin.notAdmin", { email: user.email })}</p>
        <Link href="/" className="btn btn-outline" style={{ marginTop: 20 }}>{t("admin.backHome")}</Link>
      </main>
    );
  }
  const tab = (await searchParams).tab;
  return <AdminConsole initialTab={tab === "bodegas" || tab === "piscos" || tab === "mensajes" || tab === "notas" ? tab : "pendientes"} />;
}
