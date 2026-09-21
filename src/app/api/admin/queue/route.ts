import { db } from "@/lib/db";
import { requireUser, route } from "@/lib/api";
import { getPisco, toProducerCard } from "@/lib/catalog";

export const GET = route(async () => {
  await requireUser("admin");
  const [producers, piscoIds, suggestions, flagged, openMessages] = await Promise.all([
    db.producer.findMany({ where: { status: "pending" }, include: { region: true, members: { include: { user: { select: { email: true, displayName: true } } } } }, orderBy: { createdAt: "asc" } }),
    db.pisco.findMany({ where: { status: "in_review" }, select: { id: true }, orderBy: { updatedAt: "asc" } }),
    db.bottleSuggestion.findMany({ where: { handled: false }, orderBy: { createdAt: "asc" } }),
    db.review.findMany({ where: { status: "flagged" }, include: { pisco: { select: { name: true, slug: true } }, user: { select: { displayName: true } } } }),
    db.contactMessage.count({ where: { handled: false } }),
  ]);
  return {
    openMessages,
    producers: producers.map((p) => ({ ...toProducerCard(p), ruc: p.ruc, website: p.website, contactEmail: p.contactEmail, description: p.description, claimants: p.members.map((m) => m.user) })),
    piscos: (await Promise.all(piscoIds.map((p) => getPisco(p.id, { includeUnpublished: true })))).filter(Boolean),
    suggestions,
    flagged,
  };
});
