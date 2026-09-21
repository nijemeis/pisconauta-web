import { requireUser, route } from "@/lib/api";
import { getPisco } from "@/lib/catalog";
import { submitForReview } from "@/lib/pisco-write";

export const POST = route<{ ref: string }>(async (_req, { ref }) => {
  const user = await requireUser("producer");
  await submitForReview(user, ref);
  return getPisco(ref, { includeUnpublished: true });
});
