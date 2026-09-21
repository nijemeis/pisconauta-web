import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { getProducer } from "@/lib/catalog";
import { getT } from "@/lib/i18n/server";
import { BodegaForm } from "../client";

export default async function EditBodega({ searchParams }: { searchParams: Promise<{ bodega?: string }> }) {
  const sp = await searchParams;
  const user = await getUser();
  if (!user) redirect("/cuenta?rol=productor");
  const m = user.role === "admin" && sp.bodega ? { producerId: sp.bodega } : await db.producerMember.findFirst({ where: { userId: user.id } });
  if (!m) redirect("/productor");
  const [b, regions, t] = await Promise.all([getProducer(m.producerId, { includeDrafts: true }), db.region.findMany({ orderBy: { sort: "asc" } }), getT()]);
  return (
    <main className="page page-narrow">
      <h1 className="title">{t("prod.profileTitle")}</h1>
      <BodegaForm regions={regions.map((r) => ({ slug: r.slug, name: r.name, valleys: r.valleys as string[] }))} existing={b!} />
    </main>
  );
}
