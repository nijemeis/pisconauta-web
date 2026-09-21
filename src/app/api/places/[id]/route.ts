import { db } from "@/lib/db";
import { forbidden, notFound, requireUser, route } from "@/lib/api";
import { canEditProducer } from "@/lib/auth";
import { reindexPisco } from "@/lib/catalog";

/** Remove a listing: whoever added it, the bottle's bodega, or an admin. */
export const DELETE = route<{ id: string }>(async (_req, { id }) => {
  const user = await requireUser();
  const listing = await db.priceListing.findUnique({ where: { id }, include: { pisco: { select: { producerId: true } } } });
  if (!listing) throw notFound("Lugar");
  if (listing.addedById !== user.id && !(await canEditProducer(user, listing.pisco.producerId))) throw forbidden();
  await db.priceListing.delete({ where: { id } });
  await reindexPisco(listing.piscoId);
});
