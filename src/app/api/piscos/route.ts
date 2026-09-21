import { requireUser, route } from "@/lib/api";
import { getPisco, parseSearch, searchPiscos } from "@/lib/catalog";
import { piscoInput, savePisco } from "@/lib/pisco-write";

export const GET = route((req) => searchPiscos(parseSearch(new URL(req.url).searchParams)));

export const POST = route(async (req) => {
  const user = await requireUser("producer");
  const id = await savePisco(user, piscoInput.parse(await req.json()));
  return getPisco(id, { includeUnpublished: true });
});
