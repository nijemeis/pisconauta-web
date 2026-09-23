import { memoize, requireUser, route } from "@/lib/api";
import { getPisco, parseSearch, searchPiscos } from "@/lib/catalog";
import { piscoInput, savePisco } from "@/lib/pisco-write";

export const GET = route((req) => { const sp = new URL(req.url).searchParams; return memoize(`search:${sp}`, 30_000, () => searchPiscos(parseSearch(sp))); }, { cache: true });

export const POST = route(async (req) => {
  const user = await requireUser("producer");
  const id = await savePisco(user, piscoInput.parse(await req.json()));
  return getPisco(id, { includeUnpublished: true });
});
