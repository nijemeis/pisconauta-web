import { requireUser, route } from "@/lib/api";
import { getPisco } from "@/lib/catalog";
import { publishPisco } from "@/lib/pisco-write";

export const POST = route<{ ref: string }>(async (_req, { ref }) => {
  const user = await requireUser("producer");
  await publishPisco(user, ref);
  return getPisco(ref, { includeUnpublished: true });
});
