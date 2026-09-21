import { db } from "@/lib/db";
import { notFound, requireUser, route } from "@/lib/api";
import { canEditProducer, getUser } from "@/lib/auth";
import { getPisco, reindexProducer } from "@/lib/catalog";
import { loadEditable, piscoInput, savePisco } from "@/lib/pisco-write";

type P = { ref: string };

export const GET = route<P>(async (_req, { ref }) => {
  const pub = await getPisco(ref);
  if (pub) return pub;
  // Drafts are visible to the bodega's members and admins only.
  const user = await getUser();
  const draft = user ? await getPisco(ref, { includeUnpublished: true }) : null;
  if (!draft || !(await canEditProducer(user!, draft.producerId))) throw notFound("Pisco");
  return draft;
});

export const PATCH = route<P>(async (req, { ref }) => {
  const user = await requireUser("producer");
  await savePisco(user, piscoInput.parse(await req.json()), ref);
  return getPisco(ref, { includeUnpublished: true });
});

export const DELETE = route<P>(async (_req, { ref }) => {
  const user = await requireUser("producer");
  const pisco = await loadEditable(user, ref);
  await db.pisco.update({ where: { id: pisco.id }, data: { status: "archived" } });
  await reindexProducer(pisco.producerId);
});
