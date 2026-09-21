import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { canEditProducer, getUser } from "@/lib/auth";
import { getPisco } from "@/lib/catalog";
import { BottleEditor } from "./editor";

export default async function EditPisco({ params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) redirect("/cuenta?rol=productor");
  const pisco = await getPisco((await params).id, { includeUnpublished: true });
  if (!pisco || !(await canEditProducer(user, pisco.producerId))) notFound();
  const [regions, varieties, terms] = await Promise.all([
    db.region.findMany({ orderBy: { sort: "asc" } }),
    db.variety.findMany({ orderBy: { sort: "asc" } }),
    db.tastingNoteTerm.findMany({ orderBy: [{ family: "asc" }, { termEs: "asc" }] }),
  ]);
  return (
    <BottleEditor
      pisco={pisco}
      taxonomy={{
        regions: regions.map((r) => ({ id: r.id, slug: r.slug, name: r.name, valleys: r.valleys as string[] })),
        varieties: varieties.map((v) => ({ id: v.id, slug: v.slug, name: v.name, aromatic: v.aromatic })),
        noteTerms: terms.map((t) => ({ id: t.id, es: t.termEs, en: t.termEn, family: t.family })),
      }}
    />
  );
}
